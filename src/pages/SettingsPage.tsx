import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { authStorage } from '../utils/auth';
import { backendApi } from '../services/backendApi';
import {
  User,
  Store,
  CreditCard,
  Shield,
  Save,
  CheckCircle2,
  AlertCircle,
  Moon,
  Sun,
  Lock,
  ExternalLink,
  RefreshCw,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { isDarkMode, setTheme, subscribeThemeChange } from '../utils/theme';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'account' | 'restaurant' | 'subscription' | 'security'>('account');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // User and Restaurant state
  const currentUser = authStorage.getUser();
  const currentRestaurant = authStorage.getRestaurant();

  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [email] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');

  const [restaurantName, setRestaurantName] = useState(currentRestaurant?.name || '');
  const [businessType, setBusinessType] = useState(currentRestaurant?.businessType || 'Restaurant');
  const [city, setCity] = useState(currentRestaurant?.city || 'Pune');
  const [location, setLocation] = useState(currentRestaurant?.location || 'Main Location');
  const [contactEmail, setContactEmail] = useState(currentRestaurant?.contactEmail || currentUser?.email || '');
  const [description, setDescription] = useState(currentRestaurant?.description || '');

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Subscription state
  const [subStatus, setSubStatus] = useState<{
    hasActiveSubscription: boolean;
    subscription: any;
    isExpiringSoon?: boolean;
    daysUntilExpiry?: number;
  }>({ hasActiveSubscription: false, subscription: null });

  // Theme
  const [dark, setDark] = useState<boolean>(() => isDarkMode());

  useEffect(() => {
    const unsubscribe = subscribeThemeChange((isDark) => setDark(isDark));
    return unsubscribe;
  }, []);

  // Fetch fresh profile and subscription on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const meRes = await backendApi.getMe().catch(() => null);
        if (meRes?.user) {
          authStorage.setUser(meRes.user);
          setFullName(meRes.user.fullName || '');
        }
        if (meRes?.restaurant) {
          authStorage.setRestaurant(meRes.restaurant);
          setRestaurantName(meRes.restaurant.name || '');
          setBusinessType(meRes.restaurant.businessType || 'Restaurant');
          setCity(meRes.restaurant.city || 'Pune');
          setLocation(meRes.restaurant.location || 'Main Location');
          setContactEmail(meRes.restaurant.contactEmail || meRes.user?.email || '');
          setDescription(meRes.restaurant.description || '');
        }

        const subRes = await backendApi.getSubscriptionStatus().catch(() => null);
        if (subRes) {
          setSubStatus({
            hasActiveSubscription: subRes.hasActiveSubscription,
            subscription: subRes.subscription,
            isExpiringSoon: subRes.subscription?.isExpiringSoon,
            daysUntilExpiry: subRes.subscription?.daysUntilExpiry,
          });
        }
      } catch (e) {
        console.warn('Settings load error:', e);
      }
    };

    fetchData();
  }, []);

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setSuccessMsg(null);
    } else {
      setSuccessMsg(msg);
      setErrorMsg(null);
    }
    setTimeout(() => {
      setSuccessMsg(null);
      setErrorMsg(null);
    }, 4000);
  };

  // Save Account Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showNotification('Full name cannot be empty', true);
      return;
    }

    setLoading(true);
    try {
      const res = await backendApi.updateProfile({ fullName: fullName.trim(), phone });
      if (res.user) {
        authStorage.setUser(res.user);
      }
      showNotification('Account details updated successfully!');
    } catch (err: any) {
      // Local fallback
      if (currentUser) {
        const updated = { ...currentUser, fullName: fullName.trim(), phone };
        authStorage.setUser(updated);
      }
      showNotification(err?.message || 'Profile saved locally');
    } finally {
      setLoading(false);
    }
  };

  // Save Restaurant Profile
  const handleSaveRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantName.trim()) {
      showNotification('Restaurant name is required', true);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: restaurantName.trim(),
        businessType,
        city: city.trim(),
        location: location.trim(),
        contactEmail: contactEmail.trim(),
        description: description.trim(),
      };

      const res = await backendApi.updateRestaurantDetails(payload);
      if (res.restaurant) {
        authStorage.setRestaurant(res.restaurant);
      }
      showNotification('Restaurant details saved successfully!');
    } catch (err: any) {
      if (currentRestaurant) {
        const updated = {
          ...currentRestaurant,
          name: restaurantName.trim(),
          businessType,
          city: city.trim(),
          location: location.trim(),
          contactEmail: contactEmail.trim(),
          description: description.trim(),
        };
        authStorage.setRestaurant(updated);
      }
      showNotification('Restaurant profile updated');
    } finally {
      setLoading(false);
    }
  };

  // Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      showNotification('Please fill in both current and new password', true);
      return;
    }
    if (newPassword.length < 6) {
      showNotification('New password must be at least 6 characters long', true);
      return;
    }
    if (newPassword !== confirmPassword) {
      showNotification('New passwords do not match', true);
      return;
    }

    setLoading(true);
    try {
      await backendApi.changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showNotification('Password updated successfully!');
    } catch (err: any) {
      showNotification(err?.message || 'Failed to update password', true);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authStorage.logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Sidebar restaurantName={currentRestaurant?.name || 'SellSense'} />

      <main className="flex-1 p-6 md:p-10 max-w-5xl mx-auto w-full">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Account & System Settings
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Manage your personal profile, restaurant identity, subscription access, and security preferences.
          </p>
        </div>

        {/* Success / Error Notification Banner */}
        {successMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm font-semibold flex items-center gap-2.5 animate-fade-in">
            <CheckCircle2 size={18} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-sm font-semibold flex items-center gap-2.5 animate-fade-in">
            <AlertCircle size={18} className="shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex gap-2 p-1.5 bg-slate-200/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl mb-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('account')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'account'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <User size={16} />
            <span>Account Details</span>
          </button>

          <button
            onClick={() => setActiveTab('restaurant')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'restaurant'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Store size={16} />
            <span>Restaurant Profile</span>
          </button>

          <button
            onClick={() => setActiveTab('subscription')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'subscription'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CreditCard size={16} />
            <span>Subscription & Access</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'security'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Shield size={16} />
            <span>Preferences & Security</span>
          </button>
        </div>

        {/* Tab 1: Account Details */}
        {activeTab === 'account' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Personal Account Information
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Your SellSense login identity and contact credentials.
            </p>

            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500 text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-sm font-medium cursor-not-allowed"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                      Verified
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                    Phone / WhatsApp Number
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91-9876543210"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500 text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                    Role & Permissions
                  </label>
                  <div className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/50 text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>{currentUser?.role === 'super_admin' ? 'Super Administrator' : 'Restaurant Owner'}</span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-lime-500/10 text-lime-700 dark:text-lime-400">
                      Primary Account
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-lime-500 hover:bg-lime-400 text-slate-950 font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 text-sm cursor-pointer disabled:opacity-50"
                >
                  {loading ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                  <span>Save Profile Changes</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: Restaurant Profile */}
        {activeTab === 'restaurant' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Restaurant & Outlet Details
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              This information identifies your business and maps imported review datasets.
            </p>

            <form onSubmit={handleSaveRestaurant} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                    Restaurant / Brand Name
                  </label>
                  <input
                    type="text"
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    required
                    placeholder="e.g. Spice Route Kitchen"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500 text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                    Business Type
                  </label>
                  <select
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value as any)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500 text-sm font-medium"
                  >
                    <option value="Restaurant">Fine / Casual Dining Restaurant</option>
                    <option value="Café">Café & Bakery</option>
                    <option value="Cloud Kitchen">Cloud Kitchen / QSR Delivery</option>
                    <option value="Food Stall">Food Stall / Kiosk</option>
                    <option value="Street Food Vendor">Street Food Vendor</option>
                    <option value="Other">Other Food Business</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Pune, Mumbai, Bangalore"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500 text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                    Location / Area
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Koregaon Park, Phase 1"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500 text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                    Customer Contact Email
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="feedback@yourrestaurant.com"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500 text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                    Restaurant ID (System Unique)
                  </label>
                  <div className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/50 text-xs font-mono text-slate-500 dark:text-slate-400 truncate">
                    {currentRestaurant?.id || `rest_${currentUser?.id || 'demo'}`}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                  Culinary Concept / Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Tell us briefly about your cuisine and specialties..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500 text-sm font-medium"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-lime-500 hover:bg-lime-400 text-slate-950 font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 text-sm cursor-pointer disabled:opacity-50"
                >
                  {loading ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                  <span>Save Restaurant Profile</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 3: Subscription & Access */}
        {activeTab === 'subscription' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Current Membership
                  </span>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                    {subStatus.hasActiveSubscription
                      ? (subStatus.subscription?.plan_name || 'Basic Membership Plan')
                      : 'Free Community Plan'}
                  </h2>
                </div>

                <div>
                  {subStatus.hasActiveSubscription ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-300 dark:border-emerald-800">
                      <CheckCircle2 size={15} />
                      Active Premium Access
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-bold border border-amber-300 dark:border-amber-800">
                      <Lock size={15} />
                      Limited / Pending Approval
                    </span>
                  )}
                </div>
              </div>

              {/* Status details */}
              <div className="py-6 space-y-4">
                {subStatus.hasActiveSubscription ? (
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Plan Rate</div>
                      <div className="text-xl font-black text-slate-900 dark:text-white mt-1">₹531 / month</div>
                      <div className="text-[11px] text-emerald-600 font-semibold mt-1">Special Launch Pricing</div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Renewal / Expiry</div>
                      <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
                        {subStatus.subscription?.expires_at
                          ? new Date(subStatus.subscription.expires_at).toLocaleDateString()
                          : '30 Days Active'}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        {subStatus.daysUntilExpiry ? `${subStatus.daysUntilExpiry} days remaining` : 'Verified Access'}
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Unlocked Features</div>
                      <div className="text-xl font-black text-slate-900 dark:text-white mt-1">Full Access</div>
                      <div className="text-[11px] text-lime-600 font-semibold mt-1">AI Kitchen Insights Active</div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 text-slate-700 dark:text-slate-300 space-y-3">
                    <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-300 text-sm">
                      <Sparkles size={16} />
                      Upgrade to unlock AI-powered Kitchen Intelligence
                    </div>
                    <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                      Premium gives you unlimited spreadsheet review imports, deep dish-by-dish sentiment analysis, root-cause packaging leak detection, and tailored action plans for your chef.
                    </p>
                    <div className="pt-2 flex flex-wrap gap-3">
                      <Link
                        to="/payment/plan_basic"
                        className="px-5 py-2.5 bg-lime-500 hover:bg-lime-400 text-slate-950 font-bold rounded-xl text-xs shadow-sm transition flex items-center gap-1.5"
                      >
                        Subscribe for ₹531/mo <ExternalLink size={13} />
                      </Link>
                      <Link
                        to="/payment/history"
                        className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-xl text-xs hover:bg-slate-50 transition"
                      >
                        View Payment History
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Note on Admin Verification */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-3">
                <Shield size={16} className="text-lime-600 dark:text-lime-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">Admin Approval Guarantee: </span>
                  Every payment transaction reference submitted via QR scanner is manually verified by the administrator to activate your exclusive premium tools within 24 hours.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Preferences & Security */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            {/* Appearance */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                Visual Appearance
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                Choose between dark and light themes for high-contrast viewing in any kitchen or office environment.
              </p>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-800 dark:text-slate-200">
                    {dark ? <Moon size={20} className="text-lime-400" /> : <Sun size={20} className="text-amber-500" />}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {dark ? 'Dark Mode Active' : 'Light Mode Active'}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Toggle system appearance
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setTheme(!dark)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-lime-500 text-slate-900 dark:text-white shadow-xs transition cursor-pointer"
                >
                  Switch to {dark ? 'Light Mode' : 'Dark Mode'}
                </button>
              </div>
            </div>

            {/* Change Password */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                Account Security & Password
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                Keep your restaurant analytics safe with a secure personal password.
              </p>

              <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500 text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500 text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500 text-sm font-medium"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl text-xs hover:opacity-90 shadow-sm transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Lock size={14} />
                    <span>Update Password</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Logout / Danger Zone */}
            <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 rounded-3xl p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-rose-700 dark:text-rose-400">
                    Sign Out of SellSense
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Safely terminate your current session on this device.
                  </p>
                </div>

                <button
                  onClick={handleLogout}
                  className="px-5 py-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-900/60 transition flex items-center gap-2 cursor-pointer shrink-0"
                >
                  <LogOut size={15} />
                  <span>Log Out Now</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
