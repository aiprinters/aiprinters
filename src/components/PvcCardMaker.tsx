import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  CheckCircle,
  FolderArchive,
  Printer,
  RotateCw,
  Sliders,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  FileText,
  Eye,
  Download,
  AlertCircle,
  RefreshCw,
  Layers,
  ChevronDown,
  Info,
  ShieldCheck,
  Check,
  X,
  CreditCard,
  Lock,
  Move,
  Maximize2
} from 'lucide-react';
import {
  CardCategory,
  CardSettings,
  CropBox,
  DEFAULT_SETTINGS,
  ProcessedCard,
  ProcessingLog,
  detectCardCategory,
  cropGovernmentCardAdvanced,
  extractAndFormatCard,
  renderPdfToCanvases,
  renderImageToCanvas,
  createBatchCardZip,
  generateA4PrintSheet,
  generatePvcTraySheet,
  findMahaSarathiBlueBannerBounds,
  findAadhaarCardBounds,
  findContentBoundingBox,
} from '../utils/pvcCardProcessor';

interface PvcCardMakerProps {
  onNavigateHome: () => void;
}

interface QueuedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  file?: File;
  detectedCategory: 'ayushman' | 'aadhaar' | 'ration' | 'voter' | 'abha';
  canvases?: HTMLCanvasElement[];
  numPages: number;
  previewUrl?: string;
  sourcePagesUrls: string[];
  unlockedWithPassword?: string;
}

