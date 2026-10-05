import React, { useEffect, useState } from 'react';
import { Product, ServiceCategory } from '../types';
import { store } from '../supabase';
import { ArrowLeft, MessageSquare, Tag, Plus, Check } from 'lucide-react';

interface CatalogViewProps {
  serviceId: string;
  onNavigateBack: () => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  serviceId,
  onNavigateBack,
}) => {
  const [service, setService] = useState<ServiceCategory | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      store.getServices().then((list) => list.find((s) => s.id === serviceId) || null),
      store.getProducts(serviceId),
    ]).then(([svc, prods]) => {
      setService(svc);
      setProducts(prods);
      setLoading(false);
    });
  }, [serviceId]);

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={onNavigateBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1f6fd6] hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Services</span>
        </button>

        <span className="text-xs text-slate-500 font-medium">
          Ai Printers • Product Catalog
        </span>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Service Banner */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 mb-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#1f6fd6] flex items-center justify-center text-3xl shrink-0">
                {service?.icon || '🖨️'}
              </div>
              <div>
                <span className="text-[11px] font-bold tracking-widest text-[#1f6fd6] uppercase font-outfit">
                  CATEGORY CATALOG
                </span>
                <h1 className="font-outfit font-extrabold text-2xl sm:text-3xl text-slate-900 mt-0.5">
                  {service?.name || 'Printing Services'}
                </h1>
                {service?.description && (
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
                    {service.description}
                  </p>
                )}
              </div>
            </div>

            <a
              href={`https://wa.me/917020655113?text=${encodeURIComponent(
                `Hi Ai Printers, I need a custom quote for ${service?.name || 'printing'}`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 rounded-xl bg-[#22c35e] hover:bg-[#1eb355] text-white text-xs font-bold shadow-md shadow-[#22c35e]/25 flex items-center justify-center gap-2 self-start sm:self-auto shrink-0"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Inquire on WhatsApp</span>
            </a>
          </div>

          {/* Product Grid */}
          {products.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8">
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center text-xl mx-auto mb-3">
                📦
              </div>
              <h3 className="font-outfit font-bold text-lg text-slate-800">
                No standard products listed yet in this category
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                We produce all custom print specifications on demand. Contact our shop directly on
                WhatsApp to get an instant quotation and sample photos.
              </p>
              <a
                href={`https://wa.me/917020655113?text=${encodeURIComponent(
                  `Hi Ai Printers, I want to order custom products for ${service?.name}`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-xl bg-[#131c30] text-white text-xs font-bold hover:bg-[#1e2a47]"
              >
                <MessageSquare className="w-4 h-4 text-[#22c35e]" />
                <span>Request Custom Quote</span>
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    {/* Image / Fallback Header */}
                    <div className="h-44 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                      {product.photo_url || product.photo_path ? (
                        <img
                          src={product.photo_url || product.photo_path}
                          alt={product.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                          <span className="text-3xl mb-1">{service?.icon || '🖨️'}</span>
                          <span className="text-[11px] font-semibold">Ai Printers Quality</span>
                        </div>
                      )}

                      {product.rate && (
                        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-xs font-outfit font-extrabold text-sm text-[#1f6fd6] shadow-sm">
                          ₹{product.rate}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <h3 className="font-outfit font-bold text-base text-slate-900 group-hover:text-[#1f6fd6] transition-colors leading-snug">
                        {product.title}
                      </h3>
                      {product.description && (
                        <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                          {product.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Order Button */}
                  <div className="p-5 pt-0">
                    <a
                      href={`https://wa.me/917020655113?text=${encodeURIComponent(
                        `Hi Ai Printers, I would like to order: "${product.title}"${
                          product.rate ? ` (Rate: ₹${product.rate})` : ''
                        }. Please let me know the quantity requirements and sample preview.`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-[#1f6fd6] text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-[#22c35e]" />
                      <span>Order on WhatsApp</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
