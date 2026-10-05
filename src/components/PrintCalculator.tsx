import React, { useState, useEffect } from 'react';
import {
  Calculator,
  ArrowLeft,
  MessageSquare,
  Check,
  Sparkles,
  Printer,
  ShieldCheck,
  Layers,
  FileText,
  Award,
  CreditCard,
  Heart,
  Image as ImageIcon,
} from 'lucide-react';
import { store, DEFAULT_CALCULATOR_PRICING } from '../supabase';
import { CalculatorPricing } from '../types';

interface PrintCalculatorProps {
  onNavigateHome: () => void;
}

type ProductCategory = 'wedding' | 'flex' | 'cards' | 'certificates' | 'results' | 'idcards';

export const PrintCalculator: React.FC<PrintCalculatorProps> = ({ onNavigateHome }) => {
  const [pricing, setPricing] = useState<CalculatorPricing>(DEFAULT_CALCULATOR_PRICING);
  const [productType, setProductType] = useState<ProductCategory>('wedding');

  // Load live pricing from store/admin & subscribe to real-time updates
  useEffect(() => {
    const refreshPricing = () => {
      store.getCalculatorPricing().then((res) => {
        setPricing(res);
      });
    };

    refreshPricing();

    const handleCustomUpdate = (e: any) => {
      if (e.detail) {
        setPricing(e.detail);
      } else {
        refreshPricing();
      }
    };

    window.addEventListener('ai_printers_pricing_updated', handleCustomUpdate);
    window.addEventListener('storage', refreshPricing);

    return () => {
      window.removeEventListener('ai_printers_pricing_updated', handleCustomUpdate);
      window.removeEventListener('storage', refreshPricing);
    };
  }, []);

  // 1. Wedding Card state
  const [weddingOption, setWeddingOption] = useState<'standard' | 'classic' | 'luxury'>('classic');
  const [weddingQty, setWeddingQty] = useState<number>(200);
  const [weddingGoldFoil, setWeddingGoldFoil] = useState<boolean>(true);
  const [weddingWaxSeal, setWeddingWaxSeal] = useState<boolean>(false);

  // 2. Flex & Banner state
  const [flexWidth, setFlexWidth] = useState<number>(6); // feet
  const [flexHeight, setFlexHeight] = useState<number>(3); // feet
  const [flexMaterial, setFlexMaterial] = useState<'normal' | 'star' | 'backlit' | 'blackout'>('star');
  const [hasEyelets, setHasEyelets] = useState<boolean>(true);
  const [hasFrameMounting, setHasFrameMounting] = useState<boolean>(false);
  const [flexQty, setFlexQty] = useState<number>(1);

  // 3. Visiting Card state
  const [cardFinish, setCardFinish] = useState<'matte' | 'velvet' | 'spotuv'>('velvet');
  const [cardSides, setCardSides] = useState<'single' | 'double'>('double');
  const [cardQty, setCardQty] = useState<number>(1000);

  // 4. Certificate state
  const [certType, setCertType] = useState<'standard' | 'goldborder' | 'parchment'>('goldborder');
  const [certLamination, setCertLamination] = useState<boolean>(true);
  const [certFolder, setCertFolder] = useState<boolean>(false);
  const [certQty, setCertQty] = useState<number>(100);

  // 5. Result Card state
  const [resultType, setResultType] = useState<'single' | 'bifold' | 'laminated'>('bifold');
  const [resultHologram, setResultHologram] = useState<boolean>(true);
  const [resultSleeve, setResultSleeve] = useState<boolean>(false);
  const [resultQty, setResultQty] = useState<number>(250);

  // 6. ID Card state
  const [idType, setIdType] = useState<'pvc' | 'combo' | 'rfid'>('combo');
  const [idQty, setIdQty] = useState<number>(100);

  // Safe extractors for dynamic name, description, and rates
  const getOptName = (opt: any, fallback: string) => (opt && typeof opt === 'object' && opt.name ? opt.name : fallback);
  const getOptDesc = (opt: any, fallback: string) => (opt && typeof opt === 'object' && opt.desc ? opt.desc : fallback);
  const getOptRate = (opt: any, fallback: number) => {
    if (typeof opt === 'number') return opt;
    if (opt && typeof opt === 'object' && typeof opt.rate === 'number') return opt.rate;
    return fallback;
  };
  const getAddonName = (addon: any, fallback: string) => (addon && typeof addon === 'object' && addon.name ? addon.name : fallback);
  const getAddonDesc = (addon: any, fallback: string = '') => (addon && typeof addon === 'object' && addon.desc ? addon.desc : fallback);
  const getAddonRate = (addon: any, fallback: number) => {
    if (typeof addon === 'number') return addon;
    if (addon && typeof addon === 'object' && typeof addon.rate === 'number') return addon.rate;
    return fallback;
  };
  const getCategoryMeta = (cat: any, fallbackTitle: string, fallbackDesc: string) => ({
    title: cat?.meta?.title || fallbackTitle,
    desc: cat?.meta?.desc || fallbackDesc,
  });

  // Calculate pricing based on dynamic store pricing
  const calculateTotal = (): {
    subtotal: number;
    unitRate: number;
    unitLabel: string;
    description: string;
    specs: string[];
  } => {
    // 1. Wedding Cards
    if (productType === 'wedding') {
      const optKey = weddingOption;
      const optItem = pricing.wedding[optKey];
      const baseRate = getOptRate(optItem, DEFAULT_CALCULATOR_PRICING.wedding[optKey]?.rate || 20);
      const optName = getOptName(optItem, optKey.toUpperCase());
      const optDesc = getOptDesc(optItem, '');
      let perCard = baseRate;
      const specsList = [optDesc ? `${optName} (${optDesc})` : optName];

      if (weddingGoldFoil) {
        const addonRate = getAddonRate(pricing.wedding.goldFoilAddon, 6);
        const addonName = getAddonName(pricing.wedding.goldFoilAddon, 'Gold Foil Stamping');
        perCard += addonRate;
        specsList.push(`${addonName} (+₹${addonRate})`);
      }
      if (weddingWaxSeal) {
        const addonRate = getAddonRate(pricing.wedding.waxSealAddon, 8);
        const addonName = getAddonName(pricing.wedding.waxSealAddon, 'Custom Initial Wax Seal');
        perCard += addonRate;
        specsList.push(`${addonName} (+₹${addonRate})`);
      }

      const total = perCard * weddingQty;
      return {
        subtotal: Math.round(total),
        unitRate: Math.round(perCard * 10) / 10,
        unitLabel: 'per card',
        description: `Wedding Cards (${optName}): ${weddingQty} pcs`,
        specs: specsList,
      };
    }

    // 2. Flex & Banners
    if (productType === 'flex') {
      const sqft = Math.max(1, flexWidth * flexHeight);
      const optItem = pricing.flex[flexMaterial];
      const ratePerSqft = getOptRate(optItem, DEFAULT_CALCULATOR_PRICING.flex[flexMaterial]?.rate || 20);
      const optName = getOptName(optItem, flexMaterial.toUpperCase());
      const optDesc = getOptDesc(optItem, '');
      let perBanner = sqft * ratePerSqft;
      const specsList = [`${flexWidth}ft × ${flexHeight}ft = ${sqft} sq.ft (${optName}${optDesc ? ` - ${optDesc}` : ''})`];

      if (hasEyelets) {
        const addonRate = getAddonRate(pricing.flex.eyeletCost, 30);
        const addonName = getAddonName(pricing.flex.eyeletCost, 'Corner Metal Eyelets');
        perBanner += addonRate;
        specsList.push(`${addonName} (+₹${addonRate}/banner)`);
      }
      if (hasFrameMounting) {
        const addonRate = getAddonRate(pricing.flex.frameMountingSqft, 15);
        const addonName = getAddonName(pricing.flex.frameMountingSqft, 'Frame Mounting');
        const frameCost = sqft * addonRate;
        perBanner += frameCost;
        specsList.push(`${addonName} (+₹${addonRate}/sq.ft)`);
      }

      const minOrder = pricing.flex.minOrderAmount || 150;
      const total = Math.max(minOrder, perBanner * flexQty);
      return {
        subtotal: Math.round(total),
        unitRate: Math.round((total / flexQty) * 10) / 10,
        unitLabel: 'per banner',
        description: `Flex Banner: ${flexWidth}ft × ${flexHeight}ft (${sqft} sq.ft), Qty: ${flexQty}`,
        specs: specsList,
      };
    }

    // 3. Visiting Cards
    if (productType === 'cards') {
      const optItem = pricing.visitingCards[cardFinish];
      const basePer1000 = getOptRate(optItem, DEFAULT_CALCULATOR_PRICING.visitingCards[cardFinish]?.rate || 750);
      const optName = getOptName(optItem, cardFinish.toUpperCase());
      const optDesc = getOptDesc(optItem, '');
      const doubleAddonRate = getAddonRate(pricing.visitingCards.doubleSideAddon, 150);
      const doubleAddonName = getAddonName(pricing.visitingCards.doubleSideAddon, 'Double Sided Printing');
      const sideAddon = cardSides === 'double' ? doubleAddonRate : 0;
      const effectivePer1000 = basePer1000 + sideAddon;
      const multiplier = cardQty / 1000;
      const volumeDiscount = cardQty >= 2000 ? 0.92 : 1.0;
      const total = effectivePer1000 * multiplier * volumeDiscount;
      const specsList = [
        `${optName}${optDesc ? ` (${optDesc})` : ''}`,
        cardSides === 'double' ? `${doubleAddonName} (+₹${doubleAddonRate}/1000)` : 'Single Sided Print',
      ];
      if (cardQty >= 2000) specsList.push('8% Bulk Order Discount Applied');

      return {
        subtotal: Math.round(total),
        unitRate: Math.round((total / cardQty) * 100) / 100,
        unitLabel: 'per card',
        description: `Visiting Cards: ${cardQty} pcs (${optName})`,
        specs: specsList,
      };
    }

    // 4. Certificates
    if (productType === 'certificates') {
      const optItem = pricing.certificates[certType];
      const basePerSheet = getOptRate(optItem, DEFAULT_CALCULATOR_PRICING.certificates[certType]?.rate || 20);
      const optName = getOptName(optItem, certType.toUpperCase());
      const optDesc = getOptDesc(optItem, '');
      let perSheet = basePerSheet;
      const specsList = [optDesc ? `${optName} (${optDesc})` : optName];

      if (certLamination) {
        const addonRate = getAddonRate(pricing.certificates.laminationAddon, 6);
        const addonName = getAddonName(pricing.certificates.laminationAddon, 'Thermal Lamination');
        perSheet += addonRate;
        specsList.push(`${addonName} (+₹${addonRate})`);
      }
      if (certFolder) {
        const addonRate = getAddonRate(pricing.certificates.presentationFolderAddon, 35);
        const addonName = getAddonName(pricing.certificates.presentationFolderAddon, 'Presentation Folder');
        perSheet += addonRate;
        specsList.push(`${addonName} (+₹${addonRate})`);
      }

      const total = perSheet * certQty;
      return {
        subtotal: Math.round(total),
        unitRate: Math.round(perSheet * 10) / 10,
        unitLabel: 'per certificate',
        description: `Certificates (${optName}): ${certQty} copies`,
        specs: specsList,
      };
    }

    // 5. Result Cards
    if (productType === 'results') {
      const optItem = pricing.resultCards[resultType];
      const basePerUnit = getOptRate(optItem, DEFAULT_CALCULATOR_PRICING.resultCards[resultType]?.rate || 25);
      const optName = getOptName(optItem, resultType.toUpperCase());
      const optDesc = getOptDesc(optItem, '');
      let perUnit = basePerUnit;
      const specsList = [optDesc ? `${optName} (${optDesc})` : optName];

      if (resultHologram) {
        const addonRate = getAddonRate(pricing.resultCards.hologramAddon, 3);
        const addonName = getAddonName(pricing.resultCards.hologramAddon, 'Security Hologram Sticker');
        perUnit += addonRate;
        specsList.push(`${addonName} (+₹${addonRate})`);
      }
      if (resultSleeve) {
        const addonRate = getAddonRate(pricing.resultCards.protectiveSleeveAddon, 5);
        const addonName = getAddonName(pricing.resultCards.protectiveSleeveAddon, 'Clear Protective Sleeve');
        perUnit += addonRate;
        specsList.push(`${addonName} (+₹${addonRate})`);
      }

      const total = perUnit * resultQty;
      return {
        subtotal: Math.round(total),
        unitRate: Math.round(perUnit * 10) / 10,
        unitLabel: 'per student card',
        description: `Result Cards (${optName}): ${resultQty} students`,
        specs: specsList,
      };
    }

    // 6. ID Cards
    if (productType === 'idcards') {
      const optItem = pricing.idCards[idType];
      const basePerUnit = getOptRate(optItem, DEFAULT_CALCULATOR_PRICING.idCards[idType]?.rate || 45);
      const optName = getOptName(optItem, idType.toUpperCase());
      const optDesc = getOptDesc(optItem, '');
      const specsList = [optDesc ? `${optName} (${optDesc})` : optName];

      const total = basePerUnit * idQty;
      return {
        subtotal: Math.round(total),
        unitRate: Math.round(basePerUnit * 10) / 10,
        unitLabel: 'per card/set',
        description: `ID Cards (${optName}): ${idQty} cards`,
        specs: specsList,
      };
    }

    return {
      subtotal: 500,
      unitRate: 500,
      unitLabel: 'per job',
      description: 'Commercial Print Estimate',
      specs: ['Standard Commercial Print Job'],
    };
  };

  const { subtotal, unitRate, unitLabel, description, specs } = calculateTotal();

  // Prefilled WhatsApp message with clean commercial quote breakdown
  const whatsappQuoteUrl = `https://wa.me/917020655113?text=${encodeURIComponent(
    `Hello Ai Printers! I would like to get a quote confirmation for the following print job:\n\n*Item:* ${description}\n*Calculated Total:* ₹${subtotal} (Approx ₹${unitRate} ${unitLabel})\n*Specifications:*\n- ${specs.join(
      '\n- '
    )}\n\nPlease advise delivery timeframe and payment details.`
  )}`;

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
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
          Ai Printers • Instant Commercial Print Calculator
        </span>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-700 flex items-center justify-center text-2xl font-bold">
              📐
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-outfit font-extrabold text-2xl text-slate-900 leading-tight">
                  Instant Print Price Calculator
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  <span>Live Rates</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Calculate instant commercial estimates for Wedding Cards, Banners, Cards, Certificates, Results & IDs.
              </p>
            </div>
          </div>
        </div>

        {/* 6 Category Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-8">
          {/* Tab 1: Wedding Cards */}
          <button
            type="button"
            onClick={() => setProductType('wedding')}
            className={`py-3 px-2 rounded-2xl text-xs font-bold flex flex-col items-center justify-center gap-1.5 border-2 transition-all cursor-pointer ${
              productType === 'wedding'
                ? 'border-[#e6197f] bg-pink-50/70 text-[#e6197f] ring-2 ring-pink-500/20 shadow-xs'
                : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className="text-xl">💒</span>
            <span className="truncate max-w-[120px] text-center">
              {getCategoryMeta(pricing.wedding, 'Wedding Cards', '').title}
            </span>
          </button>

          {/* Tab 2: Flex & Banners */}
          <button
            type="button"
            onClick={() => setProductType('flex')}
            className={`py-3 px-2 rounded-2xl text-xs font-bold flex flex-col items-center justify-center gap-1.5 border-2 transition-all cursor-pointer ${
              productType === 'flex'
                ? 'border-[#1f6fd6] bg-blue-50/70 text-[#1f6fd6] ring-2 ring-blue-500/20 shadow-xs'
                : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className="text-xl">🎨</span>
            <span className="truncate max-w-[120px] text-center">
              {getCategoryMeta(pricing.flex, 'Flex & Banners', '').title}
            </span>
          </button>

          {/* Tab 3: Visiting Cards */}
          <button
            type="button"
            onClick={() => setProductType('cards')}
            className={`py-3 px-2 rounded-2xl text-xs font-bold flex flex-col items-center justify-center gap-1.5 border-2 transition-all cursor-pointer ${
              productType === 'cards'
                ? 'border-indigo-600 bg-indigo-50/70 text-indigo-700 ring-2 ring-indigo-500/20 shadow-xs'
                : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className="text-xl">💼</span>
            <span className="truncate max-w-[120px] text-center">
              {getCategoryMeta(pricing.visitingCards, 'Visiting Cards', '').title}
            </span>
          </button>

          {/* Tab 4: Certificates */}
          <button
            type="button"
            onClick={() => setProductType('certificates')}
            className={`py-3 px-2 rounded-2xl text-xs font-bold flex flex-col items-center justify-center gap-1.5 border-2 transition-all cursor-pointer ${
              productType === 'certificates'
                ? 'border-amber-600 bg-amber-50/70 text-amber-700 ring-2 ring-amber-500/20 shadow-xs'
                : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className="text-xl">📜</span>
            <span className="truncate max-w-[120px] text-center">
              {getCategoryMeta(pricing.certificates, 'Certificates', '').title}
            </span>
          </button>

          {/* Tab 5: Result Cards */}
          <button
            type="button"
            onClick={() => setProductType('results')}
            className={`py-3 px-2 rounded-2xl text-xs font-bold flex flex-col items-center justify-center gap-1.5 border-2 transition-all cursor-pointer ${
              productType === 'results'
                ? 'border-emerald-600 bg-emerald-50/70 text-emerald-700 ring-2 ring-emerald-500/20 shadow-xs'
                : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className="text-xl">📊</span>
            <span className="truncate max-w-[120px] text-center">
              {getCategoryMeta(pricing.resultCards, 'Result Cards', '').title}
            </span>
          </button>

          {/* Tab 6: ID Cards */}
          <button
            type="button"
            onClick={() => setProductType('idcards')}
            className={`py-3 px-2 rounded-2xl text-xs font-bold flex flex-col items-center justify-center gap-1.5 border-2 transition-all cursor-pointer ${
              productType === 'idcards'
                ? 'border-cyan-600 bg-cyan-50/70 text-cyan-700 ring-2 ring-cyan-500/20 shadow-xs'
                : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className="text-xl">🪪</span>
            <span className="truncate max-w-[120px] text-center">
              {getCategoryMeta(pricing.idCards, 'ID Cards', '').title}
            </span>
          </button>
        </div>

        {/* Dynamic Calculator Configuration Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* 1. WEDDING CARDS (3 Main Options) */}
            {productType === 'wedding' && (
              <div className="space-y-6">
                <div className="p-4 rounded-2xl bg-pink-50/50 border border-pink-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-outfit font-extrabold text-base text-slate-900">
                      {getCategoryMeta(pricing.wedding, 'Wedding Cards (3 Tiers)', '').title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {getCategoryMeta(pricing.wedding, '', 'Select from 3 wedding card tiers with optional metallic foil & wax seal finish.').desc}
                    </p>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-pink-100 text-[#e6197f] self-start sm:self-auto shrink-0">
                    Live Rates
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                    Select Wedding Card Type (3 Options)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setWeddingOption('standard')}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${
                        weddingOption === 'standard'
                          ? 'border-[#e6197f] bg-pink-50/50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-outfit font-bold text-sm text-slate-900">
                          {getOptName(pricing.wedding.standard, 'Standard Single Leaf')}
                        </span>
                        <span className="text-xs font-extrabold text-[#e6197f]">
                          ₹{getOptRate(pricing.wedding.standard, 14)}/pc
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {getOptDesc(pricing.wedding.standard, 'Single leaf 280 GSM art card, vibrant full color print')}
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setWeddingOption('classic')}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${
                        weddingOption === 'classic'
                          ? 'border-[#e6197f] bg-pink-50/50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-outfit font-bold text-sm text-slate-900">
                          {getOptName(pricing.wedding.classic, 'Classic Two-Fold')}
                        </span>
                        <span className="text-xs font-extrabold text-[#e6197f]">
                          ₹{getOptRate(pricing.wedding.classic, 28)}/pc
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {getOptDesc(pricing.wedding.classic, 'Designer folded invite with matching printed envelope')}
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setWeddingOption('luxury')}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${
                        weddingOption === 'luxury'
                          ? 'border-[#e6197f] bg-pink-50/50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-outfit font-bold text-sm text-slate-900">
                          {getOptName(pricing.wedding.luxury, 'Luxury Royal Box')}
                        </span>
                        <span className="text-xs font-extrabold text-[#e6197f]">
                          ₹{getOptRate(pricing.wedding.luxury, 65)}/pc
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {getOptDesc(pricing.wedding.luxury, 'Hardboard box or laser-cut wooden acrylic finish')}
                      </p>
                    </button>
                  </div>
                </div>

                {/* Wedding Quantity */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                    Quantity: {weddingQty} Cards (Min: {pricing.wedding.minOrderQty || 50})
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[50, 100, 200, 300, 500, 1000].map((qty) => (
                      <button
                        key={qty}
                        type="button"
                        onClick={() => setWeddingQty(qty)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                          weddingQty === qty
                            ? 'border-[#e6197f] bg-[#e6197f] text-white shadow-xs'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {qty} Cards
                      </button>
                    ))}
                  </div>
                </div>

                {/* Add-ons */}
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Finishing Options & Add-ons
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100">
                      <input
                        type="checkbox"
                        checked={weddingGoldFoil}
                        onChange={(e) => setWeddingGoldFoil(e.target.checked)}
                        className="w-4 h-4 accent-[#e6197f]"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">
                          {getAddonName(pricing.wedding.goldFoilAddon, 'Gold Foil Names & Shlokas')}
                        </span>
                        {getAddonDesc(pricing.wedding.goldFoilAddon) && (
                          <span className="text-[10px] text-slate-500 block">
                            {getAddonDesc(pricing.wedding.goldFoilAddon)}
                          </span>
                        )}
                        <span className="text-[11px] font-semibold text-pink-700">
                          +₹{getAddonRate(pricing.wedding.goldFoilAddon, 6)} per card
                        </span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100">
                      <input
                        type="checkbox"
                        checked={weddingWaxSeal}
                        onChange={(e) => setWeddingWaxSeal(e.target.checked)}
                        className="w-4 h-4 accent-[#e6197f]"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">
                          {getAddonName(pricing.wedding.waxSealAddon, 'Custom Initial Wax Seal')}
                        </span>
                        {getAddonDesc(pricing.wedding.waxSealAddon) && (
                          <span className="text-[10px] text-slate-500 block">
                            {getAddonDesc(pricing.wedding.waxSealAddon)}
                          </span>
                        )}
                        <span className="text-[11px] font-semibold text-pink-700">
                          +₹{getAddonRate(pricing.wedding.waxSealAddon, 8)} per card
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* 2. FLEX & BANNERS (4 Options) */}
            {productType === 'flex' && (
              <div className="space-y-6">
                <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-outfit font-extrabold text-base text-slate-900">
                      {getCategoryMeta(pricing.flex, 'Flex & Banners (4 Options)', '').title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {getCategoryMeta(pricing.flex, '', 'High-resolution wide-format flex printing for hoardings, indoor events, backlit signages, and outdoor banners.').desc}
                    </p>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-blue-100 text-[#1f6fd6] self-start sm:self-auto shrink-0">
                    Live Rates
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                    Select Flex Media (4 Options)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setFlexMaterial('normal')}
                      className={`p-3.5 rounded-xl border-2 text-left transition-all ${
                        flexMaterial === 'normal'
                          ? 'border-[#1f6fd6] bg-blue-50/50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <span className="font-outfit font-bold text-xs text-slate-900 block">
                        {getOptName(pricing.flex.normal, 'Normal Frontlit')}
                      </span>
                      <span className="text-xs font-extrabold text-[#1f6fd6] mt-1 block">
                        ₹{getOptRate(pricing.flex.normal, 14)}/sq.ft
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {getOptDesc(pricing.flex.normal, 'Frontlit (260 GSM)')}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFlexMaterial('star')}
                      className={`p-3.5 rounded-xl border-2 text-left transition-all ${
                        flexMaterial === 'star'
                          ? 'border-[#1f6fd6] bg-blue-50/50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <span className="font-outfit font-bold text-xs text-slate-900 block">
                        {getOptName(pricing.flex.star, 'Star Frontlit')}
                      </span>
                      <span className="text-xs font-extrabold text-[#1f6fd6] mt-1 block">
                        ₹{getOptRate(pricing.flex.star, 22)}/sq.ft
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {getOptDesc(pricing.flex.star, 'High density (320 GSM)')}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFlexMaterial('backlit')}
                      className={`p-3.5 rounded-xl border-2 text-left transition-all ${
                        flexMaterial === 'backlit'
                          ? 'border-[#1f6fd6] bg-blue-50/50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <span className="font-outfit font-bold text-xs text-slate-900 block">
                        {getOptName(pricing.flex.backlit, 'Backlit Glow-Sign')}
                      </span>
                      <span className="text-xs font-extrabold text-[#1f6fd6] mt-1 block">
                        ₹{getOptRate(pricing.flex.backlit, 40)}/sq.ft
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {getOptDesc(pricing.flex.backlit, 'Lightbox (510 GSM)')}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFlexMaterial('blackout')}
                      className={`p-3.5 rounded-xl border-2 text-left transition-all ${
                        flexMaterial === 'blackout'
                          ? 'border-[#1f6fd6] bg-blue-50/50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <span className="font-outfit font-bold text-xs text-slate-900 block">
                        {getOptName(pricing.flex.blackout, 'Blackout / Vinyl')}
                      </span>
                      <span className="text-xs font-extrabold text-[#1f6fd6] mt-1 block">
                        ₹{getOptRate(pricing.flex.blackout, 55)}/sq.ft
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {getOptDesc(pricing.flex.blackout, '100% Light Blockout')}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Dimensions */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                      Width (Feet)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={flexWidth}
                      onChange={(e) => setFlexWidth(Math.max(1, Number(e.target.value)))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-800 focus:outline-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                      Height (Feet)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={flexHeight}
                      onChange={(e) => setFlexHeight(Math.max(1, Number(e.target.value)))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-800 focus:outline-blue-500"
                    />
                  </div>
                </div>

                {/* Banner Quantity & Add-ons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                      Number of Banners
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={flexQty}
                      onChange={(e) => setFlexQty(Math.max(1, Number(e.target.value)))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-800 focus:outline-blue-500"
                    />
                  </div>

                  <div className="flex flex-col justify-end gap-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={hasEyelets}
                        onChange={(e) => setHasEyelets(e.target.checked)}
                        className="w-4 h-4 accent-[#1f6fd6]"
                      />
                      <div>
                        <span>
                          {getAddonName(pricing.flex.eyeletCost, 'Corner Metal Eyelets')} (+₹{getAddonRate(pricing.flex.eyeletCost, 30)}/banner)
                        </span>
                        {getAddonDesc(pricing.flex.eyeletCost) && (
                          <span className="text-[10px] text-slate-500 block font-normal">
                            {getAddonDesc(pricing.flex.eyeletCost)}
                          </span>
                        )}
                      </div>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={hasFrameMounting}
                        onChange={(e) => setHasFrameMounting(e.target.checked)}
                        className="w-4 h-4 accent-[#1f6fd6]"
                      />
                      <div>
                        <span>
                          {getAddonName(pricing.flex.frameMountingSqft, 'Mount on Wooden/Iron Frame')} (+₹{getAddonRate(pricing.flex.frameMountingSqft, 15)}/sq.ft)
                        </span>
                        {getAddonDesc(pricing.flex.frameMountingSqft) && (
                          <span className="text-[10px] text-slate-500 block font-normal">
                            {getAddonDesc(pricing.flex.frameMountingSqft)}
                          </span>
                        )}
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* 3. VISITING CARDS */}
            {productType === 'cards' && (
              <div className="space-y-6">
                <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-outfit font-extrabold text-base text-slate-900">
                      {getCategoryMeta(pricing.visitingCards, 'Visiting Cards (3 Finishes)', '').title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {getCategoryMeta(pricing.visitingCards, '', 'Premium business card printing with matte, velvet, and spot UV finishes.').desc}
                    </p>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 self-start sm:self-auto shrink-0">
                    Live Rates
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                    Paper Coating & Luxury Finish
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setCardFinish('matte')}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${
                        cardFinish === 'matte'
                          ? 'border-indigo-600 bg-indigo-50/50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <span className="font-outfit font-bold text-sm text-slate-900 block">
                        {getOptName(pricing.visitingCards.matte, '350 GSM Matte')}
                      </span>
                      <span className="text-xs font-extrabold text-indigo-700 mt-1 block">
                        ₹{getOptRate(pricing.visitingCards.matte, 550)} / 1000
                      </span>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {getOptDesc(pricing.visitingCards.matte, 'Non-reflective smooth thermal matte lamination')}
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCardFinish('velvet')}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${
                        cardFinish === 'velvet'
                          ? 'border-indigo-600 bg-indigo-50/50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <span className="font-outfit font-bold text-sm text-slate-900 block">
                        {getOptName(pricing.visitingCards.velvet, 'Velvet Soft-Touch')}
                      </span>
                      <span className="text-xs font-extrabold text-indigo-700 mt-1 block">
                        ₹{getOptRate(pricing.visitingCards.velvet, 850)} / 1000
                      </span>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {getOptDesc(pricing.visitingCards.velvet, 'Anti-scratch premium peach-skin velvet feel')}
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCardFinish('spotuv')}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${
                        cardFinish === 'spotuv'
                          ? 'border-indigo-600 bg-indigo-50/50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <span className="font-outfit font-bold text-sm text-slate-900 block">
                        {getOptName(pricing.visitingCards.spotuv, 'Raised Spot UV / Foil')}
                      </span>
                      <span className="text-xs font-extrabold text-indigo-700 mt-1 block">
                        ₹{getOptRate(pricing.visitingCards.spotuv, 1400)} / 1000
                      </span>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {getOptDesc(pricing.visitingCards.spotuv, 'Velvet touch with 3D glossy embossed emblem')}
                      </p>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                      Printing Sides
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setCardSides('single')}
                        className={`flex-1 py-2.5 rounded-xl border text-xs font-bold ${
                          cardSides === 'single'
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                            : 'border-slate-200 bg-slate-50 text-slate-700'
                        }`}
                      >
                        Single Sided
                      </button>
                      <button
                        type="button"
                        onClick={() => setCardSides('double')}
                        className={`flex-1 py-2.5 rounded-xl border text-xs font-bold ${
                          cardSides === 'double'
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                            : 'border-slate-200 bg-slate-50 text-slate-700'
                        }`}
                      >
                        {getAddonName(pricing.visitingCards.doubleSideAddon, 'Double Sided')} (+₹{getAddonRate(pricing.visitingCards.doubleSideAddon, 150)})
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                      Quantity: {cardQty} Cards
                    </label>
                    <div className="flex gap-2">
                      {[500, 1000, 2000, 5000].map((qty) => (
                        <button
                          key={qty}
                          type="button"
                          onClick={() => setCardQty(qty)}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-bold border ${
                            cardQty === qty
                              ? 'border-indigo-600 bg-indigo-600 text-white'
                              : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {qty}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. CERTIFICATES */}
            {productType === 'certificates' && (
              <div className="space-y-6">
                <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-outfit font-extrabold text-base text-slate-900">
                      {getCategoryMeta(pricing.certificates, 'Certificates (3 Paper Options)', '').title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {getCategoryMeta(pricing.certificates, '', 'Official certificates for schools, colleges, sports, and seminars.').desc}
                    </p>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 self-start sm:self-auto shrink-0">
                    Live Rates
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                    Paper & Border Finish
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setCertType('standard')}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${
                        certType === 'standard'
                          ? 'border-amber-600 bg-amber-50/50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <span className="font-outfit font-bold text-sm text-slate-900 block">
                        {getOptName(pricing.certificates.standard, '300 GSM Heavy Art')}
                      </span>
                      <span className="text-xs font-extrabold text-amber-700 mt-1 block">
                        ₹{getOptRate(pricing.certificates.standard, 15)}/sheet
                      </span>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {getOptDesc(pricing.certificates.standard, 'Sturdy bright white board with crisp CMYK print')}
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCertType('goldborder')}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${
                        certType === 'goldborder'
                          ? 'border-amber-600 bg-amber-50/50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <span className="font-outfit font-bold text-sm text-slate-900 block">
                        {getOptName(pricing.certificates.goldborder, 'Gold Foil Border')}
                      </span>
                      <span className="text-xs font-extrabold text-amber-700 mt-1 block">
                        ₹{getOptRate(pricing.certificates.goldborder, 26)}/sheet
                      </span>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {getOptDesc(pricing.certificates.goldborder, 'Hot stamped metallic gold guilloche borders')}
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCertType('parchment')}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${
                        certType === 'parchment'
                          ? 'border-amber-600 bg-amber-50/50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <span className="font-outfit font-bold text-sm text-slate-900 block">
                        {getOptName(pricing.certificates.parchment, 'Parchment Finish')}
                      </span>
                      <span className="text-xs font-extrabold text-amber-700 mt-1 block">
                        ₹{getOptRate(pricing.certificates.parchment, 42)}/sheet
                      </span>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {getOptDesc(pricing.certificates.parchment, 'Authentic antique texture anti-tear parchment')}
                      </p>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                      Quantity: {certQty} Certificates (Min: {pricing.certificates.minOrderQty || 25})
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[25, 50, 100, 250, 500].map((qty) => (
                        <button
                          key={qty}
                          type="button"
                          onClick={() => setCertQty(qty)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold border ${
                            certQty === qty
                              ? 'border-amber-600 bg-amber-600 text-white'
                              : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {qty}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col justify-end gap-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={certLamination}
                        onChange={(e) => setCertLamination(e.target.checked)}
                        className="w-4 h-4 accent-amber-600"
                      />
                      <div>
                        <span>
                          {getAddonName(pricing.certificates.laminationAddon, 'Thermal Gloss / Matte Lamination')} (+₹{getAddonRate(pricing.certificates.laminationAddon, 6)}/sheet)
                        </span>
                        {getAddonDesc(pricing.certificates.laminationAddon) && (
                          <span className="text-[10px] text-slate-500 block font-normal">
                            {getAddonDesc(pricing.certificates.laminationAddon)}
                          </span>
                        )}
                      </div>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={certFolder}
                        onChange={(e) => setCertFolder(e.target.checked)}
                        className="w-4 h-4 accent-amber-600"
                      />
                      <div>
                        <span>
                          {getAddonName(pricing.certificates.presentationFolderAddon, 'Presentation Folder')} (+₹{getAddonRate(pricing.certificates.presentationFolderAddon, 35)}/pc)
                        </span>
                        {getAddonDesc(pricing.certificates.presentationFolderAddon) && (
                          <span className="text-[10px] text-slate-500 block font-normal">
                            {getAddonDesc(pricing.certificates.presentationFolderAddon)}
                          </span>
                        )}
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* 5. RESULT CARDS (School Report Cards) */}
            {productType === 'results' && (
              <div className="space-y-6">
                <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-outfit font-extrabold text-base text-slate-900">
                      {getCategoryMeta(pricing.resultCards, 'Result Cards (3 Formats)', '').title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {getCategoryMeta(pricing.resultCards, '', 'School & college marksheets, grade cards, and performance report printings.').desc}
                    </p>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 self-start sm:self-auto shrink-0">
                    Live Rates
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                    Report Card Format
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setResultType('single')}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${
                        resultType === 'single'
                          ? 'border-emerald-600 bg-emerald-50/50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <span className="font-outfit font-bold text-sm text-slate-900 block">
                        {getOptName(pricing.resultCards.single, 'Single Sheet Marksheet')}
                      </span>
                      <span className="text-xs font-extrabold text-emerald-700 mt-1 block">
                        ₹{getOptRate(pricing.resultCards.single, 12)}/sheet
                      </span>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {getOptDesc(pricing.resultCards.single, '250 GSM Security Bond')}
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setResultType('bifold')}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${
                        resultType === 'bifold'
                          ? 'border-emerald-600 bg-emerald-50/50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <span className="font-outfit font-bold text-sm text-slate-900 block">
                        {getOptName(pricing.resultCards.bifold, 'Bi-Fold Marksheet Card')}
                      </span>
                      <span className="text-xs font-extrabold text-emerald-700 mt-1 block">
                        ₹{getOptRate(pricing.resultCards.bifold, 24)}/booklet
                      </span>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {getOptDesc(pricing.resultCards.bifold, '300 GSM Folding Progress Report')}
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setResultType('laminated')}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${
                        resultType === 'laminated'
                          ? 'border-emerald-600 bg-emerald-50/50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <span className="font-outfit font-bold text-sm text-slate-900 block">
                        {getOptName(pricing.resultCards.laminated, 'Heavy Laminated Marksheet')}
                      </span>
                      <span className="text-xs font-extrabold text-emerald-700 mt-1 block">
                        ₹{getOptRate(pricing.resultCards.laminated, 32)}/card
                      </span>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {getOptDesc(pricing.resultCards.laminated, 'Tamper-Proof Heavy Thermal Seal')}
                      </p>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                      Student Enrollment: {resultQty} Students (Min: {pricing.resultCards.minOrderQty || 50})
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[50, 100, 250, 500, 1000].map((qty) => (
                        <button
                          key={qty}
                          type="button"
                          onClick={() => setResultQty(qty)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold border ${
                            resultQty === qty
                              ? 'border-emerald-600 bg-emerald-600 text-white'
                              : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {qty}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col justify-end gap-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={resultHologram}
                        onChange={(e) => setResultHologram(e.target.checked)}
                        className="w-4 h-4 accent-emerald-600"
                      />
                      <div>
                        <span>
                          {getAddonName(pricing.resultCards.hologramAddon, 'Security Hologram Sticker')} (+₹{getAddonRate(pricing.resultCards.hologramAddon, 3)}/card)
                        </span>
                        {getAddonDesc(pricing.resultCards.hologramAddon) && (
                          <span className="text-[10px] text-slate-500 block font-normal">
                            {getAddonDesc(pricing.resultCards.hologramAddon)}
                          </span>
                        )}
                      </div>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={resultSleeve}
                        onChange={(e) => setResultSleeve(e.target.checked)}
                        className="w-4 h-4 accent-emerald-600"
                      />
                      <div>
                        <span>
                          {getAddonName(pricing.resultCards.protectiveSleeveAddon, 'Clear Protective Sleeve')} (+₹{getAddonRate(pricing.resultCards.protectiveSleeveAddon, 5)}/card)
                        </span>
                        {getAddonDesc(pricing.resultCards.protectiveSleeveAddon) && (
                          <span className="text-[10px] text-slate-500 block font-normal">
                            {getAddonDesc(pricing.resultCards.protectiveSleeveAddon)}
                          </span>
                        )}
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* 6. ID CARDS (Student & Staff) */}
            {productType === 'idcards' && (
              <div className="space-y-6">
                <div className="p-4 rounded-2xl bg-cyan-50/50 border border-cyan-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-outfit font-extrabold text-base text-slate-900">
                      {getCategoryMeta(pricing.idCards, 'ID Cards (3 Types)', '').title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {getCategoryMeta(pricing.idCards, '', 'School, college, and corporate identity cards with lanyards.').desc}
                    </p>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-700 self-start sm:self-auto shrink-0">
                    Live Rates
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                    Select ID Card Solution
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setIdType('pvc')}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${
                        idType === 'pvc'
                          ? 'border-cyan-600 bg-cyan-50/50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <span className="font-outfit font-bold text-sm text-slate-900 block">
                        {getOptName(pricing.idCards.pvc, 'PVC Digital ID Card')}
                      </span>
                      <span className="text-xs font-extrabold text-cyan-700 mt-1 block">
                        ₹{getOptRate(pricing.idCards.pvc, 35)}/card
                      </span>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {getOptDesc(pricing.idCards.pvc, 'High-Gloss Waterproof PVC')}
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIdType('combo')}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${
                        idType === 'combo'
                          ? 'border-cyan-600 bg-cyan-50/50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <span className="font-outfit font-bold text-sm text-slate-900 block">
                        {getOptName(pricing.idCards.combo, 'Full Combo Package')}
                      </span>
                      <span className="text-xs font-extrabold text-cyan-700 mt-1 block">
                        ₹{getOptRate(pricing.idCards.combo, 55)}/set
                      </span>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {getOptDesc(pricing.idCards.combo, 'PVC Card + Satin Lanyard + Transparent Holder')}
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIdType('rfid')}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${
                        idType === 'rfid'
                          ? 'border-cyan-600 bg-cyan-50/50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <span className="font-outfit font-bold text-sm text-slate-900 block">
                        {getOptName(pricing.idCards.rfid, 'RFID / NFC Smart Card')}
                      </span>
                      <span className="text-xs font-extrabold text-cyan-700 mt-1 block">
                        ₹{getOptRate(pricing.idCards.rfid, 120)}/set
                      </span>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {getOptDesc(pricing.idCards.rfid, 'Contactless Proximity Attendance Chip')}
                      </p>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                    Quantity: {idQty} Cards (Min: {pricing.idCards.minOrderQty || 10})
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[20, 50, 100, 250, 500, 1000].map((qty) => (
                      <button
                        key={qty}
                        type="button"
                        onClick={() => setIdQty(qty)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                          idQty === qty
                            ? 'border-cyan-600 bg-cyan-600 text-white shadow-xs'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {qty} Sets
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Summary & WhatsApp Quotation Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-3xl bg-[#0f172a] text-white p-6 shadow-xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Live Quotation
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Live Store Rate
                  </span>
                </div>

                <div className="mb-6">
                  <span className="text-xs text-slate-400 block mb-1">Estimated Total</span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-outfit font-extrabold text-4xl text-white tracking-tight tabular-nums">
                      ₹{subtotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 mt-1 block font-medium">
                    (Approx ₹{unitRate} {unitLabel})
                  </span>
                </div>

                {/* Specs List */}
                <div className="space-y-2 mb-6">
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                    Job Specifications:
                  </span>
                  <div className="bg-slate-900/80 rounded-2xl p-3.5 border border-slate-800 space-y-1.5 text-xs text-slate-300">
                    {specs.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="leading-snug">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400 mb-6 bg-slate-900/40 p-3 rounded-xl border border-slate-800/80">
                  <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>GST invoice, prepress proofing & on-time dispatch included.</span>
                </div>
              </div>

              {/* Direct WhatsApp CTA Button */}
              <div>
                <a
                  href={whatsappQuoteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-emerald-500/25 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Inquire / Order on WhatsApp</span>
                </a>
                <p className="text-[11px] text-center text-slate-400 mt-2">
                  Direct connection with printing specialist
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
