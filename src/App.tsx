import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ServicesSection } from './components/ServicesSection';
import { CustomerToolsSection } from './components/CustomerToolsSection';
import { SchoolsPortal } from './components/SchoolsPortal';
import { PhotoStudio } from './components/PhotoStudio';
import { CertificateMaker } from './components/CertificateMaker';
import { VisitingCardMaker } from './components/VisitingCardMaker';
import { PrintCalculator } from './components/PrintCalculator';
import { CatalogView } from './components/CatalogView';
import { AdminPortal } from './components/AdminPortal';
import { PvcCardMaker } from './components/PvcCardMaker';
import { AttendancePosterMaker } from './components/AttendancePosterMaker';
import { Footer } from './components/Footer';
import { AiAssistantModal } from './components/AiAssistantModal';
import { Sparkles, MessageSquare, Mic, Radio, Bot } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<string>('home');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('srv-1');
  const [schoolCodeParam, setSchoolCodeParam] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [aiModalTab, setAiModalTab] = useState<'chat' | 'transcribe' | 'live'>('chat');
  const [isFabHovered, setIsFabHovered] = useState<boolean>(false);

  useEffect(() => {
    // Check URL parameters on mount
    const params = new URLSearchParams(window.location.search);
    const school = params.get('school');
    const service = params.get('service');
    const view = params.get('view');
    const admin = params.get('admin');

    if (school) {
      setSchoolCodeParam(school);
      setCurrentView('schools');
    } else if (service) {
      setSelectedServiceId(service);
      setCurrentView('catalog');
    } else if (view === 'admin' || admin === 'true' || admin === 'secret') {
      setCurrentView('admin');
    } else if (view === 'pvccardmaker' || view === 'pvc' || view === 'cardmaker') {
      setCurrentView('pvccardmaker');
    } else if (view === 'attendanceposter' || view === 'attendance' || view === 'poster') {
      setCurrentView('attendanceposter');
    }

    // Ctrl + Shift + A shortcut to launch Admin Portal from anywhere
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setCurrentView('admin');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNavigate = (view: string, extraParam?: string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (view === 'catalog' && extraParam) {
      setSelectedServiceId(extraParam);
    }
    if (view === 'schools' && extraParam) {
      setSchoolCodeParam(extraParam);
    }
    setCurrentView(view);
  };

  const handleSelectService = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    setCurrentView('catalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fafbfd] text-[#131c30]">
      {/* Sticky Navigation Bar */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenAiAssistant={(tab) => {
          setAiModalTab(tab || 'chat');
          setIsAiModalOpen(true);
        }}
        onSearch={(q) => {
          setSearchQuery(q);
          if (q && currentView !== 'home' && currentView !== 'services') {
            setCurrentView('services');
          }
        }}
      />

      {/* Main Dynamic View Content */}
      <main className="flex-1">
        {currentView === 'home' && (
          <>
            <Hero onNavigate={handleNavigate} />
            <ServicesSection
              searchQuery={searchQuery}
              onSelectService={handleSelectService}
            />
            <CustomerToolsSection onNavigate={handleNavigate} />
          </>
        )}

        {currentView === 'services' && (
          <ServicesSection
            searchQuery={searchQuery}
            onSelectService={handleSelectService}
          />
        )}

        {currentView === 'tools' && (
          <CustomerToolsSection onNavigate={handleNavigate} />
        )}

        {currentView === 'schools' && (
          <SchoolsPortal
            initialSchoolCode={schoolCodeParam}
            onNavigateHome={() => setCurrentView('home')}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'photostudio' && (
          <div className="py-10 px-4 sm:px-6 lg:px-8">
            <PhotoStudio
              onClose={() => setCurrentView('home')}
            />
          </div>
        )}

        {currentView === 'certificatemaker' && (
          <CertificateMaker onNavigateHome={() => setCurrentView('home')} />
        )}

        {currentView === 'visitingcards' && (
          <VisitingCardMaker onNavigateHome={() => setCurrentView('home')} />
        )}

        {currentView === 'calculator' && (
          <PrintCalculator onNavigateHome={() => setCurrentView('home')} />
        )}

        {currentView === 'pvccardmaker' && (
          <PvcCardMaker onNavigateHome={() => setCurrentView('home')} />
        )}

        {currentView === 'attendanceposter' && (
          <AttendancePosterMaker onNavigateHome={() => setCurrentView('home')} />
        )}

        {currentView === 'catalog' && (
          <CatalogView
            serviceId={selectedServiceId}
            onNavigateBack={() => setCurrentView('services')}
          />
        )}

        {/* Private Manager View activated only via URL param ?view=admin or ?admin=true */}
        {currentView === 'admin' && (
          <AdminPortal onNavigateHome={() => setCurrentView('home')} />
        )}
      </main>

      {/* Global Rich Footer */}
      <Footer onNavigate={handleNavigate} />

      {/* Floating AI Voice & Assistant Dock */}
      <div
        className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2.5"
        onMouseEnter={() => setIsFabHovered(true)}
        onMouseLeave={() => setIsFabHovered(false)}
      >
        {/* Quick Launch Action Pills */}
        {isFabHovered && (
          <div className="flex flex-col items-end gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <button
              type="button"
              onClick={() => {
                setAiModalTab('live');
                setIsAiModalOpen(true);
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-900/90 text-emerald-400 hover:text-white hover:bg-slate-900 text-xs font-bold shadow-lg backdrop-blur-md border border-emerald-500/30 transition-all hover:scale-105 cursor-pointer"
            >
              <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
              <span>Live Voice Call (gemini-3.8-live)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAiModalTab('transcribe');
                setIsAiModalOpen(true);
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-900/90 text-purple-300 hover:text-white hover:bg-slate-900 text-xs font-bold shadow-lg backdrop-blur-md border border-purple-500/30 transition-all hover:scale-105 cursor-pointer"
            >
              <Mic className="w-3.5 h-3.5 text-purple-400" />
              <span>Transcribe Speech (gemini-3.5-transcribe)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAiModalTab('chat');
                setIsAiModalOpen(true);
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-900/90 text-blue-300 hover:text-white hover:bg-slate-900 text-xs font-bold shadow-lg backdrop-blur-md border border-blue-500/30 transition-all hover:scale-105 cursor-pointer"
            >
              <Bot className="w-3.5 h-3.5 text-blue-400" />
              <span>Gemini Chatbot</span>
            </button>
          </div>
        )}

        {/* Main Floating Trigger Button */}
        <button
          type="button"
          onClick={() => {
            setAiModalTab('chat');
            setIsAiModalOpen(true);
          }}
          className="group relative flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-indigo-600/30 border border-white/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          title="Open AI Chat, Audio Transcriber & Live Voice"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-400" />
          </span>
          <Sparkles className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition-transform" />
          <span>AI Voice & Assistant</span>
          <span className="hidden sm:inline-flex items-center px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-mono text-emerald-300">
            Live
          </span>
        </button>
      </div>

      {/* AI Assistant Modal */}
      <AiAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        defaultTab={aiModalTab}
      />
    </div>
  );
}
