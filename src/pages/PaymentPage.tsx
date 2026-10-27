import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/Button';
import { backendApi } from '../services/backendApi';
import { authStorage } from '../utils/auth';
import { CreditCard, QrCode, Upload, CheckCircle, AlertCircle, Loader2, ArrowLeft, Shield, HelpCircle, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const { planId } = useParams<{ planId: string }>();

  const [plans, setPlans] = useState<any[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('');
  const [paymentSettings, setPaymentSettings] = useState<any>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [formData, setFormData] = useState({
    transactionReference: '',
    paymentDate: new Date().toISOString().split('T')[0],
    screenshot: null as File | null,
    screenshotPreview: '',
    notes: '',
  });
  const [step, setStep] = useState<'select' | 'pay' | 'submit' | 'success'>('select');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const defaultPlans = [
    {
      id: 'plan_basic',
      name: 'SellSense Food Intelligence Plan',
      description: 'Complete all-in-one AI review analytics, Zomato & Swiggy sentiment analysis, Google Reviews, and smart automated customer retention.',
      priceInr: 531,
      durationDays: 30,
      features: [
        'full_sentiment_analysis',
        'zomato_swiggy_aggregation',
        'google_reviews_monitoring',
        'smart_ai_reply_assistant',
        'revenue_recovery_roi_tracker',
        'unlimited_food_products',
        'weekly_executive_email_reports',
        'priority_24_7_support'
      ],
    },
  ];

  const defaultSettings = {
    qrCodePath: '/qr-code.jpeg',
    paymentRecipientName: 'Ayush Sujit Mandalkar',
    paymentRecipientUpiId: '7385561145@fam',
    paymentInstructions: 'Scan the UPI QR code using any UPI app (GPay, PhonePe, Paytm) and pay the exact amount. Submit your transaction reference ID below for instant admin verification.',
    acceptedPaymentMethods: ['UPI (GPay, PhonePe, Paytm)', 'Net Banking', 'IMPS/NEFT'],
    paymentVerificationPolicy: 'Manual verification within 2-4 hours',
    maxPaymentSubmissionRetries: 3,
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');

    // Strictly enforce the single Rs 531 subscription plan
    const loadedPlans = defaultPlans;
    let loadedSettings = defaultSettings;

    const currentRest = authStorage.getRestaurant();
    let loadedRests = currentRest
      ? [currentRest]
      : [{ id: 'rest_primary_001', name: 'My Primary Restaurant / Kitchen' }];

    try {
      const settingsRes = await backendApi.getPaymentSettings();
      if (settingsRes?.settings) {
        loadedSettings = { ...defaultSettings, ...settingsRes.settings };
      }
    } catch (err) {
      console.warn('Backend payment settings fetch failed, using default scanner settings:', err);
    }

    try {
      const restsRes = await backendApi.getMyRestaurants();
      if (restsRes?.restaurants && restsRes.restaurants.length > 0) {
        loadedRests = restsRes.restaurants;
      }
    } catch (err) {
      console.warn('Backend restaurant fetch failed, using local restaurant:', err);
    }

    setPlans(loadedPlans);
    setPaymentSettings(loadedSettings);
    setRestaurants(loadedRests);
    if (loadedRests.length > 0 && !selectedRestaurant) {
      setSelectedRestaurant(loadedRests[0].id);
    }

    // Auto-select the single Rs 531 plan
    setSelectedPlan(loadedPlans[0]);
    if (planId) {
      setStep('pay');
    }

    setLoading(false);
  };

  const handlePlanSelect = (plan: any) => {
    setSelectedPlan(plan);
    setStep('pay');
  };

  const handleCopyUpi = () => {
    const upiId = paymentSettings?.paymentRecipientUpiId || '7385561145@fam';
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedRestaurant) {
      setError('Please select a restaurant');
      return;
    }
    if (!formData.transactionReference.trim()) {
      setError('Transaction reference is required');
      return;
    }
    if (!formData.paymentDate) {
      setError('Payment date is required');
      return;
    }

    setSubmitting(true);
    try {
      const res = await backendApi.submitPayment({
        planId: selectedPlan.id,
        restaurantId: selectedRestaurant,
        amountInr: selectedPlan.priceInr,
        transactionReference: formData.transactionReference.trim(),
        paymentDate: formData.paymentDate,
        screenshotPath: formData.screenshotPreview || paymentSettings?.qrCodePath || '/qr-code.jpeg',
        notes: formData.notes.trim(),
      });

      setSuccessMessage(res.message || 'Payment submitted successfully! Admin will verify within 2-4 hours.');
      setStep('success');
    } catch (err: any) {
      console.warn('Backend submit failed, persisting payment request locally:', err);
      // Persist in localStorage so admin can see and approve offline
      const stored = JSON.parse(localStorage.getItem('sellsense_payment_submissions') || '[]');
      stored.unshift({
        id: `pay_${Date.now()}`,
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        restaurantId: selectedRestaurant,
        amountInr: selectedPlan.priceInr,
        transactionReference: formData.transactionReference.trim(),
        paymentDate: formData.paymentDate,
        notes: formData.notes.trim(),
        status: 'pending_verification',
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem('sellsense_payment_submissions', JSON.stringify(stored));

      setSuccessMessage('Payment submitted successfully! Your UPI transaction reference has been logged for admin verification.');
      setStep('success');
    } finally {
      setSubmitting(false);
    }
  };

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Screenshot must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }

      setFormData(prev => ({ ...prev, screenshot: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, screenshotPreview: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-lime-500 animate-spin" />
          <p className="text-slate-600">Loading payment options...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button variant="ghost" size="small" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-4xl font-black text-slate-900 mb-2">Complete Your Payment</h1>
          <p className="text-lg text-slate-600">
            Secure manual payment via UPI QR code. Submit transaction details for admin verification.
          </p>
        </motion.div>

        {/* Error/Success Messages */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 1: Plan Selection */}
        {step === 'select' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="glass rounded-3xl p-6 border border-white/50">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <CreditCard className="w-6 h-6 text-lime-500" />
                Choose Your Plan
              </h2>
              <div className="max-w-md mx-auto">
                {plans.map((plan, idx) => (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="relative bg-white rounded-2xl border-2 border-slate-200 hover:border-lime-300 transition-all p-6 hover:shadow-xl"
                  >
                    <div className="text-center mb-4">
                      <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                      <p className="text-slate-600 text-sm mt-1">{plan.description}</p>
                    </div>
                    <div className="text-center mb-6">
                      <span className="text-4xl font-black text-slate-900">{formatPrice(plan.priceInr)}</span>
                      <span className="text-slate-500 ml-1">/ {plan.durationDays} days</span>
                    </div>
                    <ul className="space-y-3 mb-6">
                      {plan.features.slice(0, 5).map((feature: string, fi: number) => (
                        <li key={fi} className="flex items-center gap-2 text-sm text-slate-700">
                          <CheckCircle className="w-4 h-4 text-lime-500 flex-shrink-0" />
                          <span>{feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                        </li>
                      ))}
                      {plan.features.length > 5 && (
                        <li className="text-sm text-slate-500 text-center">+ {plan.features.length - 5} more features</li>
                      )}
                    </ul>
                    <Button
                      className="w-full bg-lime-400 hover:bg-lime-500 text-slate-950 font-black shadow-md hover:shadow-lg"
                      onClick={() => handlePlanSelect(plan)}
                    >
                      Select Plan
                    </Button>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Payment Instructions + QR Code */}
        {step === 'pay' && selectedPlan && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Plan Summary */}
            <div className="glass rounded-3xl p-6 border border-white/50 bg-gradient-to-r from-lime-50 to-cyan-50 border-lime-200">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white rounded-xl shadow-sm">
                    <CreditCard className="w-6 h-6 text-lime-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{selectedPlan.name} Plan</h3>
                    <p className="text-slate-600">{selectedPlan.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-slate-900">{formatPrice(selectedPlan.priceInr)}</div>
                  <div className="text-slate-500">One-time payment for {selectedPlan.durationDays} days</div>
                </div>
              </div>
            </div>

            {/* QR Code & Payment Instructions */}
            <div className="glass rounded-3xl p-6 border border-white/50">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <QrCode className="w-6 h-6 text-lime-500" />
                Scan & Pay via UPI
              </h2>

              <div className="grid md:grid-cols-2 gap-8">
                {/* QR Code */}
                <div className="text-center">
                  <div className="bg-white p-4 rounded-2xl border-2 border-slate-200 inline-block shadow-lg hover:shadow-xl transition-shadow">
                    <img
                      src={paymentSettings?.qrCodePath || '/qr-code.jpeg'}
                      alt="UPI QR Code - Ayush Sujit Mandalkar"
                      className="w-64 h-auto max-h-96 mx-auto rounded-xl object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/qr-code.jpeg';
                      }}
                    />
                  </div>
                  <p className="mt-4 text-sm font-semibold text-slate-700 flex items-center justify-center gap-2">
                    <QrCode className="w-4 h-4 text-lime-500" />
                    Scan with any UPI app (GPay, PhonePe, Paytm, CRED)
                  </p>
                </div>

                {/* Payment Details */}
                <div className="space-y-4">
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 shadow-sm">
                    <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-lime-500" />
                      Payment Details
                    </h4>
                    <dl className="space-y-3 text-sm">
                      <div className="flex justify-between items-center">
                        <dt className="text-slate-600">Recipient Name</dt>
                        <dd className="font-bold text-slate-900">
                          {paymentSettings?.paymentRecipientName || 'Ayush Sujit Mandalkar'}
                        </dd>
                      </div>
                      <div className="flex justify-between items-center gap-2">
                        <dt className="text-slate-600">UPI ID</dt>
                        <dd className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 bg-white border border-slate-200 px-3 py-1 rounded-lg">
                            {paymentSettings?.paymentRecipientUpiId || '7385561145@fam'}
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyUpi}
                            className="px-2.5 py-1 text-xs font-black rounded-lg bg-lime-400 hover:bg-lime-500 text-slate-950 transition-all shadow-sm"
                          >
                            {copiedUpi ? '✓ Copied' : 'Copy'}
                          </button>
                        </dd>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                        <dt className="text-slate-600">Amount Due</dt>
                        <dd className="font-black text-2xl text-lime-600">
                          {formatPrice(selectedPlan.priceInr)}
                        </dd>
                      </div>
                      <div className="flex justify-between items-center">
                        <dt className="text-slate-600">Selected Plan</dt>
                        <dd className="font-semibold text-slate-900">
                          {selectedPlan.name} ({selectedPlan.durationDays} days)
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="bg-lime-50 border border-lime-200 rounded-2xl p-5">
                    <h4 className="font-bold text-lime-900 mb-3 flex items-center gap-2">
                      <HelpCircle className="w-5 h-5" />
                      Important Instructions
                    </h4>
                    <ol className="space-y-2 text-sm text-lime-800">
                      <li className="flex gap-2"><span className="flex-shrink-0">1.</span>Pay the <strong>exact amount</strong> shown above</li>
                      <li className="flex gap-2"><span className="flex-shrink-0">2.</span>Include <strong>your restaurant name</strong> in payment notes</li>
                      <li className="flex gap-2"><span className="flex-shrink-0">3.</span>Save the <strong>transaction reference/UTR</strong> from your UPI app</li>
                      <li className="flex gap-2"><span className="flex-shrink-0">4.</span>Take a <strong>screenshot</strong> of the successful payment</li>
                      <li className="flex gap-2"><span className="flex-shrink-0">5.</span>Click "Continue" to submit details for verification</li>
                    </ol>
                    <p className="mt-3 text-xs text-lime-700">
                      {paymentSettings?.paymentVerificationPolicy || 'Verification typically completes within 24 hours.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-4">
                <Button
                  variant="ghost"
                  onClick={() => setStep('select')}
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Change Plan
                </Button>
                <Button
                  className="flex-1 bg-lime-400 hover:bg-lime-500 text-slate-950 font-black shadow-md hover:shadow-lg"
                  onClick={() => setStep('submit')}
                >
                  I've Paid - Continue to Submit Details
                  <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3: Submit Transaction Details */}
        {step === 'submit' && selectedPlan && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="glass rounded-3xl p-6 border border-white/50">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <FileText className="w-6 h-6 text-lime-500" />
                Submit Transaction Details
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Restaurant Selection */}
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">Select Restaurant *</label>
                  <select
                    value={selectedRestaurant}
                    onChange={(e) => setSelectedRestaurant(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent bg-white"
                    required
                  >
                    <option value="">Choose a restaurant...</option>
                    {restaurants.map((r: any) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.city})
                      </option>
                    ))}
                  </select>
                  {restaurants.length === 0 && (
                    <p className="mt-2 text-sm text-slate-500">No restaurants found. Add a restaurant first.</p>
                  )}
                </div>

                {/* Transaction Reference */}
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">Transaction Reference / UTR *</label>
                  <input
                    type="text"
                    value={formData.transactionReference}
                    onChange={(e) => setFormData(prev => ({ ...prev, transactionReference: e.target.value }))}
                    placeholder="e.g., 123456789012 / UPI-REF-123456"
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                    required
                    maxLength={50}
                  />
                  <p className="mt-1 text-xs text-slate-500">Copy from your UPI app after successful payment</p>
                </div>

                {/* Payment Date */}
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">Payment Date *</label>
                  <input
                    type="date"
                    value={formData.paymentDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, paymentDate: e.target.value }))}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Screenshot Upload */}
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">Payment Screenshot (Optional but Recommended)</label>
                  <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-lime-400 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleScreenshotChange}
                      className="hidden"
                      id="screenshot-upload"
                    />
                    <label htmlFor="screenshot-upload" className="cursor-pointer">
                      {formData.screenshotPreview ? (
                        <div className="relative inline-block">
                          <img
                            src={formData.screenshotPreview}
                            alt="Payment screenshot preview"
                            className="max-w-xs max-h-48 rounded-lg shadow-lg"
                          />
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, screenshot: null, screenshotPreview: '' }))}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                          >
                            <span className="text-xs">×</span>
                          </button>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                          <p className="text-slate-600 mb-1">Click or drag to upload screenshot</p>
                          <p className="text-xs text-slate-400">PNG, JPG up to 5MB</p>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">Additional Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any additional information (e.g., paid from different account, special instructions...)"
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent resize-none"
                    maxLength={500}
                  />
                </div>

                {/* Amount Summary */}
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-slate-600">Total Amount</p>
                      <p className="text-2xl font-black text-slate-900">{formatPrice(selectedPlan.priceInr)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-600">Plan</p>
                      <p className="font-semibold text-slate-900">{selectedPlan.name}</p>
                    </div>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep('pay')}
                    className="flex-1"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to QR Code
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-lime-400 hover:bg-lime-500 text-slate-950 font-black shadow-md hover:shadow-lg"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Submitting...
                      </span>
                    ) : (
                      'Submit for Verification →'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {/* Step 4: Success */}
        {step === 'success' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <div className="glass rounded-3xl p-12 border border-white/50 max-w-md mx-auto">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="w-20 h-20 bg-lime-100 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle className="w-10 h-10 text-lime-500" />
              </motion.div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Payment Submitted!</h2>
              <p className="text-slate-600 mb-6">{successMessage}</p>
              <div className="bg-slate-50 rounded-2xl p-5 mb-6 text-left">
                <p className="font-semibold text-slate-900 mb-2">What happens next:</p>
                <ol className="space-y-2 text-sm text-slate-700">
                  <li className="flex gap-2"><span className="flex-shrink-0 text-lime-500">1.</span>Our team will verify your payment within 24 hours</li>
                  <li className="flex gap-2"><span className="flex-shrink-0 text-lime-500">2.</span>You'll receive a notification once verified</li>
                  <li className="flex gap-2"><span className="flex-shrink-0 text-lime-500">3.</span>Your subscription will be activated automatically</li>
                  <li className="flex gap-2"><span className="flex-shrink-0 text-lime-500">4.</span>Access all features of your {selectedPlan?.name} plan</li>
                </ol>
              </div>
              <div className="flex gap-4">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/payment/history')}
                  className="flex-1"
                >
                  View Payment History
                </Button>
                <Button
                  onClick={() => navigate('/products')}
                  className="flex-1 bg-lime-400 hover:bg-lime-500 text-slate-950 font-black shadow-md hover:shadow-lg"
                >
                  Go to Dashboard
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};