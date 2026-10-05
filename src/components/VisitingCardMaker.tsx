import React, { useState } from 'react';
import { Download, ArrowLeft, MessageSquare, Phone, Mail, MapPin, Globe, Sparkles } from 'lucide-react';
import { Logo } from './Logo';

interface VisitingCardMakerProps {
  onNavigateHome: () => void;
}

export const VisitingCardMaker: React.FC<VisitingCardMakerProps> = ({ onNavigateHome }) => {
  const [company, setCompany] = useState('Ai Printers');
  const [tagline, setTagline] = useState('Awesome Imagination & Print Services');
  const [name, setName] = useState('Saif Purkar');
  const [title, setTitle] = useState('Managing Director');
  const [phone, setPhone] = useState('+91 70206 55113');
  const [email, setEmail] = useState('aiprintersanddigitalservices.23@gmail.com');
  const [address, setAddress] = useState('Commercial Print Hub, Main Market');
  const [theme, setTheme] = useState<'navy' | 'white' | 'darkgold' | 'magenta'>('navy');
  const [side, setSide] = useState<'front' | 'back'>('front');

  const themeStyles = {
    navy: {
      bg: 'bg-[#131c30]',
      text: 'text-white',
      muted: 'text-slate-300',
      accent: 'text-[#22b8e6]',
      border: 'border-slate-800',
      badgeBg: 'bg-blue-500/20 text-cyan-300',
    },
    white: {
      bg: 'bg-white',
      text: 'text-slate-900',
      muted: 'text-slate-500',
      accent: 'text-[#1f6fd6]',
      border: 'border-slate-200',
      badgeBg: 'bg-slate-100 text-slate-700',
    },
    darkgold: {
      bg: 'bg-[#1c1917]',
      text: 'text-yellow-100',
      muted: 'text-yellow-200/70',
      accent: 'text-yellow-400',
      border: 'border-yellow-900/50',
      badgeBg: 'bg-yellow-500/20 text-yellow-300',
    },
    magenta: {
      bg: 'bg-gradient-to-br from-[#131c30] to-[#2a0e24]',
      text: 'text-white',
      muted: 'text-pink-200/80',
      accent: 'text-[#e6197f]',
      border: 'border-pink-900/40',
      badgeBg: 'bg-pink-500/20 text-pink-300',
    },
  }[theme];

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
          Ai Printers • Visiting Card Designer
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form Editor */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <span className="text-3xl">💼</span>
            <div>
              <h2 className="font-outfit font-extrabold text-lg text-slate-900 leading-tight">
                Visiting Card Designer
              </h2>
              <p className="text-xs text-slate-500">Live preview & commercial print configuration</p>
            </div>
          </div>

          {/* Theme Palette */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Card Theme Style
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTheme('navy')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  theme === 'navy' ? 'border-[#1f6fd6] bg-slate-900 text-white' : 'border-slate-200 text-slate-700'
                }`}
              >
                Executive Navy
              </button>
              <button
                type="button"
                onClick={() => setTheme('white')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  theme === 'white' ? 'border-[#1f6fd6] bg-slate-100 text-slate-900' : 'border-slate-200 text-slate-700'
                }`}
              >
                Minimal White
              </button>
              <button
                type="button"
                onClick={() => setTheme('darkgold')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  theme === 'darkgold' ? 'border-yellow-500 bg-stone-900 text-yellow-400' : 'border-slate-200 text-slate-700'
                }`}
              >
                Luxury Gold
              </button>
              <button
                type="button"
                onClick={() => setTheme('magenta')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  theme === 'magenta' ? 'border-[#e6197f] bg-pink-950 text-pink-300' : 'border-slate-200 text-slate-700'
                }`}
              >
                Ai Printers Magenta
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Company / Brand</label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#1f6fd6]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Tagline</label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#1f6fd6]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Your Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#1f6fd6]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Designation</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#1f6fd6]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#1f6fd6]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#1f6fd6]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Address / Location</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#1f6fd6]"
            />
          </div>

          {/* WhatsApp Order Action */}
          <div className="pt-2">
            <a
              href={`https://wa.me/917020655113?text=${encodeURIComponent(
                `Hi Ai Printers, I would like to print visiting cards with theme "${theme}". Company: ${company}, Name: ${name} (${title}), Phone: ${phone}. Please quote for 1000 cards.`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3 rounded-xl bg-[#22c35e] hover:bg-[#1eb355] text-white text-xs font-bold shadow-md shadow-[#22c35e]/25 flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Order 1,000 Cards on WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Right Live Card Preview (3.5" x 2" standard proportions) */}
        <div className="lg:col-span-7 bg-slate-100 p-6 sm:p-10 rounded-3xl border border-slate-200 flex flex-col items-center justify-center">
          {/* Card Side Toggle */}
          <div className="flex items-center gap-2 p-1 bg-white rounded-xl border border-slate-200 mb-6">
            <button
              onClick={() => setSide('front')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                side === 'front' ? 'bg-[#131c30] text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Front Side
            </button>
            <button
              onClick={() => setSide('back')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                side === 'back' ? 'bg-[#131c30] text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Back Side
            </button>
          </div>

          {/* The Physical Card Canvas Simulation (3.5" : 2" => 7:4 aspect ratio) */}
          <div
            className={`w-full max-w-lg aspect-[7/4] rounded-2xl ${themeStyles.bg} ${themeStyles.text} ${themeStyles.border} border-2 shadow-2xl p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden transition-all duration-300`}
          >
            {/* Subtle decorative geometric print line */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/10 to-transparent rounded-bl-full pointer-events-none" />

            {side === 'front' ? (
              <>
                {/* Front Top: Brand */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Logo size="sm" showText={false} />
                    <div>
                      <h3 className="font-outfit font-extrabold text-lg sm:text-xl tracking-tight leading-none">
                        {company || 'Company Name'}
                      </h3>
                      <p className={`text-[10px] ${themeStyles.muted} mt-1`}>
                        {tagline}
                      </p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${themeStyles.badgeBg}`}>
                    CMYK Print
                  </span>
                </div>

                {/* Front Middle/Bottom: Contact Details */}
                <div className="space-y-1 text-xs">
                  <div className="font-outfit font-bold text-base sm:text-lg tracking-tight">
                    {name || 'Your Name'}
                  </div>
                  <div className={`text-xs font-semibold ${themeStyles.accent}`}>
                    {title || 'Designation'}
                  </div>

                  <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[11px] opacity-90">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 shrink-0" />
                      <span>{phone}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3 h-3 shrink-0" />
                      <span className="truncate">{email}</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:col-span-2">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{address}</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* Back Side View */
              <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
                <Logo size="lg" lightText={theme !== 'white'} />
                <p className={`text-xs mt-3 ${themeStyles.muted} max-w-xs`}>
                  Premium 350 GSM Velvet Touch • Double-Sided Lamination • Spot UV
                </p>
                <div className="mt-4 flex items-center gap-2 text-[10px] opacity-75 font-mono">
                  <span>PRINTED BY AI PRINTERS</span>
                </div>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-500 mt-5 text-center">
            Standard 89mm × 51mm Commercial Card • High-density 350 GSM Art Card with Thermal Velvet Finish.
          </p>
        </div>
      </div>
    </div>
  );
};
