import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Bot,
  Mic,
  MicOff,
  Radio,
  Send,
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  Volume2,
  PhoneCall,
  PhoneOff,
  Upload,
  FileAudio,
  Loader2,
  HelpCircle,
  Cpu,
  Layers,
} from 'lucide-react';
import { float32ToPcmBase64, blobToBase64, LiveAudioPlayer } from '../utils/aiAudioHelpers';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  modelUsed?: string;
}

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'chat' | 'transcribe' | 'live';
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'chat',
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'transcribe' | 'live'>(defaultTab);

  // -------------------------------------------------------------------------
  // Chatbot State
  // -------------------------------------------------------------------------
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hello! I am your **Ai Printers & PVC ID Card Assistant**. How can I help you with PVC card specifications, tray alignments (Epson/Canon), Aadhaar/Ayushman cropping, or print orders today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelUsed: 'gemini-3.5-flash',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'gemini-3.5-flash' | 'gemini-3.1-pro-preview' | 'gemini-3.1-flash-lite'>('gemini-3.5-flash');
  const [selectedRole, setSelectedRole] = useState<'print_specialist' | 'card_designer' | 'support'>('print_specialist');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // -------------------------------------------------------------------------
  // Audio Transcriber State (gemini-3.5-transcribe)
  // -------------------------------------------------------------------------
  const [isRecordingTranscribe, setIsRecordingTranscribe] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [transcribeLoading, setTranscribeLoading] = useState(false);
  const [transcriptionResult, setTranscriptionResult] = useState('');
  const [transcribeCopied, setTranscribeCopied] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const transcribeTimerRef = useRef<number | null>(null);

  // -------------------------------------------------------------------------
  // Live Voice State (gemini-3.8-live)
  // -------------------------------------------------------------------------
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [isLiveConnecting, setIsLiveConnecting] = useState(false);
  const [isLiveMuted, setIsLiveMuted] = useState(false);
  const [liveStatus, setLiveStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking' | 'interrupted' | 'error'>('idle');
  const [liveErrorMessage, setLiveErrorMessage] = useState('');
  const liveWsRef = useRef<WebSocket | null>(null);
  const liveAudioPlayerRef = useRef<LiveAudioPlayer | null>(null);
  const liveInputCtxRef = useRef<AudioContext | null>(null);
  const liveStreamRef = useRef<MediaStream | null>(null);
  const liveProcessorRef = useRef<ScriptProcessorNode | null>(null);

  // Synchronize default tab on open
  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
    } else {
      // Disconnect live call if modal closed
      disconnectLiveVoice();
    }
  }, [isOpen, defaultTab]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (activeTab === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  // -------------------------------------------------------------------------
  // CHAT HANDLERS
  // -------------------------------------------------------------------------
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend ?? inputText).trim();
    if (!text || chatLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputText('');
    setChatLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map((m) => ({ role: m.role, text: m.text })),
          model: selectedModel,
          role: selectedRole,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate response');
      }

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: data.text || 'I could not generate an answer. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: selectedModel,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: `⚠️ **Error:** ${err?.message || 'Could not communicate with the AI service. Please verify your GEMINI_API_KEY.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: selectedModel,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        text: 'Chat history cleared. How can I help you today with your PVC print jobs or ID cards?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: selectedModel,
      },
    ]);
  };

  // -------------------------------------------------------------------------
  // AUDIO TRANSCRIBER HANDLERS (gemini-3.5-transcribe)
  // -------------------------------------------------------------------------
  const startRecordingTranscribe = async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(250);
      setIsRecordingTranscribe(true);
      setRecordingSeconds(0);

      transcribeTimerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      alert('Could not access microphone: ' + err.message);
    }
  };

  const stopRecordingAndTranscribe = async () => {
    if (!mediaRecorderRef.current || !isRecordingTranscribe) return;

    if (transcribeTimerRef.current) {
      clearInterval(transcribeTimerRef.current);
      transcribeTimerRef.current = null;
    }

    setIsRecordingTranscribe(false);

    mediaRecorderRef.current.onstop = async () => {
      // Stop all mic tracks
      mediaRecorderRef.current?.stream.getTracks().forEach((track) => track.stop());

      const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

      if (audioBlob.size < 500) {
        alert('Recorded audio clip was too short. Please try speaking again.');
        return;
      }

      setTranscribeLoading(true);
      try {
        const audioBase64 = await blobToBase64(audioBlob);
        const res = await fetch('/api/ai/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audioBase64, mimeType }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Transcription failed');
        }

        setTranscriptionResult(data.text || '(No speech detected in audio)');
      } catch (err: any) {
        alert('Transcription Error: ' + err.message);
      } finally {
        setTranscribeLoading(false);
      }
    };

    mediaRecorderRef.current.stop();
  };

  const handleFileUploadTranscribe = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setTranscribeLoading(true);
    try {
      const audioBase64 = await blobToBase64(file);
      const res = await fetch('/api/ai/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioBase64, mimeType: file.type || 'audio/wav' }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Transcription failed');
      }

      setTranscriptionResult(data.text || '(No speech detected in uploaded file)');
    } catch (err: any) {
      alert('Transcription Error: ' + err.message);
    } finally {
      setTranscribeLoading(false);
      e.target.value = '';
    }
  };

  const handleSendTranscriptionToChat = () => {
    if (!transcriptionResult) return;
    setActiveTab('chat');
    handleSendMessage(transcriptionResult);
  };

  // -------------------------------------------------------------------------
  // LIVE VOICE HANDLERS (gemini-3.8-live)
  // -------------------------------------------------------------------------
  const startLiveVoice = async () => {
    try {
      setIsLiveConnecting(true);
      setLiveErrorMessage('');
      setLiveStatus('connecting');

      // 1. Initialize Player for 24kHz incoming audio
      liveAudioPlayerRef.current = new LiveAudioPlayer();
      await liveAudioPlayerRef.current.resume();

      // 2. Connect WebSocket to server
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/live`;
      const ws = new WebSocket(wsUrl);
      liveWsRef.current = ws;

      ws.onopen = async () => {
        console.log('Live WebSocket connected');
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'ready') {
            setIsLiveConnected(true);
            setIsLiveConnecting(false);
            setLiveStatus('listening');
          } else if (msg.type === 'audio' && msg.audio) {
            setLiveStatus('speaking');
            liveAudioPlayerRef.current?.playChunk(msg.audio);
          } else if (msg.type === 'interrupted') {
            setLiveStatus('interrupted');
            liveAudioPlayerRef.current?.stopAll();
            setTimeout(() => setLiveStatus('listening'), 800);
          } else if (msg.type === 'error') {
            setLiveErrorMessage(msg.error || 'Live API Error');
            setLiveStatus('error');
          }
        } catch (e) {
          console.error('Error handling live message:', e);
        }
      };

      ws.onerror = (e) => {
        console.error('Live WebSocket error:', e);
        setLiveErrorMessage('WebSocket connection failed. Verify server is running.');
        setLiveStatus('error');
        setIsLiveConnecting(false);
        setIsLiveConnected(false);
      };

      ws.onclose = () => {
        disconnectLiveVoice();
      };

      // 3. Capture 16kHz microphone audio stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      liveStreamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const inputAudioCtx = new AudioContextClass({ sampleRate: 16000 });
      liveInputCtxRef.current = inputAudioCtx;

      const source = inputAudioCtx.createMediaStreamSource(stream);
      const processor = inputAudioCtx.createScriptProcessor(2048, 1, 1);
      liveProcessorRef.current = processor;

      source.connect(processor);
      processor.connect(inputAudioCtx.destination);

      processor.onaudioprocess = (e) => {
        if (!isLiveMuted && ws.readyState === WebSocket.OPEN) {
          const channelData = e.inputBuffer.getChannelData(0);
          const base64Audio = float32ToPcmBase64(channelData);
          ws.send(JSON.stringify({ audio: base64Audio }));
        }
      };
    } catch (err: any) {
      console.error('Live voice error:', err);
      setLiveErrorMessage(err.message || 'Microphone access denied or error');
      setLiveStatus('error');
      setIsLiveConnecting(false);
      disconnectLiveVoice();
    }
  };

  const disconnectLiveVoice = () => {
    setIsLiveConnected(false);
    setIsLiveConnecting(false);
    setLiveStatus('idle');

    if (liveWsRef.current) {
      liveWsRef.current.close();
      liveWsRef.current = null;
    }

    if (liveProcessorRef.current) {
      liveProcessorRef.current.disconnect();
      liveProcessorRef.current = null;
    }

    if (liveInputCtxRef.current) {
      liveInputCtxRef.current.close();
      liveInputCtxRef.current = null;
    }

    if (liveStreamRef.current) {
      liveStreamRef.current.getTracks().forEach((track) => track.stop());
      liveStreamRef.current = null;
    }

    if (liveAudioPlayerRef.current) {
      liveAudioPlayerRef.current.close();
      liveAudioPlayerRef.current = null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl h-[90vh] max-h-[850px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-extrabold flex items-center gap-2">
                <span>Ai Printers Studio AI Suite</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30">
                  Gemini Powered
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Multi-Turn Chat, Audio Transcription & Real-Time Live Voice
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50 px-4 pt-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'chat'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>Gemini Chatbot</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-700">Multi-Turn</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('transcribe')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'transcribe'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>Transcribe Audio</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 font-mono">gemini-3.5-transcribe</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('live')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'live'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
            <span>Voice Conversations</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-700 font-mono">gemini-3.8-live</span>
          </button>
        </div>

        {/* =================================================================== */}
        {/* TAB 1: GEMINI CHATBOT                                               */}
        {/* =================================================================== */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col min-h-0 bg-white">
            {/* Control Bar (Model & Role selector) */}
            <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-slate-200">
                  <Cpu className="w-3.5 h-3.5 text-blue-600" />
                  <span className="font-semibold text-slate-700">Model:</span>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value as any)}
                    className="font-bold text-blue-700 bg-transparent focus:outline-none cursor-pointer text-xs"
                  >
                    <option value="gemini-3.5-flash">gemini-3.5-flash (General Tasks)</option>
                    <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Complex Tasks)</option>
                    <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Fast Tasks)</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-slate-200">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="font-semibold text-slate-700">Role:</span>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as any)}
                    className="font-bold text-indigo-700 bg-transparent focus:outline-none cursor-pointer text-xs"
                  >
                    <option value="print_specialist">Print & PVC ID Specialist</option>
                    <option value="card_designer">Card & Graphic Designer</option>
                    <option value="support">Customer & Order Support</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClearHistory}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
                title="Clear conversation history"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Clear Thread</span>
              </button>
            </div>

            {/* Messages Thread */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-xs ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-xs'
                        : 'bg-slate-100 text-slate-800 rounded-bl-xs border border-slate-200/80'
                    }`}
                  >
                    <div className="whitespace-pre-wrap font-sans">{msg.text}</div>

                    <div
                      className={`flex items-center justify-between mt-2 pt-1 border-t text-[10px] ${
                        msg.role === 'user' ? 'border-blue-500/50 text-blue-200' : 'border-slate-200 text-slate-400'
                      }`}
                    >
                      <span>{msg.timestamp}</span>
                      {msg.role === 'assistant' && (
                        <div className="flex items-center gap-2">
                          {msg.modelUsed && <span className="font-mono">{msg.modelUsed}</span>}
                          <button
                            type="button"
                            onClick={() => handleCopyText(msg.id, msg.text)}
                            className="hover:text-slate-700 flex items-center gap-1"
                            title="Copy message"
                          >
                            {copiedId === msg.id ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {chatLoading && (
                <div className="flex gap-3 items-center text-slate-500 text-xs">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 animate-pulse">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-2xl border border-slate-200">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                    <span>Gemini is thinking...</span>
                  </div>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>

            {/* Quick Suggestions Chips */}
            <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/60 flex items-center gap-2 overflow-x-auto shrink-0 text-xs">
              <span className="text-[11px] font-bold text-slate-400 shrink-0">Try asking:</span>
              {[
                'What are exact CR80 PVC dimensions and DPI?',
                'How to set up Epson L8050 PVC card tray?',
                'Aadhaar vs Ayushman layout differences',
                'Tips to avoid card cut bleeding on borders',
              ].map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(chip)}
                  className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:border-blue-400 hover:text-blue-700 shrink-0 transition-colors shadow-2xs"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask about PVC ID card formats, printing tray offsets, materials, or order help..."
                className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />

              <button
                type="submit"
                disabled={!inputText.trim() || chatLoading}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition-all"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 2: AUDIO TRANSCRIBER (gemini-3.5-transcribe)                    */}
        {/* =================================================================== */}
        {activeTab === 'transcribe' && (
          <div className="flex-1 flex flex-col p-6 overflow-y-auto bg-slate-50/50">
            <div className="max-w-2xl mx-auto w-full space-y-6">
              {/* Header Card */}
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                  <Mic className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <span>Voice to Text Transcription</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                      gemini-3.5-transcribe
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Record your voice via microphone or upload an audio file to convert spoken speech into clean, formatted text.
                  </p>
                </div>
              </div>

              {/* Microphone Recorder Box */}
              <div className="p-8 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
                {!isRecordingTranscribe ? (
                  <button
                    type="button"
                    onClick={startRecordingTranscribe}
                    disabled={transcribeLoading}
                    className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white flex flex-col items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Mic className="w-10 h-10 mb-1" />
                    <span className="text-[11px] font-black uppercase tracking-wider">Record</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopRecordingAndTranscribe}
                    className="w-24 h-24 rounded-full bg-red-600 hover:bg-red-700 text-white flex flex-col items-center justify-center shadow-lg animate-pulse hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-sm bg-white mb-1" />
                    <span className="text-[11px] font-black uppercase tracking-wider">Stop</span>
                  </button>
                )}

                {isRecordingTranscribe ? (
                  <div className="space-y-1">
                    <div className="flex items-center justify-center gap-2 text-red-600 font-mono font-bold text-sm">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                      <span>Recording: {recordingSeconds}s</span>
                    </div>
                    <p className="text-xs text-slate-500">Speak clearly into your microphone, then click Stop.</p>
                  </div>
                ) : transcribeLoading ? (
                  <div className="flex items-center gap-2 text-purple-600 font-bold text-sm">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Transcribing audio with gemini-3.5-transcribe...</span>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">Click the microphone to start recording speech</p>
                )}

                {/* File Upload Option */}
                <div className="pt-2 border-t border-slate-100 w-full flex items-center justify-center gap-2">
                  <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5 text-purple-600" />
                    <span>Or upload audio file (.mp3, .wav, .webm)</span>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleFileUploadTranscribe}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Transcription Output */}
              {transcriptionResult && (
                <div className="p-5 bg-white rounded-2xl border border-purple-200 shadow-sm space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                      <FileAudio className="w-4 h-4 text-purple-600" />
                      <span>Transcribed Text</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(transcriptionResult);
                          setTranscribeCopied(true);
                          setTimeout(() => setTranscribeCopied(false), 2000);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                      >
                        {transcribeCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{transcribeCopied ? 'Copied!' : 'Copy'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSendTranscriptionToChat}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-colors"
                      >
                        <Bot className="w-3.5 h-3.5" />
                        <span>Send to Chatbot</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl text-xs sm:text-sm text-slate-800 leading-relaxed font-mono whitespace-pre-wrap border border-slate-200/80">
                    {transcriptionResult}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 3: REAL-TIME LIVE VOICE (gemini-3.8-live)                        */}
        {/* =================================================================== */}
        {activeTab === 'live' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 text-white relative overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

            <div className="max-w-lg w-full text-center space-y-6 z-10">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-mono text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Model: gemini-3.8-live (Live API)</span>
                </div>
                <h3 className="text-xl font-extrabold text-white">Hands-Free Live Voice Call</h3>
                <p className="text-xs text-slate-300">
                  Low-latency, real-time bidirectional spoken dialogue with Gemini. Speak naturally with the AI Assistant!
                </p>
              </div>

              {/* Animated Live Voice Visualizer Orb */}
              <div className="flex justify-center py-6">
                <div
                  className={`relative w-40 h-40 rounded-full flex items-center justify-center transition-all duration-500 ${
                    liveStatus === 'speaking'
                      ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-[0_0_50px_rgba(52,211,153,0.6)] scale-110'
                      : liveStatus === 'listening'
                      ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-[0_0_40px_rgba(59,130,246,0.5)] animate-pulse'
                      : liveStatus === 'connecting'
                      ? 'bg-gradient-to-tr from-amber-500 to-orange-500 shadow-[0_0_30px_rgba(245,158,11,0.5)] animate-spin'
                      : 'bg-white/10 border-2 border-white/20'
                  }`}
                >
                  {liveStatus === 'speaking' ? (
                    <Volume2 className="w-16 h-16 text-white animate-bounce" />
                  ) : liveStatus === 'listening' ? (
                    <Mic className="w-16 h-16 text-white" />
                  ) : liveStatus === 'connecting' ? (
                    <Loader2 className="w-16 h-16 text-white" />
                  ) : (
                    <Radio className="w-16 h-16 text-white/50" />
                  )}

                  {/* Pulsing ring waves */}
                  {isLiveConnected && (
                    <>
                      <div className="absolute inset-0 rounded-full border-2 border-emerald-400/40 animate-ping pointer-events-none" />
                      <div className="absolute -inset-4 rounded-full border border-teal-300/20 animate-pulse pointer-events-none" />
                    </>
                  )}
                </div>
              </div>

              {/* Status Badge */}
              <div className="text-sm font-semibold">
                {liveStatus === 'idle' && <span className="text-slate-400">Ready to start conversation</span>}
                {liveStatus === 'connecting' && <span className="text-amber-400">Connecting to Gemini Live API session...</span>}
                {liveStatus === 'listening' && <span className="text-emerald-400">Listening to you... (Speak anytime)</span>}
                {liveStatus === 'speaking' && <span className="text-teal-300">Gemini is responding... (Interrupt anytime)</span>}
                {liveStatus === 'interrupted' && <span className="text-blue-300">Interrupted — listening to you...</span>}
                {liveStatus === 'error' && (
                  <span className="text-red-400 font-mono text-xs">{liveErrorMessage || 'Session disconnected'}</span>
                )}
              </div>

              {/* Call Controls */}
              <div className="flex items-center justify-center gap-4 pt-2">
                {!isLiveConnected && !isLiveConnecting ? (
                  <button
                    type="button"
                    onClick={startLiveVoice}
                    className="px-6 py-3 rounded-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>Start Voice Call</span>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsLiveMuted(!isLiveMuted)}
                      className={`p-3.5 rounded-full border transition-all cursor-pointer ${
                        isLiveMuted
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                      }`}
                      title={isLiveMuted ? 'Unmute' : 'Mute'}
                    >
                      {isLiveMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>

                    <button
                      type="button"
                      onClick={disconnectLiveVoice}
                      className="px-6 py-3 rounded-full bg-red-600 hover:bg-red-700 text-white font-black text-sm flex items-center gap-2 shadow-lg shadow-red-600/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    >
                      <PhoneOff className="w-4 h-4" />
                      <span>End Call</span>
                    </button>
                  </>
                )}
              </div>

              <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-[11px] text-slate-400 text-left space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-300">
                  <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                  <span>How Live Voice Works:</span>
                </div>
                <p>
                  Streams 16kHz PCM audio from your microphone to Gemini Live API and plays 24kHz conversational audio back in real-time. You can interrupt Gemini at any time by speaking.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
