import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Button } from '../components/Button';
import { authStorage } from '../utils/auth';
import { demoRestaurant } from '../data/sampleData';
import { Check, Loader2, Moon, Sun, Globe, Bell, Bot, ArrowLeft, Save, Building, ShieldCheck, Sparkles, Upload, FileSpreadsheet, FileText, X } from 'lucide-react';
import type { BusinessType, Platform } from '../types';
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

  // Step 1: Business Details
  const [businessDetails, setBusinessDetails] = useState({
    restaurantName: existingRestaurant?.name || 'Nelam Restaurants',
    ownerName: existingRestaurant?.ownerName || 'Demo Owner',
    businessType: (existingRestaurant?.businessType || 'Restaurant') as BusinessType,
    city: existingRestaurant?.city || 'Pune',
    location: existingRestaurant?.location || 'Koregaon Park, Pune',
    contactEmail: existingRestaurant?.contactEmail || 'owner@nelamrestaurants.com',
    description: existingRestaurant?.description || 'Fine dining with traditional Indian flavors',
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
    const user = authStorage.getUser();
    if (user?.role === 'super_admin' || user?.role === 'admin' || user?.email === 'admin@sellsense.ai') {
      navigate('/admin', { replace: true });
      return;
    }

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

  const handleFinish = () => {
    // Save restaurant to local storage
    const restaurant = {
      ...demoRestaurant,
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
    };

    authStorage.setRestaurant(restaurant);
    navigate('/products');
  };

  // Handler for Saving from Settings section
  const handleSaveSettings = () => {
    const currentRest = authStorage.getRestaurant() || demoRestaurant;
    const updated = {
      ...currentRest,
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
    };

    authStorage.setRestaurant(updated);
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
  // VIEW B: ONBOARDING SETUP MODE (Only 3 steps, NO additional options shown)
  // Google option removed from Review Sources per Requirement 1
  // =========================================================================
  return (
    <div className="min-h-screen bg-warm-stone py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="font-serif text-4xl font-bold text-deep-charcoal mb-2">
            Setup Your Restaurant
          </h1>
          <p className="text-muted-gray">Complete the setup to start analyzing reviews</p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-12">
          <div className="flex items-center gap-2">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step >= 1 ? 'bg-deep-charcoal text-white' : 'bg-light-beige text-muted-gray'
              }`}
            >
              1
            </div>
            <div className={`w-20 h-1 ${step >= 2 ? 'bg-deep-charcoal' : 'bg-light-beige'}`} />
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step >= 2 ? 'bg-deep-charcoal text-white' : 'bg-light-beige text-muted-gray'
              }`}
            >
              2
            </div>
            <div className={`w-20 h-1 ${step >= 3 ? 'bg-deep-charcoal' : 'bg-light-beige'}`} />
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step >= 3 ? 'bg-deep-charcoal text-white' : 'bg-light-beige text-muted-gray'
              }`}
            >
              3
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 border border-border-beige">
          {/* Step 1: Business Details */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-deep-charcoal mb-6">Business Details</h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-deep-charcoal mb-2">
                    Restaurant / Business Name *
                  </label>
                  <input
                    name="restaurantName"
                    type="text"
                    value={businessDetails.restaurantName}
                    onChange={handleBusinessDetailsChange}
                    className="w-full px-4 py-3 border border-border-beige rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-charcoal"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deep-charcoal mb-2">
                    Owner Name *
                  </label>
                  <input
                    name="ownerName"
                    type="text"
                    value={businessDetails.ownerName}
                    onChange={handleBusinessDetailsChange}
                    className="w-full px-4 py-3 border border-border-beige rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-charcoal"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deep-charcoal mb-2">
                    Business Type *
                  </label>
                  <select
                    name="businessType"
                    value={businessDetails.businessType}
                    onChange={handleBusinessDetailsChange}
                    className="w-full px-4 py-3 border border-border-beige rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-charcoal"
                    required
                  >
                    <option value="Restaurant">Restaurant</option>
                    <option value="Café">Café</option>
                    <option value="Food Stall">Food Stall</option>
                    <option value="Street Food Vendor">Street Food Vendor</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-deep-charcoal mb-2">
                      City *
                    </label>
                    <input
                      name="city"
                      type="text"
                      value={businessDetails.city}
                      onChange={handleBusinessDetailsChange}
                      className="w-full px-4 py-3 border border-border-beige rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-charcoal"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-deep-charcoal mb-2">
                      Location *
                    </label>
                    <input
                      name="location"
                      type="text"
                      value={businessDetails.location}
                      onChange={handleBusinessDetailsChange}
                      className="w-full px-4 py-3 border border-border-beige rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-charcoal"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-deep-charcoal mb-2">
                    Contact Email *
                  </label>
                  <input
                    name="contactEmail"
                    type="email"
                    value={businessDetails.contactEmail}
                    onChange={handleBusinessDetailsChange}
                    className="w-full px-4 py-3 border border-border-beige rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-charcoal"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deep-charcoal mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    name="description"
                    value={businessDetails.description}
                    onChange={handleBusinessDetailsChange}
                    className="w-full px-4 py-3 border border-border-beige rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-charcoal"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleStep1Next}>Continue</Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Platform Connections (Google REMOVED - Only Zomato & Swiggy) */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-deep-charcoal mb-2 flex items-center gap-2">
                <FileSpreadsheet size={24} className="text-lime-600" />
                Upload Review Sources
              </h2>
              <p className="text-muted-gray mb-6">
                Upload your customer reviews as spreadsheets (CSV or XLSX) — no API keys required
              </p>

              <div className="space-y-4">
                {spreadsheetSources.map((source) => {
                  const status = uploadStatus[source.id as 'zomato' | 'swiggy' | 'google'];
                  const file = uploadedFiles[source.id as 'zomato' | 'swiggy' | 'google'];
                  return (
                    <div key={source.id} className="border border-border-beige rounded-xl p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="text-3xl p-2 bg-gray-50 rounded-xl border border-gray-100">{source.icon}</div>
                          <div>
                            <h3 className="font-bold text-deep-charcoal">{source.name}</h3>
                            <p className="text-sm text-muted-gray">{source.description}</p>
                            <p className="text-xs text-muted-gray mt-0.5 italic">{source.instructions}</p>
                            {status === 'success' && (
                              <span className="inline-block mt-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-green-100 text-green-700">
                                ✓ Uploaded
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          {status === 'success' && file ? (
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
                                <FileText size={14} className="text-green-600" />
                                <span className="text-xs font-medium text-green-800 max-w-[120px] truncate">{file.name}</span>
                              </div>
                              <button onClick={() => handleFileRemove(source.id as 'zomato' | 'swiggy' | 'google')} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                                <X size={14} />
                              </button>
                            </div>
                          ) : status === 'uploading' ? (
                            <div className="flex items-center gap-2 text-sm text-lime-600">
                              <Loader2 size={16} className="animate-spin" />
                              Processing...
                            </div>
                          ) : (
                            <label className="flex items-center gap-2 cursor-pointer bg-lime-400 hover:bg-lime-500 text-slate-950 font-black rounded-lg px-4 py-2 transition-colors text-sm">
                              <Upload size={14} />
                              Upload File
                              <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(source.id as 'zomato' | 'swiggy' | 'google', f); }} />
                            </label>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <p className="text-xs text-muted-gray"><span className="font-medium text-deep-charcoal">Columns:</span> {source.template}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                <p className="text-sm text-amber-800 font-medium">You can skip this step and upload spreadsheets later from Settings.</p>
              </div>

              <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button onClick={handleStep2Next}>Continue</Button>
              </div>
            </div>
          )}

          {/* Step 3: Review Configuration */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-deep-charcoal mb-6">
                Review Source Configuration
              </h2>
              <p className="text-muted-gray mb-6">
                Your connected platforms are ready to sync reviews
              </p>

              <div className="space-y-4 mb-8">
                {Object.entries(uploadedFiles).some(([_, f]) => f !== null) ? (
                  Object.entries(uploadedFiles)
                    .filter(([_, f]) => f !== null)
                    .map(([source, file]) => (
                      <div
                        key={source}
                        className="border border-green-200 rounded-xl p-5 bg-green-50 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <Check className="text-green-600" size={22} />
                          <div>
                            <h3 className="font-bold text-deep-charcoal capitalize">{source} Reviews Spreadsheet</h3>
                            <p className="text-xs text-green-800 font-medium mt-0.5">
                              File: {file?.name} • Ready for analysis
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full">Uploaded</span>
                      </div>
                    ))
                ) : (
                  <div className="border border-dashed border-gray-300 rounded-xl p-6 text-center bg-gray-50">
                    <p className="text-sm font-semibold text-deep-charcoal">Nelam Restaurants Demo Reviews Active</p>
                    <p className="text-xs text-muted-gray mt-1">
                      No custom spreadsheet uploaded. Standard demo dataset will be loaded so you can explore analytics immediately. You can upload spreadsheets anytime from Settings.
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
                <p className="text-sm text-blue-900">
                  <strong>Demo Mode:</strong> You're using sample data from Nelam Restaurants. This
                  is for demonstration purposes only.
                </p>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button onClick={handleFinish}>Continue to Dashboard</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
