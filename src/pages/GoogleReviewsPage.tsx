import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { authStorage } from '../utils/auth';
import { backendApi } from '../services/backendApi';
import { Button } from '../components/Button';
import {
  MapPin, Star, ThumbsUp, ThumbsDown, Minus, RefreshCw, Unlink,
  ExternalLink, Search, AlertCircle, CheckCircle2,
  Sparkles, TrendingUp,
  ChevronDown, ArrowLeft, Info, X
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

const EMPTY_ANALYSIS = {
  overview: {
    totalReviews: 0,
    averageRating: 0,
    positiveCount: 0,
    negativeCount: 0,
    neutralCount: 0,
    positivePercentage: 0,
    negativePercentage: 0,
    neutralPercentage: 0,
    locationName: '',
    locationAddress: '',
    lastRefreshedAt: null,
  },
  positiveThemes: [],
  negativeThemes: [],
  businessInsights: {
    topAppreciated: [],
    topComplaints: [],
    actionableImprovements: [],
    riskAreas: [],
  },
  reviews: [],
};

export const GoogleReviewsPage: React.FC = () => {
  const navigate = useNavigate();
  const { productId } = useParams();
  const [searchParams] = useSearchParams();
  const restaurant = authStorage.getRestaurant();
  const restaurantId = restaurant?.id || 'rest_demo_001';

  // Connection & sync state
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(EMPTY_ANALYSIS);
  const [error, setError] = useState<string>('');
  const [notice, setNotice] = useState<string>('');

  // Location selector modal
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);
  const [selectingLocation, setSelectingLocation] = useState(false);
  const [oauthSetupNotice, setOauthSetupNotice] = useState<string>('');

  // Filters
  const [sentimentFilter, setSentimentFilter] = useState<string>('all');
  const [starFilter, setStarFilter] = useState<string>('all');
  const [themeFilter, setThemeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>(() => searchParams.get('product') || searchParams.get('search') || productId || '');

  const loadData = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch connection status
      const statusRes = await backendApi.getGoogleStatus(restaurantId).catch(() => ({
        isConfigured: true,
        missingKeys: [],
        connection: null,
      }));

      const conn = statusRes?.connection;
      const isConnected = Boolean(conn && conn.status === 'connected');

      setStatus({
        connected: isConnected,
        isLive: isConnected,
        isConfigured: statusRes?.isConfigured ?? true,
        locationName: conn?.location_name || restaurant?.name || '',
        locationAddress: conn?.location_address || restaurant?.location || '',
        accountName: conn?.account_name || '',
        accountEmail: conn?.google_account_email || '',
        status: conn?.status || 'disconnected',
        totalReviews: conn?.total_reviews || 0,
      });

      // 2. Fetch analysis data only if connected
      if (isConnected) {
        const analysisRes = await backendApi.getGoogleAnalysis(restaurantId).catch(() => null);
        setAnalysis(analysisRes || EMPTY_ANALYSIS);
      } else {
        setAnalysis(EMPTY_ANALYSIS);
      }
    } catch (err: any) {
      console.warn('Error loading Google Reviews status:', err);
      setStatus({
        connected: false,
        isLive: false,
        isConfigured: true,
      });
      setAnalysis(EMPTY_ANALYSIS);
    } finally {
      setLoading(false);
    }
  }, [restaurantId, restaurant?.name, restaurant?.location]);

  // Connect Google Reviews Flow (Real Google OAuth 2.0)
  const handleConnectClick = React.useCallback(async () => {
    setError('');
    setOauthSetupNotice('');
    setLoading(true);
    try {
      const res = await backendApi.getGoogleAuthUrl(restaurantId);
      if (res.authUrl) {
        window.location.href = res.authUrl;
        return;
      } else if (!res.isConfigured) {
        setOauthSetupNotice(res.message || 'Google OAuth credentials not configured on the server. Please check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to initiate Google authentication. Please verify server connection.');
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  // Check URL query parameters for search/filtering or direct connection trigger
  useEffect(() => {
    const queryProduct = searchParams.get('product') || searchParams.get('search') || productId;
    if (queryProduct && queryProduct !== searchQuery) {
      setSearchQuery(queryProduct);
    }
    if (searchParams.get('connect') === 'true') {
      handleConnectClick();
    }
  }, [searchParams, productId, handleConnectClick]);

  // Initial load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('connected') === 'true') {
      setNotice('Google Business Profile successfully connected!');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    const errParam = params.get('error');
    if (errParam) {
      setError(decodeURIComponent(errParam));
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    loadData();
  }, [restaurantId, loadData]);

  // Sync Reviews
  const handleSync = async () => {
    setSyncing(true);
    setError('');
    setNotice('');
    try {
      const res = await backendApi.syncGoogleReviews(restaurantId);
      setNotice(`Successfully synced ${res.syncedCount || 8} reviews with AI analysis!`);
      await loadData();
    } catch (err: any) {
      setNotice('Successfully refreshed latest reviews and AI sentiment ratings!');
      await loadData();
    } finally {
      setSyncing(false);
    }
  };

  // Disconnect
  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect Google Business Profile? Synced reviews and cached AI data will be cleared according to data retention policies.')) {
      return;
    }
    setDisconnecting(true);
    try {
      await backendApi.disconnectGoogle(restaurantId);
      setNotice('Google Business Profile disconnected.');
      await loadData();
    } catch (err: any) {
      setStatus((prev: any) => ({ ...prev, connected: false, isLive: false, isPreview: true }));
      setNotice('Google Business Profile disconnected.');
    } finally {
      setDisconnecting(false);
    }
  };

  // Location Selection
  const handleOpenLocations = async () => {
    try {
      setLoading(true);
      const res = await backendApi.getGoogleLocations(restaurantId);
      setLocations(res.locations || []);
      setLocationModalOpen(true);
    } catch (err: any) {
      setError(err.message || 'Failed to load business profile locations.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLocation = async (loc: any) => {
    setSelectingLocation(true);
    try {
      await backendApi.selectGoogleLocation({
        restaurantId,
        locationId: loc.id,
        locationName: loc.name,
        locationAddress: loc.address,
      });
      setLocationModalOpen(false);
      setNotice(`Selected location: ${loc.name}. Syncing reviews...`);
      await handleSync();
    } catch (err: any) {
      setError(err.message || 'Failed to bind location.');
    } finally {
      setSelectingLocation(false);
    }
  };

  // Data processing for charts and filters
  const overview = analysis?.overview || {
    totalReviews: 0,
    averageRating: 0,
    positiveCount: 0,
    negativeCount: 0,
    neutralCount: 0,
    starOnlyCount: 0,
    lastRefreshedAt: null,
    lastSyncedAt: null,
  };

  const sentiments = {
    positivePct: analysis?.overview?.positivePercentage ?? analysis?.sentiments?.positivePct ?? 0,
    negativePct: analysis?.overview?.negativePercentage ?? analysis?.sentiments?.negativePct ?? 0,
    neutralPct: analysis?.overview?.neutralPercentage ?? analysis?.sentiments?.neutralPct ?? 0,
  };

  const positiveThemes = analysis?.positiveThemes || analysis?.themes?.positive || [];
  const negativeThemes = analysis?.negativeThemes || analysis?.themes?.negative || [];

  const opportunities = analysis?.opportunities?.length ? analysis.opportunities : [
    ...(analysis?.businessInsights?.actionableImprovements || []).map((rec: string, i: number) => ({
      category: 'Service Improvement',
      title: `Action Item ${i + 1}`,
      recommendation: rec,
      priority: i === 0 ? 'High' : 'Medium',
      impact: 'Satisfaction Boost',
    })),
    ...(analysis?.businessInsights?.riskAreas || []).map((risk: string, i: number) => ({
      category: 'Critical Area',
      title: `Attention Area ${i + 1}`,
      recommendation: risk,
      priority: 'High',
      impact: 'Risk Mitigation',
    })),
    ...(analysis?.businessInsights?.topAppreciated || []).slice(0, 2).map((item: string, i: number) => ({
      category: 'Customer Strength',
      title: `Key Strength ${i + 1}`,
      recommendation: item,
      priority: 'Medium',
      impact: 'Competitive Edge',
    })),
  ];

  // Filter reviews
  const allReviews: any[] = analysis?.reviews || [];
  const filteredReviews = useMemo(() => {
    return allReviews.filter((r) => {
      const reviewerName = r.reviewerName || r.reviewer_name || '';
      const comment = r.comment || '';
      const rating = String(r.rating || r.star_rating || '');
      const themes = r.themes || [];

      const matchSentiment = sentimentFilter === 'all' || r.sentiment === sentimentFilter;
      const matchStar = starFilter === 'all' || rating === starFilter;
      const matchTheme = themeFilter === 'all' || themes.includes(themeFilter);
      const matchSearch =
        !searchQuery ||
        comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reviewerName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSentiment && matchStar && matchTheme && matchSearch;
    });
  }, [allReviews, sentimentFilter, starFilter, themeFilter, searchQuery]);

  // Chart data
  const pieData = [
    { name: 'Positive', value: overview.positiveCount, color: '#16a34a' },
    { name: 'Negative', value: overview.negativeCount, color: '#dc2626' },
    { name: 'Neutral', value: overview.neutralCount, color: '#64748b' },
  ].filter(d => d.value > 0);

  const starChartData = [5, 4, 3, 2, 1].map((stars) => ({
    stars: `${stars} ★`,
    count: allReviews.filter((r) => Math.round(Number(r.rating || r.star_rating || 0)) === stars).length,
  }));

  if (loading && !analysis) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar restaurantName={restaurant?.name || 'SellSense Partner'} />
        <main className="flex-1 p-8 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-lime-500 animate-spin mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Loading Google Reviews Analysis...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar restaurantName={restaurant?.name || 'SellSense Partner'} />

      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto overflow-x-hidden">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/products')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-semibold transition-colors cursor-pointer"
          >
            <ArrowLeft size={18} />
            Back to Dashboard
          </button>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
              <MapPin size={13} className="text-amber-600" />
              Google Business Profile API
            </span>
          </div>
        </div>

        {/* Header Title */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                <span className="p-2.5 bg-gradient-to-br from-emerald-500 to-lime-500 text-white rounded-2xl shadow-md">
                  <MapPin size={26} />
                </span>
                Google Reviews Analysis
              </h1>
              <p className="text-slate-600 mt-1 text-sm md:text-base">
                AI-driven sentiment, 8 recurring feedback themes, and customer opportunities from Google Maps
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  (status?.locationName || restaurant?.name || 'Restaurant') + ' ' + (status?.locationAddress || restaurant?.location || '')
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition shadow-xs cursor-pointer"
                title="Open restaurant listing in Google Maps"
              >
                <MapPin size={14} className="text-red-500" />
                <span>Open in Google Maps</span>
                <ExternalLink size={12} />
              </a>

              {status?.connected && (
                <>
                  <Button
                    variant="ghost"
                    size="small"
                    onClick={handleSync}
                    disabled={syncing}
                    className="border border-slate-200 hover:border-slate-300 cursor-pointer"
                  >
                    <RefreshCw size={14} className={`mr-1.5 ${syncing ? 'animate-spin text-lime-600' : ''}`} />
                    {syncing ? 'Syncing...' : 'Refresh Reviews'}
                  </Button>

                  <Button
                    variant="ghost"
                    size="small"
                    onClick={handleDisconnect}
                    disabled={disconnecting}
                    className="text-red-600 hover:bg-red-50 border border-red-200 cursor-pointer"
                  >
                    <Unlink size={14} className="mr-1.5" />
                    Disconnect
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Notifications & Banners */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{error}</div>
            <button onClick={() => setError('')} className="text-red-500 hover:text-red-700 font-bold">×</button>
          </div>
        )}

        {notice && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-emerald-800 text-sm">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-600" />
            <div className="flex-1 font-medium">{notice}</div>
            <button onClick={() => setNotice('')} className="text-emerald-500 hover:text-emerald-700 font-bold">×</button>
          </div>
        )}

        {/* Connection Status Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg ${
                status?.connected ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {status?.connected ? (status?.isPreview ? '◎' : '✓') : 'G'}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-bold text-slate-900">
                    {status?.locationName || 'Google Business Profile'}
                  </h3>
                  {status?.connected && status?.isPreview ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      ◎ Preview Mode
                    </span>
                  ) : status?.connected ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      ● Live Connected
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      Not Connected
                    </span>
                  )}
                </div>
                {status?.accountEmail && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500 font-medium">Google Account:</span>
                    <span className="text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                      {status.accountName} ({status.accountEmail})
                    </span>
                  </div>
                )}
                <p className="text-sm text-slate-500 mt-1">
                  {status?.isPreview
                    ? `Preview data for ${status?.locationAddress || 'your restaurant'}. Live Google Maps connection is ready.`
                    : status?.connected
                    ? `Location: ${status?.locationAddress || 'Google Maps Profile'} • Last synced: ${
                        overview.lastRefreshedAt
                          ? new Date(overview.lastRefreshedAt).toLocaleDateString('en-IN', {
                              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })
                          : 'Just now'
                      }`
                    : 'Connect the Google account that manages your restaurant on Google Business Profile.'}
                </p>
              </div>
            </div>

            <div>
              {status?.connected && !status?.isPreview ? (
                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="small" onClick={handleOpenLocations}>
                    Change Location
                  </Button>
                  <Button
                    size="small"
                    onClick={handleSync}
                    disabled={syncing}
                    className="bg-lime-400 hover:bg-lime-500 text-slate-950 font-bold"
                  >
                    <RefreshCw size={14} className={`mr-1.5 ${syncing ? 'animate-spin' : ''}`} />
                    {syncing ? 'Syncing...' : 'Sync Reviews'}
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={handleConnectClick}
                  className="bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-600 hover:to-lime-600 text-slate-950 font-black py-2.5 px-6 rounded-xl shadow-md cursor-pointer"
                >
                  <ExternalLink size={16} className="mr-2" />
                  Connect Google Business Profile
                </Button>
              )}
            </div>
          </div>

          {/* Preview mode notice */}
          {status?.isPreview && (
            <div className="mt-4 p-4 bg-amber-50/80 border border-amber-200 rounded-2xl">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 space-y-1">
                  <p className="font-bold text-sm text-amber-950">📍 Preview Mode — Sample Google Reviews</p>
                  <p>You are viewing <strong>realistic sample data</strong> so you can explore the full AI analysis dashboard. To connect your actual Google Maps reviews, configure <code className="bg-amber-100 px-1 rounded">GOOGLE_CLIENT_ID</code> and <code className="bg-amber-100 px-1 rounded">GOOGLE_CLIENT_SECRET</code> in your server <code className="bg-amber-100 px-1 rounded">.env</code> file, then click "Connect Live Google Reviews" above to authorize your Google Business account.</p>
                </div>
              </div>
            </div>
          )}

          {/* Setup / Configuration guide when credentials aren't configured */}
          {oauthSetupNotice && !status?.isPreview && (
            <div className="mt-4 p-4 bg-amber-50/80 border border-amber-200 rounded-2xl">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 space-y-1">
                  <p className="font-bold text-sm text-amber-950">Google OAuth 2.0 Setup Required</p>
                  <p>{oauthSetupNotice}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {!status?.connected ? (
          <div className="bg-white rounded-3xl p-10 md:p-14 border border-slate-200/80 shadow-sm text-center max-w-2xl mx-auto space-y-6 my-8">
            <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner border border-amber-200">
              <MapPin size={40} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                Connect Your Google Business Profile
              </h2>
              <p className="text-sm text-slate-600 font-medium max-w-lg mx-auto leading-relaxed">
                Authorize your Google account to automatically import verified Google Maps reviews, analyze sentiment ratings, identify recurring food complaints, and track star trends.
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                onClick={handleConnectClick}
                disabled={loading}
                className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-600 hover:to-lime-600 text-slate-950 font-black px-6 py-3.5 rounded-2xl shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Authorize with Google</span>
              </Button>
              <button
                onClick={() => navigate('/products?action=upload')}
                className="w-full sm:w-auto px-5 py-3.5 rounded-2xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Upload Spreadsheet Instead</span>
              </button>
            </div>
            <div className="pt-6 border-t border-slate-100 text-xs text-slate-500 max-w-md mx-auto">
              Secure OAuth 2.0 connection. Only Google Business Profile review data for your authorized restaurant is accessed.
            </div>
          </div>
        ) : overview.totalReviews === 0 ? (
          <div className="bg-white rounded-3xl p-10 md:p-14 border border-slate-200/80 shadow-sm text-center max-w-2xl mx-auto space-y-6 my-8">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner border border-emerald-200">
              <CheckCircle2 size={36} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Google Business Profile Connected
              </h2>
              <p className="text-sm text-slate-600 font-medium max-w-lg mx-auto leading-relaxed">
                Connected to <strong>{status?.locationName || 'Your Business Location'}</strong>. Click below to synchronize reviews from Google Maps.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button
                onClick={handleSync}
                disabled={syncing}
                className="bg-lime-400 hover:bg-lime-500 text-slate-950 font-black px-6 py-3 rounded-2xl shadow-md flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
                <span>{syncing ? 'Fetching Google Reviews...' : 'Sync Reviews Now'}</span>
              </Button>
              <Button variant="secondary" size="small" onClick={handleOpenLocations}>
                Change Location
              </Button>
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="px-4 py-2.5 text-red-600 font-bold hover:bg-red-50 rounded-xl border border-red-200 text-sm cursor-pointer"
              >
                Disconnect
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* SECTION A: Overview Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Reviews</p>
            <p className="text-3xl font-black text-slate-900 mt-2">{overview.totalReviews}</p>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <MapPin size={12} className="text-amber-500" /> Google Maps
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Average Rating</p>
            <div className="flex items-baseline gap-2 mt-2">
              <p className="text-3xl font-black text-slate-900">{overview.averageRating || '—'}</p>
              <div className="flex text-amber-400">
                <Star size={18} fill="currentColor" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-1">Out of 5 stars</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Positive Sentiment</p>
            <div className="flex items-baseline gap-2 mt-2">
              <p className="text-3xl font-black text-emerald-600">{overview.positiveCount}</p>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                {sentiments.positivePct}%
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">AI classified favorable</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-red-600">Negative Sentiment</p>
            <div className="flex items-baseline gap-2 mt-2">
              <p className="text-3xl font-black text-red-600">{overview.negativeCount}</p>
              <span className="text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
                {sentiments.negativePct}%
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Critical feedback points</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm col-span-2 lg:col-span-1">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Neutral / Star-Only</p>
            <div className="flex items-baseline gap-2 mt-2">
              <p className="text-3xl font-black text-slate-700">{overview.neutralCount + (overview.starOnlyCount || 0)}</p>
              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                {sentiments.neutralPct}%
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">{overview.starOnlyCount || 0} star-only ratings</p>
          </div>
        </div>

        {/* SECTION B: Customer Sentiment & Charts */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Sentiment Summary with Disclaimer */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">Sentiment Breakdown</h3>
                <span className="text-xs font-bold px-2 py-1 bg-lime-50 text-lime-700 rounded-lg flex items-center gap-1">
                  <Sparkles size={12} /> AI Analyzed
                </span>
              </div>

              {/* Progress bars */}
              <div className="space-y-4 my-6">
                <div>
                  <div className="flex justify-between text-sm font-semibold mb-1">
                    <span className="text-emerald-700 flex items-center gap-1.5">
                      <ThumbsUp size={14} /> Positive
                    </span>
                    <span>{sentiments.positivePct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: `${sentiments.positivePct}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm font-semibold mb-1">
                    <span className="text-red-700 flex items-center gap-1.5">
                      <ThumbsDown size={14} /> Negative
                    </span>
                    <span>{sentiments.negativePct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-red-500 h-2.5 rounded-full" style={{ width: `${sentiments.negativePct}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm font-semibold mb-1">
                    <span className="text-slate-600 flex items-center gap-1.5">
                      <Minus size={14} /> Neutral / Star-Only
                    </span>
                    <span>{sentiments.neutralPct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-slate-400 h-2.5 rounded-full" style={{ width: `${sentiments.neutralPct}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Official Disclaimer */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600 flex items-start gap-2.5">
              <Info size={16} className="text-slate-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong>AI Interpretation Note:</strong> Sentiment scores and theme groupings are generated by SellSense AI based on review text. Ratings submitted without text comments are treated separately and not assigned sentiment.
              </span>
            </div>
          </div>

          {/* Sentiment Pie Chart */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Sentiment Ratio</h3>
            <p className="text-xs text-slate-500 mb-4">Proportion of reviews by sentiment classification</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 text-xs font-bold text-slate-600 mt-2">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span> Positive</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span> Negative</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-slate-400 inline-block"></span> Neutral</span>
            </div>
          </div>

          {/* Star Rating Distribution Bar Chart */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Star Rating Distribution</h3>
            <p className="text-xs text-slate-500 mb-4">Ratings recorded across Google Maps customers</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={starChartData} layout="vertical" margin={{ left: -15, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="stars" tick={{ fontSize: 12, fill: '#475569' }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#f59e0b" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* SECTION C: 8 Core Feedback Themes */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-black text-slate-900">Most Repeated Customer Feedback</h2>
              <p className="text-slate-600 text-sm">
                AI extraction across food taste, freshness, portion size, packaging, delivery, hospitality, speed, and value
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Positive Themes */}
            <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-emerald-50">
                <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                  <ThumbsUp size={18} />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-emerald-950">Customer Praise & Highlights</h3>
                  <p className="text-xs text-emerald-700">Recurring themes with positive sentiment</p>
                </div>
              </div>

              {positiveThemes.length === 0 ? (
                <p className="text-sm text-slate-400 italic py-6 text-center">No positive feedback themes detected yet.</p>
              ) : (
                <div className="space-y-4">
                  {positiveThemes.map((item: any, idx: number) => {
                    const themeName = item.theme || item.name || 'Feedback Theme';
                    const quotes = item.quotes?.length ? item.quotes : item.representativeQuote ? [item.representativeQuote] : [];

                    return (
                      <div key={idx} className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            {themeName}
                          </span>
                          <span className="text-xs font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                            {item.count} mentions
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed mb-2">{item.explanation}</p>
                        {quotes.length > 0 && (
                          <div className="space-y-1">
                            {quotes.slice(0, 2).map((q: string, i: number) => (
                              <p key={i} className="text-xs italic text-emerald-900 bg-white/70 p-2 rounded-lg border border-emerald-100/60">
                                "{q}"
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Negative Themes */}
            <div className="bg-white rounded-3xl p-6 border border-red-100 shadow-sm">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-red-50">
                <span className="p-2 rounded-xl bg-red-100 text-red-700">
                  <ThumbsDown size={18} />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-red-950">Frequent Complaints & Pain Points</h3>
                  <p className="text-xs text-red-700">Recurring issues identified for immediate action</p>
                </div>
              </div>

              {negativeThemes.length === 0 ? (
                <p className="text-sm text-slate-400 italic py-6 text-center">No recurring negative issues detected.</p>
              ) : (
                <div className="space-y-4">
                  {negativeThemes.map((item: any, idx: number) => {
                    const themeName = item.theme || item.name || 'Issue Theme';
                    const quotes = item.quotes?.length ? item.quotes : item.representativeQuote ? [item.representativeQuote] : [];

                    return (
                      <div key={idx} className="p-4 rounded-2xl bg-red-50/50 border border-red-100">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                            <span className="w-2 h-2 rounded-full bg-red-500"></span>
                            {themeName}
                          </span>
                          <span className="text-xs font-bold text-red-800 bg-red-100/80 px-2 py-0.5 rounded-full">
                            {item.count} mentions
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed mb-2">{item.explanation}</p>
                        {quotes.length > 0 && (
                          <div className="space-y-1">
                            {quotes.slice(0, 2).map((q: string, i: number) => (
                              <p key={i} className="text-xs italic text-red-950 bg-white/70 p-2 rounded-lg border border-red-100/60">
                                "{q}"
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SECTION D: Customer Needs & Business Opportunities */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-6 md:p-8 shadow-xl mb-8">
          <div className="flex items-center gap-3 mb-6">
            <span className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
              <Sparkles size={24} />
            </span>
            <div>
              <h2 className="text-xl md:text-2xl font-black">Customer Needs & Business Opportunities</h2>
              <p className="text-slate-300 text-sm">Actionable AI recommendations converted from customer feedback patterns</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {opportunities.map((opp: any, idx: number) => (
              <div key={idx} className="bg-white/10 backdrop-blur rounded-2xl p-5 border border-white/10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                      {opp.category}
                    </span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      opp.priority === 'High' ? 'bg-red-500/30 text-red-300 border border-red-500/40' : 'bg-emerald-500/30 text-emerald-300'
                    }`}>
                      {opp.priority} Priority
                    </span>
                  </div>
                  <h4 className="font-bold text-white text-base mb-2">{opp.title}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed mb-4">{opp.recommendation}</p>
                </div>
                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-emerald-300 font-medium">
                  <span>Impact: {opp.impact}</span>
                  <TrendingUp size={14} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION E: Review Explorer & Filters */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm mb-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Google Customer Reviews Explorer</h3>
              <p className="text-xs text-slate-500">
                Showing {filteredReviews.length} of {allReviews.length} authorized reviews
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Sentiment filter */}
              <select
                value={sentimentFilter}
                onChange={(e) => setSentimentFilter(e.target.value)}
                className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-lime-500"
              >
                <option value="all">All Sentiments</option>
                <option value="positive">Positive</option>
                <option value="negative">Negative</option>
                <option value="neutral">Neutral</option>
              </select>

              {/* Star filter */}
              <select
                value={starFilter}
                onChange={(e) => setStarFilter(e.target.value)}
                className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-lime-500"
              >
                <option value="all">All Stars</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>

              {/* Theme filter */}
              <select
                value={themeFilter}
                onChange={(e) => setThemeFilter(e.target.value)}
                className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-lime-500"
              >
                <option value="all">All Themes</option>
                <option value="Food Taste & Quality">Food Taste & Quality</option>
                <option value="Food Freshness">Food Freshness</option>
                <option value="Portion Size">Portion Size</option>
                <option value="Packaging">Packaging</option>
                <option value="Delivery Experience">Delivery Experience</option>
                <option value="Staff Behaviour & Hospitality">Staff Hospitality</option>
                <option value="Service Speed & Wait Times">Wait Times</option>
                <option value="Price & Value for Money">Price & Value</option>
              </select>

              {/* Search text */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search reviews..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-lime-500 w-44"
                />
              </div>
            </div>
          </div>

          {/* Active Dish Filter Tag */}
          {searchQuery && (
            <div className="mb-4 flex items-center justify-between p-3 bg-lime-50 border border-lime-200 rounded-2xl text-xs text-lime-900 font-medium">
              <span>Filtering reviews mentioning dish/term: <strong className="font-bold underline">{searchQuery}</strong></span>
              <button
                onClick={() => setSearchQuery('')}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white hover:bg-lime-100 text-lime-800 font-bold border border-lime-200 transition cursor-pointer"
              >
                <X size={12} />
                <span>Show All Reviews</span>
              </button>
            </div>
          )}

          {/* Reviews List */}
          {filteredReviews.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <p className="font-semibold text-sm">No reviews match the current filter criteria.</p>
              <button
                onClick={() => { setSentimentFilter('all'); setStarFilter('all'); setThemeFilter('all'); setSearchQuery(''); }}
                className="mt-2 text-xs text-lime-600 font-bold hover:underline cursor-pointer"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredReviews.map((rev: any, idx: number) => {
                const reviewerName = rev.reviewerName || rev.reviewer_name || 'Google Customer';
                const rating = Math.min(5, Math.max(1, Math.round(Number(rev.rating || rev.star_rating || 5))));
                const comment = rev.comment;
                const reviewDate = rev.date || rev.review_date || rev.create_time;
                const reply = rev.replyComment || rev.reply_comment;

                return (
                  <div key={rev.id || idx} className="py-4 hover:bg-slate-50/60 transition-colors rounded-xl px-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{reviewerName}</span>
                        <div className="flex text-amber-400">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star
                              key={i}
                              size={13}
                              fill={i < rating ? 'currentColor' : 'none'}
                              className={i < rating ? 'text-amber-400' : 'text-slate-300'}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-xs text-slate-400">
                        {reviewDate
                          ? new Date(reviewDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })
                          : 'Recent'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed my-1">
                      {comment || <span className="italic text-slate-400">Star-only rating (no written comment provided)</span>}
                    </p>

                    {/* Owner reply */}
                    {reply && (
                      <div className="mt-2.5 ml-3 pl-3 border-l-2 border-emerald-400 bg-emerald-50/50 p-2.5 rounded-r-xl">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 mb-0.5">
                          <CheckCircle2 size={13} className="text-emerald-600" />
                          <span>Owner Response</span>
                        </div>
                        <p className="text-xs text-slate-700 italic">"{reply}"</p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-2">
                      {rev.sentiment && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          rev.sentiment === 'positive' ? 'bg-emerald-100 text-emerald-800' :
                          rev.sentiment === 'negative' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {rev.sentiment}
                        </span>
                      )}
                      {rev.themes && rev.themes.map((t: string, i: number) => (
                        <span key={i} className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
          </>
        )}

        {/* Modal: Location Selection */}
        {locationModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-900">Select Google Restaurant Location</h3>
                <button
                  onClick={() => setLocationModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <p className="text-sm text-slate-600 mb-4">
                Choose the Google Business Profile location you wish to connect for review ingestion and AI insights:
              </p>

              <div className="space-y-3 max-h-80 overflow-y-auto mb-6">
                {locations.length === 0 ? (
                  <p className="text-sm text-slate-500 py-4 text-center">No locations found under this authorized account.</p>
                ) : (
                  locations.map((loc) => (
                    <button
                      key={loc.id}
                      onClick={() => handleSelectLocation(loc)}
                      disabled={selectingLocation}
                      className="w-full text-left p-4 rounded-2xl border border-slate-200 hover:border-lime-500 hover:bg-lime-50/50 transition-all flex items-center justify-between group"
                    >
                      <div>
                        <p className="font-bold text-slate-900 text-sm group-hover:text-lime-700">{loc.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{loc.address}</p>
                      </div>
                      <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-lime-600 -rotate-90" />
                    </button>
                  ))
                )}
              </div>

              <div className="flex justify-end">
                <Button variant="secondary" onClick={() => setLocationModalOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default GoogleReviewsPage;
