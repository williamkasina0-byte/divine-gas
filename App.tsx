import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ProductGrid } from './components/ProductGrid';
import { CartDrawer } from './components/CartDrawer';
import { SupportChat } from './components/SupportChat';
import { ProductModal } from './components/ProductModal';
import { TrackingOverlay } from './components/TrackingOverlay';
import { CoverageModal } from './components/CoverageModal';
import { LegalModal } from './components/LegalModal';
import { fetchProducts, saveProduct, deleteProduct, placeOrder } from './services/api';
import { GasProduct, OrderItem, OrderStatus } from './types';
import { RotateCcw, CheckCircle2, Phone, MessageSquare, Loader2, Save, MapPin, Clock, LogOut, User, Shield, Package, ShoppingBag } from 'lucide-react';
import { AuthModal } from './components/AuthModal';
import { CustomerDashboard } from './components/CustomerDashboard';
import { AdminPortal } from './components/AdminPortal';
import { fetchSettings } from './services/api';

const App: React.FC = () => {
  const [products, setProducts] = useState<GasProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [cart, setCart] = useState<OrderItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(() => {
    return localStorage.getItem('isEditMode') === 'true';
  });
  const [editingProduct, setEditingProduct] = useState<GasProduct | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCoverageOpen, setIsCoverageOpen] = useState(false);
  const [legalModal, setLegalModal] = useState<{ open: boolean; type: 'privacy' | 'terms' }>({ open: false, type: 'privacy' });
  const [activeOrder, setActiveOrder] = useState<any | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auth State
  const [user, setUser] = useState<any | null>(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error("Failed to parse user from localStorage", e);
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [isAdmin, setIsAdmin] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      const u = saved ? JSON.parse(saved) : null;
      return u?.role?.toLowerCase() === 'admin';
    } catch (e) {
      return false;
    }
  });
  const [adminToken, setAdminToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [showDashboard, setShowDashboard] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [settings, setSettings] = useState<any>({
    site_name: 'DIVINE GAS',
    phone: '0795556620',
    whatsapp: '254795556620',
    operating_hours: 'Open Mon-Sun: 8am - 10pm',
    delivery_guarantee: 'Free 15-Min Delivery'
  });

  // Load Settings
  useEffect(() => {
    fetchSettings().then(setSettings).catch(console.error);
  }, []);

  // Sync session
  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');
  }, [user]);

  useEffect(() => {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
  }, [token]);

  useEffect(() => {
    localStorage.setItem('isEditMode', String(isEditMode));
  }, [isEditMode]);

  // Load Products from API
  const loadProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await fetchProducts();
      setProducts(data);
    } catch (error) {
      console.error("Failed to load products:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleLoginSuccess = (newToken: string, userData: any) => {
    console.log("--- DIVINE GAS AUTH DIAGNOSTICS ---");
    console.log("Login Success. User Data:", userData);
    setToken(newToken);
    setUser(userData);

    const roleString = (userData.role || '').toLowerCase().trim();
    const isUserAdmin = roleString === 'admin';

    console.log("Identified Role:", roleString);
    console.log("Admin Access Granted?", isUserAdmin);

    setIsAdmin(isUserAdmin);
    setAdminToken(newToken);
    if (isUserAdmin) {
      setIsEditMode(true);
      console.log("Switching to Admin Portal view...");
    }
    setAuthModalOpen(false);
    console.log("------------------------------------");
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    setIsAdmin(false);
    setAdminToken(null);
    setIsEditMode(false);
    setShowDashboard(false);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  useEffect(() => {
    (window as any).onAdminAddNew = () => {
      setEditingProduct(null);
      setIsModalOpen(true);
    };
    return () => { delete (window as any).onAdminAddNew; };
  }, []);

  const handleToggleEditMode = () => {
    if (isAdmin) {
      setIsEditMode(!isEditMode);
      setShowDashboard(false); // Hide customer dashboard when in admin mode
    } else {
      if (!user) {
        setAuthModalOpen(true);
      } else {
        alert("Access Denied: Admin rights required.");
      }
    }
  };

  const handleAddToCart = useCallback((product: GasProduct, type: 'refill' | 'new', finalPrice: number, note?: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id && item.purchaseType === type);
      if (existing) {
        return prev.map(item =>
          (item.id === product.id && item.purchaseType === type)
            ? { ...item, quantity: item.quantity + 1, note: note || item.note }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1, purchaseType: type, finalPrice, note }];
    });
    setIsCartOpen(true);
  }, []);

  const handleUpdateCartItem = useCallback((id: string, oldType: 'refill' | 'new', updates: Partial<OrderItem>) => {
    setCart(prev => {
      const newCart = prev.map(item => {
        if (item.id === id && item.purchaseType === oldType) {
          const updatedItem = { ...item, ...updates };

          if (updates.purchaseType) {
            updatedItem.finalPrice = updates.purchaseType === 'refill' ? item.price : item.price + item.deposit;
          }

          return updatedItem;
        }
        return item;
      });

      if (updates.purchaseType && updates.purchaseType !== oldType) {
        const mergedCart: OrderItem[] = [];
        newCart.forEach(item => {
          const duplicate = mergedCart.find(m => m.id === item.id && m.purchaseType === item.purchaseType);
          if (duplicate) {
            duplicate.quantity += item.quantity;
            duplicate.note = item.note || duplicate.note;
          } else {
            mergedCart.push(item);
          }
        });
        return mergedCart;
      }

      return newCart;
    });
  }, []);

  const handleRemoveFromCart = useCallback((id: string, type: 'refill' | 'new') => {
    setCart(prev => prev.filter(item => !(item.id === id && item.purchaseType === type)));
  }, []);

  const handleCheckout = useCallback(async (details: any) => {
    const orderData = {
      id: Math.random().toString(36).substr(2, 9),
      items: cart.map(item => ({
        id: item.id,
        quantity: item.quantity,
        finalPrice: item.finalPrice,
        purchaseType: item.purchaseType
      })),
      total: cart.reduce((sum, item) => sum + (item.finalPrice * item.quantity), 0),
      userId: user?.id, // Link to user
      status: OrderStatus.PENDING,
      ...details
    };

    try {
      if (details.paymentMethod === 'MPESA') {
        // 1. Trigger STK Push
        const paymentResult = await import('./services/api').then(m => m.payWithMpesa(details.phone, orderData.total, orderData.id));

        // 2. Check if initiation was successful (ResponseCode 0)
        if (paymentResult.ResponseCode !== '0') {
          throw new Error(paymentResult.CustomerMessage || 'Payment failed');
        }

        alert(`M-Pesa Prompt Sent! Please enter your PIN on your phone (${details.phone}).`);
        // In a real app, we would wait for callback here or poll status.
        // For now, we assume success if prompt is sent.
        orderData.status = 'PROCESSING'; // or PAID
      }

      // 3. Save Order
      const result = await placeOrder(orderData);
      if (result.success) {
        setActiveOrder({ ...orderData, id: result.orderId });
        setCart([]);
        setIsCartOpen(false);
      }
    } catch (error: any) {
      alert(`Checkout Failed: ${error.message || "Please try again"}`);
      console.error(error);
    }
  }, [cart]);

  const handleSaveProduct = useCallback(async (product: GasProduct) => {
    if (!adminToken) return;
    setSaveStatus('saving');
    try {
      await saveProduct(product, adminToken);
      setSaveStatus('saved');
      await loadProducts(); // Refresh list
      setTimeout(() => setSaveStatus('idle'), 2000);
      setIsModalOpen(false);
      setEditingProduct(null);
    } catch (error: any) {
      console.error("Failed to save product:", error);
      setSaveStatus('idle');
      alert(error.message || "Failed to save product");
    }
  }, [adminToken, loadProducts]);

  const handleDeleteProduct = useCallback(async (id: string) => {
    if (!adminToken || !window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await deleteProduct(id, adminToken);
      await loadProducts();
    } catch (error) {
      alert("Failed to delete product");
    }
  }, [adminToken, loadProducts]);

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-orange-200">
      {/* Admin Portal is now rendered in the main area to keep Navbar visible */}

      <div className="bg-slate-900 text-white py-2 px-4 flex items-center justify-center gap-6 overflow-hidden">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-green-500" />
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em]">{settings.operating_hours}</span>
        </div>
        <div className="h-4 w-px bg-slate-700 hidden sm:block"></div>
        <div className="flex items-center gap-4">
          <a href={`tel:${settings.phone}`} className="flex items-center gap-2 group">
            <Phone className="w-3.5 h-3.5 text-orange-500 group-hover:scale-110 transition-transform" />
            <span className="text-xs sm:text-sm font-bold tracking-tight">Call: {settings.phone}</span>
          </a>
          <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 group">
            <MessageSquare className="w-3.5 h-3.5 text-green-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs sm:text-sm font-bold tracking-tight">WhatsApp Order</span>
          </a>
        </div>
      </div>

      <Navbar
        cartCount={cart.reduce((s, i) => s + i.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
        isEditMode={isEditMode}
        onToggleEditMode={handleToggleEditMode}
        user={user}
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenDashboard={() => setShowDashboard(true)}
        onLogout={handleLogout}
        siteName={settings.site_name}
      />

      <main className="relative">
        {isAdmin && isEditMode ? (
          <AdminPortal
            token={token || ''}
            onExit={() => setIsEditMode(false)}
            products={products}
            onSaveProduct={handleSaveProduct}
            onDeleteProduct={handleDeleteProduct}
            onEditProduct={(p) => { setEditingProduct(p); setIsModalOpen(true); }}
            onAddNew={() => { setEditingProduct(null); setIsModalOpen(true); }}
            onSettingsUpdate={() => fetchSettings().then(setSettings)}
          />
        ) : showDashboard && user ? (
          <CustomerDashboard user={user} token={token || ''} onLogout={handleLogout} />
        ) : (
          <>
            <Hero
              onSimulateOrder={() => {
                if (cart.length > 0) {
                  handleCheckout({
                    name: "Demo Customer",
                    phone: "0795556620",
                    address: "Ruai Stage 26, Near Mall",
                    paymentMethod: "MPESA"
                  });
                } else {
                  alert("To see the tracking demo, please add a cylinder to your cart first! Karibu.");
                }
              }}
              onCheckCoverage={() => setIsCoverageOpen(true)}
            />

            {isLoading ? (
              <div className="py-20 flex justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
              </div>
            ) : (
              <ProductGrid
                products={products}
                onAddToCart={handleAddToCart}
                isEditMode={isEditMode}
                onEditProduct={(p) => { setEditingProduct(p); setIsModalOpen(true); }}
                onAddNew={() => { setEditingProduct(null); setIsModalOpen(true); }}
              />
            )}
          </>
        )}
      </main>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onRemove={handleRemoveFromCart}
        onUpdateItem={handleUpdateCartItem}
        onCheckout={handleCheckout}
        user={user}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingProduct(null); }}
        onSave={handleSaveProduct}
        product={editingProduct}
      />

      <CoverageModal isOpen={isCoverageOpen} onClose={() => setIsCoverageOpen(false)} />
      <LegalModal isOpen={legalModal.open} onClose={() => setLegalModal({ ...legalModal, open: false })} type={legalModal.type} />

      {/* AdminLoginModal replaced by AuthModal, but keeping code clean means removing it completely or leaving as legacy if needed. We removed usage. */}

      {activeOrder && (
        <TrackingOverlay order={activeOrder} onClose={() => setActiveOrder(null)} />
      )}

      <SupportChat />

      <footer className="py-24 bg-slate-900 text-slate-400">
        <div className="max-w-7xl mx-auto px-4">
          {/* Footer content unchanged */}
          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium">
            <p>© 2024 Divine Express Limited. All Rights Reserved.</p>
            <div className="flex gap-6">
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> ERC Certified</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> KEBS Standard</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
