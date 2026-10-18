import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/Button';
import { authStorage } from '../utils/auth';
import { Loader2, CheckCircle, XCircle, ExternalLink, ArrowLeft, ChevronRight, AlertCircle, Info, Search, MapPin, X } from 'lucide-react';
import { zomatoApi, convertZomatoToRestaurant } from '../services/zomatoApi';
import { backendApi } from '../services/backendApi';
import type { Restaurant, BusinessType } from '../types';

export const ZomatoConnectPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<'connect' | 'select' | 'configure' | 'complete'>('connect');
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [businessDetails, setBusinessDetails] = useState({
    ownerName: '',
    contactEmail: '',
    businessType: 'Restaurant' as BusinessType,
    description: ''
  });
  const [apiMode, setApiMode] = useState<'demo' | 'real'>('demo');

  // Search state for production mode
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Check API mode on mount
  useEffect(() => {
    const config = zomatoApi.getConnectionInfo();
    setApiMode(config.demoMode ? 'demo' : 'real');
  }, []);

  // Handle OAuth callback from Zomato (production mode)
  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const errorParam = searchParams.get('error');
    const connected = searchParams.get('connected');

    if (errorParam) {
      setError('Failed to connect to Zomato. Please try again.');
      setStep('connect');
      return;
    }

    // If redirected back with connected=true (from backend callback)
    if (connected === 'true' && apiMode === 'real') {
      setStep('select');
      // Clear URL params
      window.history.replaceState({}, '', '/zomato-connect');
      return;
    }

    // Handle legacy callback with code/state
    if (code && state) {
      handleOAuthCallback(code, state);
    }
  }, [searchParams, navigate, apiMode]);

  const handleOAuthCallback = async (code: string, state: string) => {
    setLoading(true);
    setError(null);
    try {
      await zomatoApi.handleCallback(code, state);
      // Successfully connected, fetch restaurants (demo) or go to search (production)
      if (apiMode === 'demo') {
        await fetchRestaurants();
      } else {
        setStep('select');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to Zomato');
      setStep('connect');
    } finally {
      setLoading(false);
    }
  };

  const initiateZomatoConnection = async () => {
    if (apiMode === 'demo') {
      // Simulate OAuth flow in demo mode
      setLoading(true);
      setError(null);
      // Generate and store a demo state to match the validation
      const fakeState = 'demo_state_' + Date.now();
      localStorage.setItem('zomato_oauth_state', fakeState);

      // Simulate a delay then redirect back with fake code/state
      setTimeout(() => {
        const fakeCode = 'demo_auth_code_' + Date.now();
        // Simulate the callback by updating URL and triggering the effect
        window.history.pushState({}, '', `/zomato-connect?code=${fakeCode}&state=${fakeState}`);
        // Trigger the callback handler manually
        handleOAuthCallback(fakeCode, fakeState);
      }, 1500);
    } else {
      // Production: get OAuth URL from backend and redirect
      setLoading(true);
      setError(null);
      try {
        const { authUrl } = await backendApi.getZomatoOAuthUrl();
        window.location.href = authUrl;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initiate Zomato connection');
        setLoading(false);
      }
    }
  };

  // Search restaurants by name/location (production mode)
  const handleSearchRestaurants = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setError(null);
    try {
      const result = await zomatoApi.searchRestaurants(searchQuery.trim());
      setSearchResults(result);
      setRestaurants(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search restaurants');
      setRestaurants([]);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // For demo mode, fetch restaurants immediately after connect
  const fetchRestaurants = async () => {
    if (apiMode === 'demo') {
      setLoading(true);
      setError(null);
      try {
        const userRestaurants = await zomatoApi.fetchUserRestaurants();
        setRestaurants(userRestaurants);
        setSearchResults(userRestaurants);
        if (userRestaurants.length > 0) {
          setStep('select');
        } else {
          setError('No restaurants found in your Zomato account. Please ensure you own/manage restaurants on Zomato.');
          setStep('connect');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch restaurants');
        setStep('connect');
      } finally {
        setLoading(false);
      }
    } else {
      // Production mode: show search UI instead of auto-fetch
      setStep('select');
    }
  };

  const handleRestaurantSelect = (restaurant: any) => {
    setSelectedRestaurant(restaurant);
    // Pre-fill business details
    setBusinessDetails(prev => ({
      ...prev,
      ownerName: restaurant.name,
    }));
    setStep('configure');
  };

  const handleBusinessDetailsChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setBusinessDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleComplete = async () => {
    if (!selectedRestaurant) return;

    setLoading(true);
    try {
      // Convert Zomato restaurant to our format
      const restaurant = convertZomatoToRestaurant(selectedRestaurant);

      // Update with user-provided details
      const finalRestaurant: Restaurant = {
        ...restaurant,
        ownerName: businessDetails.ownerName || restaurant.name,
        contactEmail: businessDetails.contactEmail,
        businessType: businessDetails.businessType,
        description: businessDetails.description || restaurant.description,
      };

      // Save to localStorage (for demo/frontend-only mode)
      authStorage.setRestaurant(finalRestaurant);

      // If using real API, also save to backend
      if (apiMode === 'real') {
        try {
          await backendApi.createRestaurant(finalRestaurant);
        } catch (backendErr) {
          console.warn('Backend save failed, using local storage only:', backendErr);
        }
      }

      // Sync reviews in background
      const syncResult = await zomatoApi.syncReviews(selectedRestaurant.id);
      console.log('Zomato sync result:', syncResult);

      setStep('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete setup');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    await zomatoApi.disconnectZomato();
    setStep('connect');
    setRestaurants([]);
    setSearchResults([]);
    setSelectedRestaurant(null);
    setError(null);
    setSearchQuery('');
    // Re-check api mode
    const config = zomatoApi.getConnectionInfo();
    setApiMode(config.demoMode ? 'demo' : 'real');
  };

  // If already connected, show disconnect option
  const isConnected = zomatoApi.isConnected();
  const connectionInfo = zomatoApi.getConnectionInfo();

  // Determine which restaurants to show in select step
  const displayRestaurants = apiMode === 'real' ? searchResults : restaurants;

  return (
    <div className="min-h-screen bg-warm-stone py-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 bg-lime-500/10 text-lime-600 px-4 py-2 rounded-full mb-4">
            <div className="w-8 h-8 bg-lime-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
              Z
            </div>
            <span className="font-semibold">Zomato Integration</span>
            <span className={`px-2 py-0.5 text-xs rounded-full ${apiMode === 'real' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
              {apiMode === 'real' ? 'Live API' : 'Demo Mode'}
            </span>
          </div>
          <h1 className="font-serif text-4xl font-bold text-deep-charcoal mb-2">
            {step === 'connect' ? 'Connect Your Zomato Account' :
             step === 'select' ? 'Select Your Restaurant' :
             step === 'configure' ? 'Configure Details' : 'Setup Complete'}
          </h1>
          <p className="text-muted-gray">
            {step === 'connect' ? 'Authorize SellSense to access your Zomato restaurant data' :
             step === 'select' ? (apiMode === 'real' ? 'Search for your restaurant by name and city' : 'Choose which restaurant you want to analyze') :
             step === 'configure' ? 'Review and update your restaurant details' :
             'Your restaurant is ready for review analysis'}
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-8">
          {['connect', 'select', 'configure', 'complete'].map((s, i) => (
            <React.Fragment key={s}>
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  ['connect', 'select', 'configure', 'complete'].indexOf(step) >= i
                    ? 'bg-lime-500 text-white'
                    : 'bg-light-beige text-muted-gray'
                }`}
              >
                {['connect', 'select', 'configure', 'complete'].indexOf(step) > i ? (
                  <CheckCircle size={20} />
                ) : (
                  i + 1
                )}
              </div>
              {i < 3 && (
                <div
                  className={`w-20 h-1 mx-2 transition-all ${
                    ['connect', 'select', 'configure', 'complete'].indexOf(step) > i
                      ? 'bg-lime-500'
                      : 'bg-light-beige'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <XCircle className="text-red-500" size={20} />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* API Mode Info */}
        {apiMode === 'demo' && step === 'connect' && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
            <Info className="text-blue-500 mt-0.5" size={20} />
            <div>
              <p className="text-blue-800 font-medium mb-1">Running in Demo Mode</p>
              <p className="text-blue-700 text-sm">
                To connect real Zomato accounts, configure your Zomato API credentials in <code className="bg-blue-100 px-1.5 py-0.5 rounded">.env.local</code>:
              </p>
              <ul className="text-blue-700 text-sm mt-2 space-y-1 ml-4 list-disc">
                <li>VITE_ZOMATO_CLIENT_ID - Your Zomato OAuth Client ID</li>
                <li>VITE_ZOMATO_CLIENT_SECRET - Your Zomato OAuth Client Secret</li>
                <li>VITE_ZOMATO_REDIRECT_URI - Your callback URL (e.g., http://localhost:5173/zomato-connect)</li>
                <li>VITE_ZOMATO_API_KEY - Zomato API key for server calls</li>
              </ul>
              <p className="text-blue-700 text-sm mt-2">
                Get credentials at <a href="https://developers.zomato.com/api" target="_blank" rel="noopener" className="underline">developers.zomato.com</a>
              </p>
            </div>
          </div>
        )}

        {/* Production Mode Info */}
        {apiMode === 'real' && step === 'connect' && !isConnected && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <Info className="text-green-500 mt-0.5" size={20} />
            <div>
              <p className="text-green-800 font-medium mb-1">Production Mode Active</p>
              <p className="text-green-700 text-sm">
                You will be redirected to Zomato for secure OAuth authorization.
                Your credentials are stored securely on the backend server.
              </p>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-border-beige">
          {/* Step 1: Connect */}
          {step === 'connect' && (
            <div className="space-y-6">
              <div className="text-center py-8">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-lime-500 to-emerald-500 rounded-3xl flex items-center justify-center">
                  <ExternalLink className="text-white text-3xl" />
                </div>
                <h3 className="text-2xl font-bold text-deep-charcoal mb-3">Connect to Zomato</h3>
                <p className="text-muted-gray max-w-md mx-auto mb-6">
                  Securely connect your Zomato account to automatically import restaurant details and customer reviews.
                </p>
                <ul className="text-left max-w-md mx-auto text-sm text-muted-gray space-y-3">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="text-lime-500 flex-shrink-0" size={20} />
                    Import restaurant profile & photos
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="text-lime-500 flex-shrink-0" size={20} />
                    Sync customer reviews automatically
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="text-lime-500 flex-shrink-0" size={20} />
                    Real-time rating & sentiment updates
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="text-lime-500 flex-shrink-0" size={20} />
                    Secure OAuth 2.0 authentication
                  </li>
                </ul>
              </div>

              {isConnected ? (
                <div className="p-6 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="text-green-500" size={24} />
                      <div>
                        <h4 className="font-bold text-green-800">Connected to Zomato</h4>
                        <p className="text-sm text-green-600">{apiMode === 'real' ? 'Search for your restaurant' : 'Ready to fetch your restaurants'}</p>
                        {connectionInfo.expiresAt && (
                          <p className="text-xs text-green-500 mt-1">
                            Token expires: {new Date(connectionInfo.expiresAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" onClick={fetchRestaurants} disabled={loading || isSearching}>
                        {loading || isSearching ? <Loader2 className="animate-spin" size={18} /> : apiMode === 'real' ? 'Search Restaurants' : 'Fetch Restaurants'}
                      </Button>
                      <Button variant="secondary" onClick={handleDisconnect}>
                        Disconnect
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={initiateZomatoConnection}
                  size="large"
                  className="w-full py-4 text-lg bg-gradient-to-r from-lime-500 to-emerald-500 hover:from-lime-600 hover:to-emerald-600"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin inline mr-2" size={20} />
                      Connecting...
                    </>
                  ) : (
                    <>
                      Connect to Zomato
                      <ChevronRight className="inline ml-2" size={20} />
                    </>
                  )}
                </Button>
              )}

              <div className="text-center text-sm text-muted-gray">
                <p>{apiMode === 'real' ? 'Redirects to Zomato for OAuth authorization' : 'This is a demo prototype. Configure .env.local for real Zomato API access.'}</p>
              </div>
            </div>
          )}

          {/* Step 2: Select Restaurant */}
          {step === 'select' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-deep-charcoal">Select Restaurant</h3>
                <Button variant="outline" size="small" onClick={handleDisconnect}>
                  <ArrowLeft className="inline mr-1" size={16} />
                  Change Account
                </Button>
              </div>

              {apiMode === 'real' && (
                <div className="mb-6">
                  <p className="text-muted-gray mb-4">Search for your restaurant by name and city (e.g., "Nelam Restaurant Pune")</p>
                  <form onSubmit={handleSearchRestaurants} className="flex gap-3">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-gray" size={20} />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Restaurant name, city"
                        className="w-full pl-10 pr-4 py-3 border border-border-beige rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
                        disabled={isSearching}
                      />
                    </div>
                    <Button
                      type="submit"
                      size="large"
                      disabled={isSearching || !searchQuery.trim()}
                      className="whitespace-nowrap"
                    >
                      {isSearching ? (
                        <>
                          <Loader2 className="animate-spin inline mr-2" size={18} />
                          Searching...
                        </>
                      ) : (
                        <>
                          <Search className="inline mr-1" size={18} />
                          Search
                        </>
                      )}
                    </Button>
                  </form>

                  {searchQuery && searchResults.length > 0 && (
                    <p className="text-sm text-green-600 mt-2">
                      Found {searchResults.length} restaurant(s) matching "{searchQuery}"
                    </p>
                  )}

                  {searchQuery && searchResults.length === 0 && !isSearching && (
                    <p className="text-sm text-yellow-600 mt-2">
                      No restaurants found for "{searchQuery}". Try a different search.
                    </p>
                  )}
                </div>
              )}

              {apiMode === 'demo' && (
                <p className="text-muted-gray mb-4">Choose the restaurant you want to analyze reviews for</p>
              )}

              {(loading || isSearching) ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="animate-spin text-lime-500" size={32} />
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {displayRestaurants.map((restaurant) => (
                    <button
                      key={restaurant.id}
                      onClick={() => handleRestaurantSelect(restaurant)}
                      className={`p-6 border-2 rounded-xl transition-all text-left relative ${
                        selectedRestaurant?.id === restaurant.id
                          ? 'border-lime-500 bg-lime-50'
                          : 'border-border-beige hover:border-lime-300 hover:bg-lime-50/50'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-xl bg-cover bg-center flex-shrink-0" style={{ backgroundImage: `url(${restaurant.featured_image || restaurant.thumb})` }} />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-deep-charcoal truncate">{restaurant.name}</h4>
                          <p className="text-sm text-muted-gray mt-1">{restaurant.location.locality_verbose}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="flex items-center gap-1 text-sm text-yellow-600">
                              <span className="font-bold">{restaurant.user_rating.aggregate_rating}</span>
                              <span>★</span>
                            </span>
                            <span className="text-sm text-muted-gray">{restaurant.user_rating.votes} reviews</span>
                          </div>
                          <p className="text-xs text-muted-gray mt-2">{restaurant.cuisines}</p>
                          <p className="text-xs text-muted-gray mt-1">₹{restaurant.average_cost_for_two} for two</p>
                        </div>
                      </div>
                      {selectedRestaurant?.id === restaurant.id && (
                        <div className="absolute top-4 right-4 w-6 h-6 bg-lime-500 text-white rounded-full flex items-center justify-center">
                          <CheckCircle size={16} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {displayRestaurants.length === 0 && !loading && !isSearching && (
                <div className="text-center py-8 text-muted-gray">
                  <AlertCircle className="mx-auto mb-2 text-gray-400" size={32} />
                  <p>{apiMode === 'real' ? 'Search for your restaurant above' : 'No restaurants found in your Zomato account.'}</p>
                  <p className="text-sm mt-1">{apiMode === 'real' ? 'Enter your restaurant name and city to find it on Zomato' : 'Make sure you own or manage restaurants on Zomato.'}</p>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <Button
                  size="large"
                  onClick={() => setStep('configure')}
                  disabled={!selectedRestaurant}
                >
                  Continue
                  <ChevronRight className="inline ml-2" size={20} />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Configure Details */}
          {step === 'configure' && selectedRestaurant && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-deep-charcoal">Configure Details</h3>
                <Button variant="outline" size="small" onClick={() => setStep('select')}>
                  <ArrowLeft className="inline mr-1" size={16} />
                  Back
                </Button>
              </div>
              <p className="text-muted-gray">Review and update your restaurant information</p>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Restaurant Preview */}
                <div className="md:col-span-2 p-6 bg-gray-50 rounded-xl border border-border-beige">
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 rounded-xl bg-cover bg-center flex-shrink-0" style={{ backgroundImage: `url(${selectedRestaurant.featured_image || selectedRestaurant.thumb})` }} />
                    <div>
                      <h4 className="font-bold text-deep-charcoal text-lg">{selectedRestaurant.name}</h4>
                      <p className="text-sm text-muted-gray">{selectedRestaurant.location.locality_verbose}</p>
                      <p className="text-sm text-muted-gray mt-1">{selectedRestaurant.cuisines}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="flex items-center gap-1 text-yellow-600">
                          <span className="font-bold">{selectedRestaurant.user_rating.aggregate_rating}</span>
                          <span>★</span>
                        </span>
                        <span className="text-sm text-muted-gray">{selectedRestaurant.user_rating.votes} reviews</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <div>
                  <label className="block text-sm font-medium text-deep-charcoal mb-2">
                    Owner Name *
                  </label>
                  <input
                    name="ownerName"
                    type="text"
                    value={businessDetails.ownerName}
                    onChange={handleBusinessDetailsChange}
                    className="w-full px-4 py-3 border border-border-beige rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
                    required
                  />
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
                    className="w-full px-4 py-3 border border-border-beige rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
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
                    className="w-full px-4 py-3 border border-border-beige rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
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
                  <label className="block text-sm font-medium text-deep-charcoal mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    name="description"
                    value={businessDetails.description}
                    onChange={handleBusinessDetailsChange}
                    className="w-full px-4 py-3 border border-border-beige rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  size="large"
                  onClick={handleComplete}
                  disabled={loading || !businessDetails.ownerName || !businessDetails.contactEmail}
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin inline mr-2" size={20} />
                      Setting up...
                    </>
                  ) : (
                    <>
                      Complete Setup
                      <ChevronRight className="inline ml-2" size={20} />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Complete */}
          {step === 'complete' && (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="text-green-500" size={48} />
              </div>
              <h3 className="text-3xl font-bold text-deep-charcoal mb-3">Setup Complete!</h3>
              <p className="text-muted-gray mb-8 max-w-md mx-auto">
                Your restaurant <strong>{selectedRestaurant?.name}</strong> has been connected to SellSense.
                We've imported your Zomato data and started analyzing your reviews.
              </p>
              <Button
                size="large"
                onClick={() => navigate('/products')}
                className="bg-gradient-to-r from-lime-500 to-emerald-500 hover:from-lime-600 hover:to-emerald-600"
              >
                Go to Dashboard
                <ChevronRight className="inline ml-2" size={20} />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};