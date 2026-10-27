import React, { useState, useMemo, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { ProductCard } from '../components/ProductCard';
import { authStorage } from '../utils/auth';
import {
  Search, Grid3x3, List, Sparkles, CreditCard, Lock, CheckCircle,
  ArrowRight, MapPin, FileSpreadsheet, Upload, Settings, RefreshCw, Download,
  PlusCircle, UtensilsCrossed, ExternalLink
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/Button';
import { backendApi } from '../services/backendApi';
import { UploadReviewsModal } from '../components/UploadReviewsModal';
import { ManualReviewAnalysisModal } from '../components/ManualReviewAnalysisModal';
import type { Product, Platform } from '../types';

export const ProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const restaurant = authStorage.getRestaurant();
  const user = authStorage.getUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [googleConnected, setGoogleConnected] = useState(false);

  // Manual Review Spreadsheet States
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [uploadedProducts, setUploadedProducts] = useState<Product[]>([]);
  const [selectedProductForAnalysis, setSelectedProductForAnalysis] = useState<string | null>(null);

  const [manualStats, setManualStats] = useState<{
    totalImportedReviews: number;
    productsCount: number;
    productNames: string[];
    latestImportDate: string | null;
  }>({
    totalImportedReviews: 0,
    productsCount: 0,
    productNames: [],
    latestImportDate: null,
  });

  const activeRestaurant = restaurant || {
    id: user?.id ? `rest_${user.id}` : 'my_restaurant',
    name: user?.fullName ? `${user.fullName}'s Restaurant` : 'My Restaurant',
    location: 'Main Location',
  };

  useEffect(() => {
    if (searchParams.get('action') === 'upload') {
      setUploadModalOpen(true);
    }
  }, [searchParams]);

  // Load products strictly from uploaded spreadsheet data
  const fetchProductsAndStats = async () => {
    setLoadingProducts(true);
    try {
      // 1. Fetch products summary from backend API
      const summaryRes = await backendApi.getProductsSummary(activeRestaurant.id).catch(() => null);
      if (summaryRes?.products && summaryRes.products.length > 0) {
        // Map to Product interface
        const mapped: Product[] = summaryRes.products.map(p => ({
          id: p.id,
          restaurantId: activeRestaurant.id,
          name: p.name,
          category: p.category || 'Main Course',
          imageUrl: p.imageUrl,
          platforms: (p.platforms && p.platforms.length > 0 ? ['Zomato', 'Swiggy'] : ['Zomato']) as Platform[],
          totalReviews: p.totalReviews || 1,
          positiveCount: p.positiveCount || 0,
          negativeCount: p.negativeCount || 0,
          neutralCount: p.neutralCount || 0,
          lastAnalyzed: p.lastAnalyzed || new Date().toISOString(),
          dataMode: 'LIVE',
        }));
        setUploadedProducts(mapped);
      } else {
        // No spreadsheet uploaded: keep products completely empty (NO demo data)
        setUploadedProducts([]);
        try {
          localStorage.removeItem(`sellsense_uploaded_products_${activeRestaurant.id}`);
        } catch {}
      }

      // 2. Fetch stats
      const statsRes = await backendApi.getManualReviews({ restaurantId: activeRestaurant.id }).catch(() => null);
      if (statsRes?.stats) {
        setManualStats(statsRes.stats);
      } else {
        setManualStats({
          totalImportedReviews: 0,
          productsCount: 0,
          productNames: [],
          latestImportDate: null,
        });
      }
    } catch (e) {
      console.warn('Could not fetch products summary from backend:', e);
      setUploadedProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchProductsAndStats();
  }, [activeRestaurant.id]);

  // Subscription status
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    hasActiveSubscription: boolean;
    subscription: any;
    features: string[];
  }>({ hasActiveSubscription: false, subscription: null, features: [] });

  useEffect(() => {
    backendApi.getGoogleStatus(restaurant?.id || 'rest_demo_001')
      .then(res => setGoogleConnected(!!res.connection))
      .catch(() => setGoogleConnected(false));
  }, [restaurant]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authStorage.isAuthenticated()) {
      navigate('/login');
    }
  }, [navigate]);

  // Check subscription status
  useEffect(() => {
    const checkSubscription = async () => {
      try {
        if (user) {
          const status = await backendApi.getSubscriptionStatus();
          const features = status.subscription?.features || [];
          setSubscriptionStatus({
            hasActiveSubscription: status.hasActiveSubscription,
            subscription: status.subscription,
            features
          });
        }
      } catch (err) {
        console.error('Subscription check error:', err);
      }
    };
    checkSubscription();
  }, [user]);

  // Products are strictly the ones imported from spreadsheets (NO demo data)
  const allProducts = uploadedProducts;

  // Extract unique categories
  const categories = useMemo(() => {
    return ['All', ...Array.from(new Set(allProducts.map((p) => p.category)))];
  }, [allProducts]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return allProducts.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [allProducts, searchQuery, selectedCategory]);

  const downloadSampleTemplate = () => {
    const csvContent =
      'Dish Name,Customer Review,Rating,Review Date,Platform\n' +
      'Butter Chicken,"Rich and creamy gravy, absolutely delicious but slightly salty.",4,2026-10-18,Zomato\n' +
      'Butter Chicken,"Tender chicken and piping hot delivery. Loved it!",5,2026-10-17,Swiggy\n' +
      'Paneer Tikka,"Crispy on outside and soft inside. Packaging was intact.",5,2026-10-18,Zomato\n' +
      'Garlic Naan,"Arrived lukewarm and a bit rubbery, delivery was late.",2,2026-10-16,Zomato\n' +
      'Veg Biryani,"Aromatic spices and generous portion size. Great value for money.",5,2026-10-19,Swiggy\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'SellSense_Sample_Reviews_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/20 to-lime-50/20">
      <Sidebar restaurantName={activeRestaurant.name} />

      <main className="flex-1 p-6 md:p-8 overflow-x-hidden">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-lime-400 to-cyan-400 rounded-2xl shadow-lg shadow-lime-500/20">
                  <Sparkles className="text-white" size={28} />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                    Food Products
                  </h1>
                  <p className="text-slate-600 text-sm md:text-base font-medium mt-0.5">
                    Live menu items extracted from your uploaded review spreadsheets
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Button
                  variant="primary"
                  onClick={() => setUploadModalOpen(true)}
                  className="bg-gradient-to-r from-lime-500 to-emerald-500 hover:from-lime-600 hover:to-emerald-600 text-slate-950 font-bold py-2.5 px-4 rounded-xl shadow-md flex items-center gap-2"
                >
                  <Upload size={18} />
                  <span>Upload Spreadsheet</span>
                </Button>

                <Button
                  variant="secondary"
                  onClick={() => navigate('/settings')}
                  className="!bg-white !text-slate-800 hover:!bg-slate-50 border border-slate-200 font-bold py-2.5 px-4 rounded-xl shadow-xs flex items-center gap-2"
                >
                  <Settings size={18} className="text-slate-700" />
                  <span className="!text-slate-800">Settings</span>
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Google Reviews Integration Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="bg-gradient-to-r from-emerald-600 via-teal-600 to-lime-600 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center text-white border border-white/20 shadow-inner flex-shrink-0">
                <MapPin size={28} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black tracking-tight">Google Reviews & Maps Intelligence</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    googleConnected ? 'bg-white text-emerald-800' : 'bg-black/20 text-white/90 border border-white/20'
                  }`}>
                    {googleConnected ? '● Connected' : 'Available'}
                  </span>
                </div>
                <p className="text-sm text-emerald-50 mt-1 max-w-2xl">
                  {googleConnected
                    ? 'Google Business Profile is actively connected. View AI sentiment, recurring customer feedback themes, and opportunities.'
                    : 'Analyze customer sentiment, repetitive praises & complaints, and star trends from your Google Maps listings.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {googleConnected ? (
                <>
                  <button
                    onClick={() => navigate('/google-reviews')}
                    className="w-full md:w-auto px-5 py-3 rounded-2xl bg-white text-emerald-800 font-black text-sm hover:bg-emerald-50 transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Open Google Maps Reviews</span>
                    <ArrowRight size={16} />
                  </button>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeRestaurant.name + ' ' + (activeRestaurant.location || ''))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full md:w-auto px-4 py-3 rounded-2xl bg-white/20 hover:bg-white/30 text-white font-bold text-sm border border-white/30 transition flex items-center justify-center gap-1.5"
                    title="Open restaurant listing directly in Google Maps"
                  >
                    <ExternalLink size={15} />
                    <span>View on Maps</span>
                  </a>
                </>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/google-reviews')}
                    className="w-full md:w-auto px-5 py-3 rounded-2xl bg-white text-emerald-800 font-black text-sm hover:bg-emerald-50 transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <MapPin size={16} className="text-emerald-700" />
                    <span>View Google Maps Reviews</span>
                  </button>
                  <button
                    onClick={() => navigate('/google-reviews?connect=true')}
                    className="w-full md:w-auto px-4 py-3 rounded-2xl bg-white/20 hover:bg-white/30 text-white font-bold text-sm border border-white/30 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Connect Profile</span>
                  </button>
                </>
              )}
            </div>
          </motion.div>

          {/* Uploaded Spreadsheet Summary Banner */}
          {manualStats.totalImportedReviews > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-lime-100 text-lime-800 rounded-xl">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {manualStats.totalImportedReviews} Reviews Uploaded across {uploadedProducts.length} Food Items
                  </h4>
                  <p className="text-xs text-slate-500">
                    Click "Analyze Reviews" on any dish to see paired positive/negative themes, sentiment percentages, and fake review detection.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={downloadSampleTemplate}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Sample Template</span>
                </button>
                <button
                  onClick={() => setUploadModalOpen(true)}
                  className="px-3 py-1.5 text-xs font-bold text-lime-900 bg-lime-400 hover:bg-lime-500 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Add More Reviews</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* Filters & Search Controls */}
          {allProducts.length > 0 && (
            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search dishes by name (e.g. Butter Chicken)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent shadow-xs"
                />
              </div>

              {/* Category Pills & View Mode */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                        selectedCategory === cat
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shrink-0">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg transition-colors ${
                      viewMode === 'grid' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'
                    }`}
                    title="Grid View"
                  >
                    <Grid3x3 size={16} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-lg transition-colors ${
                      viewMode === 'list' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'
                    }`}
                    title="List View"
                  >
                    <List size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Loading Spinner */}
          {loadingProducts && (
            <div className="py-24 text-center space-y-3 bg-white rounded-3xl border border-slate-200 shadow-xs">
              <RefreshCw className="w-9 h-9 text-lime-500 animate-spin mx-auto" />
              <p className="text-slate-800 font-bold text-base">Loading Food Items & Review Analytics...</p>
              <p className="text-xs text-slate-400">Scanning uploaded spreadsheet batches...</p>
            </div>
          )}

          {/* EMPTY STATE: When NO spreadsheet has been uploaded yet */}
          {!loadingProducts && allProducts.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="bg-white rounded-3xl border-2 border-dashed border-slate-300 p-10 md:p-16 text-center shadow-sm space-y-6"
            >
              <div className="w-20 h-20 bg-lime-100 text-lime-700 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                <UtensilsCrossed size={40} />
              </div>

              <div className="max-w-md mx-auto space-y-2">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  No Food Items Listed Yet
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  Upload your spreadsheet (CSV or Excel) containing customer reviews. Our AI will automatically parse all dishes, generate repetitive good & bad analyses, calculate sentiment percentages, and flag fake/nonsense reviews!
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Button
                  variant="primary"
                  onClick={() => setUploadModalOpen(true)}
                  className="w-full sm:w-auto bg-gradient-to-r from-lime-500 to-emerald-500 hover:from-lime-600 hover:to-emerald-600 text-slate-950 font-black px-6 py-3 rounded-2xl shadow-lg flex items-center justify-center gap-2"
                >
                  <Upload size={18} />
                  <span>Upload Spreadsheet (CSV / Excel)</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={downloadSampleTemplate}
                  className="w-full sm:w-auto font-bold border-slate-300 hover:bg-slate-50 text-slate-700 px-5 py-3 rounded-2xl flex items-center justify-center gap-2"
                >
                  <Download size={18} />
                  <span>Download Sample Template</span>
                </Button>
              </div>

              <div className="pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4 text-left max-w-3xl mx-auto">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <span className="text-xs font-bold text-slate-800 block mb-1">1. Side-by-Side Category Analysis</span>
                  <span className="text-[11px] text-slate-500">Compare recurring praises and complaints grouped under the exact same aspect (Taste, Packaging, Temperature).</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <span className="text-xs font-bold text-slate-800 block mb-1">2. Sentiment Percentages</span>
                  <span className="text-[11px] text-slate-500">Real-time percentage meters of positive, negative, and neutral customer feedback for each dish.</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <span className="text-xs font-bold text-slate-800 block mb-1">3. Fake Review Detection</span>
                  <span className="text-[11px] text-slate-500">Detects gibberish nonsense, robotic copy-paste duplicates, and contradictory ratings.</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Products Grid / List */}
          {!loadingProducts && allProducts.length > 0 && filteredProducts.length > 0 && (
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className={viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-6'}
            >
              {filteredProducts.map((product) => (
                <motion.div
                  key={product.id}
                  variants={item}
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <ProductCard
                    product={product}
                    hasUploadedData={true}
                    onAnalyzeUploadedReviews={(name) => setSelectedProductForAnalysis(name)}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* No search results state */}
          {!loadingProducts && allProducts.length > 0 && filteredProducts.length === 0 && (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 space-y-3">
              <Search className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-lg font-bold text-slate-800">No matching dishes found</h3>
              <p className="text-xs text-slate-500">Try adjusting your search query or category filter.</p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                className="text-xs font-bold text-lime-700 underline pt-1"
              >
                Reset filters
              </button>
            </div>
          )}

          {/* Stats Footer */}
          {allProducts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-black text-slate-900 mb-1">{filteredProducts.length}</div>
                  <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Dishes on Menu</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-emerald-600 mb-1">
                    {filteredProducts.reduce((acc, p) => acc + p.positiveCount, 0)}
                  </div>
                  <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Positive Reviews</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-red-600 mb-1">
                    {filteredProducts.reduce((acc, p) => acc + p.negativeCount, 0)}
                  </div>
                  <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Negative Reviews</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-cyan-600 mb-1">
                    {filteredProducts.reduce((acc, p) => acc + p.totalReviews, 0)}
                  </div>
                  <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Spreadsheet Reviews</div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Upgrade / Subscription Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-md">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-lime-400 to-cyan-400 rounded-2xl shadow-lg">
                  {subscriptionStatus.hasActiveSubscription ? (
                    <CheckCircle className="text-white" size={28} />
                  ) : (
                    <CreditCard className="text-white" size={28} />
                  )}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900">
                    {subscriptionStatus.hasActiveSubscription ? 'Premium Plan Active' : 'Upgrade to SellSense Pro'}
                  </h3>
                  <p className="text-slate-600 text-sm">
                    {subscriptionStatus.hasActiveSubscription
                      ? 'You have full access to repetitive review analysis, fake review detection, and Google Reviews intelligence.'
                      : 'Unlock deeper customer analytics, automated AI responses, and Google Reviews integration.'}
                  </p>
                </div>
              </div>

              {!subscriptionStatus.hasActiveSubscription ? (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Lock className="text-slate-400" size={18} />
                        <span className="font-bold text-slate-800 text-sm">Repetitive Review Themes</span>
                      </div>
                      <p className="text-xs text-slate-500">Pinpoint exactly which recipe ingredients cause repeated positive or negative feedback.</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Lock className="text-slate-400" size={18} />
                        <span className="font-bold text-slate-800 text-sm">Fake & Duplicate Scanner</span>
                      </div>
                      <p className="text-xs text-slate-500">Automated filtering of bot gibberish, copy-paste duplicates, and contradictory reviews.</p>
                    </div>
                    <div
                      onClick={() => navigate('/google-reviews')}
                      className="p-4 bg-slate-50 hover:bg-emerald-50/60 rounded-2xl border border-slate-200 hover:border-emerald-300 transition-all cursor-pointer group"
                      title="Explore Google Maps Reviews Analysis"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="text-emerald-600 group-hover:scale-110 transition-transform" size={18} />
                          <span className="font-bold text-slate-800 group-hover:text-emerald-800 text-sm">Google Maps Reviews</span>
                        </div>
                        <ArrowRight size={14} className="text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition" />
                      </div>
                      <p className="text-xs text-slate-500 group-hover:text-slate-600">Live synchronization with your Google Business Profile with location-specific insights.</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
                    <span className="text-sm font-semibold text-slate-600">
                      Plans starting at just ₹531/month. Instant admin activation upon payment verification.
                    </span>
                    <Button
                      variant="primary"
                      onClick={() => navigate('/payment')}
                      className="w-full sm:w-auto bg-gradient-to-r from-lime-500 to-cyan-500 hover:from-lime-600 hover:to-cyan-600 text-slate-950 font-black px-6 py-3 rounded-2xl shadow-lg flex items-center justify-center gap-2"
                    >
                      <Sparkles size={18} />
                      <span>Upgrade Now</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="text-emerald-600" size={20} />
                    <span className="text-sm font-bold">All premium features are unlocked and active!</span>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/settings')}
                    className="text-xs font-bold border-emerald-300 text-emerald-900 hover:bg-emerald-100 py-1.5 px-3 rounded-xl"
                  >
                    View Plan Settings
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </main>

      {/* Spreadsheet Upload Modal */}
      <UploadReviewsModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        restaurantId={activeRestaurant.id}
        onSuccess={() => {
          fetchProductsAndStats();
        }}
      />

      {/* Dedicated Per-Food Analysis Modal */}
      {selectedProductForAnalysis && (
        <ManualReviewAnalysisModal
          isOpen={!!selectedProductForAnalysis}
          onClose={() => setSelectedProductForAnalysis(null)}
          productName={selectedProductForAnalysis}
          restaurantId={activeRestaurant.id}
        />
      )}
    </div>
  );
};
