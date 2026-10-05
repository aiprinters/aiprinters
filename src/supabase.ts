import { createClient } from '@supabase/supabase-js';
import { School, IdCardRequest, ServiceCategory, Product, RequestStatus, CustomerOrder, CustomerUser, OrderStatus, CalculatorPricing } from './types';

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://yceukuehpffktbpengfx.supabase.co';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_-8xFlxnjkipxyDihmKphzg_iTveTcqC';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const defaultFields = [
  { label: 'Student name', type: 'text' as const, required: true },
  { label: 'Admission number', type: 'text' as const, required: true },
  { label: 'Class', type: 'text' as const, required: true },
  { label: 'Section', type: 'text' as const, required: false },
  { label: 'Date of birth', type: 'date' as const, required: false },
  { label: 'Parent contact', type: 'tel' as const, required: false },
];

const INITIAL_SCHOOLS: School[] = [
  {
    id: 's1',
    name: 'Green Valley School',
    contact_name: 'Mrs. Sharma',
    access_code: 'GVS-2026',
    form_fields: defaultFields,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 's2',
    name: 'Bright Future Academy',
    contact_name: 'School Office',
    access_code: 'BFA-2026',
    form_fields: [...defaultFields, { label: 'Blood group', type: 'text', required: false }],
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 's3',
    name: "St. Mary's Public School",
    contact_name: 'Mr. Joseph',
    access_code: 'SMP-2026',
    form_fields: defaultFields,
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];

const INITIAL_SERVICES: ServiceCategory[] = [
  { id: 'srv-1', name: 'Student & Staff ID Cards', icon: '🪪', description: 'PVC, RFID, smart cards & custom printed satin lanyards' },
  { id: 'srv-2', name: 'Sublimation & Custom Gifts', icon: '☕', description: 'Mugs, steel bottles, photo frames, cushions & keychains' },
  { id: 'srv-3', name: 'Awards, Trophies & Mementos', icon: '🏆', description: 'Wooden plaques, star trophies, acrylic mementos & medals' },
  { id: 'srv-4', name: 'Flex, Banners & Standees', icon: '🎨', description: 'High-res eco-solvent star flex, vinyl, roll-up standees' },
  { id: 'srv-5', name: 'Visiting Cards & Stationery', icon: '💼', description: '350 GSM matte, velvet touch, spot UV & foil stamping' },
  { id: 'srv-6', name: 'Custom Packaging & Stickers', icon: '📦', description: 'Sweet boxes, carton packaging, die-cut product stickers' },
  { id: 'srv-7', name: '3D Printing & Laser Engraving', icon: '🐘', description: 'Rapid 3D prototypes, miniature figurines & acrylic cutting' },
  { id: 'srv-8', name: 'Certificates & Documents', icon: '📜', description: 'Parchment finish, gold foil borders & document lamination' },
];

const INITIAL_PRODUCTS: Product[] = [
  { id: 'p1', service_id: 'srv-1', title: 'Student PVC ID Card + Printed Lanyard', description: 'Double-sided waterproof card with 16mm satin lanyard and transparent holder', rate: 45 },
  { id: 'p2', service_id: 'srv-1', title: 'Staff Metal Finish Magnet ID Badge', description: 'Premium brushed metallic badge with magnetic clip', rate: 120 },
  { id: 'p3', service_id: 'srv-2', title: 'Custom Ceramic Photo Mug', description: 'Bright glossy 325ml sublimation mug with vivid full-color wrap print', rate: 199 },
  { id: 'p4', service_id: 'srv-2', title: 'Insulated Stainless Steel Sports Bottle', description: '750ml durable temperature-retaining bottle with precision logo printing', rate: 449 },
  { id: 'p5', service_id: 'srv-3', title: 'Executive Golden Star Wooden Trophy', description: 'Laser engraved teak wood finish with high-gloss acrylic star emblem', rate: 599 },
  { id: 'p6', service_id: 'srv-4', title: 'Star Frontlit Flex Banner (Per Sq Ft)', description: 'Weatherproof high-density 320 GSM flex for outdoor hoardings & shops', rate: 18 },
  { id: 'p7', service_id: 'srv-5', title: 'Velvet Matte Business Cards (Pack of 1000)', description: '350 GSM Art card with double-sided anti-scratch velvet lamination', rate: 850 },
  { id: 'p8', service_id: 'srv-7', title: 'Custom 3D Printed Figurine / Model', description: 'High-detail PLA/Resin printing with custom smoothing and paint options', rate: 350 },
];

const INITIAL_REQUESTS: IdCardRequest[] = [
  {
    id: 'AI-1048',
    school_id: 's1',
    school_name: 'Green Valley School',
    student_name: 'Aarav Mehta',
    request_type: 'Lost card',
    student_data: { 'Student name': 'Aarav Mehta', 'Admission number': 'GV-8912', Class: 'X', Section: 'A', 'Class Teacher name': 'Mrs. Sharma' },
    notes: 'Please expedite, exams next week.',
    status: 'Received',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'AI-1047',
    school_id: 's2',
    school_name: 'Bright Future Academy',
    student_name: 'Diya Singh',
    request_type: 'New admission',
    student_data: { 'Student name': 'Diya Singh', 'Admission number': 'BFA-402', Class: 'VI', Section: 'B', 'Blood group': 'O+', 'Class Teacher name': 'Mr. Verma' },
    status: 'In Design',
    created_at: new Date(Date.now() - 3600000 * 14).toISOString(),
  },
  {
    id: 'AI-1046',
    school_id: 's1',
    school_name: 'Green Valley School',
    student_name: 'Kabir Khan',
    request_type: 'Damaged card',
    student_data: { 'Student name': 'Kabir Khan', 'Admission number': 'GV-7741', Class: 'VIII', Section: 'C', 'Class Teacher name': 'Mrs. Sharma' },
    status: 'Under Printing',
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'AI-1045',
    school_id: 's3',
    school_name: "St. Mary's Public School",
    student_name: 'Ananya Das',
    request_type: 'New admission',
    student_data: { 'Student name': 'Ananya Das', 'Admission number': 'SM-119', Class: 'IV', Section: 'A', 'Class Teacher name': 'Sister Clara' },
    status: 'Printed',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

const INITIAL_CUSTOMER_ORDERS: CustomerOrder[] = [
  {
    id: 'ARP-9910',
    customerEmail: 'saif.92purkar@gmail.com',
    customerName: 'Saif Purkar',
    customerPhone: '+91 70206 55113',
    shippingAddress: 'Ai Printers Workshop, Shop No. 12, Main Commercial Street, Pune 411001',
    items: [
      {
        id: 'itm-1',
        title: 'Velvet Matte Visiting Cards',
        category: 'Visiting Cards & Stationery',
        quantity: 1000,
        unitPrice: 0.85,
        totalPrice: 850,
        specifications: '350 GSM Art Card, Double-sided Velvet Touch, Gold Foil Emblem',
      },
      {
        id: 'itm-2',
        title: 'Custom Ceramic Photo Mug',
        category: 'Sublimation & Custom Gifts',
        quantity: 3,
        unitPrice: 199,
        totalPrice: 597,
        specifications: '325ml Gloss White, Full Wrap CMYK Color Logo Print',
      },
    ],
    subtotal: 1447,
    tax: 72,
    totalAmount: 1519,
    paymentMethod: 'UPI / Online',
    paymentStatus: 'Paid',
    status: 'Printing & Production',
    trackingNumber: 'BLUEDART-882941',
    estimatedDelivery: 'Tomorrow, by 4:00 PM',
    createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    statusHistory: [
      {
        status: 'Order Received',
        timestamp: new Date(Date.now() - 3600000 * 20).toISOString(),
        note: 'Order submitted and payment verified via UPI.',
      },
      {
        status: 'In Design & Proofing',
        timestamp: new Date(Date.now() - 3600000 * 14).toISOString(),
        note: 'Print bleed and resolution verified by Ai Printers prepress team.',
      },
      {
        status: 'Printing & Production',
        timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
        note: 'Running on Epson high-density digital press.',
      },
    ],
    notes: 'Please pack in sturdy protective boxes.',
  },
  {
    id: 'ARP-9885',
    customerEmail: 'saif.92purkar@gmail.com',
    customerName: 'Saif Purkar',
    customerPhone: '+91 70206 55113',
    shippingAddress: 'Bright Future School Campus Office, Main Road',
    items: [
      {
        id: 'itm-3',
        title: 'Star Frontlit Flex Banner (12ft × 4ft)',
        category: 'Flex, Banners & Standees',
        quantity: 2,
        unitPrice: 1152,
        totalPrice: 2304,
        specifications: '48 sq.ft each (96 sq.ft total), High-Res Star Quality, Corner Metal Eyelets',
      },
    ],
    subtotal: 2304,
    tax: 115,
    totalAmount: 2419,
    paymentMethod: 'Cash on Delivery',
    paymentStatus: 'Pending Confirmation',
    status: 'In Design & Proofing',
    estimatedDelivery: 'Thursday, 3:00 PM',
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    statusHistory: [
      {
        status: 'Order Received',
        timestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
        note: 'Banner order received with custom dimensions.',
      },
      {
        status: 'In Design & Proofing',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        note: 'Drafting banner layout proof for WhatsApp confirmation.',
      },
    ],
    notes: 'Include heavy-duty zinc grommets every 2 feet.',
  },
  {
    id: 'ARP-9842',
    customerEmail: 'saif.92purkar@gmail.com',
    customerName: 'Saif Purkar',
    customerPhone: '+91 70206 55113',
    shippingAddress: 'Ai Printers Workshop, Shop No. 12, Main Commercial Street, Pune 411001',
    items: [
      {
        id: 'itm-4',
        title: 'Executive Golden Star Wooden Trophy',
        category: 'Awards, Trophies & Mementos',
        quantity: 2,
        unitPrice: 599,
        totalPrice: 1198,
        specifications: 'Laser engraved teakwood base with high-gloss gold acrylic star',
      },
      {
        id: 'itm-5',
        title: 'Insulated Stainless Steel Sports Bottle',
        category: 'Sublimation & Custom Gifts',
        quantity: 1,
        unitPrice: 449,
        totalPrice: 449,
        specifications: '750ml Matte Black Bottle with Laser Etched Logo',
      },
    ],
    subtotal: 1647,
    tax: 82,
    totalAmount: 1729,
    paymentMethod: 'Paid at Counter',
    paymentStatus: 'Paid',
    status: 'Delivered',
    trackingNumber: 'PICKUP-STORE-04',
    estimatedDelivery: 'Delivered on Oct 28',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    statusHistory: [
      {
        status: 'Order Received',
        timestamp: new Date(Date.now() - 86400000 * 4).toISOString(),
        note: 'Order confirmed at shop counter.',
      },
      {
        status: 'In Design & Proofing',
        timestamp: new Date(Date.now() - 86400000 * 3.5).toISOString(),
        note: 'Trophy engraving text approved.',
      },
      {
        status: 'Printing & Production',
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
        note: 'Laser engraving & thermal printing complete.',
      },
      {
        status: 'Quality Checked & Packed',
        timestamp: new Date(Date.now() - 86400000 * 1.5).toISOString(),
        note: 'Polished, cleaned and wrapped in gift box.',
      },
      {
        status: 'Delivered',
        timestamp: new Date(Date.now() - 86400000 * 1).toISOString(),
        note: 'Handed over to customer at store counter. Signed by Saif Purkar.',
      },
    ],
  },
];

// Helper to get local data safely
function getLocal<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setLocal<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.warn('LocalStorage save error:', e);
  }
}

// Unified Store with Supabase + LocalStorage Fallback
export const store = {
  async getSchools(): Promise<School[]> {
    try {
      const { data, error } = await supabase.from('schools').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        setLocal('ai_printers_schools', data);
        return data;
      }
    } catch (e) {
      console.log('Supabase offline, using local schools cache:', e);
    }
    return getLocal('ai_printers_schools', INITIAL_SCHOOLS);
  },

  async saveSchool(school: Omit<School, 'id'> & { id?: string }): Promise<School> {
    const newId = school.id || `s_${Date.now()}`;
    const payload: School = {
      ...school,
      id: newId,
      created_at: school.created_at || new Date().toISOString(),
    };

    // Try Supabase first
    try {
      if (school.id) {
        await supabase.from('schools').update(payload).eq('id', school.id);
      } else {
        await supabase.from('schools').insert(payload);
      }
    } catch (e) {
      console.warn('Supabase school sync deferred:', e);
    }

    // Save to local cache
    const current = await this.getSchools();
    const existingIndex = current.findIndex((s) => s.id === payload.id);
    let updated: School[];
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = payload;
    } else {
      updated = [payload, ...current];
    }
    setLocal('ai_printers_schools', updated);
    return payload;
  },

  async deleteSchool(id: string): Promise<void> {
    try {
      await supabase.from('schools').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase delete error:', e);
    }
    const current = await this.getSchools();
    const filtered = current.filter((s) => s.id !== id);
    setLocal('ai_printers_schools', filtered);
  },

  async getRequests(): Promise<IdCardRequest[]> {
    try {
      const { data, error } = await supabase.from('id_card_requests').select('*, schools(name)').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        const mapped = data.map((r: any) => ({
          ...r,
          school_name: r.schools?.name || 'School',
        }));
        setLocal('ai_printers_requests', mapped);
        return mapped;
      }
    } catch (e) {
      console.log('Supabase offline, using local requests:', e);
    }
    return getLocal('ai_printers_requests', INITIAL_REQUESTS);
  },

  async addRequest(req: Omit<IdCardRequest, 'id' | 'created_at'>): Promise<IdCardRequest> {
    const reqId = `AI-${1050 + Math.floor(Math.random() * 8900)}`;
    const newReq: IdCardRequest = {
      ...req,
      id: reqId,
      created_at: new Date().toISOString(),
    };

    try {
      await supabase.from('id_card_requests').insert({
        id: newReq.id,
        school_id: newReq.school_id,
        request_type: newReq.request_type,
        student_name: newReq.student_name,
        student_data: newReq.student_data,
        photo_path: newReq.photo_path || null,
        notes: newReq.notes || null,
        status: newReq.status,
      });
    } catch (e) {
      console.warn('Supabase request sync deferred:', e);
    }

    const current = await this.getRequests();
    const updated = [newReq, ...current];
    setLocal('ai_printers_requests', updated);
    return newReq;
  },

  async updateRequestStatus(id: string, status: RequestStatus): Promise<void> {
    try {
      await supabase.from('id_card_requests').update({ status }).eq('id', id);
    } catch (e) {
      console.warn('Supabase status update error:', e);
    }
    const current = await this.getRequests();
    const updated = current.map((r) => (r.id === id ? { ...r, status } : r));
    setLocal('ai_printers_requests', updated);
  },

  async deleteRequest(id: string): Promise<void> {
    try {
      await supabase.from('id_card_requests').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase delete request error:', e);
    }
    const current = await this.getRequests();
    const filtered = current.filter((r) => r.id !== id);
    setLocal('ai_printers_requests', filtered);
  },

  async getServices(): Promise<ServiceCategory[]> {
    try {
      const { data, error } = await supabase.from('services').select('*').order('created_at', { ascending: true });
      if (!error && data && data.length > 0) {
        setLocal('ai_printers_services', data);
        return data;
      }
    } catch (e) {
      console.log('Supabase services error, using cache:', e);
    }
    return getLocal('ai_printers_services', INITIAL_SERVICES);
  },

  async addService(service: { name: string; icon: string; description?: string }): Promise<ServiceCategory> {
    const newService: ServiceCategory = {
      ...service,
      id: `srv_${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    try {
      await supabase.from('services').insert(newService);
    } catch (e) {
      console.warn('Supabase service insert error:', e);
    }
    const current = await this.getServices();
    const updated = [...current, newService];
    setLocal('ai_printers_services', updated);
    return newService;
  },

  async deleteService(id: string): Promise<void> {
    try {
      await supabase.from('services').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase delete service error:', e);
    }
    const current = await this.getServices();
    const filtered = current.filter((s) => s.id !== id);
    setLocal('ai_printers_services', filtered);
  },

  async updateService(id: string, updates: Partial<ServiceCategory>): Promise<ServiceCategory | null> {
    try {
      await supabase.from('services').update(updates).eq('id', id);
    } catch (e) {
      console.warn('Supabase update service error:', e);
    }
    const current = await this.getServices();
    let updatedService: ServiceCategory | null = null;
    const updated = current.map((s) => {
      if (s.id === id) {
        updatedService = { ...s, ...updates };
        return updatedService;
      }
      return s;
    });
    setLocal('ai_printers_services', updated);
    return updatedService;
  },

  async getProducts(serviceId?: string): Promise<Product[]> {
    try {
      let query = supabase.from('products').select('*');
      if (serviceId) query = query.eq('service_id', serviceId);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        const cached = getLocal<Product[]>('ai_printers_products', INITIAL_PRODUCTS);
        // Merge with cache
        const map = new Map<string, Product>();
        cached.forEach((p) => map.set(p.id, p));
        data.forEach((p: Product) => map.set(p.id, p));
        const merged = Array.from(map.values());
        setLocal('ai_printers_products', merged);
        return serviceId ? merged.filter((p) => p.service_id === serviceId) : merged;
      }
    } catch (e) {
      console.log('Supabase products error, using cache:', e);
    }
    const all = getLocal<Product[]>('ai_printers_products', INITIAL_PRODUCTS);
    return serviceId ? all.filter((p) => p.service_id === serviceId) : all;
  },

  async addProduct(product: Omit<Product, 'id' | 'created_at'>): Promise<Product> {
    const newProd: Product = {
      ...product,
      id: `prod_${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    try {
      await supabase.from('products').insert(newProd);
    } catch (e) {
      console.warn('Supabase add product error:', e);
    }
    const current = await this.getProducts();
    const updated = [newProd, ...current];
    setLocal('ai_printers_products', updated);
    return newProd;
  },

  async deleteProduct(id: string): Promise<void> {
    try {
      await supabase.from('products').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase delete product error:', e);
    }
    const current = await this.getProducts();
    const filtered = current.filter((p) => p.id !== id);
    setLocal('ai_printers_products', filtered);
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    try {
      await supabase.from('products').update(updates).eq('id', id);
    } catch (e) {
      console.warn('Supabase update product error:', e);
    }
    const current = await this.getProducts();
    let updatedProd: Product | null = null;
    const updated = current.map((p) => {
      if (p.id === id) {
        updatedProd = { ...p, ...updates };
        return updatedProd;
      }
      return p;
    });
    setLocal('ai_printers_products', updated);
    return updatedProd;
  },

  // Customer User Auth
  getCurrentCustomerUser(): CustomerUser | null {
    return getLocal<CustomerUser | null>('ai_printers_current_user', {
      email: 'saif.92purkar@gmail.com',
      name: 'Saif Purkar',
      phone: '+91 70206 55113',
    });
  },

  setCurrentCustomerUser(user: CustomerUser | null): void {
    setLocal('ai_printers_current_user', user);
  },

  // Customer Orders
  async getCustomerOrders(email?: string): Promise<CustomerOrder[]> {
    const targetEmail = email || this.getCurrentCustomerUser()?.email;
    try {
      if (targetEmail) {
        const { data, error } = await supabase
          .from('customer_orders')
          .select('*')
          .eq('customerEmail', targetEmail)
          .order('createdAt', { ascending: false });
        if (!error && data && data.length > 0) {
          return data;
        }
      }
    } catch (e) {
      console.log('Supabase orders fetch error, using local cache:', e);
    }
    const all = getLocal<CustomerOrder[]>('ai_printers_customer_orders', INITIAL_CUSTOMER_ORDERS);
    if (targetEmail) {
      return all.filter((o) => o.customerEmail.toLowerCase() === targetEmail.toLowerCase());
    }
    return all;
  },

  async addCustomerOrder(
    order: Omit<CustomerOrder, 'id' | 'createdAt' | 'statusHistory'>
  ): Promise<CustomerOrder> {
    const newId = `ARP-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();
    const newOrder: CustomerOrder = {
      ...order,
      id: newId,
      createdAt: now,
      status: 'Order Received',
      statusHistory: [
        {
          status: 'Order Received',
          timestamp: now,
          note: 'Order submitted online. Awaiting print prepress verification.',
        },
      ],
    };

    try {
      await supabase.from('customer_orders').insert(newOrder);
    } catch (e) {
      console.warn('Supabase order insert error:', e);
    }

    const current = getLocal<CustomerOrder[]>('ai_printers_customer_orders', INITIAL_CUSTOMER_ORDERS);
    const updated = [newOrder, ...current];
    setLocal('ai_printers_customer_orders', updated);
    return newOrder;
  },

  async updateCustomerOrderStatus(
    orderId: string,
    status: OrderStatus,
    note?: string
  ): Promise<void> {
    const current = getLocal<CustomerOrder[]>('ai_printers_customer_orders', INITIAL_CUSTOMER_ORDERS);
    const now = new Date().toISOString();
    const updated = current.map((o) => {
      if (o.id === orderId) {
        return {
          ...o,
          status,
          statusHistory: [
            ...o.statusHistory,
            {
              status,
              timestamp: now,
              note: note || `Status updated to ${status}.`,
            },
          ],
        };
      }
      return o;
    });
    setLocal('ai_printers_customer_orders', updated);
  },

  async cancelCustomerOrder(orderId: string): Promise<void> {
    const current = getLocal<CustomerOrder[]>('ai_printers_customer_orders', INITIAL_CUSTOMER_ORDERS);
    const filtered = current.filter((o) => o.id !== orderId);
    setLocal('ai_printers_customer_orders', filtered);
  },

  async getCalculatorPricing(): Promise<CalculatorPricing> {
    const raw = getLocal<any>('ai_printers_calculator_pricing', DEFAULT_CALCULATOR_PRICING);
    return normalizeCalculatorPricing(raw);
  },

  async saveCalculatorPricing(pricing: CalculatorPricing): Promise<void> {
    setLocal('ai_printers_calculator_pricing', pricing);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ai_printers_pricing_updated', { detail: pricing }));
    }
  },

  async resetCalculatorPricing(): Promise<CalculatorPricing> {
    setLocal('ai_printers_calculator_pricing', DEFAULT_CALCULATOR_PRICING);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ai_printers_pricing_updated', { detail: DEFAULT_CALCULATOR_PRICING }));
    }
    return DEFAULT_CALCULATOR_PRICING;
  },
};

function normalizeOption(raw: any, defaultOpt: { name: string; desc: string; rate: number }) {
  if (typeof raw === 'number') {
    return { ...defaultOpt, rate: raw };
  }
  if (raw && typeof raw === 'object') {
    return {
      name: typeof raw.name === 'string' && raw.name.trim() ? raw.name : defaultOpt.name,
      desc: typeof raw.desc === 'string' && raw.desc.trim() ? raw.desc : defaultOpt.desc,
      rate: typeof raw.rate === 'number' ? raw.rate : defaultOpt.rate,
    };
  }
  return { ...defaultOpt };
}

function normalizeAddon(raw: any, defaultAddon: { name: string; desc?: string; rate: number }) {
  if (typeof raw === 'number') {
    return { ...defaultAddon, rate: raw };
  }
  if (raw && typeof raw === 'object') {
    return {
      name: typeof raw.name === 'string' && raw.name.trim() ? raw.name : defaultAddon.name,
      desc: typeof raw.desc === 'string' ? raw.desc : (defaultAddon.desc || ''),
      rate: typeof raw.rate === 'number' ? raw.rate : defaultAddon.rate,
    };
  }
  return { ...defaultAddon };
}

function normalizeMeta(raw: any, defaultMeta: { title: string; desc: string }) {
  if (raw && typeof raw === 'object') {
    return {
      title: typeof raw.title === 'string' && raw.title.trim() ? raw.title : defaultMeta.title,
      desc: typeof raw.desc === 'string' ? raw.desc : defaultMeta.desc,
    };
  }
  return { ...defaultMeta };
}

export function normalizeCalculatorPricing(raw: any): CalculatorPricing {
  if (!raw || typeof raw !== 'object') return DEFAULT_CALCULATOR_PRICING;

  return {
    wedding: {
      meta: normalizeMeta(raw.wedding?.meta, DEFAULT_CALCULATOR_PRICING.wedding.meta!),
      standard: normalizeOption(raw.wedding?.standard, DEFAULT_CALCULATOR_PRICING.wedding.standard),
      classic: normalizeOption(raw.wedding?.classic, DEFAULT_CALCULATOR_PRICING.wedding.classic),
      luxury: normalizeOption(raw.wedding?.luxury, DEFAULT_CALCULATOR_PRICING.wedding.luxury),
      goldFoilAddon: normalizeAddon(raw.wedding?.goldFoilAddon, DEFAULT_CALCULATOR_PRICING.wedding.goldFoilAddon),
      waxSealAddon: normalizeAddon(raw.wedding?.waxSealAddon, DEFAULT_CALCULATOR_PRICING.wedding.waxSealAddon),
      minOrderQty: typeof raw.wedding?.minOrderQty === 'number' ? raw.wedding.minOrderQty : DEFAULT_CALCULATOR_PRICING.wedding.minOrderQty,
    },
    flex: {
      meta: normalizeMeta(raw.flex?.meta, DEFAULT_CALCULATOR_PRICING.flex.meta!),
      normal: normalizeOption(raw.flex?.normal, DEFAULT_CALCULATOR_PRICING.flex.normal),
      star: normalizeOption(raw.flex?.star, DEFAULT_CALCULATOR_PRICING.flex.star),
      backlit: normalizeOption(raw.flex?.backlit, DEFAULT_CALCULATOR_PRICING.flex.backlit),
      blackout: normalizeOption(raw.flex?.blackout, DEFAULT_CALCULATOR_PRICING.flex.blackout),
      eyeletCost: normalizeAddon(raw.flex?.eyeletCost, DEFAULT_CALCULATOR_PRICING.flex.eyeletCost),
      frameMountingSqft: normalizeAddon(raw.flex?.frameMountingSqft, DEFAULT_CALCULATOR_PRICING.flex.frameMountingSqft),
      minOrderAmount: typeof raw.flex?.minOrderAmount === 'number' ? raw.flex.minOrderAmount : DEFAULT_CALCULATOR_PRICING.flex.minOrderAmount,
    },
    visitingCards: {
      meta: normalizeMeta(raw.visitingCards?.meta, DEFAULT_CALCULATOR_PRICING.visitingCards.meta!),
      matte: normalizeOption(raw.visitingCards?.matte, DEFAULT_CALCULATOR_PRICING.visitingCards.matte),
      velvet: normalizeOption(raw.visitingCards?.velvet, DEFAULT_CALCULATOR_PRICING.visitingCards.velvet),
      spotuv: normalizeOption(raw.visitingCards?.spotuv, DEFAULT_CALCULATOR_PRICING.visitingCards.spotuv),
      doubleSideAddon: normalizeAddon(raw.visitingCards?.doubleSideAddon, DEFAULT_CALCULATOR_PRICING.visitingCards.doubleSideAddon),
      minOrderQty: typeof raw.visitingCards?.minOrderQty === 'number' ? raw.visitingCards.minOrderQty : DEFAULT_CALCULATOR_PRICING.visitingCards.minOrderQty,
    },
    certificates: {
      meta: normalizeMeta(raw.certificates?.meta, DEFAULT_CALCULATOR_PRICING.certificates.meta!),
      standard: normalizeOption(raw.certificates?.standard, DEFAULT_CALCULATOR_PRICING.certificates.standard),
      goldborder: normalizeOption(raw.certificates?.goldborder, DEFAULT_CALCULATOR_PRICING.certificates.goldborder),
      parchment: normalizeOption(raw.certificates?.parchment, DEFAULT_CALCULATOR_PRICING.certificates.parchment),
      laminationAddon: normalizeAddon(raw.certificates?.laminationAddon, DEFAULT_CALCULATOR_PRICING.certificates.laminationAddon),
      presentationFolderAddon: normalizeAddon(raw.certificates?.presentationFolderAddon, DEFAULT_CALCULATOR_PRICING.certificates.presentationFolderAddon),
      minOrderQty: typeof raw.certificates?.minOrderQty === 'number' ? raw.certificates.minOrderQty : DEFAULT_CALCULATOR_PRICING.certificates.minOrderQty,
    },
    resultCards: {
      meta: normalizeMeta(raw.resultCards?.meta, DEFAULT_CALCULATOR_PRICING.resultCards.meta!),
      single: normalizeOption(raw.resultCards?.single, DEFAULT_CALCULATOR_PRICING.resultCards.single),
      bifold: normalizeOption(raw.resultCards?.bifold, DEFAULT_CALCULATOR_PRICING.resultCards.bifold),
      laminated: normalizeOption(raw.resultCards?.laminated, DEFAULT_CALCULATOR_PRICING.resultCards.laminated),
      hologramAddon: normalizeAddon(raw.resultCards?.hologramAddon, DEFAULT_CALCULATOR_PRICING.resultCards.hologramAddon),
      protectiveSleeveAddon: normalizeAddon(raw.resultCards?.protectiveSleeveAddon, DEFAULT_CALCULATOR_PRICING.resultCards.protectiveSleeveAddon),
      minOrderQty: typeof raw.resultCards?.minOrderQty === 'number' ? raw.resultCards.minOrderQty : DEFAULT_CALCULATOR_PRICING.resultCards.minOrderQty,
    },
    idCards: {
      meta: normalizeMeta(raw.idCards?.meta, DEFAULT_CALCULATOR_PRICING.idCards.meta!),
      pvc: normalizeOption(raw.idCards?.pvc, DEFAULT_CALCULATOR_PRICING.idCards.pvc),
      combo: normalizeOption(raw.idCards?.combo, DEFAULT_CALCULATOR_PRICING.idCards.combo),
      rfid: normalizeOption(raw.idCards?.rfid, DEFAULT_CALCULATOR_PRICING.idCards.rfid),
      minOrderQty: typeof raw.idCards?.minOrderQty === 'number' ? raw.idCards.minOrderQty : DEFAULT_CALCULATOR_PRICING.idCards.minOrderQty,
    },
  };
}

export const DEFAULT_CALCULATOR_PRICING: CalculatorPricing = {
  wedding: {
    meta: {
      title: 'Wedding Cards & Invitations',
      desc: 'Single-leaf inserts, 2-fold luxury designer cards, and royal gift box wedding invitation suites.',
    },
    standard: {
      name: 'Standard Single Leaf',
      desc: 'Single Leaf Card (280 GSM)',
      rate: 14,
    },
    classic: {
      name: 'Classic Two-Fold (Popular)',
      desc: 'Two-Fold Designer Card + Envelope',
      rate: 28,
    },
    luxury: {
      name: 'Luxury Royal Box',
      desc: 'Royal Box / Laser-Cut Acrylic Finish',
      rate: 65,
    },
    goldFoilAddon: {
      name: 'Gold Foil Stamping',
      desc: 'Metallic gold foil names & shlokas',
      rate: 6,
    },
    waxSealAddon: {
      name: 'Custom Initial Wax Seal',
      desc: 'Handcrafted metallic wax stamp seal',
      rate: 8,
    },
    minOrderQty: 50,
  },
  flex: {
    meta: {
      title: 'Flex & Banners (4 Options)',
      desc: 'High-resolution wide-format flex printing for hoardings, indoor events, backlit signages, and outdoor banners.',
    },
    normal: {
      name: 'Normal Frontlit',
      desc: 'Frontlit Flex (260 GSM)',
      rate: 14,
    },
    star: {
      name: 'Star Flex (Best Value)',
      desc: 'High-Density Star Flex (320 GSM)',
      rate: 22,
    },
    backlit: {
      name: 'Backlit Glow Sign',
      desc: 'Translucent Lightbox (510 GSM)',
      rate: 40,
    },
    blackout: {
      name: 'Blackout Heavy Flex',
      desc: '100% Light Blockout Outdoor',
      rate: 55,
    },
    eyeletCost: {
      name: 'Heavy-Duty Zinc Metal Grommets',
      desc: 'Zinc rust-proof eyelets every 2 feet',
      rate: 30,
    },
    frameMountingSqft: {
      name: 'Wooden/Iron Frame Fabrication',
      desc: 'Sturdy perimeter frame mounting',
      rate: 15,
    },
    minOrderAmount: 150,
  },
  visitingCards: {
    meta: {
      title: 'Visiting Cards & Stationery',
      desc: 'Premium executive cards with matte, velvet lamination, raised spot UV, and dual-sided full color printing.',
    },
    matte: {
      name: 'Matte Finish',
      desc: '300 GSM Art Card with Matte Coating',
      rate: 550,
    },
    velvet: {
      name: 'Velvet Touch (Top Seller)',
      desc: '350 GSM Anti-Scratch Velvet Lamination',
      rate: 850,
    },
    spotuv: {
      name: 'Spot UV Premium',
      desc: '400 GSM Ultra-Thick Embossed Gloss',
      rate: 1400,
    },
    doubleSideAddon: {
      name: 'Double-Sided Full Color Print',
      desc: 'Full-color double-sided printing per 1000 cards',
      rate: 150,
    },
    minOrderQty: 500,
  },
  certificates: {
    meta: {
      title: 'Academic & Event Certificates',
      desc: 'High-end certificate sheets with foil embossed guilloche borders, heavy art paper, and luxury presentation jackets.',
    },
    standard: {
      name: 'Standard Ivory',
      desc: '300 GSM Smooth Ivory Paper',
      rate: 15,
    },
    goldborder: {
      name: 'Gold Border Foil',
      desc: 'Metallic Foil Border Embossed',
      rate: 26,
    },
    parchment: {
      name: 'Royal Parchment',
      desc: 'Textured Linen Parchment Stock',
      rate: 42,
    },
    laminationAddon: {
      name: 'Thermal Gloss/Matte Lamination',
      desc: 'Gloss or matte protective thermal seal',
      rate: 6,
    },
    presentationFolderAddon: {
      name: 'Deluxe Gold Stamped Folder',
      desc: 'Gold embossed presentation folder',
      rate: 35,
    },
    minOrderQty: 25,
  },
  resultCards: {
    meta: {
      title: 'Result Cards & School Marksheets',
      desc: 'Institutional progress cards, quarterly report booklets, tamper-proof heavy laminate, and security holograms.',
    },
    single: {
      name: 'Single Sheet Marksheet',
      desc: '250 GSM Security Bond',
      rate: 12,
    },
    bifold: {
      name: 'Bi-Fold Marksheet Card',
      desc: '300 GSM Folding Progress Report',
      rate: 24,
    },
    laminated: {
      name: 'Heavy Laminated Marksheet',
      desc: 'Tamper-Proof Heavy Thermal Seal',
      rate: 32,
    },
    hologramAddon: {
      name: 'Security Hologram Sticker',
      desc: 'Tamper-evident holographic authenticity seal',
      rate: 3,
    },
    protectiveSleeveAddon: {
      name: 'Clear Protective Document Sleeve',
      desc: 'Transparent waterproof document envelope',
      rate: 5,
    },
    minOrderQty: 50,
  },
  idCards: {
    meta: {
      title: 'Student & Staff ID Cards',
      desc: 'Digital fused PVC identity cards, printed satin lanyards with transparent badge holders, and smart RFID chips.',
    },
    pvc: {
      name: 'PVC Digital ID Card',
      desc: 'High-Gloss Waterproof PVC',
      rate: 35,
    },
    combo: {
      name: 'Full Combo Package',
      desc: 'PVC Card + Satin Lanyard + Transparent Holder',
      rate: 55,
    },
    rfid: {
      name: 'RFID / NFC Smart Card',
      desc: 'Contactless Proximity Attendance Chip',
      rate: 120,
    },
    minOrderQty: 10,
  },
};
