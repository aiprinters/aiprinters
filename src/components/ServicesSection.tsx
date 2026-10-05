import React, { useEffect, useState } from 'react';
import { ServiceCategory } from '../types';
import { store } from '../supabase';
import { ArrowUpRight, Sparkles, Clock, CheckCircle2, Search } from 'lucide-react';

interface ServicesSectionProps {
  searchQuery?: string;
  onSelectService: (serviceId: string) => void;
}

interface ServiceMeta {
  startingRate: string;
  rateUnit: string;
  turnaround: string;
  tags: string[];
  themeColor: string;
  accentBg: string;
  badgeBorder: string;
  badgeText: string;
}

const SERVICE_META_MAP: Record<string, ServiceMeta> = {
  'srv-1': {
    startingRate: '₹45',
    rateUnit: 'per card',
    turnaround: '24-48h dispatch',
    tags: ['PVC & RFID Cards', 'Satin Lanyards', 'Barcode / QR'],
    themeColor: '#1f6fd6',
    accentBg: 'bg-blue-50/80',
    badgeBorder: 'border-blue-200',
    badgeText: 'text-blue-700',
  },
  'srv-2': {
    startingRate: '₹199',
    rateUnit: 'per piece',
    turnaround: 'Same-day proofing',
    tags: ['Ceramic Mugs', 'Steel Bottles', 'Photo Cushions'],
    themeColor: '#e6197f',
    accentBg: 'bg-pink-50/80',
    badgeBorder: 'border-pink-200',
    badgeText: 'text-pink-700',
  },
  'srv-3': {
    startingRate: '₹599',
    rateUnit: 'per award',
    turnaround: 'Laser-cut finish',
    tags: ['Wooden Plaques', 'Star Trophies', 'Acrylic Medals'],
    themeColor: '#d97706',
    accentBg: 'bg-amber-50/80',
    badgeBorder: 'border-amber-200',
    badgeText: 'text-amber-800',
  },
  'srv-4': {
    startingRate: '₹18',
    rateUnit: 'per sq.ft',
    turnaround: 'High-speed printing',
    tags: ['Star Frontlit', 'Roll-Up Standees', 'Vinyl Hoardings'],
    themeColor: '#0891b2',
    accentBg: 'bg-cyan-50/80',
    badgeBorder: 'border-cyan-200',
    badgeText: 'text-cyan-800',
  },
  'srv-5': {
    startingRate: '₹850',
    rateUnit: '1000 cards',
    turnaround: 'Matte & Velvet touch',
    tags: ['350 GSM Art Card', 'Spot UV & Foil', 'Letterpress'],
    themeColor: '#6366f1',
    accentBg: 'bg-indigo-50/80',
    badgeBorder: 'border-indigo-200',
    badgeText: 'text-indigo-700',
  },
  'srv-6': {
    startingRate: '₹4',
    rateUnit: 'per sticker',
    turnaround: 'Custom die-cutting',
    tags: ['Carton Boxes', 'Waterproof Stickers', 'Sweet Packaging'],
    themeColor: '#059669',
    accentBg: 'bg-emerald-50/80',
    badgeBorder: 'border-emerald-200',
    badgeText: 'text-emerald-800',
  },
  'srv-7': {
    startingRate: '₹350',
    rateUnit: 'per model',
    turnaround: '0.1mm layer detail',
    tags: ['PLA & Resin Prototypes', 'Acrylic Cutouts', 'Laser Etch'],
    themeColor: '#8b5cf6',
    accentBg: 'bg-purple-50/80',
    badgeBorder: 'border-purple-200',
    badgeText: 'text-purple-700',
  },
  'srv-8': {
    startingRate: '₹15',
    rateUnit: 'per sheet',
    turnaround: 'Gold foil finish',
    tags: ['Parchment Paper', 'Gold Embossed Borders', 'Lamination'],
    themeColor: '#b45309',
    accentBg: 'bg-yellow-50/80',
    badgeBorder: 'border-yellow-200',
    badgeText: 'text-yellow-800',
  },
};

const DEFAULT_META: ServiceMeta = {
  startingRate: '₹99',
  rateUnit: 'starting rate',
  turnaround: 'Quick turnaround',
  tags: ['Custom Dimensions', 'Bulk Discount', 'Commercial Grade'],
  themeColor: '#1f6fd6',
  accentBg: 'bg-blue-50/80',
  badgeBorder: 'border-blue-200',
  badgeText: 'text-blue-700',
};

