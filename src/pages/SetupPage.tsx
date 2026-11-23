import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Button } from '../components/Button';
import { authStorage } from '../utils/auth';
import { backendApi } from '../services/backendApi';
import {
  Check, Loader2, Moon, Sun, Globe, Bell, Bot, ArrowLeft, Save,
  Building, ShieldCheck, Sparkles, Upload, FileSpreadsheet, FileText,
  X, MapPin, Mail, User, Download, Info, CheckCircle, ArrowRight
} from 'lucide-react';
import type { BusinessType, Platform, Restaurant } from '../types';
import { zomatoApi } from '../services/zomatoApi';
import {
  isDarkMode,
  setTheme,
  subscribeThemeChange,
  getLanguage,
  setLanguage,
  getAlertSettings,
  setAlertSettings,
  getAiReplySettings,
  setAiReplySettings,
  type AlertSettings,
  type AiReplySettings,
} from '../utils/theme';

interface SetupPageProps {
  mode?: 'setup' | 'settings';
}

export const SetupPage: React.FC<SetupPageProps> = ({ mode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Determine whether we are in "Settings" mode or initial "Setup" onboarding wizard
  const isSettingsMode =
    mode === 'settings' ||
    location.pathname === '/settings' ||
    searchParams.get('mode') === 'settings';

  const [settingsTab, setSettingsTab] = useState<'business' | 'platforms' | 'appearance' | 'automation'>('business');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const [step, setStep] = useState(1);

  // Existing / current restaurant details
  const existingRestaurant = authStorage.getRestaurant();
  const currentUser = authStorage.getUser();

  // Step 1: Business Details
  const [businessDetails, setBusinessDetails] = useState({
    restaurantName: existingRestaurant?.name || (currentUser?.fullName ? `${currentUser.fullName}'s Restaurant` : 'My Restaurant'),
    ownerName: existingRestaurant?.ownerName || currentUser?.fullName || 'Owner',
    businessType: (existingRestaurant?.businessType || 'Restaurant') as BusinessType,
    city: existingRestaurant?.city || 'Pune',
    location: existingRestaurant?.location || 'Main Location',
    contactEmail: existingRestaurant?.contactEmail || currentUser?.email || '',
    description: existingRestaurant?.description || 'Authentic dining experience',
  });

  // Step 2: Platform Connections (Google REMOVED per requirement 1: Only Zomato & Swiggy)
  const [connections, setConnections] = useState<{ [key: string]: string }>({
    Zomato: existingRestaurant?.reviewSources?.includes('Zomato') ? 'Connected' : 'Not Connected',
    Swiggy: existingRestaurant?.reviewSources?.includes('Swiggy') ? 'Connected' : 'Not Connected',
  });



  // Spreadsheet upload state
  const [uploadedFiles, setUploadedFiles] = useState<{
    zomato: File | null;
    swiggy: File | null;
    google: File | null;
  }>({
    zomato: null,
    swiggy: null,
    google: null,
  });
  const [uploadStatus, setUploadStatus] = useState<{
    zomato: 'idle' | 'uploading' | 'success' | 'error';
    swiggy: 'idle' | 'uploading' | 'success' | 'error';
    google: 'idle' | 'uploading' | 'success' | 'error';
  }>({
    zomato: 'idle',
    swiggy: 'idle',
    google: 'idle',
  });


  // Additional Settings Options (Only shown in Settings mode, NOT during setup)
  const [darkModeActive, setDarkModeActive] = useState<boolean>(() => isDarkMode());
  const [selectedLang, setSelectedLang] = useState<string>(() => getLanguage());
  const [alertSettings, setAlertSettingsState] = useState<AlertSettings>(() => getAlertSettings());
  const [aiReplySettings, setAiReplySettingsState] = useState<AiReplySettings>(() => getAiReplySettings());

  useEffect(() => {
    const unsubscribe = subscribeThemeChange((isDark) => {
      setDarkModeActive(isDark);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const connected = zomatoApi.isConnected();
    if (connected) {
      setConnections(prev => ({ ...prev, Zomato: 'Connected' }));
    }
  }, [navigate]);

  const handleBusinessDetailsChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setBusinessDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleStep1Next = () => {
    if (
      !businessDetails.restaurantName ||
      !businessDetails.ownerName ||
      !businessDetails.city ||
      !businessDetails.contactEmail
    ) {
      alert('Please fill in all required fields');
      return;
    }
    setStep(2);
  };



  const handleStep2Next = () => {
    setStep(3);
  };

  const downloadSampleTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Date,Reviewer,Rating,Review Text,Dish\n" +
      "2026-03-01,Amit Sharma,5,The paneer was exceptionally fresh and rich in taste.,Paneer Butter Masala\n" +
      "2026-03-02,Priya Patel,2,Biryani arrived cold and the packaging box was crushed.,Chicken Dum Biryani\n" +
      "2026-03-03,Rahul Verma,4,Great spices and authentic taste. Delivery was quick.,Butter Chicken\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sellsense_review_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFinish = () => {
    // Save restaurant to local storage and backend
    const user = authStorage.getUser();
    const existingRest = authStorage.getRestaurant();
    const restId = (user && user.id !== 'user_demo_001')
      ? (existingRest && existingRest.id !== 'restaurant_nelam_001' ? existingRest.id : `rest_${user.id}`)
      : (existingRest?.id || `rest_${Date.now()}`);

    const finalOwnerId = user?.id || 'owner_default';
    const restaurant: Restaurant = {
      id: restId,
      name: businessDetails.restaurantName || (user?.fullName ? `${user.fullName}'s Restaurant` : 'My Restaurant'),
      ownerName: businessDetails.ownerName || user?.fullName || 'Owner',
      businessType: businessDetails.businessType,
      city: businessDetails.city,
      location: businessDetails.location,
      contactEmail: businessDetails.contactEmail || user?.email || '',
      description: businessDetails.description || 'Configured via SellSense Onboarding Wizard',
      reviewSources: Object.entries(connections)
        .filter(([_, status]) => status !== 'Not Connected')
        .map(([platform]) => platform as Platform),
      dataMode: 'LIVE',
      ownerId: finalOwnerId,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    if (user?.id) {
      localStorage.setItem(`sellsense_setup_done_${user.id}`, 'true');
    }
    authStorage.setRestaurant(restaurant);
    backendApi.updateRestaurantDetails(restaurant).catch((err: any) => console.warn('Sync restaurant error:', err));
    navigate('/products');
  };

  // Handler for Saving from Settings section
  const handleSaveSettings = () => {
    const user = authStorage.getUser();
    const currentRest = authStorage.getRestaurant();
    const restId = (user && user.id !== 'user_demo_001')
      ? (currentRest && currentRest.id !== 'restaurant_nelam_001' ? currentRest.id : `rest_${user.id}`)
      : (currentRest?.id || `rest_${Date.now()}`);

    const finalOwnerId = user?.id || currentRest?.ownerId || 'owner_default';
    const updated: Restaurant = {
      id: restId,
      name: businessDetails.restaurantName,
      ownerName: businessDetails.ownerName,
      businessType: businessDetails.businessType,
      city: businessDetails.city,
      location: businessDetails.location,
      contactEmail: businessDetails.contactEmail,
      description: businessDetails.description,
      reviewSources: Object.entries(connections)
        .filter(([_, status]) => status !== 'Not Connected')
        .map(([platform]) => platform as Platform),
      dataMode: 'LIVE',
      ownerId: finalOwnerId,
      isActive: true,
      createdAt: currentRest?.createdAt || new Date().toISOString(),
    };

    authStorage.setRestaurant(updated);
    backendApi.updateRestaurantDetails(updated).catch((err: any) => console.warn('Sync restaurant error:', err));
    setTheme(darkModeActive);
    setLanguage(selectedLang);
    setAlertSettings(alertSettings);
    setAiReplySettings(aiReplySettings);

    setSaveSuccessMsg('Settings updated successfully!');
    setTimeout(() => {
      setSaveSuccessMsg(null);
    }, 3500);
  };

  // Spreadsheet sources for upload
  const spreadsheetSources = [
    {
      id: 'zomato',
      name: 'Zomato Reviews',
      description: 'Upload your Zomato customer reviews as a spreadsheet (CSV or XLSX)',
      icon: '🍽️',
      color: 'from-red-500 to-orange-500',
      template: 'Date,Reviewer,Rating,Review Text,Dish',
      instructions: 'Export reviews from your Zomato Partner Dashboard → Reports → Customer Reviews',
    },
    {
      id: 'swiggy',
      name: 'Swiggy Reviews',
      description: 'Upload your Swiggy customer feedback as a spreadsheet (CSV or XLSX)',
      icon: '🛵',
      color: 'from-orange-500 to-yellow-500',
      template: 'Date,Reviewer,Rating,Review Text,Order Items',
      instructions: 'Export from Swiggy Partner Portal → Analytics → Customer Feedback',
    },
    {
      id: 'google',
      name: 'Google Maps Reviews',
      description: 'Upload your Google Business reviews as a spreadsheet (CSV or XLSX)',
      icon: '🗺️',
      color: 'from-blue-500 to-cyan-500',
      template: 'Date,Reviewer,Rating,Review Text,Reply',
      instructions: 'Connected via Google My Business API or export from Google Maps dashboard',
    },
  ];

  const handleFileUpload = (sourceId: 'zomato' | 'swiggy' | 'google', file: File) => {
    setUploadedFiles(prev => ({ ...prev, [sourceId]: file }));
    setUploadStatus(prev => ({ ...prev, [sourceId]: 'uploading' }));
    // Simulate processing
    setTimeout(() => {
      setUploadStatus(prev => ({ ...prev, [sourceId]: 'success' }));
      setConnections(prev => ({ ...prev, [sourceId === 'zomato' ? 'Zomato' : sourceId === 'swiggy' ? 'Swiggy' : 'Google'] : 'Connected' }));
    }, 1500);
  };

  const handleFileRemove = (sourceId: 'zomato' | 'swiggy' | 'google') => {
    setUploadedFiles(prev => ({ ...prev, [sourceId]: null }));
    setUploadStatus(prev => ({ ...prev, [sourceId]: 'idle' }));
    const platformName = sourceId === 'zomato' ? 'Zomato' : sourceId === 'swiggy' ? 'Swiggy' : 'Google';
    setConnections(prev => ({ ...prev, [platformName]: 'Not Connected' }));
  };

  // =========================================================================
  // VIEW A: SETTINGS MODE (Accessed from Dashboard / Products page)
  // Contains existing settings + Additional options (Dark Mode, Language, Alerts, AI Auto-reply)
  // =========================================================================
  if (isSettingsMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-10 px-4 sm:px-6 transition-colors duration-200">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="small"
                onClick={() => navigate('/products')}
                className="!bg-white dark:!bg-slate-800 !text-slate-800 dark:!text-slate-100 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-1.5"
              >
                <ArrowLeft size={16} />
                <span>Dashboard</span>
              </Button>
              <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white">
                  Restaurant Settings
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Manage your business profile, review sources, appearance, and AI automation
                </p>
              </div>
            </div>

            <Button
              onClick={handleSaveSettings}
              className="bg-lime-400 hover:bg-lime-500 text-slate-950 font-black py-2.5 px-6 rounded-xl shadow-md flex items-center gap-2"
            >
              <Save size={18} />
              <span>Save Changes</span>
            </Button>
          </div>

          {/* Success Toast */}
          {saveSuccessMsg && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center gap-3 shadow-md animate-in fade-in slide-in-from-top-2">
              <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span className="font-semibold text-sm">{saveSuccessMsg}</span>
            </div>
          )}

          {/* Settings Tabs Navigation */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6 overflow-x-auto gap-2">
            <button
              onClick={() => setSettingsTab('business')}
              className={`pb-3 px-4 font-bold text-sm flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                settingsTab === 'business'
                  ? 'border-lime-500 text-lime-600 dark:text-lime-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Building size={16} />
              Business Profile
            </button>
            <button
              onClick={() => setSettingsTab('platforms')}
              className={`pb-3 px-4 font-bold text-sm flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                settingsTab === 'platforms'
                  ? 'border-lime-500 text-lime-600 dark:text-lime-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <ShieldCheck size={16} />
              Connected Review Sources
            </button>
            <button
              onClick={() => setSettingsTab('appearance')}
              className={`pb-3 px-4 font-bold text-sm flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                settingsTab === 'appearance'
                  ? 'border-lime-500 text-lime-600 dark:text-lime-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Moon size={16} />
              Appearance & Language
            </button>
            <button
              onClick={() => setSettingsTab('automation')}
              className={`pb-3 px-4 font-bold text-sm flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                settingsTab === 'automation'
                  ? 'border-lime-500 text-lime-600 dark:text-lime-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Sparkles size={16} />
              Smart Alerts & AI Reply
            </button>
          </div>

          {/* TAB 1: Business Details (Existing Options) */}
          {settingsTab === 'business' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                  Business Information
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Update your restaurant identity, ownership details, and location
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Restaurant / Business Name *
                  </label>
                  <input
                    name="restaurantName"
                    type="text"
                    value={businessDetails.restaurantName}
                    onChange={handleBusinessDetailsChange}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Owner Name *
                  </label>
                  <input
                    name="ownerName"
                    type="text"
                    value={businessDetails.ownerName}
                    onChange={handleBusinessDetailsChange}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Business Type *
                  </label>
                  <select
                    name="businessType"
                    value={businessDetails.businessType}
                    onChange={handleBusinessDetailsChange}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500 font-medium"
                    required
                  >
                    <option value="Restaurant">Restaurant</option>
                    <option value="Café">Café</option>
                    <option value="Food Stall">Food Stall</option>
                    <option value="Street Food Vendor">Street Food Vendor</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Contact Email *
                  </label>
                  <input
                    name="contactEmail"
                    type="email"
                    value={businessDetails.contactEmail}
                    onChange={handleBusinessDetailsChange}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    City *
                  </label>
                  <input
                    name="city"
                    type="text"
                    value={businessDetails.city}
                    onChange={handleBusinessDetailsChange}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Location / Area *
                  </label>
                  <input
                    name="location"
                    type="text"
                    value={businessDetails.location}
                    onChange={handleBusinessDetailsChange}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500 font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  name="description"
                  value={businessDetails.description}
                  onChange={handleBusinessDetailsChange}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500 font-medium"
                  rows={3}
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveSettings} className="bg-lime-400 hover:bg-lime-500 text-slate-950 font-black px-6 py-2.5 rounded-xl shadow-md">
                  Save Business Profile
                </Button>
              </div>
            </div>
          )}

          {/* TAB 2: Upload Review Sources via Spreadsheet */}
          {settingsTab === 'platforms' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                  <FileSpreadsheet size={20} className="text-lime-500" />
                  Upload Review Spreadsheets
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Upload your customer reviews as CSV or XLSX spreadsheets — no API key needed.
                </p>
              </div>

              <div className="space-y-4">
                {spreadsheetSources.map((source) => {
                  const status = uploadStatus[source.id as 'zomato' | 'swiggy' | 'google'];
                  const file = uploadedFiles[source.id as 'zomato' | 'swiggy' | 'google'];
                  return (
                    <div key={source.id} className="border border-slate-200 dark:border-slate-800 rounded-2xl p-6 bg-slate-50/50 dark:bg-slate-800/40">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="text-4xl p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                            {source.icon}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 dark:text-white text-base">{source.name}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{source.description}</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 italic">{source.instructions}</p>
                            {status === 'success' && (
                              <span className="inline-block mt-2 text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                ✓ Uploaded Successfully
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          {status === 'success' && file ? (
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl px-3 py-2">
                                <FileText size={16} className="text-emerald-600 dark:text-emerald-400" />
                                <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300 max-w-[150px] truncate">{file.name}</span>
                              </div>
                              <button onClick={() => handleFileRemove(source.id as 'zomato' | 'swiggy' | 'google')} className="p-2 rounded-lg text-slate-400 hover:text-red-500 transition-colors">
                                <X size={16} />
                              </button>
                            </div>
                          ) : status === 'uploading' ? (
                            <div className="flex items-center gap-2 text-sm text-lime-600 dark:text-lime-400 font-medium">
                              <Loader2 size={18} className="animate-spin" />
                              Processing...
                            </div>
                          ) : (
                            <label className="flex items-center gap-2 cursor-pointer bg-lime-400 hover:bg-lime-500 text-slate-950 font-black rounded-xl px-4 py-2.5 transition-colors shadow-sm">
                              <Upload size={16} />
                              <span className="text-sm">Upload File</span>
                              <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(source.id as 'zomato' | 'swiggy' | 'google', f); }} />
                            </label>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/60">
                        <p className="text-xs text-slate-500 dark:text-slate-400"><span className="font-semibold">Expected columns:</span> {source.template}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl p-4">
                <p className="text-sm text-blue-800 dark:text-blue-300 font-semibold mb-2">How to export your reviews</p>
                <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1 ml-4 list-disc">
                  <li><strong className="text-blue-800 dark:text-blue-300">Zomato:</strong> Partner Dashboard → Reports → Customer Reviews → Export</li>
                  <li><strong className="text-blue-800 dark:text-blue-300">Swiggy:</strong> Partner Portal → Analytics → Customer Feedback → Download</li>
                  <li><strong className="text-blue-800 dark:text-blue-300">Google:</strong> Google My Business → Reviews → Export</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 3: Appearance & Language (NEW ADDITIONAL OPTIONS) */}
          {settingsTab === 'appearance' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800 space-y-8">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                  Appearance & Language
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Customize the interface theme and preferred language for your dashboard
                </p>
              </div>

              {/* Dark Mode Option */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-6 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    {darkModeActive ? <Moon size={24} /> : <Sun size={24} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      Dark Mode Theme
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Switch between sleek Dark Mode and high-contrast Light Mode
                    </p>
                    <span className="text-xs font-semibold text-lime-600 dark:text-lime-400 mt-1 inline-block">
                      Current theme: {darkModeActive ? 'Dark Theme' : 'Light Theme'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const next = !darkModeActive;
                      setDarkModeActive(next);
                      setTheme(next);
                    }}
                    className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-lime-500 ${
                      darkModeActive ? 'bg-lime-500' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out flex items-center justify-center text-slate-700 ${
                        darkModeActive ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    >
                      {darkModeActive ? <Moon size={14} className="text-slate-900" /> : <Sun size={14} className="text-amber-500" />}
                    </span>
                  </button>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    {darkModeActive ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>

              {/* Language Option */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-6 bg-slate-50/50 dark:bg-slate-800/40 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-950/80 flex items-center justify-center text-teal-600 dark:text-teal-400">
                    <Globe size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      Preferred Language / भाषा
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Select your preferred language for reports, reviews summary, and AI insights
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                  {[
                    { code: 'en', label: 'English', native: 'English' },
                    { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
                    { code: 'mr', label: 'Marathi', native: 'मराठी' },
                    { code: 'gu', label: 'Gujarati', native: 'ગુજરાતી' },
                    { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
                    { code: 'bn', label: 'Bengali', native: 'বাংলা' },
                  ].map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        setSelectedLang(lang.code);
                        setLanguage(lang.code);
                      }}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        selectedLang === lang.code
                          ? 'border-lime-500 bg-lime-50/80 dark:bg-lime-950/40 text-slate-900 dark:text-white shadow-xs ring-2 ring-lime-500/20'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm">{lang.label}</span>
                        {selectedLang === lang.code && <Check size={16} className="text-lime-600 dark:text-lime-400" />}
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5 font-medium">
                        {lang.native}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={handleSaveSettings} className="bg-lime-400 hover:bg-lime-500 text-slate-950 font-black px-6 py-2.5 rounded-xl shadow-md">
                  Save Appearance & Language
                </Button>
              </div>
            </div>
          )}

          {/* TAB 4: Smart Alerts & AI Automation (NEW ADDITIONAL HELPFUL OPTIONS) */}
          {settingsTab === 'automation' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800 space-y-8">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                  Smart Alerts & AI Automation
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Configure automated alert notifications and AI-assisted customer review replies
                </p>
              </div>

              {/* HELPFUL OPTION 1: Negative Review Instant Alerts */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-6 bg-slate-50/50 dark:bg-slate-800/40 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/80 flex items-center justify-center text-amber-600 dark:text-amber-400">
                      <Bell size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 dark:text-white text-base">
                          Negative Review Instant Alerts
                        </h3>
                        <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          Recommended
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Get instant alerts when customers post 1-star or 2-star reviews or hygiene issues
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setAlertSettingsState((prev) => ({ ...prev, enabled: !prev.enabled }));
                    }}
                    className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-lime-500 ${
                      alertSettings.enabled ? 'bg-lime-500' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        alertSettings.enabled ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {alertSettings.enabled && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700/60 space-y-4 animate-in fade-in">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                        Alert Trigger Threshold
                      </label>
                      <div className="flex gap-3">
                        {[
                          { val: 2, label: '≤ 2 Stars (Severe Complaints & 1★/2★)' },
                          { val: 3, label: '≤ 3 Stars (Average & Critical reviews)' },
                        ].map((item) => (
                          <button
                            key={item.val}
                            type="button"
                            onClick={() => setAlertSettingsState(p => ({ ...p, minStarRating: item.val }))}
                            className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                              alertSettings.minStarRating === item.val
                                ? 'bg-lime-50 dark:bg-lime-950/60 border-lime-500 text-lime-700 dark:text-lime-300'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                        Notification Delivery Channels
                      </label>
                      <div className="grid sm:grid-cols-3 gap-3">
                        <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={alertSettings.channels.email}
                            onChange={(e) => setAlertSettingsState(p => ({ ...p, channels: { ...p.channels, email: e.target.checked } }))}
                            className="rounded text-lime-600 focus:ring-lime-500"
                          />
                          <span>Email Notification</span>
                        </label>
                        <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={alertSettings.channels.inApp}
                            onChange={(e) => setAlertSettingsState(p => ({ ...p, channels: { ...p.channels, inApp: e.target.checked } }))}
                            className="rounded text-lime-600 focus:ring-lime-500"
                          />
                          <span>In-App Dashboard</span>
                        </label>
                        <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={alertSettings.channels.sms}
                            onChange={(e) => setAlertSettingsState(p => ({ ...p, channels: { ...p.channels, sms: e.target.checked } }))}
                            className="rounded text-lime-600 focus:ring-lime-500"
                          />
                          <span>SMS / WhatsApp</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* HELPFUL OPTION 2: Auto AI Reply Suggestions */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-6 bg-slate-50/50 dark:bg-slate-800/40 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950/80 flex items-center justify-center text-purple-600 dark:text-purple-400">
                      <Bot size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 dark:text-white text-base">
                          Auto AI Review Reply Assistant
                        </h3>
                        <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                          AI Powered
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Automatically drafts courteous, professional replies to customer reviews on Zomato & Swiggy
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setAiReplySettingsState((prev) => ({ ...prev, enabled: !prev.enabled }));
                    }}
                    className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-lime-500 ${
                      aiReplySettings.enabled ? 'bg-lime-500' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        aiReplySettings.enabled ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {aiReplySettings.enabled && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700/60 space-y-4 animate-in fade-in">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                        AI Reply Tone
                      </label>
                      <div className="grid sm:grid-cols-3 gap-3">
                        {[
                          { val: 'empathetic', title: 'Empathetic & Polite', desc: 'Best for hospitality & resolution' },
                          { val: 'professional', title: 'Professional & Crisp', desc: 'Direct, courteous and business-like' },
                          { val: 'warm', title: 'Warm & Friendly', desc: 'Welcoming cafe and neighborhood vibe' },
                        ].map((tone) => (
                          <button
                            key={tone.val}
                            type="button"
                            onClick={() => setAiReplySettingsState(p => ({ ...p, tone: tone.val as any }))}
                            className={`p-3 rounded-xl border text-left transition-all ${
                              aiReplySettings.tone === tone.val
                                ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 text-purple-900 dark:text-purple-200 ring-2 ring-purple-500/20'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <span className="font-bold text-sm block">{tone.title}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 block mt-1">{tone.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <div>
                        <span className="text-sm font-bold text-slate-900 dark:text-white block">
                          Auto-attach Apology Voucher Code
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          Include a discount voucher in draft replies for unhappy customers
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={aiReplySettings.voucherCode}
                          onChange={(e) => setAiReplySettingsState(p => ({ ...p, voucherCode: e.target.value }))}
                          placeholder="Code (e.g. SORRY10)"
                          className="px-3 py-1.5 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg w-32 focus:outline-none focus:ring-1 focus:ring-lime-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={handleSaveSettings} className="bg-lime-400 hover:bg-lime-500 text-slate-950 font-black px-6 py-2.5 rounded-xl shadow-md">
                  Save Automation Settings
                </Button>
              </div>
            </div>
          )}
        </div>


      </div>
    );
  }

  // =========================================================================
  // VIEW B: ONBOARDING SETUP MODE (Only 3 steps, modern, sleek & tenant-isolated)
  // Step 1: Restaurant Profile -> Step 2: Upload Reviews Sheet -> Step 3: Launch
  // =========================================================================
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 relative overflow-hidden flex flex-col justify-center">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-lime-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-3xl mx-auto w-full relative z-10">
        {/* Onboarding Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-lime-400/10 border border-lime-400/20 text-lime-400 text-xs font-black uppercase tracking-wider mb-3">
            <Sparkles size={14} />
            <span>Welcome to SellSense • 3-Step Guided Setup</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">
            Setup Your Restaurant & Review Hub
          </h1>
          <p className="text-slate-400 text-sm max-w-lg mx-auto">
            Configure your business profile and connect review sources to unlock AI sentiment insights in under 2 minutes.
          </p>
        </div>

        {/* 3-Step Wizard Indicator */}
        <div className="flex items-center justify-center mb-8 px-4">
          <div className="flex items-center gap-3 w-full max-w-md justify-between">
            {/* Step 1 Pill */}
            <div className="flex items-center gap-2">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm transition-all ${
                  step === 1
                    ? 'bg-lime-400 text-slate-950 shadow-lg shadow-lime-400/25 ring-2 ring-lime-400/40'
                    : step > 1
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-800 text-slate-500 border border-slate-700'
                }`}
              >
                {step > 1 ? <Check size={18} /> : '1'}
              </div>
              <span className={`text-xs font-bold hidden sm:inline ${step >= 1 ? 'text-white' : 'text-slate-500'}`}>
                Profile
              </span>
            </div>

            <div className={`flex-1 h-1 mx-2 rounded-full transition-all ${step >= 2 ? 'bg-emerald-500' : 'bg-slate-800'}`} />

            {/* Step 2 Pill */}
            <div className="flex items-center gap-2">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm transition-all ${
                  step === 2
                    ? 'bg-lime-400 text-slate-950 shadow-lg shadow-lime-400/25 ring-2 ring-lime-400/40'
                    : step > 2
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-800 text-slate-500 border border-slate-700'
                }`}
              >
                {step > 2 ? <Check size={18} /> : '2'}
              </div>
              <span className={`text-xs font-bold hidden sm:inline ${step >= 2 ? 'text-white' : 'text-slate-500'}`}>
                Reviews
              </span>
            </div>

            <div className={`flex-1 h-1 mx-2 rounded-full transition-all ${step >= 3 ? 'bg-emerald-500' : 'bg-slate-800'}`} />

            {/* Step 3 Pill */}
            <div className="flex items-center gap-2">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm transition-all ${
                  step === 3
                    ? 'bg-lime-400 text-slate-950 shadow-lg shadow-lime-400/25 ring-2 ring-lime-400/40'
                    : 'bg-slate-800 text-slate-500 border border-slate-700'
                }`}
              >
                3
              </div>
              <span className={`text-xs font-bold hidden sm:inline ${step === 3 ? 'text-white' : 'text-slate-500'}`}>
                Launch
              </span>
            </div>
          </div>
        </div>

        {/* Step Card Container */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          {/* STEP 1: RESTAURANT PROFILE DETAILS */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Building className="text-lime-400" size={20} />
                  Step 1: Restaurant Profile Details
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Tell us about your restaurant to personalize your dashboard and kitchen reports.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Restaurant / Business Name *
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      name="restaurantName"
                      type="text"
                      value={businessDetails.restaurantName}
                      onChange={handleBusinessDetailsChange}
                      placeholder="e.g. Royal Spice Biryani House"
                      className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-lime-400 font-medium"
                      required
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Owner / Manager Name *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        name="ownerName"
                        type="text"
                        value={businessDetails.ownerName}
                        onChange={handleBusinessDetailsChange}
                        placeholder="e.g. Ayush Mandalkar"
                        className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-lime-400 font-medium"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Business Type *
                    </label>
                    <select
                      name="businessType"
                      value={businessDetails.businessType}
                      onChange={handleBusinessDetailsChange}
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-lime-400 font-medium cursor-pointer"
                      required
                    >
                      <option value="Restaurant">Full-Service Restaurant</option>
                      <option value="Café">Café & Coffee Shop</option>
                      <option value="Cloud Kitchen">Cloud Kitchen / Delivery Only</option>
                      <option value="QSR">QSR / Fast Food</option>
                      <option value="Bakery">Bakery & Desserts</option>
                      <option value="Food Stall">Food Stall / Food Truck</option>
                      <option value="Other">Other Dining Format</option>
                    </select>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      City *
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        name="city"
                        type="text"
                        value={businessDetails.city}
                        onChange={handleBusinessDetailsChange}
                        placeholder="e.g. Pune, Mumbai, Bengaluru"
                        className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-lime-400 font-medium"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Branch / Outlet Area
                    </label>
                    <input
                      name="location"
                      type="text"
                      value={businessDetails.location}
                      onChange={handleBusinessDetailsChange}
                      placeholder="e.g. Koregaon Park, Indiranagar"
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-lime-400 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Contact Email *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      name="contactEmail"
                      type="email"
                      value={businessDetails.contactEmail}
                      onChange={handleBusinessDetailsChange}
                      placeholder="contact@myrestaurant.com"
                      className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-lime-400 font-medium"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Cuisine / Short Description (Optional)
                  </label>
                  <textarea
                    name="description"
                    value={businessDetails.description}
                    onChange={handleBusinessDetailsChange}
                    placeholder="e.g. Authentic North Indian, Biryanis and Mughlai curries crafted with traditional recipes"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-lime-400 font-medium"
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-800">
                <Button
                  onClick={handleStep1Next}
                  className="bg-lime-400 hover:bg-lime-500 text-slate-950 font-black px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm"
                >
                  <span>Next: Connect Review Sources</span>
                  <ArrowRight size={16} />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: REVIEW SOURCES & SPREADSHEET UPLOAD */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FileSpreadsheet className="text-lime-400" size={20} />
                    Step 2: Connect Review Sources (Spreadsheet / CSV)
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Upload customer reviews from Zomato or Swiggy. No complex API keys needed.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={downloadSampleTemplate}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-lime-400 hover:text-lime-300 bg-lime-400/10 hover:bg-lime-400/20 px-3 py-1.5 rounded-xl border border-lime-400/30 transition self-start sm:self-auto"
                >
                  <Download size={14} />
                  <span>Download Sample CSV</span>
                </button>
              </div>

              <div className="space-y-4">
                {spreadsheetSources.filter(s => s.id !== 'google').map((source) => {
                  const status = uploadStatus[source.id as 'zomato' | 'swiggy'];
                  const file = uploadedFiles[source.id as 'zomato' | 'swiggy'];

                  return (
                    <div
                      key={source.id}
                      className="border border-slate-800 rounded-2xl p-5 bg-slate-950/60 hover:border-slate-700 transition"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="text-3xl p-3 bg-slate-900 rounded-2xl border border-slate-800">
                            {source.icon}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-white text-base">{source.name}</h3>
                              {status === 'success' && (
                                <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                                  ✓ Connected & Uploaded
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">{source.description}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5 italic">{source.instructions}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-center">
                          {status === 'success' && file ? (
                            <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-800 rounded-xl px-3 py-2">
                              <FileText size={16} className="text-emerald-400" />
                              <span className="text-xs font-semibold text-emerald-200 max-w-[130px] truncate">
                                {file.name}
                              </span>
                              <button
                                onClick={() => handleFileRemove(source.id as 'zomato' | 'swiggy')}
                                className="p-1 text-slate-400 hover:text-red-400 transition"
                                title="Remove file"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : status === 'uploading' ? (
                            <div className="flex items-center gap-2 text-xs font-bold text-lime-400 bg-lime-400/10 px-4 py-2.5 rounded-xl border border-lime-400/20">
                              <Loader2 size={16} className="animate-spin" />
                              Parsing reviews...
                            </div>
                          ) : (
                            <label className="flex items-center gap-2 cursor-pointer bg-lime-400 hover:bg-lime-500 text-slate-950 font-black rounded-xl px-4 py-2.5 transition text-xs shadow-md">
                              <Upload size={14} />
                              <span>Upload Reviews</span>
                              <input
                                type="file"
                                accept=".csv,.xlsx,.xls"
                                className="hidden"
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f) handleFileUpload(source.id as 'zomato' | 'swiggy', f);
                                }}
                              />
                            </label>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Expected columns: <code className="text-slate-400">{source.template}</code></span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-start gap-3 text-xs text-slate-400">
                <Info size={18} className="text-lime-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-200 block mb-0.5">Don't have your spreadsheet ready right now?</span>
                  No problem! You can proceed now and upload your customer review sheets anytime from the dishes or analytics page.
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-800">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800 text-sm"
                >
                  Back
                </Button>
                <Button
                  onClick={handleStep2Next}
                  className="bg-lime-400 hover:bg-lime-500 text-slate-950 font-black px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm"
                >
                  <span>Continue to Launch</span>
                  <ArrowRight size={16} />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW CONFIGURATION & LAUNCH */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="text-lime-400" size={22} />
                  Step 3: Review Configuration & Launch
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Everything is set! Confirm your details below to launch your SellSense workspace.
                </p>
              </div>

              {/* Profile Summary Card */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Restaurant Profile</span>
                  <button
                    onClick={() => setStep(1)}
                    className="text-xs font-bold text-lime-400 hover:underline"
                  >
                    Edit Profile
                  </button>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block">Restaurant Name:</span>
                    <span className="text-white font-bold text-sm">{businessDetails.restaurantName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Owner / Lead:</span>
                    <span className="text-white font-bold text-sm">{businessDetails.ownerName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Business Format:</span>
                    <span className="text-white font-semibold">{businessDetails.businessType}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Location:</span>
                    <span className="text-white font-semibold">{businessDetails.location}, {businessDetails.city}</span>
                  </div>
                </div>
              </div>

              {/* Data Sources Status */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Review Sources</span>
                  <button
                    onClick={() => setStep(2)}
                    className="text-xs font-bold text-lime-400 hover:underline"
                  >
                    Manage Sources
                  </button>
                </div>

                {Object.entries(uploadedFiles).some(([_, f]) => f !== null) ? (
                  <div className="space-y-2">
                    {Object.entries(uploadedFiles)
                      .filter(([_, f]) => f !== null)
                      .map(([source, file]) => (
                        <div
                          key={source}
                          className="flex items-center justify-between p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/80 text-xs"
                        >
                          <div className="flex items-center gap-2 text-emerald-300 font-bold capitalize">
                            <CheckCircle size={16} className="text-emerald-400" />
                            <span>{source} Reviews Sheet ({file?.name})</span>
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full">
                            Ready
                          </span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
                    <span className="font-bold text-slate-300 block mb-0.5">Clean Tenant Workspace Ready</span>
                    You can upload your reviews spreadsheet anytime directly from the dishes page with 1 click.
                  </div>
                )}
              </div>

              {/* Privacy Notice */}
              <div className="p-4 bg-emerald-950/30 border border-emerald-800/60 rounded-2xl flex items-center gap-3 text-xs text-emerald-300">
                <ShieldCheck size={20} className="text-emerald-400 flex-shrink-0" />
                <span>
                  <strong>Tenant Data Isolation Guaranteed:</strong> Your restaurant reviews and menu data are strictly private and isolated to your account.
                </span>
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-800">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800 text-sm"
                >
                  Back
                </Button>
                <Button
                  onClick={handleFinish}
                  className="bg-lime-400 hover:bg-lime-500 text-slate-950 font-black px-8 py-3 rounded-xl shadow-xl flex items-center gap-2 text-sm"
                >
                  <span>🚀 Launch SellSense Dashboard</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
