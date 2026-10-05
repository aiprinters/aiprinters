import React from 'react';
import { MessageSquare, CheckCircle, Award, Truck } from 'lucide-react';

interface HeroProps {
  onNavigate?: (view: string, extraParam?: string) => void;
}

export const Hero: React.FC<HeroProps> = ({ onNavigate }) => {
  return (
    <section className="relative overflow-hidden pt-12 pb-16 bg-gradient-to-b from-white via-[#f7f9fd] to-[#f0f4fb]">
      {/* Decorative backdrop glow dots */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-[#22b8e6]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-20 right-1/4 w-96 h-96 bg-[#e6197f]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Main Hero Header Text */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-pink-50 border border-pink-200/80 mb-4">
            <span className="w-2 h-2 rounded-full bg-[#e6197f] animate-pulse" />
            <span className="text-[11px] font-bold tracking-widest text-[#e6197f] uppercase font-outfit">
              PRINT · DESIGN · CREATE · CUSTOMISE
            </span>
          </div>

          <h1 className="font-outfit font-extrabold text-3xl sm:text-5xl lg:text-6xl text-[#131c30] tracking-tight leading-[1.15] mb-5">
            Your <span className="text-[#1f6fd6]">One-Stop Solution</span> for Printing &{' '}
            <span className="text-[#e6197f]">Digital Services</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            High-quality printing, creative designs, and customized products for schools,
            institutions, corporate businesses, and personal celebrations.
          </p>
        </div>

        {/* Feature Trust Pillars */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-emerald-200 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 font-outfit">Premium Quality</h4>
              <p className="text-[11px] text-slate-500">True-to-life CMYK fidelity</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-blue-200 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 font-outfit">On-Time Dispatch</h4>
              <p className="text-[11px] text-slate-500">Fast reliable shipping</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-purple-200 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 font-outfit">School & Bulk Rates</h4>
              <p className="text-[11px] text-slate-500">Institutional discounts</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-pink-200 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 font-outfit">Direct Support</h4>
              <p className="text-[11px] text-slate-500">+91 70206 55113</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
