import React from 'react';
import { ArrowRight, Sparkles, CheckCircle2, Zap } from 'lucide-react';

interface CustomerToolsSectionProps {
  onNavigate: (view: string, extraParam?: string) => void;
}

interface ToolCardConfig {
  id: string;
  icon: string;
  previewTag: string;
  tagColor: string;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  themeGradient: string;
  borderHover: string;
  badgeBg: string;
  iconBg: string;
  actionText: string;
  actionColor: string;
  isExternalLink?: boolean;
  externalHref?: string;
  navTarget?: string;
  cardBg?: string;
  isDark?: boolean;
}

const TOOLS: ToolCardConfig[] = [
  {
    id: 'tool-pvccard',
    icon: '🪪',
    previewTag: 'AUTO-CROP · ALL-IN-ONE',
    tagColor: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-extrabold',
    title: 'PVC Card Maker & Auto Cropper',
    subtitle: 'Government e-Card Batch Print Processor',
    description:
      'Auto-detect and crop Ayushman (PM-JAY), Aadhaar (UIDAI), Digital Ration Cards, Voter ID (e-EPIC), and ABHA Cards into standard CR80 86×54mm at 300 DPI. Batch folder ZIP & A4/Tray print sheets.',
    features: ['Auto-Detect 5 Govt ID Types', 'Batch CR80 (86×54mm) Precision Crop', 'Organized ZIP & A4 5-Card Print Sheets'],
    themeGradient: 'from-emerald-600 via-teal-600 to-cyan-600',
    borderHover: 'hover:border-emerald-500',
    badgeBg: 'bg-emerald-50 text-emerald-800',
    iconBg: 'bg-emerald-100 border-emerald-200 text-emerald-800',
    actionText: 'Launch PVC Card Maker',
    actionColor: 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold',
    navTarget: 'pvccardmaker',
  },
  {
    id: 'tool-attendance',
    icon: '🏆',
    previewTag: 'SCHOOL & WHATSAPP · NEW',
    tagColor: 'bg-amber-100 text-amber-800 border-amber-300 font-extrabold',
    title: '100% Attendance Poster Maker',
    subtitle: 'Monthly Students Group Photo & Award Flyer',
    description:
      'Design monthly 100% attendance celebration flyers with classroom group photos, custom school logos, editable student names list, and multi-pattern rotating monthly themes ready for WhatsApp groups.',
    features: ['Class Group Photo + Roster List', '6 Distinct Monthly Rotating Themes', '1-Click High-Res PNG & WhatsApp Share'],
    themeGradient: 'from-amber-600 via-orange-600 to-yellow-500',
    borderHover: 'hover:border-amber-500',
    badgeBg: 'bg-amber-50 text-amber-800',
    iconBg: 'bg-amber-100 border-amber-200 text-amber-800',
    actionText: 'Create Attendance Poster',
    actionColor: 'bg-amber-600 hover:bg-amber-700 text-white font-bold',
    navTarget: 'attendanceposter',
  },
  {
    id: 'tool-schools',
    icon: '🏫',
    previewTag: 'LIVE SCHOOL PORTAL',
    tagColor: 'bg-blue-100 text-blue-800 border-blue-200',
    title: 'ID Card Request Manager',
    subtitle: 'Institutional Student & Staff Portal',
    description:
      'School teachers and administrators can submit new student admissions, card replacements, and student photo uploads using their private access code.',
    features: ['Bulk Excel / CSV Import', 'Private School Access Code', 'Direct Photo Uploads'],
    themeGradient: 'from-blue-600 via-sky-600 to-cyan-500',
    borderHover: 'hover:border-blue-500',
    badgeBg: 'bg-blue-50/90 text-blue-700',
    iconBg: 'bg-blue-100/70 border-blue-200 text-blue-700',
    actionText: 'Open School Portal',
    actionColor: 'bg-blue-600 hover:bg-blue-700 text-white',
    navTarget: 'schools',
  },
  {
    id: 'tool-photo',
    icon: '🖼️',
    previewTag: 'INTERACTIVE STUDIO',
    tagColor: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
    title: 'Photo Studio & Warper',
    subtitle: 'AI Perspective & Background Tool',
    description:
      'Straighten skewed phone photos with 4-corner perspective warping, enhance lighting and sharpness, and replace background with White, Blue, or Red instantly.',
    features: ['4-Corner Perspective Warp', 'Background Swap (White/Blue/Red)', 'Instant Lighting & Contrast'],
    themeGradient: 'from-fuchsia-600 via-pink-600 to-rose-500',
    borderHover: 'hover:border-pink-500',
    badgeBg: 'bg-pink-50/90 text-pink-700',
    iconBg: 'bg-pink-100/70 border-pink-200 text-pink-700',
    actionText: 'Launch Photo Studio',
    actionColor: 'bg-[#e6197f] hover:bg-[#c8146e] text-white',
    navTarget: 'photostudio',
  },
  {
    id: 'tool-cert',
    icon: '📜',
    previewTag: 'LIVE CANVAS DESIGNER',
    tagColor: 'bg-amber-100 text-amber-900 border-amber-200',
    title: 'Certificate Maker',
    subtitle: 'Academic & Achievement Awards',
    description:
      'Design academic excellence, sports day, and workshop certificates with authentic gold embossed borders, school logos, and batch student name lists.',
    features: ['Gold Foil & Guilloche Borders', 'Batch Student Name Injection', 'Instant 300 DPI Export'],
    themeGradient: 'from-amber-500 via-orange-500 to-yellow-500',
    borderHover: 'hover:border-amber-500',
    badgeBg: 'bg-amber-50/90 text-amber-800',
    iconBg: 'bg-amber-100/70 border-amber-200 text-amber-800',
    actionText: 'Design Certificate',
    actionColor: 'bg-amber-600 hover:bg-amber-700 text-white',
    navTarget: 'certificatemaker',
  },
  {
    id: 'tool-card',
    icon: '💼',
    previewTag: '3D REAL-TIME CUSTOMIZER',
    tagColor: 'bg-indigo-100 text-indigo-900 border-indigo-200',
    title: 'Visiting Card Designer',
    subtitle: 'Premium Corporate Stationery',
    description:
      'Customize your executive visiting cards with dynamic contact QR codes, company logo, employee details, and 3D preview of Velvet Matte and Spot UV finishes.',
    features: ['350 GSM Velvet & Spot UV', 'Dynamic Contact QR Code', 'Interactive Front & Back Flip'],
    themeGradient: 'from-indigo-600 via-violet-600 to-purple-600',
    borderHover: 'hover:border-indigo-500',
    badgeBg: 'bg-indigo-50/90 text-indigo-700',
    iconBg: 'bg-indigo-100/70 border-indigo-200 text-indigo-700',
    actionText: 'Customize Card',
    actionColor: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    navTarget: 'visitingcards',
  },
  {
    id: 'tool-calc',
    icon: '📐',
    previewTag: 'INSTANT FORMULA ENGINE',
    tagColor: 'bg-cyan-100 text-cyan-900 border-cyan-200',
    title: 'Instant Print Price Calculator',
    subtitle: 'Real-Time Commercial Estimator',
    description:
      'Calculate instant quotations for flex banners (per square foot), visiting card boxes, pamphlets, stickers, and custom signage with bulk quantity tier discounts.',
    features: ['Per Sq. Ft Banner Sizing', 'Quantity Tier Volume Discounts', '1-Click WhatsApp Quotation'],
    themeGradient: 'from-cyan-600 via-teal-600 to-emerald-600',
    borderHover: 'hover:border-cyan-500',
    badgeBg: 'bg-cyan-50/90 text-cyan-800',
    iconBg: 'bg-cyan-100/70 border-cyan-200 text-cyan-800',
    actionText: 'Calculate Price Now',
    actionColor: 'bg-cyan-700 hover:bg-cyan-800 text-white',
    navTarget: 'calculator',
  },
  {
    id: 'tool-whatsapp',
    icon: '💬',
    previewTag: '24/7 SPECIALIST CHAT',
    tagColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    title: 'WhatsApp Orders & Tracking',
    subtitle: 'Direct Human Print Specialist',
    description:
      'Connect directly with our prepress team. Submit custom design files, consult on paper stocks and die-cut shapes, and receive real-time job status updates.',
    features: ['Prepress Artwork Proofing', 'Real-Time Job Tracking Updates', 'Direct Custom Bulk Quotes'],
    themeGradient: 'from-emerald-500 via-green-500 to-teal-400',
    borderHover: 'hover:border-emerald-400',
    badgeBg: 'bg-emerald-900/60 text-emerald-200 border border-emerald-700/60',
    iconBg: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300',
    actionText: 'Chat on WhatsApp',
    actionColor: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold',
    isExternalLink: true,
    externalHref:
      'https://wa.me/917020655113?text=Hi%20Ai%20Printers%2C%20I%20would%20like%20to%20place%20an%20order%20or%20track%20my%20job%20status.',
    cardBg: 'bg-gradient-to-b from-[#0a2318] to-[#04140e] text-white border-emerald-900/80',
    isDark: true,
  },
];

