/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { NavTab, Garment, Customer, TryOnResult, ShopSettings, ToastMessage, User, AIUsage, PaymentOrder } from './types';
import {
  loadGarments,
  saveGarments,
  loadCustomers,
  saveCustomers,
  loadTryOns,
  saveTryOns,
  loadSettings,
  saveSettings,
  loadAIUsage,
  saveAIUsage,
  isOnboardingCompleted,
  setOnboardingCompleted,
  resetToDemoData,
} from './services/storage';
import { authApi } from './api/auth';
import { shopApi } from './api/shop';
import { garmentsApi } from './api/garments';
import { customersApi } from './api/customers';
import { tryOnsApi } from './api/tryons';
import { paymentsApi } from './api/payments';
import { supabase, isSupabaseConfigured } from './lib/supabase';

// Layout Components
import { MobileHeader } from './components/layout/MobileHeader';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';

// View Components
import { DashboardView } from './components/views/DashboardView';
import { TrialRoomView } from './components/views/TrialRoomView';
import { GarmentsView } from './components/views/GarmentsView';
import { CustomersView } from './components/views/CustomersView';
import { HistoryView } from './components/views/HistoryView';
import { SettingsView } from './components/views/SettingsView';
import { UpgradeView } from './components/views/UpgradeView';
import { PaymentSuccessView } from './components/views/PaymentSuccessView';
import { PaymentFailedView } from './components/views/PaymentFailedView';
import { PaymentPendingView } from './components/views/PaymentPendingView';
import { CreditHistoryView } from './components/views/CreditHistoryView';

// Modal Components
import { AddGarmentModal } from './components/modals/AddGarmentModal';
import { EditGarmentModal } from './components/modals/EditGarmentModal';
import { AddCustomerModal } from './components/modals/AddCustomerModal';
import { EditCustomerModal } from './components/modals/EditCustomerModal';
import { ShopOnboardingModal } from './components/onboarding/ShopOnboardingModal';
import { LoginModal } from './components/auth/LoginModal';
import { AuthScreen } from './components/auth/AuthScreen';
import { Toast } from './components/common/Toast';
import { Sparkles, RefreshCw } from 'lucide-react';

// Legal & Compliance Pages
import {
  TermsPage,
  PrivacyPage,
  RefundPolicyPage,
  AiDisclaimerPage,
  PhotoConsentPage,
  CookiePolicyPage,
  DataDeletionPage,
  ContactSupportPage,
} from './components/legal';

