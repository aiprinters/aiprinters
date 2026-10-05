import React from 'react';
import { Logo } from './Logo';
import { Phone, Mail, Instagram, MessageSquare, ArrowUpRight, Shield } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string, param?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-[#131c30] text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800/80">
          {/* Column 1: Brand & Bio */}
          <div className="lg:col-span-2 space-y-4">
            <Logo size="lg" lightText={true} />
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Your one-stop digital printing house. Specializing in institutional student and staff ID
              cards, thermal sublimation gifts, corporate trophies, eco-solvent star flex banners, and
              custom packaging solutions.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <a
                href="https://wa.me/917020655113"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-[#22c35e] text-white flex items-center justify-center transition-colors"
                title="WhatsApp Direct"
              >
                <MessageSquare className="w-4 h-4" />
              </a>
              <a
                href="https://www.instagram.com/ai_printer"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-[#e6197f] text-white flex items-center justify-center transition-colors"
                title="Instagram @ai_printer"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="mailto:aiprintersanddigitalservices.23@gmail.com"
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-[#1f6fd6] text-white flex items-center justify-center transition-colors"
                title="Send Email"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white font-outfit">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('home')} className="hover:text-white transition-colors">
                  Home
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('services')} className="hover:text-white transition-colors">
                  Services Catalog
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('schools')} className="hover:text-white transition-colors">
                  Schools ID Portal
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('photostudio')} className="hover:text-white transition-colors">
                  Photo Studio Tool
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('calculator')} className="hover:text-white transition-colors">
                  Print Price Calculator
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('admin')}
                  className="hover:text-amber-300 transition-colors flex items-center gap-1.5 text-amber-400 font-semibold pt-1 border-t border-slate-800"
                >
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span>Admin Portal (Staff Login)</span>
                </button>
              </li>
              <li>
                <a
                  href="https://wa.me/917020655113?text=Hi%20Ai%20Printers%2C%20I%20would%20like%20to%20check%20the%20status%20of%20my%20order."
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-emerald-400 transition-colors"
                >
                  Order Status (WhatsApp)
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Customer Tools */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white font-outfit">
              Customer Tools
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('schools')} className="hover:text-white transition-colors">
                  🪪 ID Card Request Form
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('photostudio')} className="hover:text-white transition-colors">
                  🖼️ Photo Straighten & Crop
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('certificatemaker')} className="hover:text-white transition-colors">
                  📜 Certificate Designer
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('visitingcards')} className="hover:text-white transition-colors">
                  💼 Visiting Card Creator
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('calculator')} className="hover:text-white transition-colors">
                  📐 Flex & Print Calculator
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact & Support */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white font-outfit">
              Contact Shop
            </h4>
            <div className="space-y-2.5 text-xs text-slate-400">
              <a
                href="https://wa.me/917020655113"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 hover:text-[#22c35e] transition-colors"
              >
                <Phone className="w-3.5 h-3.5 shrink-0 text-[#22c35e]" />
                <span>+91 70206 55113</span>
              </a>

              <a
                href="mailto:aiprintersanddigitalservices.23@gmail.com"
                className="flex items-center gap-2 hover:text-white transition-colors break-all"
              >
                <Mail className="w-3.5 h-3.5 shrink-0 text-[#1f6fd6]" />
                <span className="truncate">aiprintersanddigitalservices.23@gmail.com</span>
              </a>

              <a
                href="https://whatsapp.com/channel/0029Va4x4EyKwqSN70mClX10"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-yellow-400 hover:underline"
              >
                <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                <span>Join Official WhatsApp Channel</span>
                <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 Ai Printers — Awesome Imagination. All rights reserved.</p>
          <span>Commercial Printing & Institutional ID Solutions</span>
        </div>
      </div>
    </footer>
  );
};
