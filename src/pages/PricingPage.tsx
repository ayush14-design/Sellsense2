import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { backendApi } from '../services/backendApi';
import { CheckCircle, Sparkles, TrendingUp, Shield, Zap, ArrowRight, Crown, Gem, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const PricingPage: React.FC = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const plansRes = await backendApi.getPaymentPlans();
      // Transform backend plans to frontend format, filter to only the ₹531 plan
      const transformedPlans = (plansRes.plans || [])
        .filter((plan: any) => plan.price_inr === 531 || plan.priceInr === 531 || plan.id === 'plan_basic')
        .map((plan: any) => ({
          ...plan,
          features: plan.features || [],
          usageLimits: plan.usage_limits || {},
          displayOrder: plan.display_order || 0,
        }));
      setPlans(transformedPlans.length > 0 ? transformedPlans : [
        {
          id: 'plan_basic',
          name: 'SellSense Food Intelligence Plan',
          description: 'All-inclusive restaurant food review analytics, sentiment intelligence & customer feedback suite',
          priceInr: 531,
          durationDays: 30,
          features: [
            'review_monitoring',
            'sentiment_analysis',
            'basic_insights',
            'email_alerts',
            'repetitive_review_types',
            'review_quality_analysis',
            'google_review_analysis'
          ],
          usageLimits: { products: 10, reviews_per_month: 2500, api_calls_per_day: 500 },
          displayOrder: 1,
        }
      ]);
    } catch (err) {
      console.error('Pricing fetch error:', err);
      // Fallback to only single ₹531 plan
      setPlans([
        {
          id: 'plan_basic',
          name: 'SellSense Food Intelligence Plan',
          description: 'All-inclusive restaurant food review analytics, sentiment intelligence & customer feedback suite',
          priceInr: 531,
          durationDays: 30,
          features: [
            'review_monitoring',
            'sentiment_analysis',
            'basic_insights',
            'email_alerts',
            'repetitive_review_types',
            'review_quality_analysis',
            'google_review_analysis'
          ],
          usageLimits: { products: 10, reviews_per_month: 2500, api_calls_per_day: 500 },
          displayOrder: 1,
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatFeature = (feature: string) => {
    return feature
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .replace('Up To', 'Up to')
      .replace('Api', 'API')
      .replace('Sso', 'SSO');
  };

  const getFeatureIcon = (feature: string) => {
    if (feature.includes('review_monitoring') || feature.includes('sentiment') || feature.includes('fake_review')) return <TrendingUp className="w-5 h-5" />;
    if (feature.includes('insight') || feature.includes('trend') || feature.includes('competitor') || feature.includes('analysis')) return <Sparkles className="w-5 h-5" />;
    if (feature.includes('alert') || feature.includes('sms') || feature.includes('email')) return <Zap className="w-5 h-5" />;
    if (feature.includes('support') || feature.includes('manager')) return <Shield className="w-5 h-5" />;
    if (feature.includes('product') || feature.includes('unlimited') || feature.includes('api') || feature.includes('integration') || feature.includes('sso') || feature.includes('white_label')) return <Crown className="w-5 h-5" />;
    return <CheckCircle className="w-5 h-5" />;
  };

  const handlePlanSelect = (planId: string) => {
    setSelectedPlanId(planId);
    navigate(`/payment/${planId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-lime-500 animate-spin" />
          <p className="text-slate-600">Loading plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-mesh">
          <div className="absolute top-20 left-10 w-72 h-72 bg-lime-400/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative z-10 px-6 py-20 md:py-32 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto"
          >
            <span className="inline-block bg-lime-100 text-lime-700 px-4 py-1.5 rounded-full text-sm font-semibold mb-6">
              Simple, Transparent Pricing
            </span>
            <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 leading-tight">
              Choose the Perfect Plan for Your Restaurant
            </h1>
            <p className="text-xl md:text-2xl text-slate-600 mb-10 leading-relaxed">
              No hidden fees. No long-term contracts. Pay monthly or save with yearly billing.
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex items-center gap-4 bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-3 border border-slate-200">
              <span className={`font-semibold text-sm ${billingCycle === 'monthly' ? 'text-slate-900' : 'text-slate-500'}`}>
                Monthly
              </span>
              <button
                onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                className={`relative w-12 h-7 rounded-full transition-colors ${
                  billingCycle === 'yearly' ? 'bg-lime-500' : 'bg-slate-300'
                }`}
                aria-label="Toggle billing cycle"
              >
                <span
                  className={`absolute top-1 rounded-full w-5 h-5 bg-white shadow-md transition-transform ${
                    billingCycle === 'yearly' ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className={`font-semibold text-sm ${billingCycle === 'yearly' ? 'text-slate-900' : 'text-slate-500'}`}>
                Yearly
                <span className="ml-2 text-xs bg-lime-100 text-lime-700 px-2 py-0.5 rounded-full font-bold">Save 20%</span>
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Plans Grid */}
      <section className="px-6 py-16 md:py-24">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {plans
              .sort((a, b) => a.displayOrder - b.displayOrder)
              .map((plan, idx) => {
                const isPopular = plan.name === 'Professional';
                const yearlyPrice = Math.round(plan.priceInr * 12 * 0.8); // 20% discount
                const displayPrice = billingCycle === 'yearly' ? yearlyPrice : plan.priceInr;
                const displayPeriod = billingCycle === 'yearly' ? 'year' : 'month';
                const monthlyEquivalent = billingCycle === 'yearly' ? Math.round(yearlyPrice / 12) : plan.priceInr;

                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1, duration: 0.5 }}
                    className={`relative rounded-3xl border-2 transition-all duration-300 ${
                      isPopular
                        ? 'border-lime-400 bg-gradient-to-br from-lime-50 to-white shadow-xl shadow-lime-100/50'
                        : 'border-slate-200 bg-white hover:border-lime-300 hover:shadow-xl'
                    } ${selectedPlanId === plan.id ? 'ring-4 ring-lime-200' : ''}`}
                  >
                    {/* Popular Badge */}
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-gradient-to-r from-lime-500 to-lime-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                          Most Popular
                        </span>
                      </div>
                    )}

                    <div className="p-8">
                      {/* Plan Header */}
                      <div className="text-center mb-8">
                        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${
                          isPopular
                            ? 'bg-gradient-to-br from-lime-500 to-lime-600'
                            : plan.name === 'Starter'
                            ? 'bg-gradient-to-br from-cyan-500 to-cyan-600'
                            : 'bg-gradient-to-br from-purple-500 to-purple-600'
                        }`}>
                          {plan.name === 'Starter' && <Gem className="w-8 h-8 text-white" />}
                          {plan.name === 'Professional' && <Crown className="w-8 h-8 text-white" />}
                          {plan.name === 'Enterprise' && <Sparkles className="w-8 h-8 text-white" />}
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                        <p className="text-slate-600 text-sm leading-relaxed">{plan.description}</p>
                      </div>

                      {/* Price */}
                      <div className="text-center mb-8">
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="text-5xl font-black text-slate-900">
                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(displayPrice)}
                          </span>
                          <span className="text-slate-500 font-medium">/{displayPeriod}</span>
                        </div>
                        {billingCycle === 'yearly' && (
                          <p className="mt-2 text-sm text-lime-600 font-semibold">
                            ₹{new Intl.NumberFormat('en-IN').format(monthlyEquivalent)}/month billed yearly
                          </p>
                        )}
                        <p className="mt-1 text-xs text-slate-500">
                          {plan.durationDays} days access
                        </p>
                      </div>

                      {/* Features */}
                      <ul className="space-y-4 mb-8">
                        {plan.features.map((feature: string, fi: number) => (
                          <li key={fi} className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-lime-100 rounded-lg flex items-center justify-center text-lime-600 mt-0.5">
                              {getFeatureIcon(feature)}
                            </div>
                            <span className="text-sm text-slate-700 leading-relaxed">{formatFeature(feature)}</span>
                          </li>
                        ))}
                      </ul>

                      {/* Usage Limits */}
                      <div className="bg-slate-50 rounded-2xl p-4 mb-6">
                        <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                          <Shield className="w-4 h-4 text-lime-500" />
                          Limits
                        </h4>
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <p className="text-2xl font-bold text-slate-900">
                              {plan.usageLimits.products === -1 ? '∞' : plan.usageLimits.products}
                            </p>
                            <p className="text-xs text-slate-500">Products</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-slate-900">
                              {plan.usageLimits.reviews_per_month === -1 ? '∞' : new Intl.NumberFormat('en-IN').format(plan.usageLimits.reviews_per_month)}
                            </p>
                            <p className="text-xs text-slate-500">Reviews/mo</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-slate-900">
                              {new Intl.NumberFormat('en-IN').format(plan.usageLimits.api_calls_per_day)}
                            </p>
                            <p className="text-xs text-slate-500">API calls/day</p>
                          </div>
                        </div>
                      </div>

                      {/* CTA Button */}
                      <Button
                        className={`w-full py-4 text-lg font-semibold rounded-2xl transition-all ${
                          isPopular
                            ? 'bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-600 hover:to-lime-700 text-white shadow-lg hover:shadow-xl'
                            : 'bg-slate-900 hover:bg-slate-700 text-white'
                        }`}
                        onClick={() => handlePlanSelect(plan.id)}
                        disabled={selectedPlanId === plan.id}
                      >
                        {selectedPlanId === plan.id ? (
                          <span className="flex items-center justify-center gap-2">
                            <span>Selected</span>
                            <CheckCircle className="w-5 h-5" />
                          </span>
                        ) : (
                          <>
                            Get Started
                            <ArrowRight className="w-5 h-5 ml-2" />
                          </>
                        )}
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-6 py-16 md:py-24 bg-white border-t border-slate-200">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-slate-600">Everything you need to know about our pricing and plans</p>
          </motion.div>

          <div className="space-y-4">
            {[
              {
                q: 'Can I switch plans later?',
                a: 'Yes, you can upgrade or downgrade at any time. Upgrades take effect immediately with prorated billing. Downgrades take effect at the end of your current billing period.'
              },
              {
                q: 'What payment methods do you accept?',
                a: 'We accept UPI payments (GPay, PhonePe, Paytm, etc.) via QR code, and bank transfers. All payments are manually verified by our team within 24 hours.'
              },
              {
                q: 'Is there a free trial?',
                a: 'We offer a 14-day free trial for all plans. No credit card required. After the trial, you can choose to subscribe or continue with limited free features.'
              },
              {
                q: 'What happens when my subscription expires?',
                a: 'You\'ll receive notifications 7 days before expiry. After expiration, your account switches to read-only mode. Your data is preserved for 90 days for easy reactivation.'
              },
              {
                q: 'Can I get a custom plan for my restaurant chain?',
                a: 'Absolutely! Our Enterprise plan supports custom integrations, SSO, white-labeling, and dedicated support. Contact our sales team for a tailored solution.'
              },
              {
                q: 'Are there any hidden fees?',
                a: 'No hidden fees. The price you see is the price you pay. Add-ons are optional and clearly priced. Taxes are calculated separately based on your location.'
              }
            ].map((faq, idx) => (
              <motion.details
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden"
              >
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                  <span className="font-semibold text-slate-900 text-lg pr-4">{faq.q}</span>
                  <span className="flex-shrink-0 w-6 h-6 bg-slate-200 rounded-lg flex items-center justify-center text-slate-500 group-open:rotate-180 transition-transform">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                  </span>
                </summary>
                <div className="px-6 pb-6 text-slate-600 leading-relaxed animate-slide-down">{faq.a}</div>
              </motion.details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="px-6 py-16 md:py-24 bg-slate-900">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Transform Your Restaurant Reviews?
            </h2>
            <p className="text-lg text-slate-300 mb-10">
              Join hundreds of restaurants using AI to understand what customers really think.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="large"
                className="bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-600 hover:to-lime-700 text-white font-bold px-10 py-4 rounded-2xl"
                onClick={() => navigate('/payment')}
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                size="large"
                variant="ghost"
                className="text-white border-slate-600 hover:bg-slate-800 px-10 py-4 rounded-2xl"
                onClick={() => navigate('/signup')}
              >
                Create Account
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};