export const ServicesSection: React.FC<ServicesSectionProps> = ({
  searchQuery = '',
  onSelectService,
}) => {
  const [services, setServices] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    store.getServices().then((res) => {
      setServices(res);
      setLoading(false);
    });
  }, []);

  const filtered = services.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const meta = SERVICE_META_MAP[s.id];
    const tagsMatch = meta?.tags.some((t) => t.toLowerCase().includes(q));
    return (
      s.name.toLowerCase().includes(q) ||
      (s.description && s.description.toLowerCase().includes(q)) ||
      tagsMatch
    );
  });

  return (
    <section id="services" className="py-16 bg-[#f8fafc] border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-6 border-b border-slate-200/60">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#1f6fd6] font-outfit mb-2">
              <span className="w-2 h-2 rounded-full bg-[#1f6fd6] animate-pulse"></span>
              <span>COMMERCIAL PRINTING & CUSTOM FABRICATION</span>
            </div>
            <h2 className="font-outfit text-3xl sm:text-4xl font-extrabold text-[#0f172a] tracking-tight">
              Our Printing & Digital Services
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-2xl leading-relaxed">
              Explore transparent starting rates, technical specifications, and turnkey bulk options.
              Click any category to browse catalog items and submit direct orders.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
            {searchQuery ? (
              <div className="px-3.5 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-700 flex items-center gap-2">
                <Search className="w-3.5 h-3.5" />
                <span>Found {filtered.length} service{filtered.length !== 1 ? 's' : ''} matching &ldquo;{searchQuery}&rdquo;</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Wholesale & Institutional Rates Available</span>
              </div>
            )}
          </div>
        </div>

        {/* Services Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-64 rounded-3xl bg-white border border-slate-200 p-6 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-2xs max-w-lg mx-auto p-8">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl mx-auto mb-4">
              🔍
            </div>
            <h3 className="font-outfit font-bold text-lg text-slate-900">No matching services</h3>
            <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
              We couldn&apos;t find any service matching &ldquo;{searchQuery}&rdquo;. Try searching for &ldquo;ID Cards&rdquo;, &ldquo;Mugs&rdquo;, or &ldquo;Banners&rdquo;.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((service) => {
              const meta = SERVICE_META_MAP[service.id] || DEFAULT_META;

              return (
                <div
                  key={service.id}
                  onClick={() => onSelectService(service.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectService(service.id);
                    }
                  }}
                  className="group relative cursor-pointer rounded-3xl bg-white border border-slate-200/90 hover:border-[#1f6fd6] p-6 shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between overflow-hidden"
                >
                  {/* Subtle Top Gradient Accent on Hover */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ backgroundColor: meta.themeColor }}
                  />

                  {/* Top Bar: Icon + Starting Price */}
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-5">
                      <div
                        className={`w-14 h-14 rounded-2xl ${meta.accentBg} flex items-center justify-center text-3xl shadow-xs group-hover:scale-105 transition-transform duration-300 border ${meta.badgeBorder}`}
                      >
                        {service.icon || '🖨️'}
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Starting at
                        </span>
                        <div className="flex items-baseline justify-end gap-1 mt-0.5">
                          <span className="font-outfit font-extrabold text-lg text-slate-900 tabular-nums">
                            {meta.startingRate}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {meta.rateUnit}
                        </span>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <h3 className="font-outfit font-extrabold text-lg text-slate-900 group-hover:text-[#1f6fd6] transition-colors leading-tight">
                      {service.name}
                    </h3>

                    {service.description && (
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed line-clamp-2">
                        {service.description}
                      </p>
                    )}

                    {/* Capability Tags */}
                    <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap gap-1.5">
                      {meta.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-lg bg-slate-100/80 text-[11px] font-medium text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-700 transition-colors"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Card Footer: Turnaround + Action */}
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{meta.turnaround}</span>
                    </span>

                    <span className="inline-flex items-center gap-1 font-bold text-[#1f6fd6] group-hover:translate-x-0.5 transition-transform">
                      <span>Explore</span>
                      <ArrowUpRight className="w-4 h-4 opacity-75 group-hover:opacity-100" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