export default function App() {
  // Navigation State - Default to dashboard
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [globalSearch, setGlobalSearch] = useState('');

  // Auth State
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Persistent States
  const [garments, setGarments] = useState<Garment[]>(() => loadGarments());
  const [customers, setCustomers] = useState<Customer[]>(() => loadCustomers());
  const [tryOns, setTryOns] = useState<TryOnResult[]>(() => loadTryOns());
  const [settings, setSettings] = useState<ShopSettings>(() => loadSettings());
  const [aiUsage, setAiUsage] = useState<AIUsage>(() => {
    if (isSupabaseConfigured()) {
      return {
        totalCredits: 0,
        usedCredits: 0,
        remainingCredits: 0,
        tryOnsToday: 0,
        lastResetDate: new Date().toISOString().split('T')[0],
      };
    }
    return loadAIUsage();
  });

  // Payment Order State
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [lastPaymentOrder, setLastPaymentOrder] = useState<PaymentOrder | null>(null);
  const [creditsGranted, setCreditsGranted] = useState<number>(0);
  const [paymentErrorMessage, setPaymentErrorMessage] = useState<string>('');

  // Onboarding & Auth Modals
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => !isOnboardingCompleted());
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);

  // Trial Room Selected Session Entities
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedGarment, setSelectedGarment] = useState<Garment | null>(null);

  // Modal Visibility States
  const [showAddGarment, setShowAddGarment] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [editingGarment, setEditingGarment] = useState<Garment | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (
    title: string,
    description?: string,
    type: 'success' | 'error' | 'info' | 'warning' = 'success'
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, title, description, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Sync states to local storage
  useEffect(() => {
    saveGarments(garments);
  }, [garments]);

  useEffect(() => {
    saveCustomers(customers);
  }, [customers]);

  useEffect(() => {
    saveTryOns(tryOns);
  }, [tryOns]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      saveAIUsage(aiUsage);
    }
  }, [aiUsage]);

  // Data refresher function
  const refreshShopData = useCallback(async () => {
    try {
      const [loadedSettings, loadedGarments, loadedCustomers, loadedTryOns, loadedUsage] =
        await Promise.all([
          shopApi.getShopSettings(),
          garmentsApi.getGarments(),
          customersApi.getCustomers(),
          tryOnsApi.getTryOns(),
          shopApi.getAIUsage(),
        ]);

      if (loadedSettings) setSettings(loadedSettings);
      if (loadedGarments && loadedGarments.length > 0) {
        setGarments(loadedGarments);
        setSelectedGarment((prev) => prev || loadedGarments[1] || loadedGarments[0]);
      }
      if (loadedCustomers && loadedCustomers.length > 0) {
        setCustomers(loadedCustomers);
        setSelectedCustomer((prev) => prev || loadedCustomers[0]);
      }
      if (loadedTryOns && loadedTryOns.length > 0) setTryOns(loadedTryOns);
      if (loadedUsage) setAiUsage(loadedUsage);
    } catch (err) {
      console.warn('Initial data load error:', err);
    }
  }, []);

  // Initial Auth verification and real-time state listener
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      setIsAuthLoading(true);
      try {
        const user = await authApi.getCurrentUser();
        if (!isMounted) return;

        if (user) {
          setCurrentUser(user);
          await refreshShopData();
        } else {
          setCurrentUser(null);
        }
      } catch (err) {
        console.warn('Auth check exception:', err);
        if (isMounted) setCurrentUser(null);
      } finally {
        if (isMounted) setIsAuthLoading(false);
      }
    }

    initAuth();

    // Subscribe to auth state changes from Supabase
    const { data: { subscription } } = authApi.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const user = await authApi.getCurrentUser();
        if (user && isMounted) {
          setCurrentUser(user);
          await refreshShopData();
        }
      } else if (event === 'SIGNED_OUT') {
        if (isMounted) {
          setCurrentUser(null);
          setSelectedCustomer(null);
          setSelectedGarment(null);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [refreshShopData]);

  // Realtime subscription for try_on_results status and record changes
  useEffect(() => {
    if (!currentUser || !isSupabaseConfigured()) return;

    const channel = supabase
      .channel('public:try_on_results_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'try_on_results' },
        async () => {
          try {
            const updated = await tryOnsApi.getTryOns();
            setTryOns(updated);
          } catch (e) {
            console.warn('Realtime tryon sync notice:', e);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  // Handlers for Onboarding
  const handleCompleteOnboarding = async (
    updatedSettings: ShopSettings,
    firstGarment?: Garment
  ) => {
    setSettings(updatedSettings);
    await shopApi.completeOnboarding(updatedSettings);

    if (firstGarment) {
      await garmentsApi.addGarment(firstGarment);
      setGarments([firstGarment, ...garments]);
      setSelectedGarment(firstGarment);
    }

    setOnboardingCompleted(true);
    setShowOnboarding(false);
    showToast(
      `Welcome to VestiAI, ${updatedSettings.shopName}!`,
      'Your AI Virtual Trial Room is ready.',
      'success'
    );
  };

  const handleSkipOnboarding = () => {
    setOnboardingCompleted(true);
    setShowOnboarding(false);
  };

  // Handlers for Auth
  const handleAuthSuccess = async (user: User) => {
    setCurrentUser(user);
    setShowLoginModal(false);
    await refreshShopData();
  };

  const handleLogout = async () => {
    await authApi.logout();
    setCurrentUser(null);
    setSelectedCustomer(null);
    setSelectedGarment(null);
    showToast('Signed Out', 'You have been signed out of your boutique session.', 'info');
  };

  // Handlers for Garments
  const handleSaveNewGarment = async (newGarment: Garment) => {
    try {
      const saved = await garmentsApi.addGarment(newGarment);
      const updated = [saved, ...garments.filter(g => g.id !== saved.id)];
      setGarments(updated);
      showToast(
        `Garment saved as ${newGarment.productId}`,
        `"${newGarment.name}" is now available in your trial room library.`,
        'success'
      );
    } catch {
      const updated = [newGarment, ...garments];
      setGarments(updated);
    }
  };

  const handleUpdateGarment = async (updatedGarment: Garment) => {
    try {
      const updatedItem = await garmentsApi.updateGarment(updatedGarment);
      const updated = garments.map((g) => (g.id === updatedItem.id ? updatedItem : g));
      setGarments(updated);
      if (selectedGarment?.id === updatedItem.id) {
        setSelectedGarment(updatedItem);
      }
      showToast('Garment Updated', `Changes to ${updatedItem.productId} saved.`, 'success');
    } catch {
      const updated = garments.map((g) => (g.id === updatedGarment.id ? updatedGarment : g));
      setGarments(updated);
    }
  };

  const handleDeleteGarment = async (id: string) => {
    const garmentToDelete = garments.find((g) => g.id === id);
    await garmentsApi.deleteGarment(id);
    const updated = garments.filter((g) => g.id !== id);
    setGarments(updated);
    if (selectedGarment?.id === id) {
      setSelectedGarment(null);
    }
    showToast('Garment Deleted', `Removed ${garmentToDelete?.productId || 'item'}.`, 'info');
  };

  // Handlers for Customers
  const handleSaveNewCustomer = async (newCustomer: Customer) => {
    try {
      const saved = await customersApi.addCustomer(newCustomer);
      const updated = [saved, ...customers.filter(c => c.id !== saved.id)];
      setCustomers(updated);
      setSelectedCustomer(saved);
      showToast(
        `Customer saved as ${newCustomer.customerId}`,
        `${newCustomer.name}'s photo is saved and selected for trial room.`,
        'success'
      );
    } catch {
      const updated = [newCustomer, ...customers];
      setCustomers(updated);
      setSelectedCustomer(newCustomer);
    }
  };

  const handleUpdateCustomer = async (updatedCustomer: Customer) => {
    try {
      const saved = await customersApi.updateCustomer(updatedCustomer);
      const updated = customers.map((c) => (c.id === saved.id ? saved : c));
      setCustomers(updated);
      if (selectedCustomer?.id === saved.id) {
        setSelectedCustomer(saved);
      }
      showToast('Customer Updated', `Profile ${saved.customerId} updated.`, 'success');
    } catch {
      const updated = customers.map((c) => (c.id === updatedCustomer.id ? updatedCustomer : c));
      setCustomers(updated);
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    const customerToDelete = customers.find((c) => c.id === id);
    await customersApi.deleteCustomer(id);
    const updated = customers.filter((c) => c.id !== id);
    setCustomers(updated);
    if (selectedCustomer?.id === id) {
      setSelectedCustomer(null);
    }
    showToast('Customer Deleted', `Profile ${customerToDelete?.customerId || 'customer'} deleted.`, 'info');
  };

  // Handlers for Try-On Results
  const handleSaveTryOnResult = async (result: TryOnResult) => {
    await tryOnsApi.saveTryOn(result);
    setTryOns((prev) => {
      const idx = prev.findIndex((t) => t.id === result.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = result;
        return next;
      }
      return [result, ...prev];
    });

    if (result.status === 'Completed') {
      setCustomers((prev) =>
        prev.map((c) => {
          if (c.id === result.customerId || c.customerId === result.customerId) {
            return { ...c, tryOnCount: (c.tryOnCount || 0) + 1 };
          }
          return c;
        })
      );

      setGarments((prev) =>
        prev.map((g) => {
          if (g.id === result.garmentId || g.productId === result.garmentProductId) {
            return { ...g, tryOnCount: (g.tryOnCount || 0) + 1 };
          }
          return g;
        })
      );
    }

    // Refresh AI usage state
    const usage = await shopApi.getAIUsage();
    setAiUsage(usage);
  };

  const handleRefreshUsage = useCallback(async () => {
    const usage = await shopApi.getAIUsage();
    setAiUsage(usage);
  }, []);

  const handleDeleteTryOn = async (id: string) => {
    await tryOnsApi.deleteTryOn(id);
    setTryOns((prev) => prev.filter((t) => t.id !== id));
  };

  const handleTopUpCredits = async () => {
    const updated = await shopApi.topUpCredits(50);
    setAiUsage(updated);
  };

  const handleOrderCreated = async (orderId: string) => {
    setCurrentOrderId(orderId);
    try {
      const ord = await paymentsApi.getOrder(orderId);
      if (ord) setLastPaymentOrder(ord);
    } catch (e) {
      console.warn('Failed to fetch order', e);
    }
  };

  const handlePaymentSuccess = async (orderId: string, credits: number) => {
    setCurrentOrderId(orderId);
    setCreditsGranted(credits);
    try {
      const ord = await paymentsApi.getOrder(orderId);
      if (ord) setLastPaymentOrder(ord);
    } catch (e) {
      console.warn('Failed to fetch order', e);
    }
    await handleRefreshUsage();
    showToast('Payment Successful', `+${credits} AI fitting credits added to your boutique account.`, 'success');
  };

  const handlePaymentFailed = async (orderId: string, reason: string) => {
    setCurrentOrderId(orderId);
    setPaymentErrorMessage(reason);
    try {
      const ord = await paymentsApi.getOrder(orderId);
      if (ord) setLastPaymentOrder(ord);
    } catch (e) {
      console.warn('Failed to fetch order', e);
    }
  };

  // Quick Action: Launch trial room with specific garment or customer
  const handleStartTryOn = (garment?: Garment, customer?: Customer) => {
    if (garment) setSelectedGarment(garment);
    if (customer) setSelectedCustomer(customer);
    setCurrentTab('trial-room');
  };

  // Retry a previous or failed Try-On session
  const handleRetryTryOn = (result: TryOnResult) => {
    const matchedCustomer = customers.find(
      (c) => c.id === result.customerId || c.customerId === result.customerId
    ) || {
      id: result.customerId,
      customerId: result.customerId,
      name: result.customerName,
      imageUrl: result.customerPhoto || '',
      phone: result.customerPhone || '+91 ',
      createdAt: new Date().toISOString(),
      tryOnCount: 1,
      consentAgreed: true,
    };

    const matchedGarment = garments.find(
      (g) => g.id === result.garmentId || g.productId === result.garmentProductId
    ) || {
      id: result.garmentId,
      productId: result.garmentProductId,
      name: result.garmentName,
      category: result.garmentCategory || 'Dresses',
      price: result.garmentPrice || 0,
      imageUrl: result.garmentPhoto || '',
      createdAt: new Date().toISOString(),
      tryOnCount: 1,
    };

    setSelectedCustomer(matchedCustomer);
    setSelectedGarment(matchedGarment);
    setCurrentTab('trial-room');
    showToast(
      'Trial Room Loaded',
      `Loaded ${matchedCustomer.name} and ${matchedGarment.productId} for fitting retry.`,
      'info'
    );
  };

  // Reset demo mock data
  const handleResetData = () => {
    const data = resetToDemoData();
    setGarments(data.garments);
    setCustomers(data.customers);
    setTryOns(data.tryOns);
    setSettings(data.settings);
    setAiUsage(data.usage);
    setSelectedCustomer(null);
    setSelectedGarment(null);
  };

  // 1. Initial Loading State
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-neutral-900 text-white flex flex-col items-center justify-center p-4 antialiased">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-3xl bg-emerald-600 flex items-center justify-center text-white shadow-xl shadow-emerald-600/30">
            <Sparkles className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <h2 className="font-display font-black text-2xl text-white tracking-tight">
              Vesti<span className="text-emerald-400">AI</span>
            </h2>
            <p className="text-xs text-neutral-400 mt-1 flex items-center justify-center gap-1.5 font-medium">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
              <span>Verifying boutique session...</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated State -> Render Full-Screen Auth Screen
  if (!currentUser) {
    return (
      <>
        <Toast toasts={toasts} onDismiss={removeToast} />
        <AuthScreen onAuthSuccess={handleAuthSuccess} onShowToast={showToast} />
      </>
    );
  }

  // 3. Authenticated State -> Render Full Dashboard
  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900 flex flex-col lg:flex-row antialiased font-sans selection:bg-emerald-500 selection:text-white">
      {/* Toast Notification Container */}
      <Toast toasts={toasts} onDismiss={removeToast} />

      {/* Desktop Sidebar (hidden on mobile) */}
      <Sidebar
        currentTab={currentTab}
        settings={settings}
        aiUsage={aiUsage}
        garmentCount={garments.length}
        customerCount={customers.length}
        tryOnCount={tryOns.length}
        onNavigate={setCurrentTab}
        onQuickTryOn={() => {
          setCurrentTab('trial-room');
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header (hidden on desktop) */}
        <MobileHeader
          settings={settings}
          currentTab={currentTab}
          onNavigate={setCurrentTab}
          onOpenSearch={() => setCurrentTab('garments')}
        />

        {/* Desktop Topbar (hidden on mobile) */}
        <Topbar
          settings={settings}
          aiUsage={aiUsage}
          searchQuery={globalSearch}
          onSearchChange={setGlobalSearch}
          onSearchSubmit={(q) => {
            const query = q.trim().toLowerCase();
            const matched = garments.find(
              (g) =>
                g.productId.toLowerCase() === query ||
                g.name.toLowerCase().includes(query)
            );
            if (matched) {
              setSelectedGarment(matched);
              setCurrentTab('trial-room');
            } else {
              setCurrentTab('garments');
            }
          }}
          onQuickAddGarment={() => setShowAddGarment(true)}
          onQuickAddCustomer={() => setShowAddCustomer(true)}
          onStartTryOn={() => setCurrentTab('trial-room')}
          onUpgradeCredits={() => setCurrentTab('upgrade')}
        />

        {/* Main View Router */}
        <main className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-6 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] lg:pb-10">
          {currentTab === 'dashboard' && (
            <DashboardView
              settings={settings}
              garments={garments}
              customers={customers}
              tryOns={tryOns}
              aiUsage={aiUsage}
              onStartTryOn={handleStartTryOn}
              onOpenAddGarment={() => setShowAddGarment(true)}
              onOpenAddCustomer={() => setShowAddCustomer(true)}
              onViewAllGarments={() => setCurrentTab('garments')}
              onViewAllCustomers={() => setCurrentTab('customers')}
              onViewAllHistory={() => setCurrentTab('history')}
              onViewTryOnResult={(_result) => {
                setCurrentTab('history');
              }}
            />
          )}

          {currentTab === 'trial-room' && (
            <TrialRoomView
              settings={settings}
              garments={garments}
              customers={customers}
              tryOns={tryOns}
              aiUsage={aiUsage}
              selectedCustomer={selectedCustomer}
              selectedGarment={selectedGarment}
              onSelectCustomer={setSelectedCustomer}
              onSelectGarment={setSelectedGarment}
              onSaveTryOnResult={handleSaveTryOnResult}
              onOpenAddGarment={() => setShowAddGarment(true)}
              onOpenAddCustomer={() => setShowAddCustomer(true)}
              onShowToast={showToast}
              onTopUpCredits={handleTopUpCredits}
              onRefreshUsage={handleRefreshUsage}
              onNavigateToHistory={() => setCurrentTab('history')}
              onNavigate={setCurrentTab}
            />
          )}

          {currentTab === 'garments' && (
            <GarmentsView
              garments={garments}
              currencySymbol={settings.currencySymbol}
              onStartTryOn={(g) => handleStartTryOn(g)}
              onOpenAddGarment={() => setShowAddGarment(true)}
              onEditGarment={(g) => setEditingGarment(g)}
              onDeleteGarment={handleDeleteGarment}
            />
          )}

          {currentTab === 'customers' && (
            <CustomersView
              customers={customers}
              history={tryOns}
              settings={settings}
              onStartTryOn={(c) => handleStartTryOn(undefined, c)}
              onOpenAddCustomer={() => setShowAddCustomer(true)}
              onEditCustomer={(c) => setEditingCustomer(c)}
              onDeleteCustomer={handleDeleteCustomer}
              onViewCustomerHistory={(_c) => {
                setCurrentTab('history');
              }}
              onOpenResult={(_res) => {
                setCurrentTab('history');
              }}
            />
          )}

          {currentTab === 'history' && (
            <HistoryView
              tryOns={tryOns}
              settings={settings}
              onDeleteTryOn={handleDeleteTryOn}
              onStartNewTryOn={() => setCurrentTab('trial-room')}
              onRetryTryOn={handleRetryTryOn}
              onShowToast={showToast}
            />
          )}

          {currentTab === 'upgrade' && (
            <UpgradeView
              settings={settings}
              aiUsage={aiUsage}
              currentUser={currentUser}
              onNavigate={setCurrentTab}
              onShowToast={showToast}
              onRefreshUsage={handleRefreshUsage}
              onOrderCreated={handleOrderCreated}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentFailed={handlePaymentFailed}
            />
          )}

          {currentTab === 'payment-success' && (
            <PaymentSuccessView
              order={lastPaymentOrder}
              creditsAdded={creditsGranted}
              aiUsage={aiUsage}
              settings={settings}
              onNavigate={setCurrentTab}
              onStartTryOn={() => setCurrentTab('trial-room')}
            />
          )}

          {currentTab === 'payment-failed' && (
            <PaymentFailedView
              order={lastPaymentOrder}
              errorMessage={paymentErrorMessage}
              onNavigate={setCurrentTab}
            />
          )}

          {currentTab === 'payment-pending' && (
            <PaymentPendingView
              orderId={currentOrderId}
              onNavigate={setCurrentTab}
              onShowToast={showToast}
              onRefreshUsage={handleRefreshUsage}
              onPaymentSuccess={handlePaymentSuccess}
            />
          )}

          {currentTab === 'credit-history' && (
            <CreditHistoryView
              aiUsage={aiUsage}
              onNavigate={setCurrentTab}
              onRefreshUsage={handleRefreshUsage}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              settings={settings}
              aiUsage={aiUsage}
              currentUser={currentUser}
              onUpdateSettings={setSettings}
              onResetData={handleResetData}
              onTopUpCredits={handleTopUpCredits}
              onLogout={handleLogout}
              onNavigate={setCurrentTab}
              onShowToast={showToast}
            />
          )}

          {/* Legal & Compliance Policy Pages */}
          {currentTab === 'terms' && (
            <TermsPage
              onNavigate={setCurrentTab}
              onBack={() => setCurrentTab('settings')}
            />
          )}

          {currentTab === 'privacy' && (
            <PrivacyPage
              onNavigate={setCurrentTab}
              onBack={() => setCurrentTab('settings')}
            />
          )}

          {currentTab === 'refund-policy' && (
            <RefundPolicyPage
              onNavigate={setCurrentTab}
              onBack={() => setCurrentTab('settings')}
            />
          )}

          {currentTab === 'ai-disclaimer' && (
            <AiDisclaimerPage
              onNavigate={setCurrentTab}
              onBack={() => setCurrentTab('settings')}
            />
          )}

          {currentTab === 'photo-consent' && (
            <PhotoConsentPage
              onNavigate={setCurrentTab}
              onBack={() => setCurrentTab('settings')}
            />
          )}

          {currentTab === 'cookie-policy' && (
            <CookiePolicyPage
              onNavigate={setCurrentTab}
              onBack={() => setCurrentTab('settings')}
            />
          )}

          {currentTab === 'data-deletion' && (
            <DataDeletionPage
              onNavigate={setCurrentTab}
              onBack={() => setCurrentTab('settings')}
            />
          )}

          {currentTab === 'contact-support' && (
            <ContactSupportPage
              onNavigate={setCurrentTab}
              onBack={() => setCurrentTab('settings')}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Fixed on mobile) */}
      <MobileBottomNav
        currentTab={currentTab}
        onNavigate={setCurrentTab}
        garmentCount={garments.length}
        customerCount={customers.length}
      />

      {/* First-Time Shop Onboarding Modal */}
      <ShopOnboardingModal
        isOpen={showOnboarding}
        settings={settings}
        onComplete={handleCompleteOnboarding}
        onSkip={handleSkipOnboarding}
      />

      {/* Shop Staff Login Modal (for fast re-auth or user switching) */}
      <LoginModal
        isOpen={showLoginModal}
        onSuccess={handleAuthSuccess}
        onClose={() => setShowLoginModal(false)}
        allowClose={true}
      />

      {/* Global Add & Edit Modals */}
      <AddGarmentModal
        isOpen={showAddGarment}
        garments={garments}
        settings={settings}
        onSaveGarment={handleSaveNewGarment}
        onClose={() => setShowAddGarment(false)}
      />

      <EditGarmentModal
        isOpen={Boolean(editingGarment)}
        garment={editingGarment}
        onUpdateGarment={handleUpdateGarment}
        onDeleteGarment={handleDeleteGarment}
        onClose={() => setEditingGarment(null)}
      />

      <AddCustomerModal
        isOpen={showAddCustomer}
        customers={customers}
        settings={settings}
        onSaveCustomer={handleSaveNewCustomer}
        onClose={() => setShowAddCustomer(false)}
      />

      <EditCustomerModal
        isOpen={Boolean(editingCustomer)}
        customer={editingCustomer}
        onUpdateCustomer={handleUpdateCustomer}
        onDeleteCustomer={handleDeleteCustomer}
        onClose={() => setEditingCustomer(null)}
      />
    </div>
  );
}