export const CustomerToolsSection: React.FC<CustomerToolsSectionProps> = ({ onNavigate }) => {
  return (
    <section id="tools" className="py-16 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#1f6fd6] font-outfit mb-2">
            <Zap className="w-3.5 h-3.5 fill-[#1f6fd6]" />
            <span>AUTOMATED ONLINE WORKSTATIONS</span>
          </div>
          <h2 className="font-outfit text-3xl sm:text-4xl font-extrabold text-[#0f172a] tracking-tight">
            Customer Online Tools
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-2 leading-relaxed">
            Free interactive browser tools built for schools, corporate clients, and creators.
            Design cards, straighten student portraits, configure certificates, or generate instant pricing.
          </p>
        </div>

        {/* 6 Themed Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TOOLS.map((tool) => {
            const Content = (
              <div
                className={`relative rounded-3xl p-7 flex flex-col justify-between h-full transition-all duration-300 hover:-translate-y-1.5 shadow-sm hover:shadow-xl border ${
                  tool.cardBg || 'bg-[#fafbfd] hover:bg-white border-slate-200/90'
                } ${tool.borderHover} overflow-hidden group`}
              >
                {/* Vibrant Top Color Accent Line */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${tool.themeGradient}`}
                />

                {/* Card Top: Icon + Preview Tag */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-5">
                    <div
                      className={`w-14 h-14 rounded-2xl ${tool.iconBg} border flex items-center justify-center text-3xl shadow-2xs group-hover:scale-105 transition-transform duration-300`}
                    >
                      {tool.icon}
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wide uppercase border flex items-center gap-1.5 shadow-2xs ${tool.tagColor}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                      {tool.previewTag}
                    </span>
                  </div>

                  {/* Title & Subtitle */}
                  <div className="mb-2">
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider block ${
                        tool.isDark ? 'text-emerald-400' : 'text-slate-400'
                      }`}
                    >
                      {tool.subtitle}
                    </span>
                    <h3
                      className={`font-outfit font-extrabold text-xl leading-tight mt-1 transition-colors ${
                        tool.isDark
                          ? 'text-white group-hover:text-emerald-300'
                          : 'text-slate-900 group-hover:text-[#1f6fd6]'
                      }`}
                    >
                      {tool.title}
                    </h3>
                  </div>

                  {/* Description */}
                  <p
                    className={`text-xs mt-2 leading-relaxed ${
                      tool.isDark ? 'text-emerald-100/75' : 'text-slate-500'
                    }`}
                  >
                    {tool.description}
                  </p>

                  {/* Feature Badges */}
                  <div className="mt-5 pt-4 border-t border-slate-200/60 dark:border-emerald-900/60 flex flex-col gap-2">
                    {tool.features.map((feat, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center gap-2 text-xs font-semibold px-2.5 py-1.5 rounded-xl ${tool.badgeBg}`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 opacity-80" />
                        <span className="truncate">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Action Button */}
                <div className="mt-7 pt-4 border-t border-slate-100 dark:border-emerald-900/80">
                  <div
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all duration-200 shadow-2xs group-hover:shadow-md ${tool.actionColor}`}
                  >
                    <span>{tool.actionText}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            );

            if (tool.isExternalLink && tool.externalHref) {
              return (
                <a
                  key={tool.id}
                  href={tool.externalHref}
                  target="_blank"
                  rel="noreferrer"
                  className="block h-full cursor-pointer focus:outline-hidden"
                >
                  {Content}
                </a>
              );
            }

            return (
              <div
                key={tool.id}
                onClick={() => tool.navTarget && onNavigate(tool.navTarget)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && tool.navTarget) {
                    e.preventDefault();
                    onNavigate(tool.navTarget);
                  }
                }}
                className="h-full cursor-pointer focus:outline-hidden"
              >
                {Content}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
