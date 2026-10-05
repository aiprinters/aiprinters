import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Modality } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

const app = express();
const httpServer = createServer(app);

// JSON body parser with generous limit for audio payloads
app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: true, limit: '60mb' }));

// Shared server-side Gemini client with required telemetry header
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// ---------------------------------------------------------------------------
// 1. Audio Transcription Endpoint (using gemini-3.5-transcribe)
// ---------------------------------------------------------------------------
app.post('/api/ai/transcribe', async (req, res) => {
  try {
    const { audioBase64, mimeType = 'audio/webm' } = req.body;
    if (!audioBase64) {
      return res.status(400).json({ error: 'Missing audioBase64 data in request' });
    }

    const ai = getGeminiClient();
    const cleanBase64 = audioBase64.replace(/^data:[^;]+;base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: cleanBase64,
            },
          },
          {
            text: 'Transcribe this spoken audio accurately into text. Capture punctuation, numbers, names, and technical terms precisely. Return ONLY the transcribed text without extra chatter.',
          },
        ],
      },
    });

    const transcription = response.text || '';
    res.json({ text: transcription });
  } catch (err: any) {
    console.error('Audio transcription error:', err);
    res.status(500).json({ error: err?.message || 'Failed to transcribe audio' });
  }
});

// ---------------------------------------------------------------------------
// 2. Gemini Multi-Turn Chatbot Endpoint
// Models: gemini-3.5-flash (general), gemini-3.1-pro-preview (complex), gemini-3.1-flash-lite (fast)
// ---------------------------------------------------------------------------
app.post('/api/ai/chat', async (req, res) => {
  try {
    const {
      messages = [],
      model = 'gemini-3.5-flash',
      role = 'print_specialist',
    } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const ai = getGeminiClient();

    // Role-specific system instructions
    let systemInstruction = 'You are a helpful, professional assistant for Ai Printers.';
    if (role === 'print_specialist') {
      systemInstruction = `You are the Lead Print & PVC ID Card Specialist at "Ai Printers - Print & Digital Services".
Your domain knowledge includes:
- PVC Card specifications: standard CR80 format (85.6mm x 53.98mm / 86mm x 54mm, radius 3.18mm, 300-600 DPI, landscape & portrait).
- Indian Government Identity Cards:
  * UIDAI e-Aadhaar (bottom side-by-side cards with bottom red baseline & helpline bar, 86x54mm).
  * Ayushman Bharat / PM-JAY / BIS 2.0 / MahaSarathi (upper stacked cards with bottom dark blue banner "सर्व सेवा व योजनांचे डिजिटल प्रवेशद्वार.", 86x54mm).
  * Election Commission Voter ID (e-EPIC portrait 2-page or lower quadrant).
  * ABHA Digital Health Account Card & Digital Ration Card formats.
- PVC Card Tray printing setups: Epson L8050, L805, T60, Canon Pixma G1010/G2010/G3010, IP7270 PVC trays (margin offsets, card distance, paper type: Ultra Glossy / Matte).
- Commercial Printing: visiting cards (350 GSM matte/gloss), flex banners, vinyl cut stickers, photo studio enlargements, school ID lanyards.
Give concise, highly accurate, and practical advice. Use markdown bullets, bold headings, and clean numbers where appropriate.`;
    } else if (role === 'card_designer') {
      systemInstruction = `You are a graphic and layout designer specializing in PVC ID cards, badges, and print assets.
Help users with typography, dimensions, aspect ratios, color palettes, resolution, photo placement, and print bleeds.`;
    } else if (role === 'support') {
      systemInstruction = `You are the customer service representative for Ai Printers.
Help clients with file preparation (PDF, high-res JPG, PNG), order tracking, batch printing tips, delivery timelines, and bulk ID printing discounts.`;
    }

    // Format chat history into SDK contents
    const contents = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.text || '' }],
    }));

    // Choose target model
    const allowedModels = ['gemini-3.5-flash', 'gemini-3.1-pro-preview', 'gemini-3.1-flash-lite'];
    const selectedModel = allowedModels.includes(model) ? model : 'gemini-3.5-flash';

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents,
      config: {
        systemInstruction,
      },
    });

    res.json({ text: response.text || '' });
  } catch (err: any) {
    console.error('Chat generation error:', err);
    res.status(500).json({ error: err?.message || 'Failed to generate chat response' });
  }
});

// ---------------------------------------------------------------------------
// 3. Real-Time Live Voice WebSocket (using gemini-3.8-live)
// ---------------------------------------------------------------------------
const wss = new WebSocketServer({ noServer: true });

httpServer.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url || '', `http://${request.headers.host}`).pathname;
  if (pathname === '/api/live') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  }
});

wss.on('connection', async (clientWs: WebSocket) => {
  console.log('Client connected to Live Voice API WebSocket');
  let session: any = null;

  try {
    const ai = getGeminiClient();
    session = await ai.live.connect({
      model: 'gemini-3.8-live',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Zephyr' },
          },
        },
        systemInstruction: `You are the real-time AI Voice Assistant for Ai Printers.
You are speaking live with the user over microphone. Keep your spoken responses natural, concise, friendly, and helpful.
Answer questions about PVC card printing, ID card sizes, print settings, or order assistance.`,
      },
      callbacks: {
        onmessage: (message) => {
          const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (audio && clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: 'audio', audio }));
          }
          if (message.serverContent?.interrupted && clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: 'interrupted' }));
          }
        },
        onclose: () => {
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: 'closed' }));
          }
        },
        onerror: (e) => {
          console.error('Live API callback error:', e);
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: 'error', error: e?.message || 'Live session error' }));
          }
        },
      },
    });

    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({ type: 'ready' }));
    }

    clientWs.on('message', (data: Buffer | string) => {
      try {
        const payload = JSON.parse(data.toString());
        if (payload.audio && session) {
          session.sendRealtimeInput({
            audio: {
              data: payload.audio,
              mimeType: 'audio/pcm;rate=16000',
            },
          });
        }
      } catch (e) {
        console.error('Error forwarding client audio chunk:', e);
      }
    });

    clientWs.on('close', () => {
      console.log('Client disconnected from Live Voice API');
      if (session) {
        try {
          session.close();
        } catch (_) {}
      }
    });
  } catch (err: any) {
    console.error('Failed to initialize Live API session:', err);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({ type: 'error', error: err?.message || 'Failed to start Live session' }));
      clientWs.close();
    }
  }
});

// ---------------------------------------------------------------------------
// 4. Vite Middleware (Dev) or Static Assets (Prod)
// ---------------------------------------------------------------------------
if (!isProd) {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});
