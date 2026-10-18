import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { authStorage } from '../utils/auth';
import { demoRestaurant } from '../data/sampleData';
import { Check, Loader2 } from 'lucide-react';
import type { BusinessType, Platform } from '../types';
import { zomatoApi } from '../services/zomatoApi';

export const SetupPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Step 1: Business Details
  const [businessDetails, setBusinessDetails] = useState({
    restaurantName: 'Nelam Restaurants',
    ownerName: 'Demo Owner',
    businessType: 'Restaurant' as BusinessType,
    city: 'Pune',
    location: 'Koregaon Park, Pune',
    contactEmail: 'owner@nelamrestaurants.com',
    description: 'Fine dining with traditional Indian flavors',
  });

  // Step 2: Platform Connections
  const [connections, setConnections] = useState<{ [key: string]: string }>({
    Zomato: 'Not Connected',
    Swiggy: 'Not Connected',
    Google: 'Not Connected',
  });

  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');

  // Check if Zomato is already connected
  const [zomatoConnected, setZomatoConnected] = useState(false);

  useEffect(() => {
    const connected = zomatoApi.isConnected();
    setZomatoConnected(connected);
    if (connected) {
      setConnections(prev => ({ ...prev, Zomato: 'Connected' }));
    }
  }, []);

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

  const handleConnect = (platform: string) => {
    if (platform === 'Zomato') {
      // Redirect to dedicated Zomato connect page for real OAuth
      window.location.href = '/zomato-connect';
      return;
    }
    setSelectedPlatform(platform);
    setShowConnectionModal(true);
  };

  const handleDemoConnection = () => {
    setConnectingPlatform(selectedPlatform);
    setShowConnectionModal(false);

    setTimeout(() => {
      setConnections((prev) => ({
        ...prev,
        [selectedPlatform]: 'Demo Connection',
      }));
      setConnectingPlatform(null);
    }, 2000);
  };

  const handleDisconnect = (platform: string) => {
    setConnections((prev) => ({
      ...prev,
      [platform]: 'Not Connected',
    }));
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

  const platforms = [
    {
      name: 'Zomato',
      description: 'Import reviews from Zomato food delivery platform',
      icon: '🍽️',
    },
    {
      name: 'Swiggy',
      description: 'Import reviews from Swiggy food delivery platform',
      icon: '🛵',
    },
    {
      name: 'Google',
      description: 'Import reviews from Google Maps / Google Business Profile',
      icon: '🗺️',
    },
  ];

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

          {/* Step 2: Platform Connections */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-deep-charcoal mb-6">
                Connect Review Sources
              </h2>
              <p className="text-muted-gray mb-6">
                Connect your online platforms to import customer reviews
              </p>

              <div className="space-y-4">
                {platforms.map((platform) => {
                  const status = connections[platform.name];
                  const isConnecting = connectingPlatform === platform.name;
                  const isZomatoConnected = platform.name === 'Zomato' && zomatoConnected;

                  return (
                    <div
                      key={platform.name}
                      className="border border-border-beige rounded-lg p-6 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-4xl">{platform.icon}</div>
                        <div>
                          <h3 className="font-bold text-deep-charcoal">{platform.name}</h3>
                          <p className="text-sm text-muted-gray">{platform.description}</p>
                          <span
                            className={`inline-block mt-2 text-xs px-3 py-1 rounded-full ${
                              status === 'Connected' || isZomatoConnected
                                ? 'bg-green-100 text-green-700'
                                : status === 'Demo Connection'
                                ? 'bg-blue-100 text-blue-700'
                                : status === 'Connecting'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {isConnecting ? 'Connecting...' : isZomatoConnected ? 'Connected' : status}
                          </span>
                        </div>
                      </div>

                      <div>
                        {platform.name === 'Zomato' && isZomatoConnected && (
                          <div className="flex gap-2">
                            <Button variant="outline" size="small" onClick={() => window.location.href = '/zomato-connect'}>
                              Manage
                            </Button>
                            <Button variant="secondary" size="small" onClick={() => {
                              zomatoApi.disconnect();
                              setZomatoConnected(false);
                              setConnections(prev => ({ ...prev, Zomato: 'Not Connected' }));
                            }}>
                              Disconnect
                            </Button>
                          </div>
                        )}
                        {(status === 'Not Connected' || (platform.name === 'Zomato' && !isZomatoConnected && status !== 'Connected')) && !isConnecting && (
                          <Button
                            variant="outline"
                            size="small"
                            onClick={() => handleConnect(platform.name)}
                          >
                            {platform.name === 'Zomato' ? 'Connect via Zomato' : 'Connect'}
                          </Button>
                        )}
                        {isConnecting && <Loader2 className="animate-spin text-deep-charcoal" />}
                        {(status === 'Demo Connection' || (platform.name === 'Zomato' && status === 'Connected' && !isZomatoConnected)) && (
                          <Button
                            variant="secondary"
                            size="small"
                            onClick={() => handleDisconnect(platform.name)}
                          >
                            Disconnect
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
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
                {Object.entries(connections)
                  .filter(([_, status]) => status !== 'Not Connected')
                  .map(([platform, status]) => (
                    <div
                      key={platform}
                      className="border border-border-beige rounded-lg p-6 bg-green-50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Check className="text-green-600" size={24} />
                          <div>
                            <h3 className="font-bold text-deep-charcoal">{platform}</h3>
                            <p className="text-sm text-muted-gray">
                              Status: {status} • Last synced: Just now
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-medium text-green-600">Ready</span>
                      </div>
                    </div>
                  ))}
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

      {/* Connection Modal */}
      {showConnectionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-6">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-deep-charcoal mb-4">
              Connect {selectedPlatform}
            </h3>
            <p className="text-muted-gray mb-6">
              This is a demo prototype. Clicking "Connect Demo" will simulate a connection using
              sample data. Real platform integration requires authorized API access.
            </p>
            <div className="flex gap-3">
              <Button onClick={handleDemoConnection} className="flex-1">
                Connect Demo
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowConnectionModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