export const PvcCardMaker: React.FC<PvcCardMakerProps> = ({ onNavigateHome }) => {
  const [selectedMode, setSelectedMode] = useState<CardCategory>('auto');
  const [step, setStep] = useState<'upload' | 'processing' | 'results'>('upload');

  const [settings, setSettings] = useState<CardSettings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  const [queuedFiles, setQueuedFiles] = useState<QueuedFile[]>([]);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);

  const [processedCards, setProcessedCards] = useState<ProcessedCard[]>([]);
  const [terminalLogs, setTerminalLogs] = useState<ProcessingLog[]>([]);
  const [currentProcessingIndex, setCurrentProcessingIndex] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Counters matching the video
  const [counts, setCounts] = useState({
    total: 0,
    aadhaar: 0,
    ayushman: 0,
    ration: 0,
    voter: 0,
    abha: 0,
    processedOk: 0,
    failed: 0,
  });

  const [activeResultFilter, setActiveResultFilter] = useState<string>('all');
  const [isDownloadingZip, setIsDownloadingZip] = useState<boolean>(false);

  // Fine-tune modal state
  const [editingCard, setEditingCard] = useState<ProcessedCard | null>(null);
  const [editingFrontBox, setEditingFrontBox] = useState<CropBox>({ x: 0, y: 0, width: 100, height: 100 });
  const [editingBackBox, setEditingBackBox] = useState<CropBox>({ x: 0, y: 0, width: 100, height: 100 });
  const [editingRotFront, setEditingRotFront] = useState<number>(0);
  const [editingRotBack, setEditingRotBack] = useState<number>(0);

  const [printSheetUrl, setPrintSheetUrl] = useState<string | null>(null);
  const [isGeneratingSheet, setIsGeneratingSheet] = useState<boolean>(false);
  const [pvcTrayModalUrl, setPvcTrayModalUrl] = useState<string | null>(null);
  const [isGeneratingTray, setIsGeneratingTray] = useState<boolean>(false);

  // Password modal for encrypted e-Aadhaar
  const [passwordModalOpen, setPasswordModalOpen] = useState<boolean>(false);
  const [pdfPassword, setPdfPassword] = useState<string>('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLogs]);

  // Handle file uploads (extracts all pages and handles password protected PDFs)
  const handleFileSelect = async (files: FileList | null, customPassword?: string) => {
    if (!files || files.length === 0) return;

    setIsScanning(true);
    setScanProgress(0);

    const newQueued: QueuedFile[] = [];
    const totalFiles = files.length;

    for (let i = 0; i < totalFiles; i++) {
      const file = files[i];
      setScanProgress(Math.round(((i + 1) / totalFiles) * 100));

      try {
        let detected: 'ayushman' | 'aadhaar' | 'ration' | 'voter' | 'abha' = 'aadhaar';
        let canvases: HTMLCanvasElement[] = [];
        let numPages = 1;
        let sourcePagesUrls: string[] = [];
        let unlockedWithPassword: string | undefined = undefined;

        if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
          const arrayBuffer = await file.arrayBuffer();
          try {
            const res = await renderPdfToCanvases(arrayBuffer, file.name, customPassword, 4.0);
            canvases = res.canvases;
            numPages = res.numPages;
            detected = selectedMode !== 'auto' ? selectedMode : detectCardCategory(res.text, file.name);
            if (canvases[0] && selectedMode === 'auto' && detected === 'ayushman') {
              const b1 = findMahaSarathiBlueBannerBounds(canvases[0], 0.15, 0.33);
              const b2 = findMahaSarathiBlueBannerBounds(canvases[0], 0.45, 0.65);
              if (!b1.found && !b2.found) {
                const scanBot = findContentBoundingBox(canvases[0], {
                  startX: canvases[0].width * 0.05,
                  startY: canvases[0].height * 0.65,
                  width: canvases[0].width * 0.90,
                  height: canvases[0].height * 0.30,
                });
                if (scanBot.found) {
                  detected = 'aadhaar';
                }
              }
            }
            sourcePagesUrls = canvases.map((c) => c.toDataURL('image/jpeg', 0.6));
            unlockedWithPassword = res.unlockedWithPassword;
          } catch (pdfErr: any) {
            if (pdfErr?.name === 'PasswordException' || String(pdfErr?.message || '').toLowerCase().includes('password')) {
              setPendingFile(file);
              setPasswordModalOpen(true);
              setIsScanning(false);
              return;
            }
            throw pdfErr;
          }
        } else if (file.type.startsWith('image/')) {
          const imgCanvas = await renderImageToCanvas(file);
          canvases = [imgCanvas];
          numPages = 1;
          detected = selectedMode !== 'auto' ? selectedMode : detectCardCategory('', file.name);
          if (canvases[0] && selectedMode === 'auto' && detected === 'ayushman') {
            const b1 = findMahaSarathiBlueBannerBounds(canvases[0], 0.15, 0.33);
            const b2 = findMahaSarathiBlueBannerBounds(canvases[0], 0.45, 0.65);
            if (!b1.found && !b2.found) {
              const scanBot = findContentBoundingBox(canvases[0], {
                startX: canvases[0].width * 0.05,
                startY: canvases[0].height * 0.65,
                width: canvases[0].width * 0.90,
                height: canvases[0].height * 0.30,
              });
              if (scanBot.found) {
                detected = 'aadhaar';
              }
            }
          }
          sourcePagesUrls = [imgCanvas.toDataURL('image/jpeg', 0.6)];
        }

        const previewUrl = canvases[0] ? canvases[0].toDataURL('image/jpeg', 0.6) : undefined;

        newQueued.push({
          id: `file-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          size: file.size,
          type: file.type,
          file,
          detectedCategory: detected,
          canvases,
          numPages,
          previewUrl,
          sourcePagesUrls,
          unlockedWithPassword,
        });
      } catch (err) {
        console.error('Scan error on file:', file.name, err);
      }
    }

    setQueuedFiles((prev) => [...prev, ...newQueued]);
    updateCountsFromQueued([...queuedFiles, ...newQueued]);
    setIsScanning(false);
  };

  const updateCountsFromQueued = (items: QueuedFile[]) => {
    const c = {
      total: items.length,
      aadhaar: items.filter((x) => x.detectedCategory === 'aadhaar').length,
      ayushman: items.filter((x) => x.detectedCategory === 'ayushman').length,
      ration: items.filter((x) => x.detectedCategory === 'ration').length,
      voter: items.filter((x) => x.detectedCategory === 'voter').length,
      abha: items.filter((x) => x.detectedCategory === 'abha').length,
      processedOk: 0,
      failed: 0,
    };
    setCounts(c);
  };

  // Start Batch Processing
  const handleStartProcessing = async () => {
    if (queuedFiles.length === 0) return;

    setStep('processing');
    setIsProcessing(true);
    setTerminalLogs([]);
    setCurrentProcessingIndex(0);

    const processedList: ProcessedCard[] = [];
    let okCount = 0;
    let failCount = 0;

    const addLog = (message: string, level: 'info' | 'success' | 'warn' | 'error' = 'info') => {
      const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
      setTerminalLogs((prev) => [...prev, { timestamp, level, message }]);
    };

    addLog(`Initiating auto-detection & CR80 PVC cropping for ${queuedFiles.length} file(s)...`, 'info');
    addLog(`Target Size: ${settings.widthMm}mm x ${settings.heightMm}mm @ ${settings.dpi} DPI, Format: ${settings.outputFormat.toUpperCase()}`, 'info');

    for (let i = 0; i < queuedFiles.length; i++) {
      const item = queuedFiles[i];
      setCurrentProcessingIndex(i + 1);

      addLog(`Processing ${i + 1}/${queuedFiles.length}: ${item.name}`, 'info');

      try {
        let canvases = item.canvases;

        if ((!canvases || canvases.length === 0) && item.file) {
          if (item.file.type === 'application/pdf' || item.name.endsWith('.pdf')) {
            const ab = await item.file.arrayBuffer();
            const res = await renderPdfToCanvases(ab, item.name, undefined, 4.0);
            canvases = res.canvases;
          } else {
            const img = await renderImageToCanvas(item.file);
            canvases = [img];
          }
        }

        if (!canvases || canvases.length === 0) {
          throw new Error('Could not render document canvas');
        }

        const cat = selectedMode !== 'auto' ? selectedMode : item.detectedCategory;
        const catNameUpper = cat.toUpperCase();

        addLog(`-> ${item.name}: ${catNameUpper} (${item.numPages} Page${item.numPages > 1 ? 's' : ''})`, 'info');
        if (item.unlockedWithPassword) {
          addLog(`   [KEY] Auto-unlocked using filename: "${item.unlockedWithPassword}"`, 'success');
        }

        const { frontUrl, backUrl, frontBox, backBox, rotFront, rotBack } = cropGovernmentCardAdvanced(
          canvases,
          cat,
          settings
        );

        const cardNum = String(i + 1).padStart(2, '0');
        const ext = settings.outputFormat;

        addLog(`   [OK] Saved: ${cardNum}_front.${ext} (${catNameUpper})`, 'success');
        addLog(`   [OK] Saved: ${cardNum}_back.${ext} (${catNameUpper})`, 'success');

        const catLabels: Record<string, string> = {
          ayushman: 'Ayushman Card (PM-JAY)',
          aadhaar: 'Aadhaar Card (UIDAI)',
          ration: 'Digital Ration Card',
          voter: 'Voter ID (e-EPIC)',
          abha: 'ABHA Card (NDHM)',
        };

        processedList.push({
          id: `card-${i}-${Date.now()}`,
          sourceFileName: item.name,
          category: cat,
          categoryLabel: catLabels[cat] || 'Government ID',
          frontDataUrl: frontUrl,
          backDataUrl: backUrl,
          sourcePages: item.sourcePagesUrls || [canvases[0].toDataURL('image/jpeg', 0.6)],
          frontCropBox: frontBox,
          backCropBox: backBox,
          cardIndex: i + 1,
          numPages: item.numPages,
          rotationFront: rotFront,
          rotationBack: rotBack,
          dimensions: {
            widthPx: Math.round((settings.widthMm / 25.4) * settings.dpi),
            heightPx: Math.round((settings.heightMm / 25.4) * settings.dpi),
            dpi: settings.dpi,
            mm: `${settings.widthMm}mm x ${settings.heightMm}mm`,
          },
        });

        okCount++;
        setCounts((prev) => ({ ...prev, processedOk: okCount }));
      } catch (err: any) {
        failCount++;
        addLog(`   [FAILED] Error processing ${item.name}: ${err?.message || 'Unknown error'}`, 'error');
        setCounts((prev) => ({ ...prev, failed: failCount }));
      }

      await new Promise((r) => setTimeout(r, 120));
    }

    addLog(`Process Complete — ${okCount}/${queuedFiles.length} file(s) processed successfully`, 'success');
    setProcessedCards(processedList);
    setIsProcessing(false);

    setTimeout(() => {
      setStep('results');
    }, 800);
  };

  // Download all as ZIP with folders matching the video
  const handleDownloadZip = async () => {
    if (processedCards.length === 0) return;
    setIsDownloadingZip(true);
    try {
      const zipBlob = await createBatchCardZip(processedCards);
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `PVC_Print_Cards_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('ZIP generation error:', err);
    } finally {
      setIsDownloadingZip(false);
    }
  };

  // Generate A4 Sheet Preview & Print
  const handleOpenA4PrintSheet = async () => {
    setIsGeneratingSheet(true);
    try {
      const url = await generateA4PrintSheet(processedCards, settings);
      setPrintSheetUrl(url);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingSheet(false);
    }
  };

  // Generate Epson L805 PVC Tray Template Preview & Print
  const handleOpenPvcTray = async (card?: ProcessedCard) => {
    const targetCard = card || processedCards[0];
    if (!targetCard) return;
    setIsGeneratingTray(true);
    try {
      const url = await generatePvcTraySheet(targetCard, settings);
      setPvcTrayModalUrl(url);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingTray(false);
    }
  };

  // Safe in-page print helper avoiding window.open
  const triggerDirectPrint = (dataUrl: string) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              @page { size: auto; margin: 0; }
              body { margin: 0; display: flex; justify-content: center; align-items: center; }
              img { width: 100vw; height: 100vh; object-fit: contain; }
            </style>
          </head>
          <body>
            <img src="${dataUrl}" onload="setTimeout(() => { window.print(); }, 200);" />
          </body>
        </html>
      `);
      doc.close();
    }
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 60000);
  };

  // Single card download helper
  const handleDownloadSingle = (dataUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open fine-tune modal for card
  const handleOpenFineTune = (card: ProcessedCard) => {
    setEditingCard(card);
    setEditingFrontBox(card.frontCropBox || { x: 0, y: 0, width: 100, height: 100 });
    setEditingBackBox(card.backCropBox || { x: 0, y: 0, width: 100, height: 100 });
    setEditingRotFront(card.rotationFront || 0);
    setEditingRotBack(card.rotationBack || 0);
  };

  // Apply fine-tuned crop boxes to card
  const handleApplyFineTune = () => {
    if (!editingCard) return;

    const queuedItem = queuedFiles.find((f) => f.name === editingCard.sourceFileName);
    if (!queuedItem || !queuedItem.canvases || queuedItem.canvases.length === 0) {
      setEditingCard(null);
      return;
    }

    const page1 = queuedItem.canvases[0];
    const page2 = queuedItem.canvases.length > 1 ? queuedItem.canvases[1] : queuedItem.canvases[0];

    const newFrontUrl = extractAndFormatCard(page1, editingFrontBox, settings, editingRotFront);
    const newBackUrl = extractAndFormatCard(page2, editingBackBox, settings, editingRotBack);

    const updated: ProcessedCard = {
      ...editingCard,
      frontDataUrl: newFrontUrl,
      backDataUrl: newBackUrl,
      frontCropBox: editingFrontBox,
      backCropBox: editingBackBox,
      rotationFront: editingRotFront,
      rotationBack: editingRotBack,
    };

    setProcessedCards((prev) => prev.map((c) => (c.id === editingCard.id ? updated : c)));
    setEditingCard(null);
  };

  // Preset crop box appliers
  const applyPreset = (presetType: 'mahasarathi' | 'aadhaar' | 'aadhaar_mid' | 'ayushman_split' | 'voter' | 'full') => {
    if (!editingCard) return;
    const queuedItem = queuedFiles.find((f) => f.name === editingCard.sourceFileName);
    if (!queuedItem || !queuedItem.canvases || queuedItem.canvases.length === 0) return;

    const page = queuedItem.canvases[0];
    const W = page.width;
    const H = page.height;

    if (presetType === 'mahasarathi' || presetType === 'ayushman_split') {
      const banner1 = findMahaSarathiBlueBannerBounds(page, 0.15, 0.33);
      const banner2 = findMahaSarathiBlueBannerBounds(page, 0.45, 0.65);

      if (banner1.found) {
        const cw1 = banner1.width;
        const ch1 = Math.round(cw1 * (54 / 86));
        const y1 = Math.max(0, banner1.bottomY - ch1);
        setEditingFrontBox({ x: banner1.leftX, y: y1, width: cw1, height: ch1 });
      } else {
        const ch1 = Math.round(H * 0.268);
        const cw1 = Math.round(ch1 * (86 / 54));
        const x1 = Math.round((W - cw1) / 2);
        setEditingFrontBox({ x: x1, y: Math.round(H * 0.020), width: cw1, height: ch1 });
      }

      if (banner2.found) {
        const cw2 = banner2.width;
        const ch2 = Math.round(cw2 * (54 / 86));
        const y2 = Math.max(0, banner2.bottomY - ch2);
        setEditingBackBox({ x: banner2.leftX, y: y2, width: cw2, height: ch2 });
      } else if (banner1.found) {
        const cw2 = banner1.width;
        const ch2 = Math.round(cw2 * (54 / 86));
        setEditingBackBox({ x: banner1.leftX, y: Math.round(H * 0.320), width: cw2, height: ch2 });
      } else {
        const ch2 = Math.round(H * 0.268);
        const cw2 = Math.round(ch2 * (86 / 54));
        const x2 = Math.round((W - cw2) / 2);
        setEditingBackBox({ x: x2, y: Math.round(H * 0.320), width: cw2, height: ch2 });
      }

      setEditingRotFront(0);
      setEditingRotBack(0);
    } else if (presetType === 'aadhaar') {
      const aadhaar = findAadhaarCardBounds(page);
      setEditingFrontBox(aadhaar.frontBox);
      setEditingBackBox(aadhaar.backBox);
      setEditingRotFront(0);
      setEditingRotBack(0);
    } else if (presetType === 'aadhaar_mid') {
      const cardWidth = Math.round(W * 0.440);
      const cardHeight = Math.round(cardWidth * (54 / 86));
      const cardY = Math.round(H * 0.60);
      setEditingFrontBox({ x: Math.round(W * 0.052), y: cardY, width: cardWidth, height: cardHeight });
      setEditingBackBox({ x: Math.round(W * 0.508), y: cardY, width: cardWidth, height: cardHeight });
      setEditingRotFront(0);
      setEditingRotBack(0);
    } else if (presetType === 'voter') {
      const cw = W * 0.88;
      const ch = cw * (54 / 86);
      setEditingFrontBox({ x: (W - cw) / 2, y: H * 0.52, width: cw, height: ch });
      setEditingBackBox({ x: (W - cw) / 2, y: H * 0.52, width: cw, height: ch });
      setEditingRotFront(0);
      setEditingRotBack(0);
    } else if (presetType === 'full') {
      setEditingFrontBox({ x: 0, y: 0, width: W, height: H });
      setEditingBackBox({ x: 0, y: 0, width: W, height: H });
    }
  };

  const filteredCards = processedCards.filter((card) => {
    if (activeResultFilter === 'all') return true;
    return card.category === activeResultFilter;
  });

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-[#0f172a] font-sans pb-20">
      {/* Top Application Bar */}
      <div className="bg-[#1e293b] text-white border-b border-slate-700 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onNavigateHome}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Studio</span>
            </button>

            <div className="h-6 w-px bg-slate-700" />

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-bold shadow-sm">
                <CreditCard className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-extrabold tracking-tight flex items-center gap-2">
                  <span>PVC Card Maker & Auto Cropper</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    CR80 300 DPI
                  </span>
                </h1>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  Automated e-Card Detection, 86×54mm Auto-Crop & Multi-Tray Print Sheets
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                showSettings
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Card & Print Settings</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${showSettings ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Collapsible Card Settings Bar */}
        {showSettings && (
          <div className="bg-[#0f172a] border-t border-slate-800 px-4 sm:px-6 lg:px-8 py-4">
            <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Width (mm)</label>
                <input
                  type="number"
                  value={settings.widthMm}
                  onChange={(e) => setSettings({ ...settings, widthMm: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Height (mm)</label>
                <input
                  type="number"
                  value={settings.heightMm}
                  onChange={(e) => setSettings({ ...settings, heightMm: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">DPI (Print Quality)</label>
                <select
                  value={settings.dpi}
                  onChange={(e) => setSettings({ ...settings, dpi: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white font-bold focus:outline-none focus:border-blue-500"
                >
                  <option value={300}>300 DPI (High-Quality)</option>
                  <option value={600}>600 DPI (Ultra Fine)</option>
                  <option value={200}>200 DPI (Fast)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Ayushman Rotation</label>
                <select
                  value={settings.ayushmanRotation}
                  onChange={(e) => setSettings({ ...settings, ayushmanRotation: e.target.value as any })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white font-bold focus:outline-none focus:border-blue-500"
                >
                  <option value="cw">CW (Clockwise 90°)</option>
                  <option value="ccw">CCW (-90°)</option>
                  <option value="none">None (0°)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Output Format</label>
                <select
                  value={settings.outputFormat}
                  onChange={(e) => setSettings({ ...settings, outputFormat: e.target.value as any })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white font-bold focus:outline-none focus:border-blue-500"
                >
                  <option value="jpg">JPG (High Quality)</option>
                  <option value="png">PNG (Lossless)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Card Corners & Bleed</label>
                <div className="flex items-center gap-2 pt-1">
                  <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.roundedCorners}
                      onChange={(e) => setSettings({ ...settings, roundedCorners: e.target.checked })}
                      className="rounded accent-blue-500"
                    />
                    <span>CR80 Curve</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.borderGuide}
                      onChange={(e) => setSettings({ ...settings, borderGuide: e.target.checked })}
                      className="rounded accent-blue-500"
                    />
                    <span>Cut Line</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Mode Tabs Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4 mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Choose how you want to work
            </span>
            <span className="text-xs font-semibold text-blue-600 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>All types of card cut in one click</span>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {/* Auto */}
            <button
              type="button"
              onClick={() => setSelectedMode('auto')}
              className={`p-3 rounded-xl border text-left transition-all relative ${
                selectedMode === 'auto'
                  ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-600'
                  : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/70 text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-extrabold px-1.5 py-0.5 rounded bg-blue-800 text-white font-mono">
                  AUTO
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-700 uppercase">
                  RECOMMENDED
                </span>
              </div>
              <div className="text-xs font-bold text-slate-900 leading-tight">
                Auto-Detect (All Files)
              </div>
            </button>

            {/* Ayushman */}
            <button
              type="button"
              onClick={() => setSelectedMode('ayushman')}
              className={`p-3 rounded-xl border text-left transition-all ${
                selectedMode === 'ayushman'
                  ? 'border-amber-600 bg-amber-50/50 shadow-xs ring-1 ring-amber-600'
                  : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/70 text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-extrabold px-1.5 py-0.5 rounded bg-amber-800 text-white font-mono">
                  AYU
                </span>
              </div>
              <div className="text-xs font-bold text-slate-900 leading-tight">
                Ayushman Card
              </div>
            </button>

            {/* Aadhaar */}
            <button
              type="button"
              onClick={() => setSelectedMode('aadhaar')}
              className={`p-3 rounded-xl border text-left transition-all ${
                selectedMode === 'aadhaar'
                  ? 'border-orange-600 bg-orange-50/50 shadow-xs ring-1 ring-orange-600'
                  : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/70 text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-extrabold px-1.5 py-0.5 rounded bg-orange-800 text-white font-mono">
                  AAD
                </span>
              </div>
              <div className="text-xs font-bold text-slate-900 leading-tight">
                Aadhaar Card
              </div>
            </button>

            {/* Ration */}
            <button
              type="button"
              onClick={() => setSelectedMode('ration')}
              className={`p-3 rounded-xl border text-left transition-all ${
                selectedMode === 'ration'
                  ? 'border-red-600 bg-red-50/50 shadow-xs ring-1 ring-red-600'
                  : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/70 text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-extrabold px-1.5 py-0.5 rounded bg-red-800 text-white font-mono">
                  RTN
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 uppercase">
                  NEW
                </span>
              </div>
              <div className="text-xs font-bold text-slate-900 leading-tight">
                Ration Card Document
              </div>
            </button>

            {/* Voter ID */}
            <button
              type="button"
              onClick={() => setSelectedMode('voter')}
              className={`p-3 rounded-xl border text-left transition-all ${
                selectedMode === 'voter'
                  ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-600'
                  : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/70 text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-extrabold px-1.5 py-0.5 rounded bg-indigo-800 text-white font-mono">
                  VOT
                </span>
              </div>
              <div className="text-xs font-bold text-slate-900 leading-tight">
                Voter ID (e-EPIC)
              </div>
            </button>

            {/* ABHA */}
            <button
              type="button"
              onClick={() => setSelectedMode('abha')}
              className={`p-3 rounded-xl border text-left transition-all ${
                selectedMode === 'abha'
                  ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-600'
                  : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/70 text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-extrabold px-1.5 py-0.5 rounded bg-emerald-800 text-white font-mono">
                  ABH
                </span>
              </div>
              <div className="text-xs font-bold text-slate-900 leading-tight">
                ABHA Card
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* ================= STEP 1: UPLOAD & DETECTION PRE-SCAN ================= */}
        {step === 'upload' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs text-center relative overflow-hidden">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,image/jpeg,image/png,image/webp"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />

              <div className="max-w-xl mx-auto space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center shadow-inner">
                  <Upload className="w-8 h-8" />
                </div>

                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                    Upload Your Original Government PDF or Image Cards
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Select your official e-Aadhaar, Ayushman PM-JAY, Digital Ration, Voter ID, or ABHA downloads. Multi-page and encrypted PDFs fully supported.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isScanning}
                    className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Your Card Files</span>
                  </button>
                </div>

                {isScanning && (
                  <div className="pt-4 space-y-2 max-w-xs mx-auto">
                    <div className="flex justify-between text-xs font-bold text-slate-600">
                      <span>Scanning original pages...</span>
                      <span>{scanProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${scanProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Review Detected Files Statistics */}
            {queuedFiles.length > 0 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900">
                      Review Detected Files
                    </h3>
                    <p className="text-xs text-slate-500">
                      {queuedFiles.length} file(s) scanned. Click "Process Files" to auto-crop both Front & Back into 86×54mm CR80 cards.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setQueuedFiles([]);
                      updateCountsFromQueued([]);
                    }}
                    className="text-xs text-red-600 hover:text-red-700 font-bold"
                  >
                    Clear All
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-slate-800 text-white font-mono">
                        ALL
                      </span>
                      <span className="text-2xl font-black text-slate-900">{counts.total}</span>
                    </div>
                    <div className="text-xs font-bold text-slate-700 mt-2">Total Files</div>
                    <div className="text-[10px] text-slate-400">All loaded files</div>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-orange-700 text-white font-mono">
                        AAD
                      </span>
                      <span className="text-2xl font-black text-orange-700">{counts.aadhaar}</span>
                    </div>
                    <div className="text-xs font-bold text-slate-700 mt-2">Aadhaar</div>
                    <div className="text-[10px] text-slate-400">UIDAI cut section</div>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-700 text-white font-mono">
                        AYU
                      </span>
                      <span className="text-2xl font-black text-amber-700">{counts.ayushman}</span>
                    </div>
                    <div className="text-xs font-bold text-slate-700 mt-2">Ayushman</div>
                    <div className="text-[10px] text-slate-400">PM-JAY Gold</div>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-red-700 text-white font-mono">
                        RTN
                      </span>
                      <span className="text-2xl font-black text-red-700">{counts.ration}</span>
                    </div>
                    <div className="text-xs font-bold text-slate-700 mt-2">Ration Card</div>
                    <div className="text-[10px] text-slate-400">Digital Ration</div>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-700 text-white font-mono">
                        VOT
                      </span>
                      <span className="text-2xl font-black text-indigo-700">{counts.voter}</span>
                    </div>
                    <div className="text-xs font-bold text-slate-700 mt-2">Voter ID</div>
                    <div className="text-[10px] text-slate-400">e-EPIC ECI</div>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-700 text-white font-mono">
                        ABH
                      </span>
                      <span className="text-2xl font-black text-emerald-700">{counts.abha}</span>
                    </div>
                    <div className="text-xs font-bold text-slate-700 mt-2">ABHA Card</div>
                    <div className="text-[10px] text-slate-400">Health ID NDHM</div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-2">
                    {queuedFiles.map((item, idx) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          {item.previewUrl ? (
                            <img
                              src={item.previewUrl}
                              alt="thumb"
                              className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center shrink-0">
                              <FileText className="w-5 h-5 text-slate-500" />
                            </div>
                          )}
                          <div className="truncate">
                            <div className="font-bold text-slate-800 truncate" title={item.name}>
                              {idx + 1}. {item.name}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 flex-wrap">
                              <span>{(item.size / 1024).toFixed(1)} KB · {item.numPages} Page{item.numPages > 1 ? 's' : ''}</span>
                              {item.unlockedWithPassword && (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                  🔑 Auto-unlocked ({item.unlockedWithPassword})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0 uppercase ${
                            item.detectedCategory === 'ayushman'
                              ? 'bg-amber-100 text-amber-800'
                              : item.detectedCategory === 'aadhaar'
                              ? 'bg-orange-100 text-orange-800'
                              : item.detectedCategory === 'ration'
                              ? 'bg-red-100 text-red-800'
                              : item.detectedCategory === 'voter'
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {item.detectedCategory}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={() => setQueuedFiles([])}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200"
                    >
                      ← Back
                    </button>

                    <button
                      type="button"
                      onClick={handleStartProcessing}
                      className="px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md transition-all flex items-center gap-2"
                    >
                      <span>Process Files</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= STEP 2: REAL-TIME PROCESSING & TERMINAL ================= */}
        {step === 'processing' && (
          <div className="space-y-6">
            <div className="bg-[#1e293b] rounded-2xl border border-slate-700 p-6 text-white shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
                    <span>Processing Files</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    {queuedFiles.length} file(s) queued | Processing item {currentProcessingIndex} of {queuedFiles.length}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-2xl font-black text-emerald-400 font-mono">
                    {Math.round((currentProcessingIndex / queuedFiles.length) * 100)}%
                  </span>
                </div>
              </div>

              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-200"
                  style={{ width: `${(currentProcessingIndex / queuedFiles.length) * 100}%` }}
                />
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 pt-2 border-t border-slate-800 text-center font-mono">
                <div className="p-2 rounded-lg bg-slate-800/80">
                  <div className="text-base font-bold text-white">{queuedFiles.length}</div>
                  <div className="text-[10px] text-slate-400 uppercase">Uploaded</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-800/80">
                  <div className="text-base font-bold text-orange-400">{counts.aadhaar}</div>
                  <div className="text-[10px] text-slate-400 uppercase">Aadhaar</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-800/80">
                  <div className="text-base font-bold text-amber-400">{counts.ayushman}</div>
                  <div className="text-[10px] text-slate-400 uppercase">Ayushman</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-800/80">
                  <div className="text-base font-bold text-red-400">{counts.ration}</div>
                  <div className="text-[10px] text-slate-400 uppercase">Ration</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-800/80">
                  <div className="text-base font-bold text-indigo-400">{counts.voter}</div>
                  <div className="text-[10px] text-slate-400 uppercase">Voter ID</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-800/80">
                  <div className="text-base font-bold text-emerald-400">{counts.abha}</div>
                  <div className="text-[10px] text-slate-400 uppercase">ABHA</div>
                </div>
                <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-800">
                  <div className="text-base font-bold text-emerald-400">{counts.processedOk}</div>
                  <div className="text-[10px] text-emerald-300 uppercase">Processed OK</div>
                </div>
                <div className="p-2 rounded-lg bg-rose-950/60 border border-rose-900">
                  <div className="text-base font-bold text-rose-400">{counts.failed}</div>
                  <div className="text-[10px] text-rose-300 uppercase">Failed</div>
                </div>
              </div>
            </div>

            <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-6 shadow-2xl font-mono text-xs text-slate-300 space-y-2 h-[420px] overflow-y-auto">
              <div className="text-slate-500 pb-2 border-b border-slate-800 text-[11px] flex justify-between">
                <span>TERMINAL LOG OUTPUT — AUTO CROP ENGINE</span>
                <span>STATUS: {isProcessing ? 'RUNNING' : 'DONE'}</span>
              </div>

              {terminalLogs.map((log, idx) => (
                <div
                  key={idx}
                  className={`leading-relaxed ${
                    log.level === 'success'
                      ? 'text-emerald-400 font-bold'
                      : log.level === 'error'
                      ? 'text-rose-400 font-bold'
                      : log.level === 'warn'
                      ? 'text-amber-400'
                      : 'text-slate-300'
                  }`}
                >
                  <span className="text-slate-600 mr-2">[{log.timestamp}]</span>
                  <span>{log.message}</span>
                </div>
              ))}
              <div ref={terminalEndRef} />
            </div>
          </div>
        )}

        {/* ================= STEP 3: RESULTS & EXPORT HUB ================= */}
        {step === 'results' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-6 rounded-2xl bg-emerald-600 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-wider font-extrabold text-emerald-200">
                  All files processed
                </div>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight">
                  Process Complete — {processedCards.length}/{processedCards.length} file(s) processed successfully
                </h3>
                <div className="flex flex-wrap gap-2 text-xs font-mono text-emerald-100 pt-1">
                  <span>Aadhaar: {counts.aadhaar}</span>
                  <span>•</span>
                  <span>Ayushman: {counts.ayushman}</span>
                  <span>•</span>
                  <span>Ration: {counts.ration}</span>
                  <span>•</span>
                  <span>Voter ID: {counts.voter}</span>
                  <span>•</span>
                  <span>ABHA: {counts.abha}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleDownloadZip}
                  disabled={isDownloadingZip}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
                >
                  <FolderArchive className="w-4 h-4 text-emerald-400" />
                  <span>{isDownloadingZip ? 'Zipping...' : 'Download Folders ZIP'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenA4PrintSheet}
                  disabled={isGeneratingSheet}
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs shadow-md transition-all flex items-center gap-2"
                >
                  <Printer className="w-4 h-4 text-blue-600" />
                  <span>A4 Print Sheet</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenPvcTray()}
                  disabled={isGeneratingTray}
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs shadow-md transition-all flex items-center gap-2"
                >
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>{isGeneratingTray ? 'Loading...' : 'Epson L805 Tray'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('upload');
                    setQueuedFiles([]);
                    setProcessedCards([]);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-all"
                >
                  Process More
                </button>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 flex flex-wrap items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2">
                <FolderArchive className="w-5 h-5 text-blue-600" />
                <span className="font-bold">
                  Organized Folders Generated:
                </span>
                <span className="text-slate-500 font-mono">
                  Ration Card/ • Ayushman Card/ • Voter ID/ • ABHA Card/ • Aadhaar Card/
                </span>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                CR80 86mm × 54mm (Ready for PVC Printer / Dragon Sheet)
              </span>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {[
                { id: 'all', label: `All Cards (${processedCards.length})` },
                { id: 'ayushman', label: `Ayushman (${counts.ayushman})` },
                { id: 'aadhaar', label: `Aadhaar (${counts.aadhaar})` },
                { id: 'ration', label: `Ration Card (${counts.ration})` },
                { id: 'voter', label: `Voter ID (${counts.voter})` },
                { id: 'abha', label: `ABHA Card (${counts.abha})` },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setActiveResultFilter(f.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                    activeResultFilter === f.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Card Gallery Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCards.map((card) => (
                <div
                  key={card.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 hover:border-slate-300 transition-all flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-800 truncate max-w-[200px]" title={card.sourceFileName}>
                        {card.cardIndex}. {card.sourceFileName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {card.dimensions.mm} @ {card.dimensions.dpi} DPI · {card.numPages} Page{card.numPages > 1 ? 's' : ''}
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                        card.category === 'ayushman'
                          ? 'bg-amber-100 text-amber-800'
                          : card.category === 'aadhaar'
                          ? 'bg-orange-100 text-orange-800'
                          : card.category === 'ration'
                          ? 'bg-red-100 text-red-800'
                          : card.category === 'voter'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {card.category}
                    </span>
                  </div>

                  {/* Side-by-Side Front and Back Previews */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Front */}
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-bold text-slate-500 uppercase flex items-center justify-between">
                        <span>Front Side</span>
                        <span className="text-[9px] text-emerald-600 font-mono">OK</span>
                      </div>
                      <div className="aspect-[86/54] rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shadow-inner relative group">
                        <img
                          src={card.frontDataUrl}
                          alt="Front"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleDownloadSingle(card.frontDataUrl, `${card.cardIndex}_front.jpg`)}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </button>
                      </div>
                    </div>

                    {/* Back */}
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-bold text-slate-500 uppercase flex items-center justify-between">
                        <span>Back Side</span>
                        <span className="text-[9px] text-emerald-600 font-mono">OK</span>
                      </div>
                      <div className="aspect-[86/54] rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shadow-inner relative group">
                        <img
                          src={card.backDataUrl}
                          alt="Back"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleDownloadSingle(card.backDataUrl, `${card.cardIndex}_back.jpg`)}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Actions for this individual card */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenFineTune(card)}
                        className="text-slate-600 hover:text-blue-600 font-bold flex items-center gap-1 text-[11px]"
                      >
                        <Sliders className="w-3 h-3 text-blue-600" />
                        <span>Adjust Crop</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const updated = {
                            ...card,
                            frontDataUrl: card.backDataUrl,
                            backDataUrl: card.frontDataUrl,
                            rotationFront: card.rotationBack,
                            rotationBack: card.rotationFront,
                          };
                          setProcessedCards((prev) => prev.map((c) => (c.id === card.id ? updated : c)));
                        }}
                        className="text-slate-500 hover:text-slate-800 font-bold flex items-center gap-1 text-[11px]"
                        title="Swap Front and Back"
                      >
                        <RefreshCw className="w-3 h-3 text-slate-400" />
                        <span>Swap</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenPvcTray(card)}
                        className="text-slate-500 hover:text-emerald-700 font-bold flex items-center gap-1 text-[11px]"
                        title="Open Epson L805 Tray for this card"
                      >
                        <CreditCard className="w-3 h-3 text-emerald-600" />
                        <span>Tray</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleDownloadSingle(card.frontDataUrl, `${card.cardIndex}_front.jpg`)}
                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold"
                      >
                        Front JPG
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadSingle(card.backDataUrl, `${card.cardIndex}_back.jpg`)}
                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold"
                      >
                        Back JPG
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ================= MODAL: PRECISION VISUAL CROP ADJUSTER ================= */}
      {editingCard && (() => {
        const queuedItem = queuedFiles.find((f) => f.name === editingCard.sourceFileName);
        const page1 = queuedItem?.canvases?.[0];
        const page2 = queuedItem?.canvases && queuedItem.canvases.length > 1 ? queuedItem.canvases[1] : page1;
        const pageH = page1?.height || 2000;
        const pageW = page1?.width || 1414;

        // Compute live previews in real time as user adjusts sliders or presets
        const liveFront = page1
          ? extractAndFormatCard(page1, editingFrontBox, settings, editingRotFront)
          : editingCard.frontDataUrl;

        const liveBack = page2
          ? extractAndFormatCard(page2, editingBackBox, settings, editingRotBack)
          : editingCard.backDataUrl;

        const yPercent = Math.round((editingFrontBox.y / pageH) * 100);

        return (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-4xl w-full p-6 space-y-4 shadow-2xl animate-scaleUp max-h-[95vh] flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 shrink-0">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <span>Precision Crop Adjuster & Live Preview</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      {editingCard.sourceFileName}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Use 1-click presets or the sliders below to move the crop box over your card. Watch the preview update instantly!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingCard(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Quick 1-Click Presets */}
              <div className="flex flex-wrap items-center gap-2 shrink-0 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-slate-700">1-Click Presets:</span>
                <button
                  type="button"
                  onClick={() => applyPreset('mahasarathi')}
                  className="px-3 py-1 rounded-lg border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs font-black shadow-xs ring-1 ring-blue-500/20"
                >
                  MahaSarathi / Stacked (Top & Mid)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('aadhaar')}
                  className="px-3 py-1 rounded-lg border border-red-300 bg-red-50 hover:bg-red-100 text-red-900 text-xs font-black shadow-xs ring-1 ring-red-500/20"
                >
                  UIDAI Aadhaar (Marked Red Boxes)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('aadhaar_mid')}
                  className="px-3 py-1 rounded-lg border border-orange-200 bg-white hover:bg-orange-50 text-orange-800 text-xs font-bold shadow-xs"
                >
                  Aadhaar Mid-Page (60%)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('voter')}
                  className="px-3 py-1 rounded-lg border border-indigo-200 bg-white hover:bg-indigo-50 text-indigo-800 text-xs font-bold shadow-xs"
                >
                  Voter ID (e-EPIC)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('full')}
                  className="px-3 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold shadow-xs"
                >
                  Full Card (No Crop)
                </button>
              </div>

              {/* Sliders for Easy Vertical & Horizontal Alignment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-3 bg-blue-50/50 rounded-2xl border border-blue-200/80 shrink-0">
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Front Card Y (Top):</span>
                    <span className="font-mono text-blue-600">{Math.round((editingFrontBox.y / pageH) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={Math.round(pageH * 0.85)}
                    step={1}
                    value={editingFrontBox.y}
                    onChange={(e) => {
                      const newY = Number(e.target.value);
                      setEditingFrontBox((prev) => ({ ...prev, y: newY }));
                    }}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>Top (0%)</span>
                    <span>Bottom (85%)</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Back Card Y (Top):</span>
                    <span className="font-mono text-emerald-600">{Math.round((editingBackBox.y / pageH) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={Math.round(pageH * 0.85)}
                    step={1}
                    value={editingBackBox.y}
                    onChange={(e) => {
                      const newY = Number(e.target.value);
                      setEditingBackBox((prev) => ({ ...prev, y: newY }));
                    }}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>Top (0%)</span>
                    <span>Bottom (85%)</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Front Card X (Left):</span>
                    <span className="font-mono text-blue-600">{Math.round((editingFrontBox.x / pageW) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={Math.round(pageW * 0.50)}
                    step={1}
                    value={editingFrontBox.x}
                    onChange={(e) => {
                      const newX = Number(e.target.value);
                      setEditingFrontBox((prev) => ({ ...prev, x: newX }));
                    }}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>Left (0%)</span>
                    <span>Center (50%)</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Back Card X (Left):</span>
                    <span className="font-mono text-emerald-600">{Math.round((editingBackBox.x / pageW) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={Math.round(pageW * 0.35)}
                    max={Math.round(pageW * 0.80)}
                    step={1}
                    value={editingBackBox.x}
                    onChange={(e) => {
                      const newX = Number(e.target.value);
                      setEditingBackBox((prev) => ({ ...prev, x: newX }));
                    }}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>Center (35%)</span>
                    <span>Right (80%)</span>
                  </div>
                </div>

                <div className="sm:col-span-2 lg:col-span-2">
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Card Width / Scale:</span>
                    <span className="font-mono text-blue-600">{Math.round((editingFrontBox.width / pageW) * 100)}% width</span>
                  </div>
                  <input
                    type="range"
                    min={Math.round(pageW * 0.30)}
                    max={Math.round(pageW * 0.95)}
                    step={1}
                    value={editingFrontBox.width}
                    onChange={(e) => {
                      const newW = Number(e.target.value);
                      const newH = Math.round(newW * (54 / 86));
                      setEditingFrontBox((prev) => ({ ...prev, width: newW, height: newH }));
                      setEditingBackBox((prev) => ({ ...prev, width: newW, height: newH }));
                    }}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>Compact (30%)</span>
                    <span>Wide (95%)</span>
                  </div>
                </div>

                <div className="sm:col-span-2 lg:col-span-2">
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Card Height (Independent):</span>
                    <span className="font-mono text-indigo-600">{Math.round((editingFrontBox.height / pageH) * 100)}% height</span>
                  </div>
                  <input
                    type="range"
                    min={Math.round(pageH * 0.15)}
                    max={Math.round(pageH * 0.35)}
                    step={1}
                    value={editingFrontBox.height}
                    onChange={(e) => {
                      const newH = Number(e.target.value);
                      setEditingFrontBox((prev) => ({ ...prev, height: newH }));
                      setEditingBackBox((prev) => ({ ...prev, height: newH }));
                    }}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>Trim Bottom (15%)</span>
                    <span>Expand Bottom (35%)</span>
                  </div>
                </div>
              </div>

              {/* Real-Time Live Preview Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-y-auto">
                <div className="space-y-2 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5 text-blue-700">
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                      <span>Front Side Preview</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditingRotFront((prev) => (prev + 90) % 360)}
                        className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[11px] font-bold hover:bg-slate-100"
                      >
                        Rotate 90°
                      </button>
                    </div>
                  </div>
                  <div className="aspect-[86/54] rounded-xl overflow-hidden border-2 border-blue-400 shadow-sm bg-white">
                    <img src={liveFront} alt="Front" className="w-full h-full object-cover" />
                  </div>
                </div>

                <div className="space-y-2 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5 text-emerald-700">
                      <span className="w-2 h-2 rounded-full bg-emerald-600" />
                      <span>Back Side Preview</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditingRotBack((prev) => (prev + 90) % 360)}
                        className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[11px] font-bold hover:bg-slate-100"
                      >
                        Rotate 90°
                      </button>
                    </div>
                  </div>
                  <div className="aspect-[86/54] rounded-xl overflow-hidden border-2 border-emerald-400 shadow-sm bg-white">
                    <img src={liveBack} alt="Back" className="w-full h-full object-cover" />
                  </div>
                </div>
              </div>

              {/* Controls & Done Button */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const frontBoxTemp = { ...editingFrontBox };
                    const backBoxTemp = { ...editingBackBox };
                    const rotFrontTemp = editingRotFront;
                    const rotBackTemp = editingRotBack;

                    setEditingFrontBox(backBoxTemp);
                    setEditingBackBox(frontBoxTemp);
                    setEditingRotFront(rotBackTemp);
                    setEditingRotBack(rotFrontTemp);
                  }}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-800 flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Swap Front & Back</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingCard(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const updated: ProcessedCard = {
                        ...editingCard,
                        frontDataUrl: liveFront,
                        backDataUrl: liveBack,
                        frontCropBox: editingFrontBox,
                        backCropBox: editingBackBox,
                        rotationFront: editingRotFront,
                        rotationBack: editingRotBack,
                      };
                      setProcessedCards((prev) => prev.map((c) => (c.id === editingCard.id ? updated : c)));
                      setEditingCard(null);
                    }}
                    className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md"
                  >
                    Apply & Save Card
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ================= MODAL: ENCRYPTED E-AADHAAR PASSWORD PROMPT ================= */}
      {passwordModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-scaleUp">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Password Protected e-Aadhaar
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Official UIDAI e-Aadhaar PDFs are protected by default with an 8-character password.
                <br />
                <strong className="text-slate-700">Format:</strong> First 4 letters of Name in CAPITAL + Year of Birth (e.g. <code>SAIF1992</code>).
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Enter PDF Password</label>
              <input
                type="text"
                placeholder="e.g. SAIF1992"
                value={pdfPassword}
                onChange={(e) => setPdfPassword(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold tracking-wider text-sm focus:outline-none focus:border-blue-500 uppercase"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setPasswordModalOpen(false);
                  setPendingFile(null);
                  setPdfPassword('');
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (pendingFile) {
                    const dt = new DataTransfer();
                    dt.items.add(pendingFile);
                    setPasswordModalOpen(false);
                    handleFileSelect(dt.files, pdfPassword);
                    setPendingFile(null);
                    setPdfPassword('');
                  }
                }}
                className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-md"
              >
                Unlock & Process
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: A4 PRINT SHEET PREVIEW ================= */}
      {printSheetUrl && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 space-y-4 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 shrink-0">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Printer className="w-4 h-4 text-blue-600" />
                  <span>A4 Print Sheet Preview (5 Cards Front & Back Aligned)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Ready to print at 100% scale (no fit to page) for Dragon sheet / PVC inkjet trays / lamination pouches.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPrintSheetUrl(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-slate-100 rounded-2xl flex items-center justify-center">
              <img
                src={printSheetUrl}
                alt="A4 Print Sheet"
                className="max-h-[65vh] w-auto object-contain rounded-lg shadow-xl border border-slate-300"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 shrink-0">
              <span className="text-xs text-slate-500 font-mono">
                300 DPI · 2480 × 3508 pixels
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => triggerDirectPrint(printSheetUrl)}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Sheet (Ctrl+P)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadSingle(printSheetUrl, 'PVC_A4_Print_Sheet.jpg')}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download High-Res JPG</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: EPSON L805 PVC TRAY PREVIEW ================= */}
      {pvcTrayModalUrl && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 shrink-0">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>Epson L805 / PVC Tray Template (2 Cards)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Formatted for standard Epson L805 / R280 / T50 PVC card tray slots at 300 DPI.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPvcTrayModalUrl(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-slate-100 rounded-2xl flex items-center justify-center">
              <img
                src={pvcTrayModalUrl}
                alt="PVC Tray Template"
                className="max-h-[60vh] w-auto object-contain rounded-lg shadow-xl border border-slate-300"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 shrink-0">
              <span className="text-xs text-slate-500 font-mono">
                300 DPI · 1650 × 2480 pixels
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => triggerDirectPrint(pvcTrayModalUrl)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Tray</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadSingle(pvcTrayModalUrl, 'PVC_Tray_Template.jpg')}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download JPG</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
