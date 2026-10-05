import React, { useRef, useState, useEffect } from 'react';
import { Download, Award, RefreshCw, ArrowLeft } from 'lucide-react';

interface CertificateMakerProps {
  onNavigateHome: () => void;
}

export const CertificateMaker: React.FC<CertificateMakerProps> = ({ onNavigateHome }) => {
  const [recipient, setRecipient] = useState('Aarav Mehta');
  const [title, setTitle] = useState('Certificate of Excellence');
  const [reason, setReason] = useState('for outstanding academic performance and dedicated leadership during the 2025-2026 academic year');
  const [organization, setOrganization] = useState('Green Valley International School');
  const [dateStr, setDateStr] = useState('October 2026');
  const [signatory, setSignatory] = useState('Dr. S. K. Sharma (Principal)');
  const [theme, setTheme] = useState<'gold' | 'blue' | 'maroon'>('gold');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    drawCertificate();
  }, [recipient, title, reason, organization, dateStr, signatory, theme]);

  const drawCertificate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dimensions: 1200 x 840 (standard A4 landscape proportions)
    canvas.width = 1200;
    canvas.height = 840;

    // Background
    ctx.fillStyle = '#faf8f5';
    ctx.fillRect(0, 0, 1200, 840);

    // Theme color palettes
    const palette = {
      gold: {
        primary: '#b48324',
        accent: '#d4af37',
        dark: '#1c1917',
        border: '#c59b27',
      },
      blue: {
        primary: '#1f6fd6',
        accent: '#22b8e6',
        dark: '#0f172a',
        border: '#2563eb',
      },
      maroon: {
        primary: '#991b1b',
        accent: '#e6197f',
        dark: '#18181b',
        border: '#b91c1c',
      },
    }[theme];

    // Double Border
    ctx.strokeStyle = palette.border;
    ctx.lineWidth = 12;
    ctx.strokeRect(30, 30, 1140, 780);

    ctx.strokeStyle = palette.accent;
    ctx.lineWidth = 2;
    ctx.strokeRect(48, 48, 1104, 744);

    // Corner decorative flourishes
    const drawCorner = (x: number, y: number, angle: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillStyle = palette.primary;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(24, 0);
      ctx.lineTo(0, 24);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    drawCorner(56, 56, 0);
    drawCorner(1144, 56, Math.PI / 2);
    drawCorner(1144, 784, Math.PI);
    drawCorner(56, 784, -Math.PI / 2);

    // Organization Name
    ctx.textAlign = 'center';
    ctx.fillStyle = palette.dark;
    ctx.font = 'bold 24px "Outfit", sans-serif';
    ctx.fillText(organization.toUpperCase(), 600, 140);

    // Subtitle
    ctx.fillStyle = palette.primary;
    ctx.font = '600 15px "DM Sans", sans-serif';
    ctx.fillText('THIS ACKNOWLEDGEMENT IS PROUDLY PRESENTED TO', 600, 195);

    // Recipient Name
    ctx.fillStyle = palette.dark;
    ctx.font = 'italic 700 52px "Outfit", serif';
    ctx.fillText(recipient || 'Recipient Name', 600, 280);

    // Divider Line under recipient name
    ctx.strokeStyle = palette.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(350, 310);
    ctx.lineTo(850, 310);
    ctx.stroke();

    // Certificate Title / Purpose
    ctx.fillStyle = palette.primary;
    ctx.font = 'bold 36px "Outfit", sans-serif';
    ctx.fillText(title, 600, 380);

    // Description / Reason (multi-line wrap)
    ctx.fillStyle = '#475569';
    ctx.font = '18px "DM Sans", sans-serif';
    const words = reason.split(' ');
    let line = '';
    let y = 440;
    const maxWidth = 760;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, 600, y);
        line = words[n] + ' ';
        y += 28;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, 600, y);

    // Seal Medal
    ctx.beginPath();
    ctx.arc(600, 610, 42, 0, Math.PI * 2);
    ctx.fillStyle = palette.primary;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px "Outfit", sans-serif';
    ctx.fillText('★', 600, 618);

    // Left Signature & Date
    ctx.textAlign = 'left';
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 15px "DM Sans", sans-serif';
    ctx.fillText(`Date: ${dateStr}`, 140, 720);

    // Right Signatory
    ctx.textAlign = 'right';
    ctx.fillText(signatory, 1060, 720);

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(820, 695);
    ctx.lineTo(1060, 695);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '12px "DM Sans", sans-serif';
    ctx.fillText('Authorized Signature', 1060, 740);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `Certificate_${recipient.replace(/\s+/g, '_')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={onNavigateHome}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1f6fd6] hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </button>

        <span className="text-xs text-slate-500 font-medium">
          Ai Printers • Instant Certificate Maker
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form Controls */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <span className="text-3xl">📜</span>
            <div>
              <h2 className="font-outfit font-extrabold text-lg text-slate-900 leading-tight">
                Certificate Maker
              </h2>
              <p className="text-xs text-slate-500">Customize text and download print-ready PNG</p>
            </div>
          </div>

          {/* Theme Palette */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Border Theme
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTheme('gold')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  theme === 'gold'
                    ? 'border-yellow-500 bg-yellow-50 text-yellow-800'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                Classic Gold
              </button>
              <button
                type="button"
                onClick={() => setTheme('blue')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  theme === 'blue'
                    ? 'border-blue-500 bg-blue-50 text-blue-800'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                Royal Blue
              </button>
              <button
                type="button"
                onClick={() => setTheme('maroon')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  theme === 'maroon'
                    ? 'border-red-500 bg-red-50 text-red-800'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                Maroon
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Recipient Name
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#1f6fd6]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Certificate Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#1f6fd6]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Organization / School
            </label>
            <input
              type="text"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#1f6fd6]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Reason / Citation
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#1f6fd6]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Date
              </label>
              <input
                type="text"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#1f6fd6]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Signatory
              </label>
              <input
                type="text"
                value={signatory}
                onChange={(e) => setSignatory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#1f6fd6]"
              />
            </div>
          </div>

          <button
            onClick={handleDownload}
            className="w-full py-3 rounded-xl bg-[#131c30] hover:bg-[#1e2a47] text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 mt-4"
          >
            <Download className="w-4 h-4 text-yellow-400" />
            <span>Download Certificate (PNG)</span>
          </button>
        </div>

        {/* Right Canvas Live Preview */}
        <div className="lg:col-span-8 bg-slate-900/5 p-4 sm:p-6 rounded-3xl border border-slate-200 flex flex-col items-center">
          <canvas
            ref={canvasRef}
            className="w-full rounded-2xl shadow-xl border border-slate-300 bg-white"
          />
          <p className="text-xs text-slate-400 mt-4 text-center">
            Rendering in crisp 1200×840px high-resolution canvas. Ready for printing on parchment or glossy 300 GSM paper.
          </p>
        </div>
      </div>
    </div>
  );
};
