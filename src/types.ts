export interface FormField {
  label: string;
  type: 'text' | 'number' | 'date' | 'tel';
  required: boolean;
}

export interface School {
  id: string;
  name: string;
  contact_name?: string;
  access_code: string;
  form_fields: FormField[];
  created_at?: string;
}

export type RequestStatus = 'Received' | 'Under Printing' | 'In Design' | 'Printed' | 'Delivered';

export interface IdCardRequest {
  id: string;
  school_id: string;
  school_name?: string;
  request_type: 'New admission' | 'Lost card' | 'Damaged card' | 'Correction';
  student_name: string;
  student_data: Record<string, string>;
  photo_path?: string;
  photo_data?: string; // base64 or blob url fallback
  notes?: string;
  status: RequestStatus;
  created_at: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  icon: string;
  description?: string;
  created_at?: string;
}

export interface Product {
  id: string;
  service_id: string;
  title: string;
  description?: string;
  rate?: number | string;
  photo_path?: string;
  photo_url?: string;
  created_at?: string;
}

export type OrderStatus =
  | 'Order Received'
  | 'In Design & Proofing'
  | 'Printing & Production'
  | 'Quality Checked & Packed'
  | 'Dispatched / In Transit'
  | 'Delivered';

export interface OrderItem {
  id: string;
  title: string;
  category: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  specifications?: string;
  previewImage?: string;
}

export interface OrderTimelineStep {
  status: OrderStatus;
  timestamp: string;
  note: string;
}

export interface CustomerOrder {
  id: string; // e.g. "ARP-9842"
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  shippingAddress: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  totalAmount: number;
  paymentMethod: 'Cash on Delivery' | 'UPI / Online' | 'Bank Transfer' | 'Paid at Counter';
  paymentStatus: 'Paid' | 'Pending Confirmation';
  status: OrderStatus;
  statusHistory: OrderTimelineStep[];
  trackingNumber?: string;
  estimatedDelivery: string;
  createdAt: string;
  notes?: string;
}

export interface CustomerUser {
  email: string;
  name: string;
  phone?: string;
}

export interface CalculatorOptionItem {
  name: string;
  desc: string;
  rate: number;
}

export interface CalculatorAddonItem {
  name: string;
  desc?: string;
  rate: number;
}

export interface CalculatorCategoryMeta {
  title: string;
  desc: string;
}

export interface CalculatorPricing {
  wedding: {
    meta?: CalculatorCategoryMeta;
    standard: CalculatorOptionItem;
    classic: CalculatorOptionItem;
    luxury: CalculatorOptionItem;
    goldFoilAddon: CalculatorAddonItem;
    waxSealAddon: CalculatorAddonItem;
    minOrderQty: number;
  };
  flex: {
    meta?: CalculatorCategoryMeta;
    normal: CalculatorOptionItem;
    star: CalculatorOptionItem;
    backlit: CalculatorOptionItem;
    blackout: CalculatorOptionItem;
    eyeletCost: CalculatorAddonItem;
    frameMountingSqft: CalculatorAddonItem;
    minOrderAmount: number;
  };
  visitingCards: {
    meta?: CalculatorCategoryMeta;
    matte: CalculatorOptionItem;
    velvet: CalculatorOptionItem;
    spotuv: CalculatorOptionItem;
    doubleSideAddon: CalculatorAddonItem;
    minOrderQty: number;
  };
  certificates: {
    meta?: CalculatorCategoryMeta;
    standard: CalculatorOptionItem;
    goldborder: CalculatorOptionItem;
    parchment: CalculatorOptionItem;
    laminationAddon: CalculatorAddonItem;
    presentationFolderAddon: CalculatorAddonItem;
    minOrderQty: number;
  };
  resultCards: {
    meta?: CalculatorCategoryMeta;
    single: CalculatorOptionItem;
    bifold: CalculatorOptionItem;
    laminated: CalculatorOptionItem;
    hologramAddon: CalculatorAddonItem;
    protectiveSleeveAddon: CalculatorAddonItem;
    minOrderQty: number;
  };
  idCards: {
    meta?: CalculatorCategoryMeta;
    pvc: CalculatorOptionItem;
    combo: CalculatorOptionItem;
    rfid: CalculatorOptionItem;
    minOrderQty: number;
  };
}

