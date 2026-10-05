import React, { useState } from 'react';
import { Logo } from './Logo';
import { Search, MessageSquare, X, Menu, Sparkles, Radio } from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, extraParam?: string) => void;
  onSearch?: (query: string) => void;
  onOpenAiAssistant?: (tab?: 'chat' | 'transcribe' | 'live') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, onSearch, onOpenAiAssistant }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchVal(val);
    if (onSearch) onSearch(val);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand - Official CMYK Triangle Logo & Wordmark */}
          <div
            onClick={() => onNavigate('home')}
            className="cursor-pointer select-none py-1"
          >
            <Logo size="md" showText={true} />
          </div>

          {/* Desktop Navigation Links: Home, Services, Customer Tools */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-700">
            <button
              onClick={() => onNavigate('home')}
              className={`hover:text-[#1f6fd6] transition-colors py-1.5 ${
                currentView === 'home' ? 'text-[#1f6fd6] font-bold border-b-2 border-[#1f6fd6]' : ''
              }`}
            >
              Home
            </button>
            <button
              onClick={() => onNavigate('services')}
              className={`hover:text-[#1f6fd6] transition-colors py-1.5 ${
                currentView === 'services' ? 'text-[#1f6fd6] font-bold border-b-2 border-[#1f6fd6]' : ''
              }`}
            >
              Services
            </button>
            <button
              onClick={() => onNavigate('tools')}
              className={`hover:text-[#1f6fd6] transition-colors py-1.5 ${
                currentView === 'tools' ? 'text-[#1f6fd6] font-bold border-b-2 border-[#1f6fd6]' : ''
              }`}
            >
              Customer Tools
            </button>
          </nav>

          {/* Right Action Icons & Direct Support: Search, WhatsApp Chat, Admin */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Toggle */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="w-9 h-9 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-colors"
                title="Search services"
                aria-label="Search"
              >
                {isSearchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
              </button>

              {isSearchOpen && (
                <div className="absolute right-0 top-12 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
                    <Search className="w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      autoFocus
                      placeholder="Search services or products..."
                      value={searchVal}
                      onChange={handleSearchChange}
                      className="w-full bg-transparent text-sm focus:outline-none text-slate-800 placeholder:text-slate-400"
                    />
                    {searchVal && (
                      <button onClick={() => { setSearchVal(''); onSearch && onSearch(''); }} className="text-slate-400 hover:text-slate-600">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* AI Assistant & Voice Studio Launcher */}
            {onOpenAiAssistant && (
              <button
                type="button"
                onClick={() => onOpenAiAssistant('chat')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xs font-black shadow-md shadow-blue-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                title="Open AI Chatbot, Audio Transcribe & Live Voice Assistant"
              >
                <Sparkles className="w-3.5 h-3.5 animate-spin-slow text-amber-300" />
                <span>AI Assistant</span>
                <span className="hidden lg:inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-mono text-emerald-300">
                  <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-400" />
                  Live
                </span>
              </button>
            )}



            {/* WhatsApp Direct Chat */}
            <a
              href="https://wa.me/917020655113?text=Hi%20Ai%20Printers%2C%20I%20want%20to%20inquire%20about%20printing%20services"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-[#22c35e] hover:bg-[#1eb355] text-white text-xs font-bold transition-all shadow-sm shadow-[#22c35e]/30 whitespace-nowrap"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp Chat</span>
              <span className="sm:hidden">WhatsApp</span>
            </a>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              aria-label="Toggle Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-slate-100 space-y-1">
            {onOpenAiAssistant && (
              <button
                onClick={() => { onOpenAiAssistant('chat'); setMobileMenuOpen(false); }}
                className="w-full text-left px-3 py-2 text-sm font-black rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>AI Assistant & Voice Studio</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-white/20 text-emerald-300 font-mono">gemini-3.8-live</span>
              </button>
            )}
            <button
              onClick={() => { onNavigate('home'); setMobileMenuOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm font-semibold rounded-lg hover:bg-slate-100 text-slate-800"
            >
              Home
            </button>
            <button
              onClick={() => { onNavigate('services'); setMobileMenuOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm font-semibold rounded-lg hover:bg-slate-100 text-slate-800"
            >
              Services Catalog
            </button>
            <button
              onClick={() => { onNavigate('tools'); setMobileMenuOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm font-semibold rounded-lg hover:bg-slate-100 text-slate-800"
            >
              Customer Tools
            </button>
            <button
              onClick={() => { onNavigate('calculator'); setMobileMenuOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm font-semibold rounded-lg hover:bg-slate-100 text-slate-800 flex items-center gap-2"
            >
              <span>📐 Print Price Calculator</span>
            </button>

            <a
              href="https://wa.me/917020655113?text=Hi%20Ai%20Printers%2C%20I%20would%20like%20to%20place%20an%20order%20or%20inquire%20about%20my%20print%20job."
              target="_blank"
              rel="noreferrer"
              className="w-full text-left px-3 py-2 text-sm font-semibold rounded-lg hover:bg-emerald-50 text-[#22c35e] flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp Orders & Inquiries</span>
            </a>
          </div>
        )}
      </div>
    </header>
  );
};

