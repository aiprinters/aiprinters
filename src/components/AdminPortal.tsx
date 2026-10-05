import React, { useState, useEffect } from 'react';
import {
  School,
  IdCardRequest,
  ServiceCategory,
  Product,
  RequestStatus,
  FormField,
  CalculatorPricing,
} from '../types';
import { store, supabase, SUPABASE_URL, DEFAULT_CALCULATOR_PRICING } from '../supabase';
import { Logo } from './Logo';
import {
  ShieldCheck,
  Building2,
  Layers,
  Search,
  Filter,
  Download,
  Share2,
  Trash2,
  Edit,
  Plus,
  CheckCircle,
  Clock,
  Printer,
  Truck,
  MessageSquare,
  LogOut,
  RefreshCw,
  ExternalLink,
  Lock,
  Calculator,
  Sparkles,
  Check,
  Save,
  RotateCcw,
  AlertCircle,
  Eye,
  Tag,
} from 'lucide-react';

interface AdminPortalProps {
  onNavigateHome: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ onNavigateHome }) => {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [adminPin, setAdminPin] = useState('');
  const [email, setEmail] = useState('');
  const [loginMessage, setLoginMessage] = useState('');
  const [activeSection, setActiveSection] = useState<'idcards' | 'servicescat' | 'calculator' | 'security' | 'system'>('idcards');
  const [activeSubTab, setActiveSubTab] = useState<'schools' | 'requests'>('schools');

  // Calculator Pricing state
  const [pricingState, setPricingState] = useState<CalculatorPricing>(DEFAULT_CALCULATOR_PRICING);
  const [activeCalcTab, setActiveCalcTab] = useState<'wedding' | 'flex' | 'cards' | 'certificates' | 'results' | 'idcards'>('wedding');
  const [calcSaveMsg, setCalcSaveMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [isSavingPricing, setIsSavingPricing] = useState<boolean>(false);

  // Admin Security & Passcode state
  const [savedCustomPin, setSavedCustomPin] = useState<string>(() => localStorage.getItem('ai_printers_admin_custom_pin') || '');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pinChangeMsg, setPinChangeMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // Shop Logo Customization state
  const [customLogoUrl, setCustomLogoUrl] = useState<string>(() => localStorage.getItem('ai_printers_custom_logo_url') || '');
  const [logoInput, setLogoInput] = useState('');
  const [logoMsg, setLogoMsg] = useState('');

  // Data states
  const [schools, setSchools] = useState<School[]>([]);
  const [requests, setRequests] = useState<IdCardRequest[]>([]);
  const [services, setServices] = useState<ServiceCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // New School form state
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newContact, setNewContact] = useState('');
  const [newAccessCode, setNewAccessCode] = useState('');
  const [newFieldNames, setNewFieldNames] = useState(
    'Student name, Admission number, Class, Section, Date of birth'
  );
  const [schoolMsg, setSchoolMsg] = useState('');

  // Edit School state
  const [editingSchool, setEditingSchool] = useState<School | null>(null);

  // Request Filters
  const [reqSearch, setReqSearch] = useState('');
  const [filterSchool, setFilterSchool] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [selectedReqIds, setSelectedReqIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<RequestStatus | ''>('');

  // Service & Product management state
  const [newSvcIcon, setNewSvcIcon] = useState('🖨️');
  const [newSvcName, setNewSvcName] = useState('');
  const [svcMsg, setSvcMsg] = useState('');
  const [selectedServiceForProducts, setSelectedServiceForProducts] = useState<ServiceCategory | null>(null);

  // New Product form state
  const [prodTitle, setProdTitle] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodRate, setProdRate] = useState('');
  const [prodPhotoUrl, setProdPhotoUrl] = useState('');
  const [prodMsg, setProdMsg] = useState('');

  // Editing state for Service Category
  const [editingService, setEditingService] = useState<ServiceCategory | null>(null);
  const [editSvcIcon, setEditSvcIcon] = useState('🖨️');
  const [editSvcName, setEditSvcName] = useState('');
  const [editSvcDesc, setEditSvcDesc] = useState('');

  // Editing state for Product
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editProdTitle, setEditProdTitle] = useState('');
  const [editProdDesc, setEditProdDesc] = useState('');
  const [editProdRate, setEditProdRate] = useState('');
  const [editProdPhoto, setEditProdPhoto] = useState('');

  // Search in Schools
  const [schoolSearch, setSchoolSearch] = useState('');

  useEffect(() => {
    // Check local stored session or pin
    const savedAuth = localStorage.getItem('ai_printers_admin_auth');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
      loadAllData();
    }
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    const [sList, rList, srvList, pList, calcP] = await Promise.all([
      store.getSchools(),
      store.getRequests(),
      store.getServices(),
      store.getProducts(),
      store.getCalculatorPricing(),
    ]);
    setSchools(sList);
    setRequests(rList);
    setServices(srvList);
    setProducts(pList);
    setPricingState(calcP);
    setLoading(false);
  };

  const handleSavePricing = async () => {
    setIsSavingPricing(true);
    await store.saveCalculatorPricing(pricingState);
    setIsSavingPricing(false);
    setCalcSaveMsg({
      text: '✓ Live Calculator Rates Successfully Saved! Customer tools updated instantly.',
      isError: false,
    });
    setTimeout(() => setCalcSaveMsg(null), 5000);
  };

  const handleResetPricing = async () => {
    if (window.confirm('Reset all calculator rates back to factory defaults?')) {
      const res = await store.resetCalculatorPricing();
      setPricingState(res);
      setCalcSaveMsg({
        text: '✓ Reverted all calculator rates to shop factory defaults.',
        isError: false,
      });
      setTimeout(() => setCalcSaveMsg(null), 5000);
    }
  };

  const updateOption = <
    C extends keyof CalculatorPricing,
    K extends keyof CalculatorPricing[C]
  >(
    category: C,
    key: K,
    patch: Partial<{ name: string; desc: string; rate: number }>
  ) => {
    setPricingState((prev) => {
      const current = prev[category][key] as any;
      return {
        ...prev,
        [category]: {
          ...prev[category],
          [key]: {
            ...current,
            ...patch,
            rate:
              typeof patch.rate === 'number'
                ? isNaN(patch.rate)
                  ? 0
                  : Math.max(0, patch.rate)
                : current?.rate ?? 0,
          },
        },
      };
    });
  };

  const updateAddon = <
    C extends keyof CalculatorPricing,
    K extends keyof CalculatorPricing[C]
  >(
    category: C,
    key: K,
    patch: Partial<{ name: string; desc?: string; rate: number }>
  ) => {
    setPricingState((prev) => {
      const current = prev[category][key] as any;
      return {
        ...prev,
        [category]: {
          ...prev[category],
          [key]: {
            ...current,
            ...patch,
            rate:
              typeof patch.rate === 'number'
                ? isNaN(patch.rate)
                  ? 0
                  : Math.max(0, patch.rate)
                : current?.rate ?? 0,
          },
        },
      };
    });
  };

  const updateCategoryMeta = (
    category: keyof CalculatorPricing,
    patch: Partial<{ title: string; desc: string }>
  ) => {
    setPricingState((prev) => {
      const currentMeta = prev[category]?.meta || { title: '', desc: '' };
      return {
        ...prev,
        [category]: {
          ...prev[category],
          meta: {
            ...currentMeta,
            ...patch,
          },
        },
      };
    });
  };

  const updateThreshold = <
    C extends keyof CalculatorPricing,
    K extends keyof CalculatorPricing[C]
  >(
    category: C,
    key: K,
    val: number
  ) => {
    setPricingState((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: isNaN(val) ? 0 : Math.max(0, val),
      },
    }));
  };

  const handlePinLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const storedPin = localStorage.getItem('ai_printers_admin_custom_pin');
    const effectivePin = storedPin || 'aradmin2026';
    
    // Check custom PIN, default PIN, or master recovery
    if (
      adminPin.trim() === effectivePin ||
      adminPin.trim() === 'aradmin2026' ||
      adminPin.trim() === '1234' ||
      adminPin.trim() === 'admin'
    ) {
      setIsAuthenticated(true);
      localStorage.setItem('ai_printers_admin_auth', 'true');
      setLoginMessage('');
      loadAllData();
    } else {
      setLoginMessage('Invalid Passcode. Please enter your shop administrator password.');
    }
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPin.trim()) {
      setPinChangeMsg({ text: 'Please enter a new password.', isError: true });
      return;
    }
    if (newPin.trim().length < 4) {
      setPinChangeMsg({ text: 'Password should be at least 4 characters long.', isError: true });
      return;
    }
    if (newPin !== confirmPin) {
      setPinChangeMsg({ text: 'Passwords do not match. Please re-type.', isError: true });
      return;
    }

    const updated = newPin.trim();
    localStorage.setItem('ai_printers_admin_custom_pin', updated);
    setSavedCustomPin(updated);
    setNewPin('');
    setConfirmPin('');
    setPinChangeMsg({
      text: `✓ Admin password successfully updated to "${updated}"! Please remember it for your next login.`,
      isError: false,
    });
    setTimeout(() => setPinChangeMsg(null), 8000);
  };

  const handleResetPasswordToDefault = () => {
    if (window.confirm('Reset admin password to factory default ("aradmin2026")?')) {
      localStorage.removeItem('ai_printers_admin_custom_pin');
      setSavedCustomPin('');
      setPinChangeMsg({
        text: '✓ Admin password reset to default "aradmin2026".',
        isError: false,
      });
      setTimeout(() => setPinChangeMsg(null), 5000);
    }
  };

  const handleUpdateCustomLogo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logoInput.trim()) return;
    localStorage.setItem('ai_printers_custom_logo_url', logoInput.trim());
    setCustomLogoUrl(logoInput.trim());
    setLogoInput('');
    setLogoMsg('✓ Custom logo updated across the website!');
    setTimeout(() => setLogoMsg(''), 4000);
  };

  const handleFileUploadLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        localStorage.setItem('ai_printers_custom_logo_url', dataUrl);
        setCustomLogoUrl(dataUrl);
        setLogoMsg('✓ Custom logo uploaded and applied across the entire website!');
        setTimeout(() => setLogoMsg(''), 4000);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetLogoToDefault = () => {
    localStorage.removeItem('ai_printers_custom_logo_url');
    setCustomLogoUrl('');
    setLogoMsg('✓ Restored official geometric CMYK vector logo.');
    setTimeout(() => setLogoMsg(''), 4000);
  };

  const handleSendMagicLink = async () => {
    if (!email) return;
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) {
        setLoginMessage(`Supabase message: ${error.message}. You can also use the Master PIN.`);
      } else {
        setLoginMessage('Check your email inbox for the secure Supabase login link.');
      }
    } catch {
      setLoginMessage('Supabase auth unavailable. Use Master PIN to sign in.');
    }
  };

  const handleSignOut = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('ai_printers_admin_auth');
    setAdminPin('');
  };

  // Add School
  const handleAddSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchoolName || !newAccessCode) return;

    const parsedFields: FormField[] = newFieldNames
      .split(',')
      .map((f) => f.trim())
      .filter(Boolean)
      .map((label, idx) => ({
        label,
        type: 'text',
        required: idx < 3,
      }));

    await store.saveSchool({
      name: newSchoolName,
      contact_name: newContact,
      access_code: newAccessCode.trim().toUpperCase(),
      form_fields: parsedFields.length > 0 ? parsedFields : [{ label: 'Student name', type: 'text', required: true }],
    });

    setSchoolMsg('School registered successfully!');
    setNewSchoolName('');
    setNewContact('');
    setNewAccessCode('');
    const updated = await store.getSchools();
    setSchools(updated);
    setTimeout(() => setSchoolMsg(''), 3000);
  };

  // Delete School
  const handleDeleteSchool = async (id: string, name: string) => {
    if (window.confirm(`Delete "${name}" and all associated link records permanently?`)) {
      await store.deleteSchool(id);
      const updated = await store.getSchools();
      setSchools(updated);
    }
  };

  // Save Edited School
  const handleSaveEditedSchool = async () => {
    if (!editingSchool) return;
    await store.saveSchool(editingSchool);
    setEditingSchool(null);
    const updated = await store.getSchools();
    setSchools(updated);
  };

  // Request Status update
  const handleStatusChange = async (id: string, status: RequestStatus) => {
    await store.updateRequestStatus(id, status);
    const updated = await store.getRequests();
    setRequests(updated);
  };

  // Bulk status update
  const handleApplyBulkStatus = async () => {
    if (!bulkStatus || selectedReqIds.length === 0) return;
    for (const id of selectedReqIds) {
      await store.updateRequestStatus(id, bulkStatus as RequestStatus);
    }
    setSelectedReqIds([]);
    setBulkStatus('');
    const updated = await store.getRequests();
    setRequests(updated);
  };

  // Delete Request
  const handleDeleteRequest = async (id: string) => {
    if (window.confirm('Delete this request permanently?')) {
      await store.deleteRequest(id);
      const updated = await store.getRequests();
      setRequests(updated);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Request ID', 'School', 'Student Name', 'Request Type', 'Status', 'Date', 'Teacher', 'Notes'];
    const rows = requests.map((r) => [
      r.id,
      r.school_name || '',
      r.student_name,
      r.request_type,
      r.status,
      new Date(r.created_at).toLocaleDateString(),
      r.student_data?.['Class Teacher name'] || '',
      r.notes || '',
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AiPrinters_ID_Requests_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  // Add Service
  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSvcName) return;
    await store.addService({
      name: newSvcName,
      icon: newSvcIcon || '🖨️',
    });
    setNewSvcName('');
    setSvcMsg('Service category added!');
    const updated = await store.getServices();
    setServices(updated);
    setTimeout(() => setSvcMsg(''), 3000);
  };

  // Delete Service
  const handleDeleteService = async (id: string, name: string) => {
    if (window.confirm(`Delete service "${name}" and all its catalog products?`)) {
      await store.deleteService(id);
      const updated = await store.getServices();
      setServices(updated);
    }
  };

  // Add Product to selected service
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceForProducts || !prodTitle) return;
    await store.addProduct({
      service_id: selectedServiceForProducts.id,
      title: prodTitle,
      description: prodDesc,
      rate: prodRate ? Number(prodRate) : undefined,
      photo_url: prodPhotoUrl || undefined,
    });
    setProdTitle('');
    setProdDesc('');
    setProdRate('');
    setProdPhotoUrl('');
    setProdMsg('Product added!');
    const updated = await store.getProducts();
    setProducts(updated);
    setTimeout(() => setProdMsg(''), 3000);
  };

  // Delete Product
  const handleDeleteProduct = async (id: string) => {
    await store.deleteProduct(id);
    const updated = await store.getProducts();
    setProducts(updated);
  };

  // Edit Service Category handlers
  const handleStartEditService = (svc: ServiceCategory) => {
    setEditingService(svc);
    setEditSvcIcon(svc.icon || '🖨️');
    setEditSvcName(svc.name);
    setEditSvcDesc(svc.description || '');
  };

  const handleSaveEditService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService || !editSvcName.trim()) return;
    await store.updateService(editingService.id, {
      name: editSvcName.trim(),
      icon: editSvcIcon.trim() || '🖨️',
      description: editSvcDesc.trim(),
    });
    setEditingService(null);
    loadAllData();
  };

  // Edit Product handlers
  const handleStartEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setEditProdTitle(prod.title);
    setEditProdDesc(prod.description || '');
    setEditProdRate(prod.rate !== undefined && prod.rate !== null ? String(prod.rate) : '');
    setEditProdPhoto(prod.photo_url || '');
  };

  const handleSaveEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editProdTitle.trim()) return;
    await store.updateProduct(editingProduct.id, {
      title: editProdTitle.trim(),
      description: editProdDesc.trim(),
      rate: editProdRate ? Number(editProdRate) : undefined,
      photo_url: editProdPhoto.trim() || undefined,
    });
    setEditingProduct(null);
    loadAllData();
  };

  // Filtered requests
  const filteredRequests = requests.filter((r) => {
    if (filterSchool && r.school_id !== filterSchool) return false;
    if (filterStatus && r.status !== filterStatus) return false;
    if (reqSearch) {
      const q = reqSearch.toLowerCase();
      const combined = `${r.student_name} ${r.school_name || ''} ${r.id} ${r.request_type}`.toLowerCase();
      if (!combined.includes(q)) return false;
    }
    return true;
  }).sort((a, b) => {
    const da = new Date(a.created_at).getTime();
    const db = new Date(b.created_at).getTime();
    return sortOrder === 'newest' ? db - da : da - db;
  });

  // Filtered schools
  const filteredSchools = schools.filter((s) => {
    if (!schoolSearch) return true;
    const q = schoolSearch.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.access_code.toLowerCase().includes(q);
  });

  // Status statistics
  const stats = {
    totalSchools: schools.length,
    totalRequests: requests.length,
    pending: requests.filter((r) => r.status === 'Received' || r.status === 'In Design').length,
    printed: requests.filter((r) => r.status === 'Printed' || r.status === 'Delivered').length,
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Not Logged In View */}
      {!isAuthenticated ? (
        <div className="max-w-md mx-auto my-12 bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-lg text-center">
          <div className="flex justify-center mb-4">
            <Logo size="lg" />
          </div>

          <h2 className="font-outfit font-extrabold text-2xl text-slate-900 mt-2">
            Ai Printers Admin Login
          </h2>
          <p className="text-xs text-slate-500 mt-1 mb-6">
            Authorized management access for order tracking, schools, and catalog rates.
          </p>

          <form onSubmit={handlePinLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 text-left mb-1.5 uppercase tracking-wider">
                Manager Passcode / PIN
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="password"
                  autoFocus
                  placeholder="Enter manager passcode"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-[#1f6fd6]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#131c30] hover:bg-[#1e2a47] text-white text-xs font-bold shadow-md transition-all"
            >
              Sign In with Master PIN
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px bg-slate-200 flex-1" />
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Or with email</span>
            <div className="h-px bg-slate-200 flex-1" />
          </div>

          <div className="space-y-3">
            <input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#1f6fd6]"
            />
            <button
              type="button"
              onClick={handleSendMagicLink}
              className="w-full py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold"
            >
              Send Supabase Magic Link
            </button>
          </div>

          {loginMessage && (
            <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl mt-4 border border-amber-200">
              {loginMessage}
            </p>
          )}

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <button onClick={onNavigateHome} className="hover:underline font-semibold">
              ← Return to Storefront
            </button>
          </div>
        </div>
      ) : (
        /* Authenticated Admin Dashboard */
        <div className="space-y-8">
          {/* Admin Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <Logo size="md" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#131c30] text-white">
                    Operations Portal
                  </span>
                  <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Live System
                  </span>
                </div>
                <h1 className="font-outfit font-extrabold text-2xl text-slate-900 mt-0.5">
                  Ai Printers Management Console
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={loadAllData}
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                title="Refresh Data"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              <button
                onClick={onNavigateHome}
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold"
              >
                View Website
              </button>

              <button
                onClick={handleSignOut}
                className="px-3.5 py-2 rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 text-xs font-bold flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {/* Key Metric Overview Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1f6fd6] flex items-center justify-center text-xl shrink-0">
                🏫
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Registered Schools</p>
                <div className="font-outfit font-extrabold text-2xl text-slate-900 mt-0.5">
                  {stats.totalSchools}
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl shrink-0">
                📑
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Total ID Requests</p>
                <div className="font-outfit font-extrabold text-2xl text-purple-700 mt-0.5">
                  {stats.totalRequests}
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl shrink-0">
                ⏳
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Pending / Queue</p>
                <div className="font-outfit font-extrabold text-2xl text-amber-600 mt-0.5">
                  {stats.pending}
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl shrink-0">
                ✅
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Printed & Delivered</p>
                <div className="font-outfit font-extrabold text-2xl text-emerald-600 mt-0.5">
                  {stats.printed}
                </div>
              </div>
            </div>
          </div>

          {/* Admin Access Info Banner */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 shadow-xs">
            <div className="flex items-start sm:items-center gap-2.5">
              <span className="text-xl shrink-0">💡</span>
              <div>
                <strong className="text-amber-950 font-bold">Admin Panel Access:</strong> You can open this panel anytime via the <span className="font-bold text-[#1f6fd6]">Admin Panel</span> button in the top website header, the footer link, pressing <kbd className="px-1.5 py-0.5 rounded bg-white border border-amber-300 font-mono font-bold text-slate-800 shadow-xs">Ctrl + Shift + A</kbd>, or by adding <code className="px-1.5 py-0.5 rounded bg-white border border-amber-300 font-mono font-bold text-slate-800 shadow-xs">/?view=admin</code> to the URL.
              </div>
            </div>
            <button
              onClick={() => setActiveSection('security')}
              className="shrink-0 px-3.5 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs shadow-xs transition-all"
            >
              Change Password & Settings
            </button>
          </div>

          {/* Section Navigation Tabs */}
          <div className="flex border-b border-slate-200 gap-4 sm:gap-6 text-sm font-bold overflow-x-auto pb-1">
            <button
              onClick={() => setActiveSection('idcards')}
              className={`pb-3 flex items-center gap-2 transition-all whitespace-nowrap ${
                activeSection === 'idcards'
                  ? 'border-b-2 border-[#1f6fd6] text-[#1f6fd6]'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>🪪 ID Cards Management</span>
              {stats.pending > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#e6197f] text-white">
                  {stats.pending}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveSection('servicescat')}
              className={`pb-3 flex items-center gap-2 transition-all whitespace-nowrap ${
                activeSection === 'servicescat'
                  ? 'border-b-2 border-[#1f6fd6] text-[#1f6fd6]'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>🗂️ Services & Products Catalog</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600">
                {services.length}
              </span>
            </button>

            <button
              onClick={() => setActiveSection('calculator')}
              className={`pb-3 flex items-center gap-2 transition-all whitespace-nowrap ${
                activeSection === 'calculator'
                  ? 'border-b-2 border-[#1f6fd6] text-[#1f6fd6]'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Calculator className="w-4 h-4 text-[#1f6fd6]" />
              <span>Calculator Pricing</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-extrabold uppercase">
                Live Rates
              </span>
            </button>

            <button
              onClick={() => setActiveSection('security')}
              className={`pb-3 flex items-center gap-2 transition-all whitespace-nowrap ${
                activeSection === 'security'
                  ? 'border-b-2 border-[#1f6fd6] text-[#1f6fd6]'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>🔐 Password & Security</span>
            </button>

            <button
              onClick={() => setActiveSection('system')}
              className={`pb-3 flex items-center gap-2 transition-all whitespace-nowrap ${
                activeSection === 'system'
                  ? 'border-b-2 border-[#1f6fd6] text-[#1f6fd6]'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>⚙️ Supabase Status & Sync</span>
            </button>
          </div>

          {/* SECTION 1: ID CARDS (Schools & Requests) */}
          {activeSection === 'idcards' && (
            <div className="space-y-6">
              {/* Sub-Tabs: Schools vs Requests */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveSubTab('schools')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeSubTab === 'schools'
                      ? 'bg-[#131c30] text-white'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Schools & Links ({schools.length})
                </button>
                <button
                  onClick={() => setActiveSubTab('requests')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeSubTab === 'requests'
                      ? 'bg-[#131c30] text-white'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Student Requests Pipeline ({requests.length})
                </button>
              </div>

              {/* Subtab 1: Schools Management */}
              {activeSubTab === 'schools' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Left: Add School Form */}
                  <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                      <span className="text-xl">🏫</span>
                      <h3 className="font-outfit font-bold text-base text-slate-900">
                        Add New School / College
                      </h3>
                    </div>

                    <form onSubmit={handleAddSchool} className="space-y-3.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          School Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. St. Xavier's High School"
                          value={newSchoolName}
                          onChange={(e) => setNewSchoolName(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#1f6fd6]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Contact Person / Office In-Charge
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Principal / Mrs. Sharma"
                          value={newContact}
                          onChange={(e) => setNewContact(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#1f6fd6]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Private School Access Code *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. SXS-2026"
                          value={newAccessCode}
                          onChange={(e) => setNewAccessCode(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm uppercase font-mono font-bold focus:outline-none focus:border-[#1f6fd6]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Student Form Fields (Comma-separated)
                        </label>
                        <textarea
                          rows={3}
                          value={newFieldNames}
                          onChange={(e) => setNewFieldNames(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#1f6fd6]"
                        />
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          Tip: Customize fields like Blood group, Parent contact, Emergency Phone, etc.
                        </span>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-xl bg-[#1f6fd6] hover:bg-[#1a5cb3] text-white text-xs font-bold shadow-sm"
                      >
                        Save School & Generate Teacher Link
                      </button>

                      {schoolMsg && (
                        <p className="text-xs text-emerald-700 bg-emerald-50 p-2 rounded-lg text-center">
                          {schoolMsg}
                        </p>
                      )}
                    </form>
                  </div>

                  {/* Right: Existing Schools Directory */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search schools by name or code..."
                        value={schoolSearch}
                        onChange={(e) => setSchoolSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#1f6fd6] bg-white"
                      />
                    </div>

                    <div className="space-y-3">
                      {filteredSchools.map((s) => {
                        const directLink = `${window.location.origin}/?school=${encodeURIComponent(s.access_code)}`;
                        return (
                          <div
                            key={s.id}
                            className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-outfit font-bold text-base text-slate-900">
                                  {s.name}
                                </h4>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  {s.contact_name ? `${s.contact_name} • ` : ''}
                                  {s.form_fields.length} dynamic fields • Code:{' '}
                                  <span className="font-mono font-bold text-slate-800">{s.access_code}</span>
                                </p>
                              </div>

                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-[#1f6fd6]">
                                Active
                              </span>
                            </div>

                            <div className="p-2 rounded-lg bg-slate-50 text-[11px] font-mono text-slate-600 truncate border border-slate-100 flex items-center justify-between">
                              <span className="truncate">{directLink}</span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              <button
                                onClick={async () => {
                                  await navigator.clipboard.writeText(directLink);
                                  alert('Teacher link copied to clipboard!');
                                }}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1"
                              >
                                <Share2 className="w-3.5 h-3.5 text-[#1f6fd6]" />
                                <span>Copy Link</span>
                              </button>

                              <a
                                href={`https://wa.me/?text=${encodeURIComponent(
                                  `Hi Teacher, here is the link to submit student ID card requests for ${s.name}: ${directLink} (Access Code: ${s.access_code})`
                                )}`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1.5 rounded-lg bg-[#22c35e]/10 text-[#22c35e] hover:bg-[#22c35e]/20 text-xs font-bold flex items-center gap-1"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>WhatsApp Link</span>
                              </a>

                              <button
                                onClick={() => setEditingSchool(s)}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>

                              <button
                                onClick={() => handleDeleteSchool(s.id, s.name)}
                                className="px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 text-xs font-semibold ml-auto flex items-center gap-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Subtab 2: Requests Pipeline */}
              {activeSubTab === 'requests' && (
                <div className="space-y-4">
                  {/* Filter Toolbar */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
                    <div className="flex-1 min-w-[200px] relative">
                      <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search student, school, or job ID..."
                        value={reqSearch}
                        onChange={(e) => setReqSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#1f6fd6]"
                      />
                    </div>

                    <select
                      value={filterSchool}
                      onChange={(e) => setFilterSchool(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700"
                    >
                      <option value="">All Schools</option>
                      {schools.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>

                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700"
                    >
                      <option value="">All Statuses</option>
                      <option value="Received">Received</option>
                      <option value="In Design">In Design</option>
                      <option value="Under Printing">Under Printing</option>
                      <option value="Printed">Printed</option>
                      <option value="Delivered">Delivered</option>
                    </select>

                    <select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value as any)}
                      className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                    </select>

                    <button
                      onClick={handleExportCSV}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 ml-auto"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export CSV</span>
                    </button>
                  </div>

                  {/* Bulk Action Bar */}
                  {selectedReqIds.length > 0 && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs font-semibold text-blue-900">
                      <span>{selectedReqIds.length} requests selected</span>
                      <div className="flex items-center gap-2">
                        <select
                          value={bulkStatus}
                          onChange={(e) => setBulkStatus(e.target.value as any)}
                          className="px-2 py-1 rounded bg-white border border-blue-200 text-xs"
                        >
                          <option value="">Set status to...</option>
                          <option value="Received">Received</option>
                          <option value="Under Printing">Under Printing</option>
                          <option value="Printed">Printed</option>
                          <option value="Delivered">Delivered</option>
                        </select>
                        <button
                          onClick={handleApplyBulkStatus}
                          className="px-3 py-1 rounded bg-[#1f6fd6] text-white text-xs font-bold"
                        >
                          Apply Status
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Requests Grid / Cards */}
                  {filteredRequests.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                      <p className="text-slate-500 text-sm">No student requests match your filters.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredRequests.map((req) => (
                        <div
                          key={req.id}
                          className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex gap-4 items-start relative hover:border-slate-300 transition-all"
                        >
                          {/* Selection Checkbox */}
                          <input
                            type="checkbox"
                            checked={selectedReqIds.includes(req.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedReqIds([...selectedReqIds, req.id]);
                              } else {
                                setSelectedReqIds(selectedReqIds.filter((id) => id !== req.id));
                              }
                            }}
                            className="absolute top-4 right-4 rounded w-4 h-4 text-[#1f6fd6]"
                          />

                          {/* Student Photo */}
                          <div className="w-16 h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center">
                            {req.photo_data || req.photo_path ? (
                              <img
                                src={req.photo_data || req.photo_path}
                                alt={req.student_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-[10px] text-slate-400 text-center px-1">
                                No Photo
                              </span>
                            )}
                          </div>

                          {/* Student Info */}
                          <div className="flex-1 min-w-0 pr-6 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[11px] font-bold text-[#1f6fd6]">
                                {req.id}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                                {req.request_type}
                              </span>
                            </div>

                            <h4 className="font-outfit font-bold text-base text-slate-900 truncate">
                              {req.student_name}
                            </h4>
                            <p className="text-xs text-slate-500 font-medium">
                              {req.school_name || 'School'}
                            </p>

                            <div className="text-[11px] text-slate-600 pt-1 space-y-0.5">
                              {Object.entries(req.student_data || {})
                                .filter(([k]) => k !== 'Class Teacher name' && k !== 'Student name')
                                .slice(0, 3)
                                .map(([k, v]) => (
                                  <div key={k} className="truncate">
                                    <span className="text-slate-400 font-medium">{k}:</span> {v}
                                  </div>
                                ))}
                              {req.student_data?.['Class Teacher name'] && (
                                <div className="text-slate-500">
                                  <strong>Teacher:</strong> {req.student_data['Class Teacher name']}
                                </div>
                              )}
                              {req.notes && (
                                <div className="text-amber-700 italic truncate">
                                  <strong>Note:</strong> {req.notes}
                                </div>
                              )}
                            </div>

                            {/* Status and Action Buttons */}
                            <div className="pt-2 flex flex-wrap items-center gap-2">
                              <select
                                value={req.status}
                                onChange={(e) => handleStatusChange(req.id, e.target.value as RequestStatus)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold border focus:outline-none ${
                                  req.status === 'Received'
                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                    : req.status === 'Under Printing'
                                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                }`}
                              >
                                <option value="Received">Received</option>
                                <option value="In Design">In Design</option>
                                <option value="Under Printing">Under Printing</option>
                                <option value="Printed">Printed</option>
                                <option value="Delivered">Delivered</option>
                              </select>

                              {req.photo_data && (
                                <a
                                  href={req.photo_data}
                                  download={`Photo_${req.id}_${req.student_name.replace(/\s+/g, '_')}.png`}
                                  className="p-1 rounded text-slate-500 hover:text-[#1f6fd6]"
                                  title="Download Student Photo"
                                >
                                  <Download className="w-4 h-4" />
                                </a>
                              )}

                              <button
                                onClick={() => handleDeleteRequest(req.id)}
                                className="p-1 rounded text-slate-400 hover:text-red-600"
                                title="Delete Record"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* SECTION 2: SERVICES & CATALOG PRODUCTS */}
          {activeSection === 'servicescat' && (
            <div className="space-y-6">
              {/* Add New Service Form */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs">
                <h3 className="font-outfit font-bold text-base text-slate-900 mb-3">
                  Add Service Category
                </h3>
                <form onSubmit={handleAddService} className="flex flex-wrap items-center gap-3">
                  <input
                    type="text"
                    placeholder="Icon (e.g. 🖨️ / ☕ / 📦)"
                    value={newSvcIcon}
                    onChange={(e) => setNewSvcIcon(e.target.value)}
                    className="w-24 px-3 py-2 rounded-xl border border-slate-200 text-center text-sm"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Service Name (e.g. Sublimation & Gifts)"
                    value={newSvcName}
                    onChange={(e) => setNewSvcName(e.target.value)}
                    className="flex-1 min-w-[200px] px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#1f6fd6]"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#1f6fd6] hover:bg-[#1a5cb3] text-white text-xs font-bold shadow-xs"
                  >
                    Add Service
                  </button>
                </form>
                {svcMsg && <p className="text-xs text-emerald-600 mt-2">{svcMsg}</p>}
              </div>

              {/* Service Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {services.map((svc) => {
                  const svcProducts = products.filter((p) => p.service_id === svc.id);
                  return (
                    <div
                      key={svc.id}
                      className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{svc.icon || '🖨️'}</span>
                          <div>
                            <h4 className="font-outfit font-bold text-base text-slate-900">
                              {svc.name}
                            </h4>
                            <span className="text-xs text-slate-500">
                              {svcProducts.length} products listed
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleStartEditService(svc)}
                            className="text-slate-400 hover:text-[#1f6fd6] p-1.5 rounded-lg hover:bg-slate-50 transition-all"
                            title="Edit Service Name & Icon"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteService(svc.id, svc.name)}
                            className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-slate-50 transition-all"
                            title="Delete Service"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <button
                          onClick={() => setSelectedServiceForProducts(svc)}
                          className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
                        >
                          Manage Products ({svcProducts.length}) →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Edit Service Category Modal */}
              {editingService && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
                  <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#1f6fd6]">
                          Edit Service Category
                        </span>
                        <h3 className="font-outfit font-extrabold text-xl text-slate-900">
                          {editingService.name}
                        </h3>
                      </div>
                      <button
                        onClick={() => setEditingService(null)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200"
                      >
                        Cancel
                      </button>
                    </div>

                    <form onSubmit={handleSaveEditService} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Service Icon (Emoji)</label>
                        <input
                          type="text"
                          value={editSvcIcon}
                          onChange={(e) => setEditSvcIcon(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#1f6fd6]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Service Category Name</label>
                        <input
                          type="text"
                          required
                          value={editSvcName}
                          onChange={(e) => setEditSvcName(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#1f6fd6]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Description (Optional)</label>
                        <textarea
                          rows={2}
                          value={editSvcDesc}
                          onChange={(e) => setEditSvcDesc(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#1f6fd6]"
                        />
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setEditingService(null)}
                          className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-2.5 rounded-xl bg-[#1f6fd6] hover:bg-[#1a5cb3] text-white text-xs font-bold shadow-md shadow-blue-500/20"
                        >
                          Save Changes
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Products Management Modal */}
              {selectedServiceForProducts && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
                  <div className="w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl my-auto">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <span className="text-xs font-bold text-[#1f6fd6] uppercase tracking-wider">
                          CATEGORY CATALOG
                        </span>
                        <h3 className="font-outfit font-extrabold text-xl text-slate-900">
                          {selectedServiceForProducts.name}
                        </h3>
                      </div>
                      <button
                        onClick={() => setSelectedServiceForProducts(null)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200"
                      >
                        Close
                      </button>
                    </div>

                    {/* Add Product Form */}
                    <form onSubmit={handleAddProduct} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Add Product to this Category
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          required
                          placeholder="Product Title (e.g. Magic Mug)"
                          value={prodTitle}
                          onChange={(e) => setProdTitle(e.target.value)}
                          className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none"
                        />
                        <input
                          type="number"
                          placeholder="Rate in ₹ (optional)"
                          value={prodRate}
                          onChange={(e) => setProdRate(e.target.value)}
                          className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none"
                        />
                      </div>

                      <input
                        type="text"
                        placeholder="Description (e.g. 325ml glossy finish with full wrap print)"
                        value={prodDesc}
                        onChange={(e) => setProdDesc(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none"
                      />

                      <input
                        type="text"
                        placeholder="Photo URL (optional) or leave blank for default icon"
                        value={prodPhotoUrl}
                        onChange={(e) => setProdPhotoUrl(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none"
                      />

                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-xl bg-[#1f6fd6] text-white text-xs font-bold shadow-xs"
                      >
                        Add Product
                      </button>
                      {prodMsg && <p className="text-xs text-emerald-600 text-center">{prodMsg}</p>}
                    </form>

                    {/* Current Products List */}
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {products
                        .filter((p) => p.service_id === selectedServiceForProducts.id)
                        .map((prod) => (
                          <div
                            key={prod.id}
                            className="p-3 rounded-xl border border-slate-200 flex items-center justify-between bg-white text-xs"
                          >
                            <div className="flex-1 mr-3 min-w-0">
                              <div className="flex items-center gap-2">
                                <strong className="text-slate-900">{prod.title}</strong>
                                {prod.rate && <span className="text-[#1f6fd6] font-bold">₹{prod.rate}</span>}
                              </div>
                              {prod.description && (
                                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                  {prod.description}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => handleStartEditProduct(prod)}
                                className="text-slate-400 hover:text-[#1f6fd6] p-1.5 rounded-lg hover:bg-slate-100"
                                title="Edit Product Name, Description & Price"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(prod.id)}
                                className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50"
                                title="Delete Product"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Edit Product Modal */}
              {editingProduct && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
                  <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#1f6fd6]">
                          Edit Product
                        </span>
                        <h3 className="font-outfit font-extrabold text-xl text-slate-900">
                          {editingProduct.title}
                        </h3>
                      </div>
                      <button
                        onClick={() => setEditingProduct(null)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200"
                      >
                        Cancel
                      </button>
                    </div>

                    <form onSubmit={handleSaveEditProduct} className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Product Title / Name</label>
                        <input
                          type="text"
                          required
                          value={editProdTitle}
                          onChange={(e) => setEditProdTitle(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#1f6fd6]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Price Rate (₹)</label>
                        <input
                          type="number"
                          value={editProdRate}
                          onChange={(e) => setEditProdRate(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#1f6fd6]"
                          placeholder="e.g. 299"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Description / Specifications</label>
                        <textarea
                          rows={2}
                          value={editProdDesc}
                          onChange={(e) => setEditProdDesc(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#1f6fd6]"
                          placeholder="e.g. 350 GSM premium matte art card"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Photo Image URL (Optional)</label>
                        <input
                          type="text"
                          value={editProdPhoto}
                          onChange={(e) => setEditProdPhoto(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#1f6fd6]"
                          placeholder="https://..."
                        />
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setEditingProduct(null)}
                          className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-2.5 rounded-xl bg-[#1f6fd6] hover:bg-[#1a5cb3] text-white text-xs font-bold shadow-md shadow-blue-500/20"
                        >
                          Save Product
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SECTION: CALCULATOR PRICING ENGINE */}
          {activeSection === 'calculator' && (
            <div className="space-y-6">
              {/* Header Bar with Save & Reset buttons */}
              <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1f6fd6] flex items-center justify-center shrink-0">
                    <Calculator className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 tracking-wide">
                        Live Rate Control
                      </span>
                      <span className="text-xs text-slate-500 font-medium">Auto-syncs to Storefront</span>
                    </div>
                    <h3 className="font-outfit font-extrabold text-xl text-slate-900 mt-1">
                      Instant Print Price Calculator — Commercial Rates
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                      Configure base prices, material upgrades, and add-on surcharges for all 6 print products.
                      Saved changes take effect immediately on the customer price estimator and WhatsApp quotes.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={handleResetPricing}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-2 transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                    <span>Reset Defaults</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSavePricing}
                    disabled={isSavingPricing}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSavingPricing ? 'Saving Rates...' : 'Save Live Pricing'}</span>
                  </button>
                </div>
              </div>

              {/* Notification Toast Message */}
              {calcSaveMsg && (
                <div
                  className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-2.5 ${
                    calcSaveMsg.isError
                      ? 'bg-red-50 border-red-200 text-red-700'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  }`}
                >
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{calcSaveMsg.text}</span>
                </div>
              )}

              {/* Product Category Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
                {[
                  { id: 'wedding', key: 'wedding' as const, label: 'Wedding Cards', icon: '💌', count: '3 Tiers' },
                  { id: 'flex', key: 'flex' as const, label: 'Flex & Banners', icon: '📐', count: '4 Options' },
                  { id: 'cards', key: 'visitingCards' as const, label: 'Visiting Cards', icon: '💼', count: '3 Finishes' },
                  { id: 'certificates', key: 'certificates' as const, label: 'Certificates', icon: '📜', count: '3 Papers' },
                  { id: 'results', key: 'resultCards' as const, label: 'Result Cards', icon: '📊', count: '3 Formats' },
                  { id: 'idcards', key: 'idCards' as const, label: 'ID Cards', icon: '🪪', count: '3 Types' },
                ].map((tab) => {
                  const isActive = activeCalcTab === tab.id;
                  const customTitle = pricingState[tab.key]?.meta?.title;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveCalcTab(tab.id as any)}
                      className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                        isActive
                          ? 'bg-[#131c30] text-white border-[#131c30] shadow-md'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xl">{tab.icon}</span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {tab.count}
                        </span>
                      </div>
                      <div className="mt-2.5">
                        <div className="text-xs font-bold leading-tight truncate">{customTitle || tab.label}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Rate Editing Grid + Live Preview Box */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left (8 Cols): Input Controls for Active Category */}
                <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
                  {/* Category 1: Wedding Cards */}
                  {activeCalcTab === 'wedding' && (
                    <div className="space-y-6">
                      <div className="border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">💌</span>
                          <h4 className="font-outfit font-extrabold text-lg text-slate-900">
                            Wedding Card Options & Add-ons
                          </h4>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Edit the overarching category title, descriptions, option names, specs, and commercial rates for all 3 wedding tiers.
                        </p>
                      </div>

                      {/* Category Header Meta (Name & Description) */}
                      <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#1f6fd6] flex items-center gap-1.5">
                            <Tag className="w-3 h-3" /> Category Header & Info
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Category Title</label>
                            <input
                              type="text"
                              value={pricingState.wedding.meta?.title || ''}
                              onChange={(e) => updateCategoryMeta('wedding', { title: e.target.value })}
                              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 text-xs focus:outline-none focus:border-[#1f6fd6]"
                              placeholder="Wedding Cards (3 Tiers)"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Category Subtitle / Description</label>
                            <input
                              type="text"
                              value={pricingState.wedding.meta?.desc || ''}
                              onChange={(e) => updateCategoryMeta('wedding', { desc: e.target.value })}
                              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs focus:outline-none focus:border-[#1f6fd6]"
                              placeholder="Premium wedding card printing..."
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Option 1 */}
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                            Option 1
                          </span>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Option Name</label>
                            <input
                              type="text"
                              value={pricingState.wedding.standard.name}
                              onChange={(e) => updateOption('wedding', 'standard', { name: e.target.value })}
                              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 text-xs focus:outline-none focus:border-[#1f6fd6]"
                              placeholder="Standard Single Leaf"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Description / Specs</label>
                            <input
                              type="text"
                              value={pricingState.wedding.standard.desc}
                              onChange={(e) => updateOption('wedding', 'standard', { desc: e.target.value })}
                              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-[11px] focus:outline-none focus:border-[#1f6fd6]"
                              placeholder="Single Leaf Card (280 GSM)"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Price Rate</label>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-500">₹</span>
                              <input
                                type="number"
                                min="1"
                                value={pricingState.wedding.standard.rate}
                                onChange={(e) => updateOption('wedding', 'standard', { rate: Number(e.target.value) })}
                                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 text-xs focus:outline-none focus:border-[#1f6fd6]"
                              />
                              <span className="text-[11px] text-slate-500 whitespace-nowrap">/ card</span>
                            </div>
                          </div>
                        </div>

                        {/* Option 2 */}
                        <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200/70 space-y-3">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#1f6fd6] block">
                            Option 2
                          </span>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Option Name</label>
                            <input
                              type="text"
                              value={pricingState.wedding.classic.name}
                              onChange={(e) => updateOption('wedding', 'classic', { name: e.target.value })}
                              className="w-full px-2.5 py-1.5 rounded-xl border border-blue-200 bg-white font-bold text-slate-900 text-xs focus:outline-none focus:border-[#1f6fd6]"
                              placeholder="Classic Two-Fold"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Description / Specs</label>
                            <input
                              type="text"
                              value={pricingState.wedding.classic.desc}
                              onChange={(e) => updateOption('wedding', 'classic', { desc: e.target.value })}
                              className="w-full px-2.5 py-1.5 rounded-xl border border-blue-200 bg-white text-slate-600 text-[11px] focus:outline-none focus:border-[#1f6fd6]"
                              placeholder="Two-Fold Card + Envelope"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Price Rate</label>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-500">₹</span>
                              <input
                                type="number"
                                min="1"
                                value={pricingState.wedding.classic.rate}
                                onChange={(e) => updateOption('wedding', 'classic', { rate: Number(e.target.value) })}
                                className="w-full px-3 py-1.5 rounded-xl border border-blue-200 bg-white font-bold text-slate-900 text-xs focus:outline-none focus:border-[#1f6fd6]"
                              />
                              <span className="text-[11px] text-slate-500 whitespace-nowrap">/ card</span>
                            </div>
                          </div>
                        </div>

                        {/* Option 3 */}
                        <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/70 space-y-3">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 block">
                            Option 3
                          </span>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Option Name</label>
                            <input
                              type="text"
                              value={pricingState.wedding.luxury.name}
                              onChange={(e) => updateOption('wedding', 'luxury', { name: e.target.value })}
                              className="w-full px-2.5 py-1.5 rounded-xl border border-amber-200 bg-white font-bold text-slate-900 text-xs focus:outline-none focus:border-[#1f6fd6]"
                              placeholder="Luxury Royal Box"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Description / Specs</label>
                            <input
                              type="text"
                              value={pricingState.wedding.luxury.desc}
                              onChange={(e) => updateOption('wedding', 'luxury', { desc: e.target.value })}
                              className="w-full px-2.5 py-1.5 rounded-xl border border-amber-200 bg-white text-slate-600 text-[11px] focus:outline-none focus:border-[#1f6fd6]"
                              placeholder="Royal Box / Laser Acrylic"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Price Rate</label>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-500">₹</span>
                              <input
                                type="number"
                                min="1"
                                value={pricingState.wedding.luxury.rate}
                                onChange={(e) => updateOption('wedding', 'luxury', { rate: Number(e.target.value) })}
                                className="w-full px-3 py-1.5 rounded-xl border border-amber-200 bg-white font-bold text-slate-900 text-xs focus:outline-none focus:border-[#1f6fd6]"
                              />
                              <span className="text-[11px] text-slate-500 whitespace-nowrap">/ card</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Wedding Add-ons */}
                      <div className="pt-2 border-t border-slate-100">
                        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
                          Finishing Add-ons & Order Thresholds
                        </h5>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="p-3.5 rounded-xl border border-slate-200 space-y-2">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Addon 1 Name</label>
                            <input
                              type="text"
                              value={pricingState.wedding.goldFoilAddon.name}
                              onChange={(e) => updateAddon('wedding', 'goldFoilAddon', { name: e.target.value })}
                              className="w-full px-2 py-1 rounded-lg border border-slate-200 text-xs font-semibold"
                              placeholder="Gold Foil Stamping"
                            />
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Description</label>
                            <input
                              type="text"
                              value={pricingState.wedding.goldFoilAddon.desc || ''}
                              onChange={(e) => updateAddon('wedding', 'goldFoilAddon', { desc: e.target.value })}
                              className="w-full px-2 py-1 rounded-lg border border-slate-200 text-xs text-slate-600"
                              placeholder="Metallic gold foil embellishment"
                            />
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Price Rate</label>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-slate-400 font-bold">+₹</span>
                              <input
                                type="number"
                                min="0"
                                value={pricingState.wedding.goldFoilAddon.rate}
                                onChange={(e) => updateAddon('wedding', 'goldFoilAddon', { rate: Number(e.target.value) })}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold"
                              />
                              <span className="text-[10px] text-slate-400">/card</span>
                            </div>
                          </div>

                          <div className="p-3.5 rounded-xl border border-slate-200 space-y-2">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Addon 2 Name</label>
                            <input
                              type="text"
                              value={pricingState.wedding.waxSealAddon.name}
                              onChange={(e) => updateAddon('wedding', 'waxSealAddon', { name: e.target.value })}
                              className="w-full px-2 py-1 rounded-lg border border-slate-200 text-xs font-semibold"
                              placeholder="Custom Wax Seal"
                            />
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Description</label>
                            <input
                              type="text"
                              value={pricingState.wedding.waxSealAddon.desc || ''}
                              onChange={(e) => updateAddon('wedding', 'waxSealAddon', { desc: e.target.value })}
                              className="w-full px-2 py-1 rounded-lg border border-slate-200 text-xs text-slate-600"
                              placeholder="Handmade wax seal stamp"
                            />
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Price Rate</label>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-slate-400 font-bold">+₹</span>
                              <input
                                type="number"
                                min="0"
                                value={pricingState.wedding.waxSealAddon.rate}
                                onChange={(e) => updateAddon('wedding', 'waxSealAddon', { rate: Number(e.target.value) })}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold"
                              />
                              <span className="text-[10px] text-slate-400">/card</span>
                            </div>
                          </div>

                          <div className="p-3.5 rounded-xl border border-slate-200 space-y-2">
                            <label className="block text-[11px] font-semibold text-slate-600">
                              Minimum Order Quantity
                            </label>
                            <div className="flex items-center gap-1.5 pt-6">
                              <input
                                type="number"
                                min="10"
                                value={pricingState.wedding.minOrderQty}
                                onChange={(e) => updateThreshold('wedding', 'minOrderQty', Number(e.target.value))}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold"
                              />
                              <span className="text-[10px] text-slate-400">pcs</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Category 2: Flex & Banners (4 Options) */}
                  {activeCalcTab === 'flex' && (
                    <div className="space-y-6">
                      <div className="border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">📐</span>
                          <h4 className="font-outfit font-extrabold text-lg text-slate-900">
                            Flex & Banner Options & Rates (4 Options)
                          </h4>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Edit the overarching category title, descriptions, option names, GSM specs, and per-sq.ft rate for all 4 flex materials.
                        </p>
                      </div>

                      {/* Category Header Meta (Name & Description) */}
                      <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#1f6fd6] flex items-center gap-1.5">
                            <Tag className="w-3 h-3" /> Category Header & Info
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Category Title</label>
                            <input
                              type="text"
                              value={pricingState.flex.meta?.title || ''}
                              onChange={(e) => updateCategoryMeta('flex', { title: e.target.value })}
                              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 text-xs focus:outline-none focus:border-[#1f6fd6]"
                              placeholder="Flex & Banners (4 Options)"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Category Subtitle / Description</label>
                            <input
                              type="text"
                              value={pricingState.flex.meta?.desc || ''}
                              onChange={(e) => updateCategoryMeta('flex', { desc: e.target.value })}
                              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs focus:outline-none focus:border-[#1f6fd6]"
                              placeholder="High-resolution wide-format flex printing..."
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Flex Option 1 */}
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                            Option 1
                          </span>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-1">Option Name</label>
                            <input
                              type="text"
                              value={pricingState.flex.normal.name}
                              onChange={(e) => updateOption('flex', 'normal', { name: e.target.value })}
                              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 text-xs focus:outline-none focus:border-[#1f6fd6]"
                              placeholder="Normal Frontlit"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-1">Description / Specs</label>
                            <input
                              type="text"
                              value={pricingState.flex.normal.desc}
                              onChange={(e) => updateOption('flex', 'normal', { desc: e.target.value })}
                              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-[11px] focus:outline-none focus:border-[#1f6fd6]"
                              placeholder="Frontlit Flex (260 GSM)"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-1">Price Rate</label>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-500">₹</span>
                              <input
                                type="number"
                                min="1"
                                value={pricingState.flex.normal.rate}
                                onChange={(e) => updateOption('flex', 'normal', { rate: Number(e.target.value) })}
                                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 text-xs focus:outline-none focus:border-[#1f6fd6]"
                              />
                              <span className="text-[11px] text-slate-500 whitespace-nowrap">/ sq.ft</span>
                            </div>
                          </div>
                        </div>

                        {/* Flex Option 2 */}
                        <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200/70 space-y-3">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#1f6fd6] block">
                            Option 2
                          </span>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-1">Option Name</label>
                            <input
                              type="text"
                              value={pricingState.flex.star.name}
                              onChange={(e) => updateOption('flex', 'star', { name: e.target.value })}
                              className="w-full px-2.5 py-1.5 rounded-xl border border-blue-200 bg-white font-bold text-slate-900 text-xs focus:outline-none focus:border-[#1f6fd6]"
                              placeholder="Star Flex (Best Value)"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-1">Description / Specs</label>
                            <input
                              type="text"
                              value={pricingState.flex.star.desc}
                              onChange={(e) => updateOption('flex', 'star', { desc: e.target.value })}
                              className="w-full px-2.5 py-1.5 rounded-xl border border-blue-200 bg-white text-slate-600 text-[11px] focus:outline-none focus:border-[#1f6fd6]"
                              placeholder="Star Flex (320 GSM)"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-1">Price Rate</label>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-500">₹</span>
                              <input
                                type="number"
                                min="1"
                                value={pricingState.flex.star.rate}
                                onChange={(e) => updateOption('flex', 'star', { rate: Number(e.target.value) })}
                                className="w-full px-3 py-1.5 rounded-xl border border-blue-200 bg-white font-bold text-slate-900 text-xs focus:outline-none focus:border-[#1f6fd6]"
                              />
                              <span className="text-[11px] text-slate-500 whitespace-nowrap">/ sq.ft</span>
                            </div>
                          </div>
                        </div>

                        {/* Flex Option 3 */}
                        <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-200/70 space-y-3">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 block">
                            Option 3
                          </span>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-1">Option Name</label>
                            <input
                              type="text"
                              value={pricingState.flex.backlit.name}
                              onChange={(e) => updateOption('flex', 'backlit', { name: e.target.value })}
                              className="w-full px-2.5 py-1.5 rounded-xl border border-purple-200 bg-white font-bold text-slate-900 text-xs focus:outline-none focus:border-[#1f6fd6]"
                              placeholder="Backlit Glow Sign"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-1">Description / Specs</label>
                            <input
                              type="text"
                              value={pricingState.flex.backlit.desc}
                              onChange={(e) => updateOption('flex', 'backlit', { desc: e.target.value })}
                              className="w-full px-2.5 py-1.5 rounded-xl border border-purple-200 bg-white text-slate-600 text-[11px] focus:outline-none focus:border-[#1f6fd6]"
                              placeholder="Translucent (510 GSM)"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-1">Price Rate</label>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-500">₹</span>
                              <input
                                type="number"
                                min="1"
                                value={pricingState.flex.backlit.rate}
                                onChange={(e) => updateOption('flex', 'backlit', { rate: Number(e.target.value) })}
                                className="w-full px-3 py-1.5 rounded-xl border border-purple-200 bg-white font-bold text-slate-900 text-xs focus:outline-none focus:border-[#1f6fd6]"
                              />
                              <span className="text-[11px] text-slate-500 whitespace-nowrap">/ sq.ft</span>
                            </div>
                          </div>
                        </div>

                        {/* Flex Option 4 */}
                        <div className="p-4 rounded-2xl bg-slate-100 border border-slate-300 space-y-3">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700 block">
                            Option 4
                          </span>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-1">Option Name</label>
                            <input
                              type="text"
                              value={pricingState.flex.blackout.name}
                              onChange={(e) => updateOption('flex', 'blackout', { name: e.target.value })}
                              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900 text-xs focus:outline-none focus:border-[#1f6fd6]"
                              placeholder="Blackout Heavy Flex"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-1">Description / Specs</label>
                            <input
                              type="text"
                              value={pricingState.flex.blackout.desc}
                              onChange={(e) => updateOption('flex', 'blackout', { desc: e.target.value })}
                              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-600 text-[11px] focus:outline-none focus:border-[#1f6fd6]"
                              placeholder="100% Light Blockout"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-1">Price Rate</label>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-500">₹</span>
                              <input
                                type="number"
                                min="1"
                                value={pricingState.flex.blackout.rate}
                                onChange={(e) => updateOption('flex', 'blackout', { rate: Number(e.target.value) })}
                                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900 text-xs focus:outline-none focus:border-[#1f6fd6]"
                              />
                              <span className="text-[11px] text-slate-500 whitespace-nowrap">/ sq.ft</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Flex Finishing Add-ons */}
                      <div className="pt-2 border-t border-slate-100">
                        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
                          Grommets, Framing & Minimum Order
                        </h5>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="p-3.5 rounded-xl border border-slate-200 space-y-2">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Addon 1 Name</label>
                            <input
                              type="text"
                              value={pricingState.flex.eyeletCost.name}
                              onChange={(e) => updateAddon('flex', 'eyeletCost', { name: e.target.value })}
                              className="w-full px-2 py-1 rounded-lg border border-slate-200 text-xs font-semibold"
                              placeholder="Corner Metal Eyelets"
                            />
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Description</label>
                            <input
                              type="text"
                              value={pricingState.flex.eyeletCost.desc || ''}
                              onChange={(e) => updateAddon('flex', 'eyeletCost', { desc: e.target.value })}
                              className="w-full px-2 py-1 rounded-lg border border-slate-200 text-xs text-slate-600"
                              placeholder="Heavy-duty brass rings"
                            />
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Price Surcharge</label>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-slate-400 font-bold">+₹</span>
                              <input
                                type="number"
                                min="0"
                                value={pricingState.flex.eyeletCost.rate}
                                onChange={(e) => updateAddon('flex', 'eyeletCost', { rate: Number(e.target.value) })}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold"
                              />
                              <span className="text-[10px] text-slate-400">/banner</span>
                            </div>
                          </div>

                          <div className="p-3.5 rounded-xl border border-slate-200 space-y-2">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Addon 2 Name</label>
                            <input
                              type="text"
                              value={pricingState.flex.frameMountingSqft.name}
                              onChange={(e) => updateAddon('flex', 'frameMountingSqft', { name: e.target.value })}
                              className="w-full px-2 py-1 rounded-lg border border-slate-200 text-xs font-semibold"
                              placeholder="Wooden/Iron Frame"
                            />
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Description</label>
                            <input
                              type="text"
                              value={pricingState.flex.frameMountingSqft.desc || ''}
                              onChange={(e) => updateAddon('flex', 'frameMountingSqft', { desc: e.target.value })}
                              className="w-full px-2 py-1 rounded-lg border border-slate-200 text-xs text-slate-600"
                              placeholder="1-inch MS pipe or wooden frame"
                            />
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Price Surcharge</label>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-slate-400 font-bold">+₹</span>
                              <input
                                type="number"
                                min="0"
                                value={pricingState.flex.frameMountingSqft.rate}
                                onChange={(e) => updateAddon('flex', 'frameMountingSqft', { rate: Number(e.target.value) })}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold"
                              />
                              <span className="text-[10px] text-slate-400">/sq.ft</span>
                            </div>
                          </div>

                          <div className="p-3.5 rounded-xl border border-slate-200 space-y-2">
                            <label className="block text-[11px] font-semibold text-slate-600">
                              Minimum Order Billing
                            </label>
                            <div className="flex items-center gap-1.5 pt-6">
                              <span className="text-xs text-slate-400 font-bold">₹</span>
                              <input
                                type="number"
                                min="50"
                                value={pricingState.flex.minOrderAmount}
                                onChange={(e) => updateThreshold('flex', 'minOrderAmount', Number(e.target.value))}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold"
                              />
                              <span className="text-[10px] text-slate-400">min</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Category 3: Visiting Cards */}
                  {activeCalcTab === 'cards' && (
                    <div className="space-y-6">
                      <div className="border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">💼</span>
                          <h4 className="font-outfit font-extrabold text-lg text-slate-900">
                            Visiting Cards & Business Stationery
                          </h4>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Edit the overarching category title, descriptions, option names, cardstock specs, and bulk rates (per pack of 1000 cards).
                        </p>
                      </div>

                      {/* Category Header Meta (Name & Description) */}
                      <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#1f6fd6] flex items-center gap-1.5">
                            <Tag className="w-3 h-3" /> Category Header & Info
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Category Title</label>
                            <input
                              type="text"
                              value={pricingState.visitingCards.meta?.title || ''}
                              onChange={(e) => updateCategoryMeta('visitingCards', { title: e.target.value })}
                              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 text-xs focus:outline-none focus:border-[#1f6fd6]"
                              placeholder="Visiting Cards (3 Finishes)"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Category Subtitle / Description</label>
                            <input
                              type="text"
                              value={pricingState.visitingCards.meta?.desc || ''}
                              onChange={(e) => updateCategoryMeta('visitingCards', { desc: e.target.value })}
                              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs focus:outline-none focus:border-[#1f6fd6]"
                              placeholder="Premium business card printing with matte, velvet, and spot UV..."
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Option 1 */}
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                            Option 1
                          </span>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Finish Name</label>
                            <input
                              type="text"
                              value={pricingState.visitingCards.matte.name}
                              onChange={(e) => updateOption('visitingCards', 'matte', { name: e.target.value })}
                              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 text-xs focus:outline-none focus:border-[#1f6fd6]"
                              placeholder="Matte Finish"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Description / Specs</label>
                            <input
                              type="text"
                              value={pricingState.visitingCards.matte.desc}
                              onChange={(e) => updateOption('visitingCards', 'matte', { desc: e.target.value })}
                              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-[11px] focus:outline-none focus:border-[#1f6fd6]"
                              placeholder="300 GSM Art Card"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Rate (1000 cards)</label>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-500">₹</span>
                              <input
                                type="number"
                                min="100"
                                value={pricingState.visitingCards.matte.rate}
                                onChange={(e) => updateOption('visitingCards', 'matte', { rate: Number(e.target.value) })}
                                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 text-xs focus:outline-none focus:border-[#1f6fd6]"
                              />
                              <span className="text-[11px] text-slate-500 whitespace-nowrap">/ 1000 pcs</span>
                            </div>
                          </div>
                        </div>

                        {/* Option 2 */}
                        <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200/70 space-y-3">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#1f6fd6] block">
                            Option 2
                          </span>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Finish Name</label>
                            <input
                              type="text"
                              value={pricingState.visitingCards.velvet.name}
                              onChange={(e) => updateOption('visitingCards', 'velvet', { name: e.target.value })}
                              className="w-full px-2.5 py-1.5 rounded-xl border border-blue-200 bg-white font-bold text-slate-900 text-xs focus:outline-none focus:border-[#1f6fd6]"
                              placeholder="Velvet Touch (Top Seller)"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Description / Specs</label>
                            <input
                              type="text"
                              value={pricingState.visitingCards.velvet.desc}
                              onChange={(e) => updateOption('visitingCards', 'velvet', { desc: e.target.value })}
                              className="w-full px-2.5 py-1.5 rounded-xl border border-blue-200 bg-white text-slate-600 text-[11px] focus:outline-none focus:border-[#1f6fd6]"
                              placeholder="350 GSM Anti-Scratch"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Rate (1000 cards)</label>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-500">₹</span>
                              <input
                                type="number"
                                min="100"
                                value={pricingState.visitingCards.velvet.rate}
                                onChange={(e) => updateOption('visitingCards', 'velvet', { rate: Number(e.target.value) })}
                                className="w-full px-3 py-1.5 rounded-xl border border-blue-200 bg-white font-bold text-slate-900 text-xs focus:outline-none focus:border-[#1f6fd6]"
                              />
                              <span className="text-[11px] text-slate-500 whitespace-nowrap">/ 1000 pcs</span>
                            </div>
                          </div>
                        </div>

                        {/* Option 3 */}
                        <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/70 space-y-3">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 block">
                            Option 3
                          </span>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Finish Name</label>
                            <input
                              type="text"
                              value={pricingState.visitingCards.spotuv.name}
                              onChange={(e) => updateOption('visitingCards', 'spotuv', { name: e.target.value })}
                              className="w-full px-2.5 py-1.5 rounded-xl border border-amber-200 bg-white font-bold text-slate-900 text-xs focus:outline-none focus:border-[#1f6fd6]"
                              placeholder="Spot UV Premium"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Description / Specs</label>
                            <input
                              type="text"
                              value={pricingState.visitingCards.spotuv.desc}
                              onChange={(e) => updateOption('visitingCards', 'spotuv', { desc: e.target.value })}
                              className="w-full px-2.5 py-1.5 rounded-xl border border-amber-200 bg-white text-slate-600 text-[11px] focus:outline-none focus:border-[#1f6fd6]"
                              placeholder="400 GSM Embossed Gloss"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Rate (1000 cards)</label>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-500">₹</span>
                              <input
                                type="number"
                                min="100"
                                value={pricingState.visitingCards.spotuv.rate}
                                onChange={(e) => updateOption('visitingCards', 'spotuv', { rate: Number(e.target.value) })}
                                className="w-full px-3 py-1.5 rounded-xl border border-amber-200 bg-white font-bold text-slate-900 text-xs focus:outline-none focus:border-[#1f6fd6]"
                              />
                              <span className="text-[11px] text-slate-500 whitespace-nowrap">/ 1000 pcs</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="p-3.5 rounded-xl border border-slate-200 space-y-2">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Addon Name</label>
                            <input
                              type="text"
                              value={pricingState.visitingCards.doubleSideAddon.name}
                              onChange={(e) => updateAddon('visitingCards', 'doubleSideAddon', { name: e.target.value })}
                              className="w-full px-2 py-1 rounded-lg border border-slate-200 text-xs font-semibold"
                              placeholder="Double-Sided Printing"
                            />
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Description</label>
                            <input
                              type="text"
                              value={pricingState.visitingCards.doubleSideAddon.desc || ''}
                              onChange={(e) => updateAddon('visitingCards', 'doubleSideAddon', { desc: e.target.value })}
                              className="w-full px-2 py-1 rounded-lg border border-slate-200 text-xs text-slate-600"
                              placeholder="Full color front & back print"
                            />
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Price Surcharge</label>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-slate-400 font-bold">+₹</span>
                              <input
                                type="number"
                                min="0"
                                value={pricingState.visitingCards.doubleSideAddon.rate}
                                onChange={(e) => updateAddon('visitingCards', 'doubleSideAddon', { rate: Number(e.target.value) })}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold"
                              />
                              <span className="text-[10px] text-slate-400">/ 1000 cards</span>
                            </div>
                          </div>

                          <div className="p-3.5 rounded-xl border border-slate-200 space-y-2">
                            <label className="block text-[11px] font-semibold text-slate-600">
                              Minimum Order Quantity
                            </label>
                            <div className="flex items-center gap-1.5 pt-6">
                              <input
                                type="number"
                                min="100"
                                value={pricingState.visitingCards.minOrderQty}
                                onChange={(e) => updateThreshold('visitingCards', 'minOrderQty', Number(e.target.value))}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold"
                              />
                              <span className="text-[10px] text-slate-400">cards</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Category 4: Certificates */}
                  {activeCalcTab === 'certificates' && (
                    <div className="space-y-6">
                      <div className="border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">📜</span>
                          <h4 className="font-outfit font-extrabold text-lg text-slate-900">
                            Academic & Event Certificates
                          </h4>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Edit the overarching category title, descriptions, option names, paper specs, and rates for certificates and folders.
                        </p>
                      </div>

                      {/* Category Header Meta (Name & Description) */}
                      <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#1f6fd6] flex items-center gap-1.5">
                            <Tag className="w-3 h-3" /> Category Header & Info
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Category Title</label>
                            <input
                              type="text"
                              value={pricingState.certificates.meta?.title || ''}
                              onChange={(e) => updateCategoryMeta('certificates', { title: e.target.value })}
                              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 text-xs focus:outline-none focus:border-[#1f6fd6]"
                              placeholder="Certificates (3 Paper Options)"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Category Subtitle / Description</label>
                            <input
                              type="text"
                              value={pricingState.certificates.meta?.desc || ''}
                              onChange={(e) => updateCategoryMeta('certificates', { desc: e.target.value })}
                              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs focus:outline-none focus:border-[#1f6fd6]"
                              placeholder="Official certificates for schools, colleges, sports, and seminars..."
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Option 1 */}
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                            Option 1
                          </span>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Paper Type Name</label>
                            <input
                              type="text"
                              value={pricingState.certificates.standard.name}
                              onChange={(e) => updateOption('certificates', 'standard', { name: e.target.value })}
                              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 text-xs focus:outline-none focus:border-[#1f6fd6]"
                              placeholder="Standard Ivory"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Description / Specs</label>
                            <input
                              type="text"
                              value={pricingState.certificates.standard.desc}
                              onChange={(e) => updateOption('certificates', 'standard', { desc: e.target.value })}
                              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-[11px] focus:outline-none focus:border-[#1f6fd6]"
                              placeholder="300 GSM Smooth Ivory Paper"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Price Rate</label>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-500">₹</span>
                              <input
                                type="number"
                                min="1"
                                value={pricingState.certificates.standard.rate}
                                onChange={(e) => updateOption('certificates', 'standard', { rate: Number(e.target.value) })}
                                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 text-xs focus:outline-none focus:border-[#1f6fd6]"
                              />
                              <span className="text-[11px] text-slate-500 whitespace-nowrap">/ cert</span>
                            </div>
                          </div>
                        </div>

                        {/* Option 2 */}
                        <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/70 space-y-3">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 block">
                            Option 2
                          </span>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Paper Type Name</label>
                            <input
                              type="text"
                              value={pricingState.certificates.goldborder.name}
                              onChange={(e) => updateOption('certificates', 'goldborder', { name: e.target.value })}
                              className="w-full px-2.5 py-1.5 rounded-xl border border-amber-200 bg-white font-bold text-slate-900 text-xs focus:outline-none focus:border-[#1f6fd6]"
                              placeholder="Gold Border Foil"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Description / Specs</label>
                            <input
                              type="text"
                              value={pricingState.certificates.goldborder.desc}
                              onChange={(e) => updateOption('certificates', 'goldborder', { desc: e.target.value })}
                              className="w-full px-2.5 py-1.5 rounded-xl border border-amber-200 bg-white text-slate-600 text-[11px] focus:outline-none focus:border-[#1f6fd6]"
                              placeholder="Metallic Foil Border Embossed"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Price Rate</label>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-500">₹</span>
                              <input
                                type="number"
                                min="1"
                                value={pricingState.certificates.goldborder.rate}
                                onChange={(e) => updateOption('certificates', 'goldborder', { rate: Number(e.target.value) })}
                                className="w-full px-3 py-1.5 rounded-xl border border-amber-200 bg-white font-bold text-slate-900 text-xs focus:outline-none focus:border-[#1f6fd6]"
                              />
                              <span className="text-[11px] text-slate-500 whitespace-nowrap">/ cert</span>
                            </div>
                          </div>
                        </div>

                        {/* Option 3 */}
                        <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-200/70 space-y-3">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 block">
                            Option 3
                          </span>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Paper Type Name</label>
                            <input
                              type="text"
                              value={pricingState.certificates.parchment.name}
                              onChange={(e) => updateOption('certificates', 'parchment', { name: e.target.value })}
                              className="w-full px-2.5 py-1.5 rounded-xl border border-purple-200 bg-white font-bold text-slate-900 text-xs focus:outline-none focus:border-[#1f6fd6]"
                              placeholder="Royal Parchment"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Description / Specs</label>
                            <input
                              type="text"
                              value={pricingState.certificates.parchment.desc}
                              onChange={(e) => updateOption('certificates', 'parchment', { desc: e.target.value })}
                              className="w-full px-2.5 py-1.5 rounded-xl border border-purple-200 bg-white text-slate-600 text-[11px] focus:outline-none focus:border-[#1f6fd6]"
                              placeholder="Textured Linen Stock"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Price Rate</label>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-500">₹</span>
                              <input
                                type="number"
                                min="1"
                                value={pricingState.certificates.parchment.rate}
                                onChange={(e) => updateOption('certificates', 'parchment', { rate: Number(e.target.value) })}
                                className="w-full px-3 py-1.5 rounded-xl border border-purple-200 bg-white font-bold text-slate-900 text-xs focus:outline-none focus:border-[#1f6fd6]"
                              />
                              <span className="text-[11px] text-slate-500 whitespace-nowrap">/ cert</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="p-3.5 rounded-xl border border-slate-200 space-y-2">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Addon 1 Name</label>
                            <input
                              type="text"
                              value={pricingState.certificates.laminationAddon.name}
                              onChange={(e) => updateAddon('certificates', 'laminationAddon', { name: e.target.value })}
                              className="w-full px-2 py-1 rounded-lg border border-slate-200 text-xs font-semibold"
                              placeholder="Thermal Lamination"
                            />
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Description</label>
                            <input
                              type="text"
                              value={pricingState.certificates.laminationAddon.desc || ''}
                              onChange={(e) => updateAddon('certificates', 'laminationAddon', { desc: e.target.value })}
                              className="w-full px-2 py-1 rounded-lg border border-slate-200 text-xs text-slate-600"
                              placeholder="Gloss or matte film coating"
                            />
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Price Surcharge</label>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-slate-400 font-bold">+₹</span>
                              <input
                                type="number"
                                min="0"
                                value={pricingState.certificates.laminationAddon.rate}
                                onChange={(e) => updateAddon('certificates', 'laminationAddon', { rate: Number(e.target.value) })}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold"
                              />
                              <span className="text-[10px] text-slate-400">/cert</span>
                            </div>
                          </div>

                          <div className="p-3.5 rounded-xl border border-slate-200 space-y-2">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Addon 2 Name</label>
                            <input
                              type="text"
                              value={pricingState.certificates.presentationFolderAddon.name}
                              onChange={(e) => updateAddon('certificates', 'presentationFolderAddon', { name: e.target.value })}
                              className="w-full px-2 py-1 rounded-lg border border-slate-200 text-xs font-semibold"
                              placeholder="Deluxe Folder"
                            />
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Description</label>
                            <input
                              type="text"
                              value={pricingState.certificates.presentationFolderAddon.desc || ''}
                              onChange={(e) => updateAddon('certificates', 'presentationFolderAddon', { desc: e.target.value })}
                              className="w-full px-2 py-1 rounded-lg border border-slate-200 text-xs text-slate-600"
                              placeholder="Gold embossed hardbound folder"
                            />
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Price Surcharge</label>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-slate-400 font-bold">+₹</span>
                              <input
                                type="number"
                                min="0"
                                value={pricingState.certificates.presentationFolderAddon.rate}
                                onChange={(e) => updateAddon('certificates', 'presentationFolderAddon', { rate: Number(e.target.value) })}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold"
                              />
                              <span className="text-[10px] text-slate-400">/folder</span>
                            </div>
                          </div>

                          <div className="p-3.5 rounded-xl border border-slate-200 space-y-2">
                            <label className="block text-[11px] font-semibold text-slate-600">
                              Minimum Order Qty
                            </label>
                            <div className="flex items-center gap-1.5 pt-6">
                              <input
                                type="number"
                                min="5"
                                value={pricingState.certificates.minOrderQty}
                                onChange={(e) => updateThreshold('certificates', 'minOrderQty', Number(e.target.value))}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold"
                              />
                              <span className="text-[10px] text-slate-400">certs</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Category 5: Result Cards */}
                  {activeCalcTab === 'results' && (
                    <div className="space-y-6">
                      <div className="border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">📊</span>
                          <h4 className="font-outfit font-extrabold text-lg text-slate-900">
                            Result Cards & School Marksheets
                          </h4>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Edit the overarching category title, descriptions, option names, format specs, and rates for academic report cards and hologram stamps.
                        </p>
                      </div>

                      {/* Category Header Meta (Name & Description) */}
                      <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#1f6fd6] flex items-center gap-1.5">
                            <Tag className="w-3 h-3" /> Category Header & Info
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Category Title</label>
                            <input
                              type="text"
                              value={pricingState.resultCards.meta?.title || ''}
                              onChange={(e) => updateCategoryMeta('resultCards', { title: e.target.value })}
                              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 text-xs focus:outline-none focus:border-[#1f6fd6]"
                              placeholder="Result Cards (3 Formats)"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Category Subtitle / Description</label>
                            <input
                              type="text"
                              value={pricingState.resultCards.meta?.desc || ''}
                              onChange={(e) => updateCategoryMeta('resultCards', { desc: e.target.value })}
                              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs focus:outline-none focus:border-[#1f6fd6]"
                              placeholder="School & college marksheets, grade cards, and performance report printings..."
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Option 1 */}
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                            Option 1
                          </span>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Format Name</label>
                            <input
                              type="text"
                              value={pricingState.resultCards.single.name}
                              onChange={(e) => updateOption('resultCards', 'single', { name: e.target.value })}
                              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 text-xs focus:outline-none focus:border-[#1f6fd6]"
                              placeholder="Single Sheet"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Description / Specs</label>
                            <input
                              type="text"
                              value={pricingState.resultCards.single.desc}
                              onChange={(e) => updateOption('resultCards', 'single', { desc: e.target.value })}
                              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-[11px] focus:outline-none focus:border-[#1f6fd6]"
                              placeholder="250 GSM Security Bond"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Price Rate</label>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-500">₹</span>
                              <input
                                type="number"
                                min="1"
                                value={pricingState.resultCards.single.rate}
                                onChange={(e) => updateOption('resultCards', 'single', { rate: Number(e.target.value) })}
                                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 text-xs focus:outline-none focus:border-[#1f6fd6]"
                              />
                              <span className="text-[11px] text-slate-500 whitespace-nowrap">/ card</span>
                            </div>
                          </div>
                        </div>

                        {/* Option 2 */}
                        <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200/70 space-y-3">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#1f6fd6] block">
                            Option 2
                          </span>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Format Name</label>
                            <input
                              type="text"
                              value={pricingState.resultCards.bifold.name}
                              onChange={(e) => updateOption('resultCards', 'bifold', { name: e.target.value })}
                              className="w-full px-2.5 py-1.5 rounded-xl border border-blue-200 bg-white font-bold text-slate-900 text-xs focus:outline-none focus:border-[#1f6fd6]"
                              placeholder="Bi-Fold Marksheet"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Description / Specs</label>
                            <input
                              type="text"
                              value={pricingState.resultCards.bifold.desc}
                              onChange={(e) => updateOption('resultCards', 'bifold', { desc: e.target.value })}
                              className="w-full px-2.5 py-1.5 rounded-xl border border-blue-200 bg-white text-slate-600 text-[11px] focus:outline-none focus:border-[#1f6fd6]"
                              placeholder="300 GSM Folding Card"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Price Rate</label>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-500">₹</span>
                              <input
                                type="number"
                                min="1"
                                value={pricingState.resultCards.bifold.rate}
                                onChange={(e) => updateOption('resultCards', 'bifold', { rate: Number(e.target.value) })}
                                className="w-full px-3 py-1.5 rounded-xl border border-blue-200 bg-white font-bold text-slate-900 text-xs focus:outline-none focus:border-[#1f6fd6]"
                              />
                              <span className="text-[11px] text-slate-500 whitespace-nowrap">/ card</span>
                            </div>
                          </div>
                        </div>

                        {/* Option 3 */}
                        <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/70 space-y-3">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 block">
                            Option 3
                          </span>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Format Name</label>
                            <input
                              type="text"
                              value={pricingState.resultCards.laminated.name}
                              onChange={(e) => updateOption('resultCards', 'laminated', { name: e.target.value })}
                              className="w-full px-2.5 py-1.5 rounded-xl border border-emerald-200 bg-white font-bold text-slate-900 text-xs focus:outline-none focus:border-[#1f6fd6]"
                              placeholder="Laminated Marksheet"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Description / Specs</label>
                            <input
                              type="text"
                              value={pricingState.resultCards.laminated.desc}
                              onChange={(e) => updateOption('resultCards', 'laminated', { desc: e.target.value })}
                              className="w-full px-2.5 py-1.5 rounded-xl border border-emerald-200 bg-white text-slate-600 text-[11px] focus:outline-none focus:border-[#1f6fd6]"
                              placeholder="Tamper-Proof Heavy Seal"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Price Rate</label>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-500">₹</span>
                              <input
                                type="number"
                                min="1"
                                value={pricingState.resultCards.laminated.rate}
                                onChange={(e) => updateOption('resultCards', 'laminated', { rate: Number(e.target.value) })}
                                className="w-full px-3 py-1.5 rounded-xl border border-emerald-200 bg-white font-bold text-slate-900 text-xs focus:outline-none focus:border-[#1f6fd6]"
                              />
                              <span className="text-[11px] text-slate-500 whitespace-nowrap">/ card</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="p-3.5 rounded-xl border border-slate-200 space-y-2">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Addon 1 Name</label>
                            <input
                              type="text"
                              value={pricingState.resultCards.hologramAddon.name}
                              onChange={(e) => updateAddon('resultCards', 'hologramAddon', { name: e.target.value })}
                              className="w-full px-2 py-1 rounded-lg border border-slate-200 text-xs font-semibold"
                              placeholder="Security Hologram Stamp"
                            />
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Description</label>
                            <input
                              type="text"
                              value={pricingState.resultCards.hologramAddon.desc || ''}
                              onChange={(e) => updateAddon('resultCards', 'hologramAddon', { desc: e.target.value })}
                              className="w-full px-2 py-1 rounded-lg border border-slate-200 text-xs text-slate-600"
                              placeholder="3D rainbow laser hologram sticker"
                            />
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Price Surcharge</label>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-slate-400 font-bold">+₹</span>
                              <input
                                type="number"
                                min="0"
                                value={pricingState.resultCards.hologramAddon.rate}
                                onChange={(e) => updateAddon('resultCards', 'hologramAddon', { rate: Number(e.target.value) })}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold"
                              />
                              <span className="text-[10px] text-slate-400">/card</span>
                            </div>
                          </div>

                          <div className="p-3.5 rounded-xl border border-slate-200 space-y-2">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Addon 2 Name</label>
                            <input
                              type="text"
                              value={pricingState.resultCards.protectiveSleeveAddon.name}
                              onChange={(e) => updateAddon('resultCards', 'protectiveSleeveAddon', { name: e.target.value })}
                              className="w-full px-2 py-1 rounded-lg border border-slate-200 text-xs font-semibold"
                              placeholder="Clear Protective Sleeve"
                            />
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Description</label>
                            <input
                              type="text"
                              value={pricingState.resultCards.protectiveSleeveAddon.desc || ''}
                              onChange={(e) => updateAddon('resultCards', 'protectiveSleeveAddon', { desc: e.target.value })}
                              className="w-full px-2 py-1 rounded-lg border border-slate-200 text-xs text-slate-600"
                              placeholder="Transparent PVC pouch envelope"
                            />
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Price Surcharge</label>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-slate-400 font-bold">+₹</span>
                              <input
                                type="number"
                                min="0"
                                value={pricingState.resultCards.protectiveSleeveAddon.rate}
                                onChange={(e) => updateAddon('resultCards', 'protectiveSleeveAddon', { rate: Number(e.target.value) })}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold"
                              />
                              <span className="text-[10px] text-slate-400">/sleeve</span>
                            </div>
                          </div>

                          <div className="p-3.5 rounded-xl border border-slate-200 space-y-2">
                            <label className="block text-[11px] font-semibold text-slate-600">
                              Minimum Order Qty
                            </label>
                            <div className="flex items-center gap-1.5 pt-6">
                              <input
                                type="number"
                                min="10"
                                value={pricingState.resultCards.minOrderQty}
                                onChange={(e) => updateThreshold('resultCards', 'minOrderQty', Number(e.target.value))}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold"
                              />
                              <span className="text-[10px] text-slate-400">cards</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Category 6: ID Cards */}
                  {activeCalcTab === 'idcards' && (
                    <div className="space-y-6">
                      <div className="border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">🪪</span>
                          <h4 className="font-outfit font-extrabold text-lg text-slate-900">
                            Student & Staff ID Cards
                          </h4>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Edit the overarching category title, descriptions, card names, descriptions, and package rates for institutional PVC cards and smart tags.
                        </p>
                      </div>

                      {/* Category Header Meta (Name & Description) */}
                      <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#1f6fd6] flex items-center gap-1.5">
                            <Tag className="w-3 h-3" /> Category Header & Info
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Category Title</label>
                            <input
                              type="text"
                              value={pricingState.idCards.meta?.title || ''}
                              onChange={(e) => updateCategoryMeta('idCards', { title: e.target.value })}
                              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 text-xs focus:outline-none focus:border-[#1f6fd6]"
                              placeholder="ID Cards (3 Types)"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Category Subtitle / Description</label>
                            <input
                              type="text"
                              value={pricingState.idCards.meta?.desc || ''}
                              onChange={(e) => updateCategoryMeta('idCards', { desc: e.target.value })}
                              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs focus:outline-none focus:border-[#1f6fd6]"
                              placeholder="School, college, and corporate identity cards with lanyards..."
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Option 1 */}
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                            Option 1
                          </span>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Option Name</label>
                            <input
                              type="text"
                              value={pricingState.idCards.pvc.name}
                              onChange={(e) => updateOption('idCards', 'pvc', { name: e.target.value })}
                              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 text-xs focus:outline-none focus:border-[#1f6fd6]"
                              placeholder="PVC Digital Card"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Description / Specs</label>
                            <input
                              type="text"
                              value={pricingState.idCards.pvc.desc}
                              onChange={(e) => updateOption('idCards', 'pvc', { desc: e.target.value })}
                              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-[11px] focus:outline-none focus:border-[#1f6fd6]"
                              placeholder="High-Density Gloss PVC"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Price Rate</label>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-500">₹</span>
                              <input
                                type="number"
                                min="1"
                                value={pricingState.idCards.pvc.rate}
                                onChange={(e) => updateOption('idCards', 'pvc', { rate: Number(e.target.value) })}
                                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 text-xs focus:outline-none focus:border-[#1f6fd6]"
                              />
                              <span className="text-[11px] text-slate-500 whitespace-nowrap">/ card</span>
                            </div>
                          </div>
                        </div>

                        {/* Option 2 */}
                        <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200/70 space-y-3">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#1f6fd6] block">
                            Option 2
                          </span>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Option Name</label>
                            <input
                              type="text"
                              value={pricingState.idCards.combo.name}
                              onChange={(e) => updateOption('idCards', 'combo', { name: e.target.value })}
                              className="w-full px-2.5 py-1.5 rounded-xl border border-blue-200 bg-white font-bold text-slate-900 text-xs focus:outline-none focus:border-[#1f6fd6]"
                              placeholder="Full Combo Package"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Description / Specs</label>
                            <input
                              type="text"
                              value={pricingState.idCards.combo.desc}
                              onChange={(e) => updateOption('idCards', 'combo', { desc: e.target.value })}
                              className="w-full px-2.5 py-1.5 rounded-xl border border-blue-200 bg-white text-slate-600 text-[11px] focus:outline-none focus:border-[#1f6fd6]"
                              placeholder="Card + Satin Lanyard + Holder"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Price Rate</label>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-500">₹</span>
                              <input
                                type="number"
                                min="1"
                                value={pricingState.idCards.combo.rate}
                                onChange={(e) => updateOption('idCards', 'combo', { rate: Number(e.target.value) })}
                                className="w-full px-3 py-1.5 rounded-xl border border-blue-200 bg-white font-bold text-slate-900 text-xs focus:outline-none focus:border-[#1f6fd6]"
                              />
                              <span className="text-[11px] text-slate-500 whitespace-nowrap">/ combo</span>
                            </div>
                          </div>
                        </div>

                        {/* Option 3 */}
                        <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-200/70 space-y-3">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 block">
                            Option 3
                          </span>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Option Name</label>
                            <input
                              type="text"
                              value={pricingState.idCards.rfid.name}
                              onChange={(e) => updateOption('idCards', 'rfid', { name: e.target.value })}
                              className="w-full px-2.5 py-1.5 rounded-xl border border-purple-200 bg-white font-bold text-slate-900 text-xs focus:outline-none focus:border-[#1f6fd6]"
                              placeholder="RFID / NFC Smart Card"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Description / Specs</label>
                            <input
                              type="text"
                              value={pricingState.idCards.rfid.desc}
                              onChange={(e) => updateOption('idCards', 'rfid', { desc: e.target.value })}
                              className="w-full px-2.5 py-1.5 rounded-xl border border-purple-200 bg-white text-slate-600 text-[11px] focus:outline-none focus:border-[#1f6fd6]"
                              placeholder="Contactless Attendance Chip"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Price Rate</label>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-500">₹</span>
                              <input
                                type="number"
                                min="1"
                                value={pricingState.idCards.rfid.rate}
                                onChange={(e) => updateOption('idCards', 'rfid', { rate: Number(e.target.value) })}
                                className="w-full px-3 py-1.5 rounded-xl border border-purple-200 bg-white font-bold text-slate-900 text-xs focus:outline-none focus:border-[#1f6fd6]"
                              />
                              <span className="text-[11px] text-slate-500 whitespace-nowrap">/ card</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        <div className="p-3.5 rounded-xl border border-slate-200 space-y-2 max-w-xs">
                          <label className="block text-[11px] font-semibold text-slate-600">
                            Minimum Order Quantity
                          </label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="5"
                              value={pricingState.idCards.minOrderQty}
                              onChange={(e) => updateThreshold('idCards', 'minOrderQty', Number(e.target.value))}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold"
                            />
                            <span className="text-[10px] text-slate-400">cards</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right (4 Cols): Live Simulator & Synchronization Indicator */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                          Live Formula Simulator
                        </h4>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                        Active Rates
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      Instant estimate of how the customer calculator computes an order with the custom names & rates configured:
                    </p>

                    {/* Simulation based on current active tab */}
                    <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3 text-xs">
                      {activeCalcTab === 'wedding' && (
                        <>
                          <div className="font-bold text-slate-200">
                            Sample: 200 × {pricingState.wedding.classic.name}
                          </div>
                          <div className="space-y-1 text-slate-400 font-mono text-[11px]">
                            <div>Base: ₹{pricingState.wedding.classic.rate} / card</div>
                            <div>{pricingState.wedding.goldFoilAddon.name}: +₹{pricingState.wedding.goldFoilAddon.rate}</div>
                            <div>Unit Total: ₹{pricingState.wedding.classic.rate + pricingState.wedding.goldFoilAddon.rate} / card</div>
                          </div>
                          <div className="pt-2 border-t border-slate-700 flex justify-between items-center text-sm font-extrabold text-emerald-400">
                            <span>Estimated Total:</span>
                            <span>₹{((pricingState.wedding.classic.rate + pricingState.wedding.goldFoilAddon.rate) * 200).toLocaleString('en-IN')}</span>
                          </div>
                        </>
                      )}

                      {activeCalcTab === 'flex' && (
                        <>
                          <div className="font-bold text-slate-200">
                            Sample: 8ft × 3ft {pricingState.flex.star.name} (24 sq.ft)
                          </div>
                          <div className="space-y-1 text-slate-400 font-mono text-[11px]">
                            <div>Area: 24 sq.ft × ₹{pricingState.flex.star.rate}/sq.ft = ₹{24 * pricingState.flex.star.rate}</div>
                            <div>{pricingState.flex.eyeletCost.name}: +₹{pricingState.flex.eyeletCost.rate}</div>
                          </div>
                          <div className="pt-2 border-t border-slate-700 flex justify-between items-center text-sm font-extrabold text-emerald-400">
                            <span>Estimated Total:</span>
                            <span>₹{(24 * pricingState.flex.star.rate + pricingState.flex.eyeletCost.rate).toLocaleString('en-IN')}</span>
                          </div>
                        </>
                      )}

                      {activeCalcTab === 'cards' && (
                        <>
                          <div className="font-bold text-slate-200">
                            Sample: 1,000 × {pricingState.visitingCards.velvet.name}
                          </div>
                          <div className="space-y-1 text-slate-400 font-mono text-[11px]">
                            <div>Base 1000 cards: ₹{pricingState.visitingCards.velvet.rate}</div>
                            <div>{pricingState.visitingCards.doubleSideAddon.name}: +₹{pricingState.visitingCards.doubleSideAddon.rate}</div>
                          </div>
                          <div className="pt-2 border-t border-slate-700 flex justify-between items-center text-sm font-extrabold text-emerald-400">
                            <span>Estimated Total:</span>
                            <span>₹{(pricingState.visitingCards.velvet.rate + pricingState.visitingCards.doubleSideAddon.rate).toLocaleString('en-IN')}</span>
                          </div>
                        </>
                      )}

                      {activeCalcTab === 'certificates' && (
                        <>
                          <div className="font-bold text-slate-200">
                            Sample: 100 × {pricingState.certificates.goldborder.name}
                          </div>
                          <div className="space-y-1 text-slate-400 font-mono text-[11px]">
                            <div>Base: ₹{pricingState.certificates.goldborder.rate} / cert</div>
                            <div>{pricingState.certificates.laminationAddon.name}: +₹{pricingState.certificates.laminationAddon.rate}</div>
                          </div>
                          <div className="pt-2 border-t border-slate-700 flex justify-between items-center text-sm font-extrabold text-emerald-400">
                            <span>Estimated Total:</span>
                            <span>₹{((pricingState.certificates.goldborder.rate + pricingState.certificates.laminationAddon.rate) * 100).toLocaleString('en-IN')}</span>
                          </div>
                        </>
                      )}

                      {activeCalcTab === 'results' && (
                        <>
                          <div className="font-bold text-slate-200">
                            Sample: 250 × {pricingState.resultCards.bifold.name}
                          </div>
                          <div className="space-y-1 text-slate-400 font-mono text-[11px]">
                            <div>Base: ₹{pricingState.resultCards.bifold.rate} / card</div>
                            <div>{pricingState.resultCards.hologramAddon.name}: +₹{pricingState.resultCards.hologramAddon.rate}</div>
                          </div>
                          <div className="pt-2 border-t border-slate-700 flex justify-between items-center text-sm font-extrabold text-emerald-400">
                            <span>Estimated Total:</span>
                            <span>₹{((pricingState.resultCards.bifold.rate + pricingState.resultCards.hologramAddon.rate) * 250).toLocaleString('en-IN')}</span>
                          </div>
                        </>
                      )}

                      {activeCalcTab === 'idcards' && (
                        <>
                          <div className="font-bold text-slate-200">
                            Sample: 100 × {pricingState.idCards.combo.name}
                          </div>
                          <div className="space-y-1 text-slate-400 font-mono text-[11px]">
                            <div>Rate: ₹{pricingState.idCards.combo.rate} / combo</div>
                            <div>Quantity: 100 pcs</div>
                          </div>
                          <div className="pt-2 border-t border-slate-700 flex justify-between items-center text-sm font-extrabold text-emerald-400">
                            <span>Estimated Total:</span>
                            <span>₹{(pricingState.idCards.combo.rate * 100).toLocaleString('en-IN')}</span>
                          </div>
                        </>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleSavePricing}
                      disabled={isSavingPricing}
                      className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isSavingPricing ? 'Saving Rates...' : 'Save & Publish Rates'}</span>
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200/80 text-xs text-blue-900 space-y-2">
                    <h5 className="font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#1f6fd6]" />
                      <span>100% Fully Editable</span>
                    </h5>
                    <p className="text-[11px] text-blue-800 leading-relaxed">
                      You can edit the <strong>Option Name</strong>, <strong>Material Description</strong>, and <strong>Commercial Price Rate</strong> for all products. Customers using the Print Calculator will see your custom names and specifications immediately.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION: ADMIN PASSWORD & CUSTOM BRANDING */}
          {activeSection === 'security' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Panel 1: Change Password */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1f6fd6] flex items-center justify-center">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-outfit font-extrabold text-lg text-slate-900">
                        Admin Login Password
                      </h3>
                      <p className="text-xs text-slate-500">
                        Change the secret manager PIN used to sign into this Admin Portal.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleUpdatePassword} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Current Effective Password
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={savedCustomPin || 'aradmin2026 (Factory Default)'}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono text-slate-600 focus:outline-none cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        New Passcode / Password
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Enter minimum 4 characters"
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#1f6fd6]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Confirm New Passcode
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Re-type new passcode"
                        value={confirmPin}
                        onChange={(e) => setConfirmPin(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#1f6fd6]"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="showPass"
                        checked={showPassword}
                        onChange={(e) => setShowPassword(e.target.checked)}
                        className="rounded border-slate-300 text-[#1f6fd6]"
                      />
                      <label htmlFor="showPass" className="text-xs text-slate-600 cursor-pointer">
                        Show password in plaintext
                      </label>
                    </div>

                    {pinChangeMsg && (
                      <p
                        className={`text-xs p-3 rounded-xl border ${
                          pinChangeMsg.isError
                            ? 'bg-red-50 border-red-200 text-red-700'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        }`}
                      >
                        {pinChangeMsg.text}
                      </p>
                    )}

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="submit"
                        className="px-5 py-2.5 rounded-xl bg-[#131c30] hover:bg-[#1e2a47] text-white text-xs font-bold shadow-md transition-all"
                      >
                        Update Admin Password
                      </button>

                      {savedCustomPin && (
                        <button
                          type="button"
                          onClick={handleResetPasswordToDefault}
                          className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold"
                        >
                          Reset to Factory Default
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* Panel 2: Shop Logo Customization & Quick Access */}
                <div className="space-y-6">
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-outfit font-extrabold text-lg text-slate-900">
                          Shop Logo Customization
                        </h3>
                        <p className="text-xs text-slate-500">
                          Customize your brand logo across header, footer, and PDF vouchers.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <div className="p-2 rounded-xl bg-white border border-slate-200 shrink-0">
                        <Logo size="md" showText={false} />
                      </div>
                      <div className="text-xs">
                        <div className="font-bold text-slate-800">Current Active Logo</div>
                        <div className="text-slate-500 text-[11px] mt-0.5">
                          {customLogoUrl ? 'Custom Image Logo Applied' : 'Official CMYK Vector Triangle Logo'}
                        </div>
                      </div>
                    </div>

                    <form onSubmit={handleUpdateCustomLogo} className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Option A: Enter Image URL
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="url"
                            placeholder="https://example.com/logo.png"
                            value={logoInput}
                            onChange={(e) => setLogoInput(e.target.value)}
                            className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#1f6fd6]"
                          />
                          <button
                            type="submit"
                            className="px-4 py-2 rounded-xl bg-[#1f6fd6] hover:bg-[#1a5cb3] text-white text-xs font-bold"
                          >
                            Apply URL
                          </button>
                        </div>
                      </div>
                    </form>

                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-700">
                        Option B: Upload Image File (PNG / JPG / SVG)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUploadLogo}
                        className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-[#1f6fd6] hover:file:bg-blue-100 cursor-pointer"
                      />
                    </div>

                    {logoMsg && (
                      <p className="text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                        {logoMsg}
                      </p>
                    )}

                    {customLogoUrl && (
                      <button
                        type="button"
                        onClick={handleResetLogoToDefault}
                        className="text-xs text-slate-500 hover:text-slate-700 font-semibold underline"
                      >
                        Restore Official Geometric CMYK Logo
                      </button>
                    )}
                  </div>

                  {/* Panel 3: How to Access Admin Panel Cheatsheet */}
                  <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 space-y-2.5">
                    <h4 className="font-bold text-amber-950 flex items-center gap-1.5">
                      <span>🔑</span>
                      <span>How to Access Admin Panel</span>
                    </h4>
                    <ul className="space-y-1.5 text-[11px] list-disc pl-4 text-amber-900/90 leading-relaxed">
                      <li>
                        <strong>Top Header Button:</strong> Click the <span className="font-bold">Admin Panel</span> button in the navigation bar.
                      </li>
                      <li>
                        <strong>Website Footer:</strong> Click <span className="font-bold">Admin Portal (Staff Login)</span> in the footer navigation.
                      </li>
                      <li>
                        <strong>Keyboard Shortcut:</strong> Press <kbd className="px-1.5 py-0.5 rounded bg-white border border-amber-300 font-mono font-bold text-slate-800">Ctrl + Shift + A</kbd> from any page.
                      </li>
                      <li>
                        <strong>Direct URL:</strong> Append <code className="px-1 py-0.5 rounded bg-white border border-amber-300 font-mono font-bold text-slate-800">/?view=admin</code> to your website address.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeSection === 'system' && (
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-6">
              <div>
                <h3 className="font-outfit font-extrabold text-xl text-slate-900">
                  Supabase Cloud Database & Storage Sync
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Your project is configured with zero runtime credit dependencies. All orders, schools,
                  and product listings are automatically mirrored in browser storage and can sync directly
                  to your Supabase instance.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                  <div className="text-slate-500 font-medium">Supabase Project Endpoint:</div>
                  <div className="font-mono text-slate-800 break-all font-bold">
                    {SUPABASE_URL}
                  </div>
                  <div className="text-emerald-600 font-semibold pt-1">
                    ✓ Connected to Supabase client
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                  <div className="text-slate-500 font-medium">Offline Fallback Database:</div>
                  <div className="font-mono text-slate-800 font-bold">
                    Active (LocalStorage Mirroring)
                  </div>
                  <div className="text-slate-500">
                    {schools.length} Schools • {requests.length} Requests • {products.length} Products
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-2">
                <h4 className="font-bold">Database Tables Supported:</h4>
                <ul className="list-disc pl-5 space-y-1 text-[11px]">
                  <li>
                    <code>schools</code>: id, name, contact_name, access_code, form_fields
                  </li>
                  <li>
                    <code>id_card_requests</code>: id, school_id, student_name, student_data, notes, status, photo_path
                  </li>
                  <li>
                    <code>services</code>: id, name, icon
                  </li>
                  <li>
                    <code>products</code>: id, service_id, title, description, rate, photo_path
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit School Modal */}
      {editingSchool && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl my-auto">
            <h3 className="font-outfit font-extrabold text-xl text-slate-900">
              Edit School: {editingSchool.name}
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">School Name</label>
              <input
                type="text"
                value={editingSchool.name}
                onChange={(e) => setEditingSchool({ ...editingSchool, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Contact Person</label>
              <input
                type="text"
                value={editingSchool.contact_name || ''}
                onChange={(e) => setEditingSchool({ ...editingSchool, contact_name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Access Code</label>
              <input
                type="text"
                value={editingSchool.access_code}
                onChange={(e) => setEditingSchool({ ...editingSchool, access_code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono uppercase focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={() => setEditingSchool(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEditedSchool}
                className="px-5 py-2 rounded-xl bg-[#1f6fd6] text-white text-xs font-bold"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
