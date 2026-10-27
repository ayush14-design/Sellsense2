import React, { useEffect, useRef, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Button } from '../components/Button';
import {
  ArrowRight, TrendingUp, TrendingDown, MessageSquare, BarChart3, CheckCircle, XCircle,
  Users, Cpu, Zap, Star, Shield, Clock, Target,
  Sparkles, Brain, Globe, Smartphone, ChefHat, Truck,
  Award, Heart, RefreshCw, Zap as ZapIcon,
  X, Mail, Send,
  ArrowUpRight, Eye, Download, Upload, Settings,
  ChevronDown, MapPin, Utensils, AlertTriangle, Lock,
  Video, Flag, Trophy,
  Calculator, ShoppingBag,
  Check, Copy
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authStorage } from '../utils/auth';
import { useCounterAnimation } from '../hooks/useScrollAnimation';
import { useScrollProgress, useParallax } from '../hooks/useScrollProgress';
import { useScrollReveal, useStaggeredReveal } from '../hooks/useScrollReveal';
import { useScrollTrigger } from '../hooks/useScrollProgress';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    const isAuthenticated = authStorage.isAuthenticated();
    if (!isAuthenticated) {
      navigate('/signup');
    } else {
      const user = authStorage.getUser();
      if (user?.role === 'super_admin' || user?.role === 'admin' || user?.email === 'admin@sellsense.ai') {
        navigate('/admin');
      } else {
        navigate('/setup');
      }
    }
  };

  const { progress } = useScrollProgress();
  const [activeStep, setActiveStep] = useState(0);
  const [roiOrders, setRoiOrders] = useState(1200);
  const [roiTicket, setRoiTicket] = useState(350);
  const [replyType, setReplyType] = useState<'negative' | 'mixed' | 'positive'>('negative');
  const [copiedReply, setCopiedReply] = useState(false);

  // AI Review Reply Templates
  const replyTemplates = {
    negative: {
      platform: 'Zomato',
      rating: 1,
      reviewer: 'Kunal Verma',
      dish: 'Paneer Butter Masala & Naan',
      review: 'Waited 50 mins, food was lukewarm and gravy had leaked into the polybag. Naan was chewy like rubber. Extremely disappointing for the price.',
      tags: ['Temperature: Cold', 'Packaging: Leaked', 'Delivery: 50m'],
      suggestedReply: 'Dear Kunal, we sincerely apologize for this experience. Lukewarm food and packaging leakages are completely unacceptable to our standards. We have already switched to leak-proof heat-sealed curry containers and flagged dispatch speed with our team. Please use code KUNALCARE for 40% off your next meal on Zomato — we would truly value the opportunity to make this right for you!',
    },
    positive: {
      platform: 'Google Maps',
      rating: 5,
      reviewer: 'Sneha Kapadia',
      dish: 'Signature Dal Makhani & Garlic Kulcha',
      review: 'Hands down the best Dal Makhani in the area! Slow-cooked to perfection, rich creamy texture, and the garlic kulcha was super soft. Staff was polite too.',
      tags: ['Taste: 10/10', 'Texture: Creamy', 'Staff: Courteous'],
      suggestedReply: 'Thank you so much Sneha! ❤️ Our chef simmers our signature Dal Makhani overnight for 16 hours over slow embers, and hearing your wonderful words about the rich creaminess made our whole kitchen team smile! Next time you visit, ask our staff for our house-special Mint Cooler. Looking forward to welcoming you back soon! ✨',
    },
    mixed: {
      platform: 'Swiggy',
      rating: 3,
      reviewer: 'Rohit Shenoy',
      dish: 'Veg Biryani Combo',
      review: 'Aroma and spice blend were spot on, but the portion size felt slightly smaller than usual and there was very little raita.',
      tags: ['Taste: Positive', 'Portion Size: Low', 'Add-on: Scant'],
      suggestedReply: 'Hi Rohit, thank you for being a valued patron! We are thrilled you enjoyed the biryani aroma and authentic spice blend, but we hear your feedback loud and clear regarding portion size and raita quantity. We have recalibrated our standard kitchen scoop weights today to guarantee generous servings every single time. Next time will be 5-star worthy, promised!',
    },
  };

  const handleCopyReply = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedReply(true);
    setTimeout(() => setCopiedReply(false), 2000);
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Hero parallax
  const { ref: heroRef, offset: heroParallax } = useParallax(0.3);

  // Scroll-triggered sections - use reveal hooks
  const { ref: featuresRef, isVisible: featuresVisible } = useScrollReveal<HTMLDivElement>({ threshold: 0.2, delay: 100 });
  const { ref: howItWorksRef, isVisible: howItWorksVisible } = useScrollReveal<HTMLDivElement>({ threshold: 0.2, delay: 100 });
  const { ref: dashboardRef, isVisible: dashboardVisible } = useScrollReveal<HTMLDivElement>({ threshold: 0.2, delay: 100 });
  const { ref: ctaRef } = useScrollReveal<HTMLDivElement>({ threshold: 0.2, delay: 100 });

  // Additional refs for new sections
  const { ref: trustRef, isVisible: trustVisible } = useScrollReveal<HTMLDivElement>({ threshold: 0.2, delay: 100 });
  const { ref: platformsRef, isVisible: platformsVisible } = useScrollReveal<HTMLDivElement>({ threshold: 0.2, delay: 100 });
  const { ref: aiRef, isVisible: aiVisible } = useScrollReveal<HTMLDivElement>({ threshold: 0.2, delay: 100 });
  const { ref: benefitsRef, isVisible: benefitsVisible } = useScrollReveal<HTMLDivElement>({ threshold: 0.2, delay: 100 });
  const { ref: faqRef, isVisible: faqVisible } = useScrollReveal<HTMLDivElement>({ threshold: 0.2, delay: 100 });

  // Testimonial counter
  const { ref: testimonialRef } = useCounterAnimation<HTMLDivElement>(500, 1200, 100);
  const { ref: restaurantRef } = useCounterAnimation<HTMLDivElement>(1200, 1200, 200);
  const { ref: platformRef } = useCounterAnimation<HTMLDivElement>(3, 1200, 300);
  const { ref: accuracyRef } = useCounterAnimation<HTMLDivElement>(94, 1200, 400);

  // Counter animations
  const { ref: totalRef } = useCounterAnimation<HTMLDivElement>(214, 1200, 100);
  const { ref: positiveRef } = useCounterAnimation<HTMLDivElement>(158, 1200, 200);
  const { ref: negativeRef } = useCounterAnimation<HTMLDivElement>(38, 1200, 300);
  const { ref: neutralRef } = useCounterAnimation<HTMLDivElement>(18, 1200, 400);

  // Staggered reveals for feature cards
  const { containerRef: featuresContainerRef, visibleItems: featureItemsVisible } = useStaggeredReveal<HTMLDivElement>(3, 150);

  // Step detection for How It Works
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Scroll to top button visibility
  const { ref: scrollTopRef, isTriggered: showScrollTop } = useScrollTrigger<HTMLButtonElement>(0, '0px 0px -80% 0px', false);
  const [scrollTopVisible, setScrollTopVisible] = useState(false);

  useEffect(() => {
    if (showScrollTop) {
      setScrollTopVisible(true);
    } else {
      setScrollTopVisible(false);
    }
  }, [showScrollTop]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = stepRefs.current.indexOf(entry.target as HTMLDivElement);
            if (index !== -1) setActiveStep(index);
          }
        });
      },
      { threshold: 0.5, rootMargin: '0px 0px -50% 0px' }
    );

    stepRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Global Scroll Reveal Observer for all reveal-on-scroll and stagger-reveal elements
  useEffect(() => {
    const elements = document.querySelectorAll('.reveal-on-scroll, .stagger-reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            entry.target.classList.add('is-visible');
          }
        });
      },
      { threshold: 0.05, rootMargin: '0px 0px 60px 0px' }
    );

    elements.forEach((el) => observer.observe(el));

    const checkInitialVisibility = () => {
      elements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight + 100 && rect.bottom > -100) {
          el.classList.add('visible');
          el.classList.add('is-visible');
        }
      });
    };
    checkInitialVisibility();
    const timer = setTimeout(checkInitialVisibility, 200);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  // Marquee Live Customer Reviews
  const liveReviewsMarquee = [
    { platform: 'Zomato', color: '#E23744', rating: 5, text: 'The Veg Biryani was incredible, piping hot with perfect aroma!', dish: 'Veg Biryani', tag: '+Taste: 98%', positive: true, time: '2m ago' },
    { platform: 'Swiggy', color: '#FC8019', rating: 4, text: 'Masala Dosa was super crispy. Chutneys were fresh and spicy.', dish: 'Masala Dosa', tag: '+Crispy Crust', positive: true, time: '5m ago' },
    { platform: 'Google', color: '#4285F4', rating: 2, text: 'Paneer tikka was great but delivery took 48 minutes.', dish: 'Paneer Tikka', tag: '-Delivery Delay', positive: false, time: '8m ago' },
    { platform: 'Zomato', color: '#E23744', rating: 5, text: 'Cheese sandwich melted just right, best midnight snack!', dish: 'Cheese Sandwich', tag: '+Packaging', positive: true, time: '11m ago' },
    { platform: 'Swiggy', color: '#FC8019', rating: 4, text: 'Veg Hakka Noodles was flavorful. Loved the packaging!', dish: 'Hakka Noodles', tag: '+Generous Portion', positive: true, time: '14m ago' },
    { platform: 'Google', color: '#4285F4', rating: 5, text: 'Consistently delicious food and courteous team. 10/10', dish: 'Nelam Special Thali', tag: '+Service Quality', positive: true, time: '17m ago' },
    { platform: 'Zomato', color: '#E23744', rating: 3, text: 'Curry was a bit salty today, usually it is perfect.', dish: 'Dal Makhani', tag: '-Salt Balance', positive: false, time: '21m ago' },
  ];

  const steps = [
    {
      icon: Users,
      iconBg: 'bg-lime-accent',
      title: 'Create Account',
      desc: 'Sign up in seconds and set up your restaurant profile with cuisine type, locations, and menu.',
      visual: (
        <div className="relative w-full h-48">
          <div className="absolute inset-0 bg-gradient-to-br from-lime-accent/10 to-cyan/10 rounded-2xl" />
          <div className="absolute inset-0 p-4 flex flex-col justify-center items-center">
            {/* Animated phone mockup */}
            <div className="relative w-48 h-96 bg-slate-900 rounded-[32px] p-2 shadow-2xl float-slow" style={{ animationDelay: '0s' }}>
              <div className="w-full h-full bg-white rounded-[28px] overflow-hidden relative">
                <div className="h-8 bg-slate-100 flex items-center justify-center px-4">
                  <div className="w-20 h-1 bg-slate-300 rounded-full" />
                </div>
                <div className="p-4 space-y-3">
                  <div className="h-12 bg-gradient-to-r from-lime-accent/20 to-cyan/20 rounded-xl flex items-center justify-center">
                    <span className="text-sm font-medium text-lime-accent">Welcome to SellSense</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="h-20 bg-gray-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Users className="text-lime-accent text-2xl" />
                    </div>
                    <div className="h-20 bg-gray-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <ChefHat className="text-orange text-2xl" />
                    </div>
                    <div className="h-20 bg-gray-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <MapPin className="text-red text-2xl" />
                    </div>
                    <div className="h-20 bg-gray-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Utensils className="text-green text-2xl" />
                    </div>
                  </div>
                  <div className="mt-4 h-12 bg-lime-400 rounded-xl flex items-center justify-center text-slate-950 font-black group-hover:shadow-lg transition-shadow">
                    Continue
                  </div>
                </div>
              </div>
            </div>
            {/* Floating checkmark */}
            <div className="absolute -top-2 -right-2 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
              <CheckCircle className="text-white text-2xl" />
            </div>
            {/* Floating particles */}
            <div className="absolute top-10 right-10 w-4 h-4 bg-lime-accent/20 rounded-full animate-pulse" />
            <div className="absolute bottom-10 left-10 w-3 h-3 bg-cyan/30 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
        </div>
      ),
    },
    {
      icon: Cpu,
      iconBg: 'bg-cyan',
      title: 'Connect Sources',
      desc: 'Link Zomato, Swiggy, and Google with one-click OAuth. Reviews sync automatically every hour.',
      visual: (
        <div className="relative w-full h-48">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan/10 to-purple/10 rounded-2xl" />
          <div className="absolute inset-0 p-4 flex flex-col justify-center items-center">
            {/* Platform cards animation */}
            <div className="flex gap-3 animate-fade-in-up">
              {[
                { name: 'Zomato', color: '#E23744', icon: '🍽️', delay: '0s' },
                { name: 'Swiggy', color: '#FC8019', icon: '🛵', delay: '0.2s' },
                { name: 'Google', color: '#4285F4', icon: '⭐', delay: '0.4s' },
              ].map((platform, i) => (
                <div key={i} className="relative group" style={{ animationDelay: platform.delay }}>
                  <div className="w-28 h-40 bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-4 flex flex-col items-center justify-center transition-all duration-300 hover:border-lime-accent hover:shadow-2xl hover:-translate-y-2 card-shine">
                    <div className="text-3xl mb-2">{platform.icon}</div>
                    <span className="text-sm font-semibold text-gray-700">{platform.name}</span>
                    <div className="mt-3 w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full animate-pulse" style={{ width: '60%', background: platform.color }} />
                    </div>
                    <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
                      <CheckCircle className="text-green-500" size={10} />
                      <span>Connected</span>
                    </div>
                  </div>
                  {/* Floating arrow */}
                  <div className="absolute -top-3 right-3 w-6 h-6 bg-cyan/10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="text-cyan text-sm" />
                  </div>
                </div>
              ))}
            </div>
            {/* Central brain */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-16 h-16 bg-cyan/10 rounded-2xl flex items-center justify-center shadow-lg float-slow" style={{ animationDelay: '0.6s' }}>
              <Brain className="text-cyan text-2xl" />
            </div>
            {/* Data flow lines */}
            <div className="absolute top-10 left-1/2 -translate-x-1/2 w-1 h-16 bg-gradient-to-b from-cyan to-transparent opacity-30" />
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-1 h-16 bg-gradient-to-t from-purple to-transparent opacity-30" />
          </div>
        </div>
      ),
    },
    {
      icon: Zap,
      iconBg: 'bg-orange',
      title: 'Pick a Product',
      desc: 'Choose any menu item to analyze. See sentiment, topics, and trends for each dish instantly.',
      visual: (
        <div className="relative w-full h-48">
          <div className="absolute inset-0 bg-gradient-to-br from-orange/10 to-pink/10 rounded-2xl" />
          <div className="absolute inset-0 p-4 flex flex-col justify-center items-center">
            {/* Menu items carousel */}
            <div className="relative w-full max-w-xs">
              {[
                { name: 'Chicken Biryani', rating: 4.5, reviews: 234, sentiment: 'Positive', trend: 'up' },
                { name: 'Butter Naan', rating: 4.8, reviews: 189, sentiment: 'Very Positive', trend: 'up' },
                { name: 'Paneer Tikka', rating: 3.9, reviews: 156, sentiment: 'Mixed', trend: 'down' },
                { name: 'Dal Makhani', rating: 4.2, reviews: 198, sentiment: 'Positive', trend: 'up' },
              ].map((item, i) => (
                <div key={i} className={`absolute inset-0 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 transition-all duration-500 ${i === 0 ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-95 -translate-y-4'}`} style={{ animationDelay: `${i * 0.5}s` }}>
                  <div className="flex items-start gap-3">
                    <div className="w-14 h-14 bg-gradient-to-br from-orange/20 to-pink/20 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Utensils className="text-orange text-xl" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-deep-slate-800 truncate">{item.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-lg font-bold text-yellow-500">{item.rating}★</span>
                        <span className="text-sm text-gray-500">({item.reviews} reviews)</span>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${item.trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {item.trend === 'up' ? <TrendingUp className="inline mr-1" size={10} /> : <TrendingDown className="inline mr-1" size={10} />} {item.sentiment}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-xs text-gray-500">
                    <span>Taste: 92%</span>
                    <span>Portion: 88%</span>
                    <span>Temp: 76%</span>
                  </div>
                </div>
              ))}
            </div>
            {/* Selection indicator */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 flex gap-2">
              {[0,1,2,3].map((i) => (
                <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === 0 ? 'bg-orange w-6' : 'bg-gray-300'}`} />
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      icon: BarChart3,
      iconBg: 'bg-purple',
      title: 'Get Insights',
      desc: 'AI analyzes sentiment, detects themes, benchmarks competitors, and gives prioritized recommendations.',
      visual: (
        <div className="relative w-full h-48">
          <div className="absolute inset-0 bg-gradient-to-br from-purple/10 to-pink/10 rounded-2xl" />
          <div className="absolute inset-0 p-4 flex flex-col justify-center items-center">
            {/* Dashboard preview */}
            <div className="w-full max-w-xs bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <span className="font-semibold text-deep-slate-800">AI Insights</span>
                <div className="w-6 h-6 bg-purple/10 rounded-xl flex items-center justify-center">
                  <Sparkles className="text-purple text-lg" />
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3 p-3 bg-lime-accent/5 rounded-xl border border-lime-accent/20 group-hover:border-lime-accent/50 transition-all">
                  <div className="w-8 h-8 bg-lime-accent/20 rounded-lg flex items-center justify-center">
                    <Target className="text-lime-accent text-lg" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-deep-slate-800">Add vegan options</p>
                    <p className="text-xs text-gray-500">+15% projected rating boost</p>
                  </div>
                  <span className="text-xs font-bold text-lime-accent px-2 py-1 bg-lime-accent/10 rounded-full">HIGH</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-100 group-hover:border-red-200 transition-all">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="text-red-500 text-lg" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-deep-slate-800">Fix delivery packaging</p>
                    <p className="text-xs text-gray-500">23 complaints this month</p>
                  </div>
                  <span className="text-xs font-bold text-red-500 px-2 py-1 bg-red-100 rounded-full">URGENT</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100 group-hover:border-blue-200 transition-all">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="text-blue-500 text-lg" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-deep-slate-800">Promote Butter Naan</p>
                    <p className="text-xs text-gray-500">4.8★ • Top rated dish</p>
                  </div>
                  <span className="text-xs font-bold text-blue-500 px-2 py-1 bg-blue-100 rounded-full">QUICK WIN</span>
                </div>
              </div>
            </div>
            {/* Floating metrics */}
            <div className="absolute -top-4 right-4 flex flex-col gap-2">
              <div className="w-20 h-20 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 text-center float-slow" style={{ animationDelay: '0s' }}>
                <div className="text-2xl font-bold text-purple counter-bounce">94%</div>
                <div className="text-xs text-gray-500">Accuracy</div>
              </div>
              <div className="w-20 h-20 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 text-center float-slow" style={{ animationDelay: '-1s' }}>
                <div className="text-2xl font-bold text-cyan counter-bounce">247</div>
                <div className="text-xs text-gray-500">Topics</div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* Scroll Progress Bar */}
      <div
        className="scroll-progress-bar"
        style={{ transform: `scaleX(${progress})` }}
        aria-hidden="true"
      />

      {/* Background Blobs */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      <Navbar />

      {/* Hero Section */}
      <section ref={heroRef} className="relative pt-32 pb-28 px-6 min-h-[90vh] flex items-center">
        {/* Enhanced Background Elements */}
        <div className="absolute inset-0 -z-20 pointer-events-none overflow-hidden">
          {/* Gradient orbs for depth */}
          <div className="gradient-orb orb-1" />
          <div className="gradient-orb orb-2" />
          <div className="gradient-orb orb-3" />
          <div className="gradient-orb orb-4" />
          {/* Grid pattern */}
          <div className="absolute inset-0 grid-pattern opacity-50 dark:opacity-30" />
          {/* Dots pattern */}
          <div className="absolute inset-0 dots-pattern opacity-30 dark:opacity-20" />
        </div>

        <div className="max-w-7xl mx-auto w-full">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="reveal-on-scroll stagger-reveal relative z-10 visible is-visible">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-lime-accent/10 text-lime-accent text-sm font-medium mb-6 animate-fade-in-up dark:bg-lime-accent/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-accent opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-lime-accent" />
                </span>
                NEW: AI Review Intelligence v2.4
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 dark:text-slate-100 leading-[1.1] text-reveal">
                <span style={{ transitionDelay: '0ms' }}>Turn Customer Reviews</span>
                <br />
                <span style={{ transitionDelay: '100ms' }} className="gradient-text">Into Smarter Decisions</span>
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed mt-6 max-w-xl reveal-on-scroll left visible is-visible">
                Understand what customers love, discover recurring complaints, and improve your food business with AI-powered insights.
              </p>

              {/* Trust badges */}
              <div className="flex flex-wrap items-center gap-6 mt-10 reveal-on-scroll right visible is-visible" style={{ transitionDelay: '200ms' }}>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <CheckCircle className="text-lime-accent" size={16} />
                  <span>500+ restaurants</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <CheckCircle className="text-lime-accent" size={16} />
                  <span>500K+ reviews analyzed</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <CheckCircle className="text-lime-accent" size={16} />
                  <span>94% AI accuracy</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 mt-8 reveal-on-scroll right visible is-visible" style={{ transitionDelay: '300ms' }}>
                <Button size="large" onClick={handleGetStarted} className="group bg-lime-400 text-slate-950 font-black hover:bg-lime-500 shadow-lg hover:shadow-xl transition-all duration-300">
                  Get Started Free
                  <ArrowRight className="inline ml-2 transition-transform group-hover:translate-x-1" size={20} />
                </Button>
                <Button
                  variant="secondary"
                  size="large"
                  onClick={() => scrollToSection('how-it-works')}
                  className="group border-gray-300 dark:border-slate-600 hover:border-lime-accent hover:text-lime-accent text-slate-700 dark:text-slate-300 transition-all duration-300"
                >
                  See How It Works
                  <Eye className="inline ml-2 transition-transform group-hover:translate-x-1" size={18} />
                </Button>
              </div>

              {/* Stats preview */}
              <div className="grid grid-cols-3 gap-4 mt-10 reveal-on-scroll scale visible is-visible" style={{ transitionDelay: '400ms' }}>
                <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-gray-100 dark:border-slate-700 backdrop-blur-sm text-center hover:shadow-lg hover:border-lime-accent/50 transition-all duration-300">
                  <div className="text-2xl font-bold text-lime-accent">14-day</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Free Trial</div>
                </div>
                <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-gray-100 dark:border-slate-700 backdrop-blur-sm text-center hover:shadow-lg hover:border-lime-accent/50 transition-all duration-300">
                  <div className="text-2xl font-bold text-cyan">No CC</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Required</div>
                </div>
                <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-gray-100 dark:border-slate-700 backdrop-blur-sm text-center hover:shadow-lg hover:border-lime-accent/50 transition-all duration-300">
                  <div className="text-2xl font-bold text-purple">2 min</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Setup Time</div>
                </div>
              </div>
            </div>

            {/* Animated Hero Visual - Enhanced */}
            <div className="relative reveal-on-scroll right visible is-visible" style={{ transitionDelay: '200ms' }}>
              <div className="relative">
                {/* Floating cards animation */}
                <div className="relative h-[500px] md:h-[550px]">
                  {/* Floating food icons around */}
                  <div className="absolute -top-4 -left-4 w-16 h-16 floating-food opacity-20" style={{ animationDelay: '0s' }}>
                    <svg className="w-full h-full text-lime-accent" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM18 11V10C18 7.79 16.21 6 14 6H10C7.79 6 6 7.79 6 10V11H4V10C4 5.58 7.58 2 12 2C16.42 2 20 5.58 20 10V11H18ZM14 18V14H10V18H6V10C6 5.58 9.58 2 14 2C18.42 2 22 5.58 22 10V18H14Z"/></svg>
                  </div>
                  <div className="absolute -top-4 right-10 w-16 h-16 floating-food opacity-20" style={{ animationDelay: '-2s' }}>
                    <svg className="w-full h-full text-cyan" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.58 20 4 16.48 4 12C4 7.58 7.58 4 12 4C16.42 4 20 7.58 20 12C20 16.48 16.42 20 12 20ZM12 6C10.34 6 9 7.34 9 9C9 10.66 10.34 12 12 12C13.66 12 15 10.66 15 9C15 7.34 13.66 6 12 6Z"/></svg>
                  </div>
                  <div className="absolute bottom-10 -right-4 w-16 h-16 floating-food opacity-20" style={{ animationDelay: '-4s' }}>
                    <svg className="w-full h-full text-orange" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM18 11V10C18 7.79 16.21 6 14 6H10C7.79 6 6 7.79 6 10V11H4V10C4 5.58 7.58 2 12 2C16.42 2 20 5.58 20 10V11H18ZM14 18V14H10V18H6V10C6 5.58 9.58 2 14 2C18.42 2 22 5.58 22 10V18H14Z"/></svg>
                  </div>
                  <div className="absolute bottom-20 left-20 w-16 h-16 floating-food opacity-20" style={{ animationDelay: '-6s' }}>
                    <svg className="w-full h-full text-purple" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM18 11V10C18 7.79 16.21 6 14 6H10C7.79 6 6 7.79 6 10V11H4V10C4 5.58 7.58 2 12 2C16.42 2 20 5.58 20 10V11H18ZM14 18V14H10V18H6V10C6 5.58 9.58 2 14 2C18.42 2 22 5.58 22 10V18H14Z"/></svg>
                  </div>

                  {/* Main dashboard card */}
                  <div
                    className="absolute top-10 left-10 w-72 h-48 bg-white rounded-2xl shadow-2xl border border-gray-100 float-slow card-shine"
                    style={{ animationDelay: '0s', transform: `translateY(${heroParallax * 0.5}px)` }}
                  >
                    <div className="p-4 border-b border-gray-100 flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-yellow-400" />
                      <div className="w-3 h-3 rounded-full bg-green-400" />
                    </div>
                    <div className="p-6 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Positive</span>
                        <span className="text-2xl font-bold text-green-600 count-animate" style={{ animationDelay: '200ms' }}>71%</span>
                      </div>
                      <div className="h-2 bg-green-100 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full progress-ring-animate" style={{ width: '71%', animationDelay: '0s', transition: 'width 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Negative</span>
                        <span className="text-2xl font-bold text-red-600 count-animate" style={{ animationDelay: '300ms' }}>18%</span>
                      </div>
                      <div className="h-2 bg-red-100 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500 rounded-full progress-ring-animate" style={{ width: '18%', animationDelay: '-2s', transition: 'width 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Neutral</span>
                        <span className="text-2xl font-bold text-gray-600 count-animate" style={{ animationDelay: '400ms' }}>11%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gray-400 rounded-full progress-ring-animate" style={{ width: '11%', animationDelay: '-4s', transition: 'width 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                      </div>
                    </div>
                  </div>

                  {/* Rating card */}
                  <div
                    className="absolute top-20 right-10 w-56 h-56 bg-white rounded-2xl shadow-xl border border-gray-100 float-slow flex items-center justify-center card-shine"
                    style={{ animationDelay: '-2s', transform: `translateY(${heroParallax * 0.3}px)` }}
                  >
                    <div className="text-center p-4">
                      <div className="text-4xl font-bold text-lime-accent mb-1 counter-bounce">4.8★</div>
                      <div className="text-sm text-gray-600">Avg Rating</div>
                      <div className="flex items-center justify-center gap-1 mt-2 text-yellow-400">
                        ★★★★★
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <span className="text-xs text-green-600 font-medium">+0.4 vs last month</span>
                      </div>
                    </div>
                  </div>

                  {/* AI Insight card */}
                  <div
                    className="absolute bottom-10 left-20 w-72 h-44 bg-white rounded-2xl shadow-xl border border-gray-100 float-slow card-shine"
                    style={{ animationDelay: '-4s', transform: `translateY(${heroParallax * 0.7}px)` }}
                  >
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-lime-accent/10 rounded-lg flex items-center justify-center animate-pulse-glow">
                          <Brain className="text-lime-accent text-lg" />
                        </div>
                        <span className="font-semibold text-deep-slate-800">AI Insight</span>
                        <div className="ml-auto w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      </div>
                      <p className="text-sm text-gray-600 mb-3">"Customers love the biryani but complain about cold delivery"</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">Taste</span>
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full">Temperature</span>
                        <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full">Delivery</span>
                      </div>
                    </div>
                  </div>

                  {/* Platform badges floating */}
                  <div className="absolute top-0 right-20 flex flex-col gap-2">
                    <div className="platform-badge zomato float-slow" style={{ animationDelay: '0s' }}>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.58 20 4 16.48 4 12C4 7.58 7.58 4 12 4C16.42 4 20 7.58 20 12C20 16.48 16.42 20 12 20Z"/></svg>
                      <span className="text-xs font-medium">Zomato</span>
                    </div>
                    <div className="platform-badge swiggy float-slow" style={{ animationDelay: '-1s' }}>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2Z"/></svg>
                      <span className="text-xs font-medium">Swiggy</span>
                    </div>
                    <div className="platform-badge google float-slow" style={{ animationDelay: '-2s' }}>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z"/></svg>
                      <span className="text-xs font-medium">Google</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-scroll-bounce">
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Live Ingestion Marquee - Venture In Action */}
      <div className="relative py-6 bg-slate-50/90 dark:bg-slate-900/80 border-y border-gray-200 dark:border-slate-800 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-lime-500" />
            </span>
            <span>Live Review Stream: Ingesting & Analyzing from Zomato, Swiggy & Google</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-lime-accent" /> Hourly Auto-Sync</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-cyan" /> 94.2% AI Accuracy</span>
          </div>
        </div>

        <div className="relative w-full overflow-hidden">
          <div className="flex gap-4 marquee whitespace-nowrap">
            {[...liveReviewsMarquee, ...liveReviewsMarquee].map((item, i) => (
              <div
                key={i}
                className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all flex-shrink-0"
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-sm"
                  style={{ background: item.color }}
                >
                  {item.platform[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{item.dish}</span>
                    <span className="text-xs text-yellow-500 font-bold">{item.rating}★</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.positive
                          ? 'bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                          : 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                      }`}
                    >
                      {item.tag}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 truncate max-w-xs">{item.text}</p>
                </div>
                <span className="text-[10px] text-slate-400 ml-1 font-mono">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section - Visual Cards */}
      <section ref={featuresRef} id="features" className="py-20 px-6 bg-white dark:bg-slate-900 relative">
        {/* Background pattern */}
        <div className="absolute inset-0 -z-10 pointer-events-none opacity-30 dark:opacity-10 grid-pattern" />
        <div className="absolute inset-0 -z-10 pointer-events-none opacity-20 dark:opacity-10 dots-pattern" />

        <div className="max-w-7xl mx-auto">
          <div className={`text-center mb-16 reveal-on-scroll ${featuresVisible ? 'visible' : ''}`}>
            <span className="inline-block px-4 py-2 rounded-full bg-lime-accent/10 text-lime-accent text-sm font-medium mb-4 dark:bg-lime-accent/20">Core Features</span>
            <h2 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">Understand Every Customer Opinion</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">Three powerful ways to turn noise into signal</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6" ref={featuresContainerRef}>
            {/* Feature 1: Sentiment */}
            <div className={`group relative p-8 rounded-3xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 hover:border-lime-accent/50 hover:shadow-2xl transition-all duration-500 overflow-hidden card-shine ${featureItemsVisible.has(0) ? 'visible' : ''}`} style={{ transitionDelay: '0ms' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-lime-accent/5 to-cyan/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="w-14 h-14 bg-lime-accent/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="text-lime-accent text-3xl" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-3">Sentiment Analysis</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">AI classifies every review as positive, negative, or neutral with 94% accuracy.</p>

                {/* Mini demo visualization */}
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-2xl p-4 mb-6">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-3">Live demo: "The biryani was amazing but delivery was cold"</div>
                  <div className="flex gap-2">
                    <div className="flex-1 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl text-center border border-green-100 dark:border-green-800">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">Positive</div>
                      <div className="text-xs text-green-600 dark:text-green-400">Taste, Quality</div>
                    </div>
                    <div className="flex-1 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl text-center border border-red-100 dark:border-red-800">
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">Negative</div>
                      <div className="text-xs text-red-600 dark:text-red-400">Temperature</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">Real-time classification</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">Multi-language support</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">Trend detection</span>
                  </div>
                </div>
              </div>
              {/* Floating metric */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-lime-accent/10 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-2xl font-bold text-lime-accent">94%</span>
              </div>
            </div>

            {/* Feature 2: Feedback Detection */}
            <div className={`group relative p-8 rounded-3xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 hover:border-cyan/50 hover:shadow-2xl transition-all duration-500 overflow-hidden card-shine ${featureItemsVisible.has(1) ? 'visible' : ''}`} style={{ transitionDelay: '100ms' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-cyan/5 to-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="w-14 h-14 bg-cyan/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <MessageSquare className="text-cyan text-3xl" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-3">Repeated Feedback Detection</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">Automatically surfaces the most mentioned praises and complaints across all platforms.</p>

                {/* Mini demo visualization */}
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-2xl p-4 mb-6">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-3">Top topics detected this week</div>
                  <div className="space-y-2">
                    {[
                      { label: 'Taste & Flavor', count: 89, sentiment: 'positive' },
                      { label: 'Cold Delivery', count: 67, sentiment: 'negative' },
                      { label: 'Portion Size', count: 45, sentiment: 'positive' },
                      { label: 'Packaging', count: 34, sentiment: 'negative' },
                    ].map((topic, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{topic.label}</span>
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${topic.sentiment === 'positive' ? 'text-green-600' : 'text-red-600'}`}>{topic.count}</span>
                          <div className={`w-16 h-1.5 rounded-full ${topic.sentiment === 'positive' ? 'bg-green-100' : 'bg-red-100'}`}>
                            <div className={`h-full rounded-full ${topic.sentiment === 'positive' ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${(topic.count / 89) * 100}%` }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">Topic clustering</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">Frequency tracking</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">Priority ranking</span>
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-cyan/10 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-2xl font-bold text-cyan">247</span>
              </div>
            </div>

            {/* Feature 3: Platform Insights */}
            <div className={`group relative p-8 rounded-3xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 hover:border-purple/50 hover:shadow-2xl transition-all duration-500 overflow-hidden card-shine ${featureItemsVisible.has(2) ? 'visible' : ''}`} style={{ transitionDelay: '200ms' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-purple/5 to-pink/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="w-14 h-14 bg-purple/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="text-purple text-3xl" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-3">Platform-Wise Insights</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">Compare performance across Zomato, Swiggy, and Google with unified analytics.</p>

                {/* Mini demo visualization */}
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-2xl p-4 mb-6">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-3">Your ratings across platforms</div>
                  <div className="space-y-3">
                    {[
                      { name: 'Zomato', rating: 4.2, color: '#E23744', reviews: '1,234' },
                      { name: 'Swiggy', rating: 4.5, color: '#FC8019', reviews: '987' },
                      { name: 'Google', rating: 4.7, color: '#4285F4', reviews: '2,156' },
                    ].map((platform, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold" style={{ background: platform.color }}>
                          {platform.name[0]}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-900 dark:text-slate-100">{platform.name}</span>
                            <span className="text-lg font-bold text-yellow-500">{platform.rating}★</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-lime-accent to-cyan rounded-full" style={{ width: `${(platform.rating / 5) * 100}%` }} />
                          </div>
                        </div>
                        <span className="text-sm text-slate-500 dark:text-slate-400">{platform.reviews} reviews</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">Zomato integration</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">Swiggy integration</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">Google Reviews</span>
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-purple/10 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-2xl font-bold text-purple">3</span>
              </div>
            </div>
          </div>

          {/* Feature highlights strip */}
          <div className="mt-16 grid md:grid-cols-3 gap-4 reveal-on-scroll left">
            {[
              { icon: Shield, title: "Enterprise Security", desc: "SOC 2 Type II, GDPR compliant, AES-256 encryption", color: "lime" },
              { icon: Globe, title: "12+ Languages", desc: "Hindi, English, Tamil, Telugu, Bengali & more", color: "cyan" },
              { icon: ZapIcon, title: "Real-time Sync", desc: "Hourly auto-sync from all connected platforms", color: "orange" },
              { icon: Brain, title: "Weekly AI Updates", desc: "Models retrained weekly with latest review data", color: "purple" },
              { icon: Download, title: "Export Everything", desc: "CSV, PDF, API access for custom integrations", color: "pink" },
              { icon: Settings, title: "Custom Alerts", desc: "Slack, email, webhook notifications for rating changes", color: "blue" },
            ].map((highlight, i) => (
              <div key={i} className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-2xl border border-gray-100 dark:border-slate-700 hover:border-lime-accent/50 hover:shadow-lg transition-all duration-300 group card-hover-enhanced">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${highlight.color}-100 group-hover:${highlight.color}-200 transition-colors`}>
                  <highlight.icon className={`text-${highlight.color}-500 text-xl`} />
                </div>
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">{highlight.title}</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">{highlight.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Visual Flow */}
      <section ref={howItWorksRef} id="how-it-works" className="py-20 px-6 bg-gray-50 dark:bg-slate-800/50 relative">
        <div className="max-w-5xl mx-auto">
          <div className={`text-center mb-16 reveal-on-scroll ${howItWorksVisible ? 'visible' : ''}`}>
            <span className="inline-block px-4 py-2 rounded-full bg-lime-accent/10 text-lime-accent text-sm font-medium mb-4 dark:bg-lime-accent/20">How It Works</span>
            <h2 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">From Reviews to Insights in 4 Steps</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">No complex setup. Just connect, select, and understand.</p>
          </div>

          {/* Visual Flow Container */}
          <div className="relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute left-[92px] top-0 bottom-0 w-1 bg-gradient-to-b from-lime-accent via-cyan to-purple opacity-30" />
            <div className="hidden md:block absolute left-[92px] top-0 bottom-0 w-1 bg-gradient-to-b from-lime-accent via-cyan to-purple flow-line">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-lime-accent via-cyan to-purple" style={{ transform: `scaleY(${Math.min(activeStep / 3 + 0.25, 1)})`, transformOrigin: 'top' }} />
            </div>

            <div className="space-y-12">
              {steps.map((step, index) => (
                <div
                  key={index}
                  ref={(el) => { stepRefs.current[index] = el; }}
                  className={`relative flex gap-6 items-start reveal-on-scroll ${index % 2 === 0 ? 'left' : 'right'} transition-all duration-500 ${howItWorksVisible ? 'visible' : ''}`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  {/* Step number & connector */}
                  <div className="relative flex-shrink-0 z-10">
                    <div className={`relative w-18 h-18 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500 ${step.iconBg} ${activeStep === index ? 'scale-110 ring-4 ring-offset-2' : ''} ${activeStep > index ? 'ring-lime-accent' : 'ring-offset-gray-50'}`}>
                      {activeStep > index ? (
                        <CheckCircle className="text-white text-3xl" />
                      ) : (
                        <span className="text-white text-2xl font-bold">{String(index + 1).padStart(2, '0')}</span>
                      )}
                      {activeStep === index && (
                        <div className="pulse-ring absolute inset-0 rounded-2xl" style={{ borderColor: step.iconBg.replace('bg-', '') }} />
                      )}
                    </div>
                  </div>

                  {/* Visual Animation */}
                  <div className="flex-1 max-w-md">
                    {step.visual}
                  </div>

                  {/* Text Content */}
                  <div className="flex-1 pt-4 min-w-[200px]">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">{step.title}</h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile step indicators */}
          <div className="md:hidden mt-8 flex justify-center gap-2">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveStep(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${activeStep === index ? 'bg-lime-accent w-8' : 'bg-gray-300 hover:bg-gray-400'}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Preview - Live Demo Feel */}
      <section ref={dashboardRef} id="dashboard-preview" className="py-20 px-6 bg-white dark:bg-slate-900 relative">
        {/* Background elements */}
        <div className="absolute inset-0 -z-10 pointer-events-none opacity-30 dark:opacity-10 grid-pattern" />
        <div className="absolute top-0 right-0 w-1/2 h-full -z-10 pointer-events-none">
          <div className="gradient-orb orb-1" style={{ width: '300px', height: '300px', top: '10%', right: '10%' }} />
        </div>

        <div className="max-w-7xl mx-auto">
          <div className={`text-center mb-12 reveal-on-scroll ${dashboardVisible ? 'visible' : ''}`}>
            <span className="inline-block px-4 py-2 rounded-full bg-lime-accent/10 text-lime-accent text-sm font-medium mb-4 dark:bg-lime-accent/20">Live Preview</span>
            <h2 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">Your Analytics Dashboard</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">See how your data comes to life</p>
          </div>

          <div className="stagger-reveal">
            {/* Metric Cards */}
            <div className="grid md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-lg hover:border-lime-accent/50 transition-all duration-300 group reveal-on-scroll scale card-shine">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Total Reviews</span>
                  <div className="w-8 h-8 bg-lime-accent/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Users className="text-lime-accent text-lg" />
                  </div>
                </div>
                <div className="text-4xl font-bold text-slate-900 dark:text-slate-100 count-animate counter-bounce" ref={totalRef} style={{ animationDelay: '100ms' }}>214</div>
                <div className="mt-2 flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                  <TrendingUp className="text-green-500" size={12} />
                  <span>+23% vs last month</span>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-lg hover:border-green-500/50 transition-all duration-300 group reveal-on-scroll scale card-shine">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Positive</span>
                  <div className="w-8 h-8 bg-green-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <CheckCircle className="text-green-600 dark:text-green-400 text-lg" />
                  </div>
                </div>
                <div className="text-4xl font-bold text-green-600 dark:text-green-400 count-animate counter-bounce" ref={positiveRef} style={{ animationDelay: '200ms' }}>158</div>
                <div className="mt-2 flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                  <TrendingUp className="text-green-500" size={12} />
                  <span>74% of total</span>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-lg hover:border-red-500/50 transition-all duration-300 group reveal-on-scroll scale card-shine">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Negative</span>
                  <div className="w-8 h-8 bg-red-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <XCircle className="text-red-600 dark:text-red-400 text-lg" />
                  </div>
                </div>
                <div className="text-4xl font-bold text-red-600 dark:text-red-400 count-animate counter-bounce" ref={negativeRef} style={{ animationDelay: '300ms' }}>38</div>
                <div className="mt-2 flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                  <TrendingDown className="text-red-500" size={12} />
                  <span>18% - needs attention</span>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-lg hover:border-gray-500/50 transition-all duration-300 group reveal-on-scroll scale card-shine">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Neutral</span>
                  <div className="w-8 h-8 bg-gray-100 dark:bg-slate-700 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <BarChart3 className="text-gray-600 dark:text-gray-400 text-lg" />
                  </div>
                </div>
                <div className="text-4xl font-bold text-gray-600 dark:text-gray-400 count-animate counter-bounce" ref={neutralRef} style={{ animationDelay: '400ms' }}>18</div>
                <div className="mt-2 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <span>8% - opportunity</span>
                </div>
              </div>
            </div>

            {/* Sentiment Visualization */}
            <div className="bg-gray-50 dark:bg-slate-800/50 rounded-3xl p-8 border border-gray-100 dark:border-slate-700 reveal-on-scroll left card-shine">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg flex items-center gap-2">
                  <TrendingUp className="text-lime-accent" size={20} />
                  Sentiment Breakdown
                </h3>
                <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Last 30 days</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" /> Last 90 days</span>
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center relative">
                  <div className="relative w-32 h-32 mx-auto mb-4">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="54"
                        fill="none"
                        stroke="#E5E7EB"
                        strokeWidth="8"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="54"
                        fill="none"
                        stroke="#84CC16"
                        strokeWidth="8"
                        strokeDasharray="339"
                        strokeDashoffset="98"
                        strokeLinecap="round"
                        className="count-animate progress-ring-animate"
                        style={{ animationDelay: '200ms', transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl font-bold text-deep-slate-800 counter-bounce">71%</span>
                    </div>
                  </div>
                  <div className="text-sm text-green-600 font-medium">Positive</div>
                  <div className="mt-2 flex justify-center gap-1 text-xs">
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">Taste: 92%</span>
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">Fresh: 88%</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="relative w-32 h-32 mx-auto mb-4">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="64" cy="64" r="54" fill="none" stroke="#E5E7EB" strokeWidth="8" />
                      <circle
                        cx="64"
                        cy="64"
                        r="54"
                        fill="none"
                        stroke="#EF4444"
                        strokeWidth="8"
                        strokeDasharray="339"
                        strokeDashoffset="278"
                        strokeLinecap="round"
                        className="count-animate progress-ring-animate"
                        style={{ animationDelay: '300ms' }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl font-bold text-deep-slate-800 counter-bounce">18%</span>
                    </div>
                  </div>
                  <div className="text-sm text-red-600 font-medium">Negative</div>
                  <div className="mt-2 flex justify-center gap-1 text-xs">
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full">Temp: 67%</span>
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full">Pack: 45%</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="relative w-32 h-32 mx-auto mb-4">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="64" cy="64" r="54" fill="none" stroke="#E5E7EB" strokeWidth="8" />
                      <circle
                        cx="64"
                        cy="64"
                        r="54"
                        fill="none"
                        stroke="#9CA3AF"
                        strokeWidth="8"
                        strokeDasharray="339"
                        strokeDashoffset="302"
                        strokeLinecap="round"
                        className="count-animate progress-ring-animate"
                        style={{ animationDelay: '400ms' }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl font-bold text-deep-slate-800 counter-bounce">11%</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 font-medium">Neutral</div>
                  <div className="mt-2 flex justify-center gap-1 text-xs">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full">Service: 52%</span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full">Price: 48%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Topics - Animated bars */}
            <div className="grid md:grid-cols-2 gap-6 mt-8 reveal-on-scroll right">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 card-shine">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <CheckCircle className="text-green-500" size={18} />
                    What Customers Love
                  </h3>
                  <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">4 categories</span>
                </div>
                <div className="space-y-4">
                  {[
                    { label: 'Taste & Flavor', value: 42, color: 'from-green-500 to-emerald-500', icon: Heart },
                    { label: 'Freshness', value: 28, color: 'from-emerald-500 to-teal-500', icon: Sparkles },
                    { label: 'Portion Size', value: 22, color: 'from-lime-500 to-green-500', icon: Utensils },
                    { label: 'Quick Delivery', value: 18, color: 'from-cyan-500 to-blue-500', icon: Truck },
                  ].map((item, i) => (
                    <div key={i} className="reveal-on-scroll left group" style={{ transitionDelay: `${i * 100}ms` }}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <item.icon className="text-green-500" size={14} />
                          <span>{item.label}</span>
                        </div>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{item.value} mentions</span>
                      </div>
                      <div className="h-2.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden group-hover:h-3 transition-all duration-300">
                        <div
                          className="h-full bg-gradient-to-r rounded-full count-animate"
                          style={{
                            width: `${(item.value / 42) * 100}%`,
                            background: item.color,
                            transitionDelay: `${i * 100 + 200}ms`,
                            transitionDuration: '1s'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 card-shine">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <XCircle className="text-red-500" size={18} />
                    What Needs Improvement
                  </h3>
                  <span className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full">4 categories</span>
                </div>
                <div className="space-y-4">
                  {[
                    { label: 'Temperature Issues', value: 15, color: 'from-red-500 to-orange-500', icon: AlertTriangle },
                    { label: 'Spice Level', value: 8, color: 'from-orange-500 to-amber-500', icon: ChefHat },
                    { label: 'Packaging Quality', value: 6, color: 'from-amber-500 to-yellow-500', icon: Shield },
                    { label: 'Wait Time', value: 4, color: 'from-yellow-500 to-lime-500', icon: Clock },
                  ].map((item, i) => (
                    <div key={i} className="reveal-on-scroll right group" style={{ transitionDelay: `${i * 100}ms` }}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <item.icon className="text-red-500" size={14} />
                          <span>{item.label}</span>
                        </div>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{item.value} mentions</span>
                      </div>
                      <div className="h-2.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden group-hover:h-3 transition-all duration-300">
                        <div
                          className="h-full bg-gradient-to-r rounded-full count-animate"
                          style={{
                            width: `${(item.value / 15) * 100}%`,
                            background: item.color,
                            transitionDelay: `${i * 100 + 200}ms`,
                            transitionDuration: '1s'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Additional dashboard widgets */}
            <div className="grid md:grid-cols-3 gap-6 mt-8 reveal-on-scroll scale">
              {/* Rating Trend */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 card-shine">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                  <TrendingUp className="text-lime-accent" size={18} />
                  Rating Trend (30 days)
                </h4>
                <div className="h-32 relative">
                  <svg className="w-full h-full" viewBox="0 0 300 120" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="trendGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#84CC16" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#84CC16" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M10,100 L40,85 L70,75 L100,65 L130,55 L160,50 L190,48 L220,45 L250,42 L280,40"
                      stroke="#84CC16"
                      strokeWidth="3"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="count-animate"
                      style={{
                        strokeDasharray: 350,
                        strokeDashoffset: 350,
                        animationDelay: '200ms',
                        transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    />
                    <path
                      d="M10,100 L40,85 L70,75 L100,65 L130,55 L160,50 L190,48 L220,45 L250,42 L280,40"
                      stroke="url(#trendGradient)"
                      strokeWidth="20"
                      fill="none"
                    />
                  </svg>
                </div>
                <div className="mt-4 flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Start: 3.8★</span>
                  <span className="text-green-600 dark:text-green-400 font-semibold">Now: 4.2★</span>
                  <span className="text-lime-accent font-bold">+0.4★</span>
                </div>
              </div>

              {/* Competitor Comparison */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 card-shine">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                  <Award className="text-purple" size={18} />
                  vs Competitors
                </h4>
                <div className="space-y-3">
                  {[
                    { name: 'You', rating: 4.2, reviews: 214, highlight: true },
                    { name: 'Spice Palace', rating: 3.9, reviews: 189, highlight: false },
                    { name: 'Curry House', rating: 4.0, reviews: 156, highlight: false },
                    { name: 'Tandoor Treat', rating: 3.7, reviews: 203, highlight: false },
                  ].map((comp, i) => (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${comp.highlight ? 'bg-lime-accent/5 border border-lime-accent/20' : 'hover:bg-gray-50 dark:hover:bg-slate-700/50'}`}>
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-bold ${comp.highlight ? 'bg-lime-accent' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-slate-900 dark:text-slate-100">{comp.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{comp.reviews} reviews</div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <span className="text-xl font-bold text-yellow-500">{comp.rating}★</span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{comp.highlight ? 'You\'re #1!' : `${(4.2 - comp.rating).toFixed(1)}★ behind`}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Peak Hours Heatmap */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 card-shine">
                <h4 className="font-bold text-deep-slate-800 mb-4 flex items-center gap-2">
                  <Clock className="text-orange" size={18} />
                  Peak Review Hours
                </h4>
                <div className="grid grid-cols-6 gap-1">
                  {[
                    { hour: '12 PM', intensity: 0.9 },
                    { hour: '1 PM', intensity: 1.0 },
                    { hour: '2 PM', intensity: 0.8 },
                    { hour: '7 PM', intensity: 0.7 },
                    { hour: '8 PM', intensity: 0.9 },
                    { hour: '9 PM', intensity: 0.6 },
                  ].map((slot, i) => (
                    <div key={i} className="text-center group">
                      <div className={`w-full h-16 rounded-lg transition-all duration-300 flex items-end justify-center p-1`} style={{ background: `rgba(132, 204, 22, ${slot.intensity})` }}>
                        <div className="w-full h-1/2 bg-lime-accent rounded-t opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <span className="text-xs text-gray-500 mt-1 block">{slot.hour}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Social Proof Section */}
      <section ref={trustRef} id="trust" className="py-20 px-6 bg-white dark:bg-slate-900 relative">
        <div className="max-w-7xl mx-auto">
          <div className={`text-center mb-16 reveal-on-scroll ${trustVisible ? 'visible' : ''}`}>
            <span className="inline-block px-4 py-2 rounded-full bg-lime-accent/10 text-lime-accent text-sm font-medium mb-4 dark:bg-lime-accent/20">Trusted by Industry Leaders</span>
            <h2 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">Join 1,200+ Restaurants Making Smarter Decisions</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">From local cafes to multi-location chains, food businesses trust SellSense to understand their customers.</p>
          </div>

          {/* Trust Metrics */}
          <div className="grid md:grid-cols-4 gap-6 mb-16 stagger-reveal">
            <div className="bg-gradient-to-br from-lime-accent/5 to-cyan/5 p-8 rounded-3xl border border-lime-accent/20 hover:border-lime-accent/50 hover:shadow-xl transition-all duration-500 reveal-on-scroll scale">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-lime-accent/10 rounded-xl flex items-center justify-center">
                  <Users className="text-lime-accent text-2xl" />
                </div>
              </div>
              <div className="text-4xl font-bold text-slate-900 dark:text-slate-100 count-animate" ref={restaurantRef} style={{ animationDelay: '100ms' }}>1,200+</div>
              <div className="text-slate-600 dark:text-slate-400 mt-1">Active Restaurants</div>
            </div>
            <div className="bg-gradient-to-br from-cyan/5 to-purple/5 p-8 rounded-3xl border border-cyan/20 hover:border-cyan/50 hover:shadow-xl transition-all duration-500 reveal-on-scroll scale">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-cyan/10 rounded-xl flex items-center justify-center">
                  <MessageSquare className="text-cyan text-2xl" />
                </div>
              </div>
              <div className="text-4xl font-bold text-slate-900 dark:text-slate-100 count-animate" ref={testimonialRef} style={{ animationDelay: '200ms' }}>500K+</div>
              <div className="text-slate-600 dark:text-slate-400 mt-1">Reviews Analyzed</div>
            </div>
            <div className="bg-gradient-to-br from-purple/5 to-pink/5 p-8 rounded-3xl border border-purple/20 hover:border-purple/50 hover:shadow-xl transition-all duration-500 reveal-on-scroll scale">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-purple/10 rounded-xl flex items-center justify-center">
                  <Globe className="text-purple text-2xl" />
                </div>
              </div>
              <div className="text-4xl font-bold text-slate-900 dark:text-slate-100 count-animate" ref={platformRef} style={{ animationDelay: '300ms' }}>3</div>
              <div className="text-slate-600 dark:text-slate-400 mt-1">Major Platforms</div>
            </div>
            <div className="bg-gradient-to-br from-orange/5 to-red/5 p-8 rounded-3xl border border-orange/20 hover:border-orange/50 hover:shadow-xl transition-all duration-500 reveal-on-scroll scale">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-orange/10 rounded-xl flex items-center justify-center">
                  <Target className="text-orange text-2xl" />
                </div>
              </div>
              <div className="text-4xl font-bold text-slate-900 dark:text-slate-100 count-animate" ref={accuracyRef} style={{ animationDelay: '400ms' }}>94%</div>
              <div className="text-slate-600 dark:text-slate-400 mt-1">AI Accuracy</div>
            </div>
          </div>

          {/* Testimonials Carousel */}
          <div className="reveal-on-scroll left">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 text-center mb-12">What Restaurant Owners Say</h3>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  name: "Priya Sharma",
                  role: "Owner, Spice Route Kitchen",
                  location: "Bangalore",
                  rating: 5,
                  text: "SellSense transformed how we understand our customers. We discovered our biryani was loved but delivery temperature was a major issue. Fixed it and saw 23% more repeat orders!",
                  avatar: "PS"
                },
                {
                  name: "Rajesh Kumar",
                  role: "Manager, Mumbai Munchies",
                  location: "Mumbai",
                  rating: 5,
                  text: "The platform insights are incredible. We compared our Zomato vs Swiggy ratings and found we needed better packaging for Swiggy orders. Simple fix, huge impact.",
                  avatar: "RK"
                },
                {
                  name: "Anita Desai",
                  role: "Founder, Green Leaf Cafe",
                  location: "Pune",
                  rating: 5,
                  text: "I love the AI recommendations. It told us customers wanted more vegan options. We added 3 dishes and they became our top sellers within a month. Pure gold!",
                  avatar: "AD"
                }
              ].map((testimonial, i) => (
                <div key={i} className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-xl hover:border-lime-accent/50 transition-all duration-500 card-shine reveal-on-scroll scale" style={{ transitionDelay: `${i * 100}ms` }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-lime-accent to-cyan flex items-center justify-center text-white font-bold text-xl">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{testimonial.name}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">{testimonial.role} • {testimonial.location}</div>
                    </div>
                  </div>
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">"{testimonial.text}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Customer Success Stories */}
      <section ref={trustRef} id="success-stories" className="py-20 px-6 bg-white dark:bg-slate-900 relative">
        <div className="absolute inset-0 -z-10 pointer-events-none opacity-30 dark:opacity-10 grid-pattern" />
        <div className="absolute inset-0 -z-10 pointer-events-none opacity-20 dark:opacity-10 dots-pattern" />

        <div className="max-w-7xl mx-auto">
          <div className={`text-center mb-16 reveal-on-scroll ${trustVisible ? 'visible' : ''}`}>
            <span className="inline-block px-4 py-2 rounded-full bg-lime-accent/10 text-lime-accent text-sm font-medium mb-4 dark:bg-lime-accent/20">Success Stories</span>
            <h2 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">Real Results from Real Restaurants</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">See how food businesses across India transformed their operations with SellSense insights.</p>
          </div>

          {/* Interactive Case Studies Carousel */}
          <div className="reveal-on-scroll left">
            <div className="relative">
              {/* Tabs for filtering */}
              <div className="flex justify-center gap-3 mb-12 flex-wrap">
                {['All', 'Fine Dining', 'Quick Service', 'Cloud Kitchen', 'Cafe'].map((filter, i) => (
                  <button
                    key={i}
                    className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 tab-button ${
                      i === 0 ? 'bg-lime-400 text-slate-950 font-black shadow-lg' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    name: "Spice Route Kitchen",
                    type: "Fine Dining • Bangalore",
                    image: "🍛",
                    before: { rating: 3.6, reviews: 180 },
                    after: { rating: 4.4, reviews: 342 },
                    insight: "Fixed cold delivery issue with insulated bags",
                    result: "+23% repeat orders in 60 days",
                    color: "from-amber-500 to-orange-500",
                    metrics: ["+0.8★ rating", "+89% reviews", "-67% complaints"]
                  },
                  {
                    name: "Mumbai Munchies",
                    type: "Quick Service • Mumbai",
                    image: "🍔",
                    before: { rating: 3.8, reviews: 95 },
                    after: { rating: 4.5, reviews: 267 },
                    insight: "Improved Swiggy packaging per platform insights",
                    result: "Reduced negative reviews by 45%",
                    color: "from-rose-500 to-pink-500",
                    metrics: ["+0.7★ rating", "+181% reviews", "-45% negativity"]
                  },
                  {
                    name: "Green Leaf Cafe",
                    type: "Cafe • Pune",
                    image: "🥗",
                    before: { rating: 3.9, reviews: 156 },
                    after: { rating: 4.6, reviews: 298 },
                    insight: "Added 3 vegan dishes from AI recommendation",
                    result: "Vegan items became top 2 sellers",
                    color: "from-emerald-500 to-teal-500",
                    metrics: ["+0.7★ rating", "+91% reviews", "+156% vegan sales"]
                  },
                  {
                    name: "Tandoor Treats",
                    type: "Cloud Kitchen • Delhi",
                    image: "🍢",
                    before: { rating: 3.4, reviews: 203 },
                    after: { rating: 4.2, reviews: 412 },
                    insight: "Optimized menu - removed 5 low-rated items",
                    result: "Kitchen efficiency up 34%",
                    color: "from-purple-500 to-indigo-500",
                    metrics: ["+0.8★ rating", "+103% reviews", "+34% efficiency"]
                  },
                  {
                    name: "Biryani House",
                    type: "Quick Service • Hyderabad",
                    image: "🍚",
                    before: { rating: 3.7, reviews: 312 },
                    after: { rating: 4.5, reviews: 589 },
                    insight: "Fixed portion size complaints",
                    result: "Customer satisfaction score +28%",
                    color: "from-orange-500 to-red-500",
                    metrics: ["+0.8★ rating", "+89% reviews", "+28% satisfaction"]
                  },
                  {
                    name: "Coastal Flavors",
                    type: "Fine Dining • Chennai",
                    image: "🐟",
                    before: { rating: 4.0, reviews: 134 },
                    after: { rating: 4.7, reviews: 276 },
                    insight: "Staff training from service feedback themes",
                    result: "Service rating improved from 3.2 to 4.6",
                    color: "from-cyan-500 to-blue-500",
                    metrics: ["+0.7★ rating", "+106% reviews", "+44% service score"]
                  }
                ].map((story, i) => (
                  <div key={i} className="group relative bg-white rounded-3xl overflow-hidden border border-gray-100 hover:shadow-2xl hover:border-lime-accent/50 transition-all duration-500 card-shine reveal-on-scroll scale" style={{ transitionDelay: `${i * 50}ms` }}>
                    {/* Header with gradient */}
                    <div className={`p-6 relative ${story.color} text-white`}>
                      <div className="absolute inset-0 bg-gradient-to-br opacity-10" />
                      <div className="relative z-10 flex items-start justify-between">
                        <div>
                          <div className="text-5xl mb-2">{story.image}</div>
                          <h3 className="font-bold text-xl mb-1">{story.name}</h3>
                          <p className="text-white/80 text-sm">{story.type}</p>
                        </div>
                        <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                          <TrendingUp className="text-2xl" />
                        </div>
                      </div>
                    </div>

                    <div className="p-6 space-y-5">
                      {/* Before/After Rating */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-red-50 border border-red-100">
                          <p className="text-xs text-red-600 font-medium uppercase tracking-wide mb-1">Before SellSense</p>
                          <div className="flex items-center gap-2">
                            <span className="text-3xl font-bold text-red-600">{story.before.rating}★</span>
                            <span className="text-sm text-gray-500">({story.before.reviews} reviews)</span>
                          </div>
                        </div>
                        <div className="p-4 rounded-2xl bg-green-50 border border-green-100">
                          <p className="text-xs text-green-600 font-medium uppercase tracking-wide mb-1">After SellSense</p>
                          <div className="flex items-center gap-2">
                            <span className="text-3xl font-bold text-green-600">{story.after.rating}★</span>
                            <span className="text-sm text-gray-500">({story.after.reviews} reviews)</span>
                          </div>
                        </div>
                      </div>

                      {/* Key Insight */}
                      <div className="bg-lime-accent/5 border border-lime-accent/20 rounded-2xl p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-lime-accent/10 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Brain className="text-lime-accent text-lg" />
                          </div>
                          <div>
                            <p className="font-medium text-deep-slate-800">AI Insight: {story.insight}</p>
                            <p className="text-sm text-gray-600 mt-1">Result: {story.result}</p>
                          </div>
                        </div>
                      </div>

                      {/* Metrics */}
                      <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-100">
                        {story.metrics.map((metric, j) => (
                          <div key={j} className="text-center p-3 rounded-xl bg-gray-50">
                            <p className="text-xs font-bold text-lime-accent">{metric}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Floating badge */}
                    <div className="absolute -top-3 right-6 w-10 h-10 bg-lime-accent rounded-full flex items-center justify-center shadow-lg animate-bounce">
                      <CheckCircle className="text-white text-xl" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Aggregate Results */}
          <div className="mt-16 reveal-on-scroll right">
            <div className="bg-gradient-to-r from-lime-accent/5 via-white to-cyan/5 rounded-3xl p-8 md:p-12 text-center border border-gray-100">
              <h3 className="text-2xl font-bold text-deep-slate-800 mb-6">Aggregate Impact Across All Customers</h3>
              <div className="grid md:grid-cols-4 gap-8">
                {[
                  { value: "0.6★", label: "Avg Rating Increase", icon: Star, color: "text-yellow-500" },
                  { value: "89%", label: "Review Volume Growth", icon: MessageSquare, color: "text-lime-accent" },
                  { value: "42%", label: "Negative Feedback Reduction", icon: TrendingDown, color: "text-green-500" },
                  { value: "3.2x", label: "ROI in First Year", icon: Trophy, color: "text-purple-500" }
                ].map((stat, i) => (
                  <div key={i} className="group">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 ${stat.color}/10 group-hover:scale-110 transition-transform`}>
                      <stat.icon className={`${stat.color} text-2xl`} />
                    </div>
                    <div className="text-3xl font-bold text-deep-slate-800 counter-bounce">{stat.value}</div>
                    <div className="text-gray-600 mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive ROI & Revenue Recovery Calculator */}
      <section id="roi-calculator" className="py-20 px-6 bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-800/80 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14 reveal-on-scroll">
            <span className="inline-block px-4 py-2 rounded-full bg-lime-accent/10 text-lime-accent text-sm font-semibold mb-4 dark:bg-lime-accent/20">
              Venture ROI Estimator
            </span>
            <h2 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Calculate How Much Bad Reviews Cost Your Venture
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Food delivery algorithms heavily favor restaurants rated 4.3★ and above. Discover the real financial upside of fixing repeat customer complaints.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 md:p-12 border border-gray-200 dark:border-slate-700 shadow-xl reveal-on-scroll">
            <div className="grid lg:grid-cols-12 gap-10 items-center">
              {/* Left Controls */}
              <div className="lg:col-span-6 space-y-8">
                {/* Control 1: Monthly Orders */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <ShoppingBag size={18} className="text-lime-accent" />
                      Monthly Orders Across Platforms
                    </label>
                    <span className="text-lg font-black text-lime-accent font-mono bg-lime-accent/10 px-3 py-1 rounded-xl">
                      {roiOrders.toLocaleString()} orders/mo
                    </span>
                  </div>
                  <input
                    type="range"
                    min="300"
                    max="10000"
                    step="100"
                    value={roiOrders}
                    onChange={(e) => setRoiOrders(Number(e.target.value))}
                    className="w-full h-2.5 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-lime-500"
                  />
                  <div className="flex justify-between text-xs text-slate-400 mt-2 font-medium">
                    <span>300 (Single Stall / Cafe)</span>
                    <span>2,500 (Cloud Kitchen)</span>
                    <span>10,000+ (Multi-Branch)</span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    {[500, 1500, 3500, 7000].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => setRoiOrders(preset)}
                        className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                          roiOrders === preset
                            ? 'bg-lime-400 text-slate-950 font-black border-lime-400'
                            : 'bg-gray-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-gray-200 dark:border-slate-600 hover:border-lime-accent'
                        }`}
                      >
                        {preset.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Control 2: Average Order Value */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <Calculator size={18} className="text-cyan" />
                      Average Order Value (AOV)
                    </label>
                    <span className="text-lg font-black text-cyan font-mono bg-cyan/10 px-3 py-1 rounded-xl">
                      ₹{roiTicket}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="150"
                    max="1500"
                    step="50"
                    value={roiTicket}
                    onChange={(e) => setRoiTicket(Number(e.target.value))}
                    className="w-full h-2.5 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan"
                  />
                  <div className="flex justify-between text-xs text-slate-400 mt-2 font-medium">
                    <span>₹150 (Snacks/Street)</span>
                    <span>₹450 (Casual Dining)</span>
                    <span>₹1,500 (Premium/Family)</span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    {[200, 350, 600, 1000].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => setRoiTicket(preset)}
                        className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                          roiTicket === preset
                            ? 'bg-cyan text-white border-cyan'
                            : 'bg-gray-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-gray-200 dark:border-slate-600 hover:border-cyan'
                        }`}
                      >
                        ₹{preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/40 border border-gray-200 dark:border-slate-600/60 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  💡 <strong>Benchmark Source:</strong> Zomato and Swiggy industry reports indicate that a +0.3★ improvement in food and packaging rating yields an average <strong>14% to 22% increase</strong> in organic algorithmic placement and repeat customer retention.
                </div>
              </div>

              {/* Right Output Dashboard */}
              <div className="lg:col-span-6 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-lime-accent/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-white/10">
                    <div>
                      <span className="text-xs uppercase tracking-wider text-lime-400 font-bold">
                        Projected Venture Impact
                      </span>
                      <h4 className="text-xl font-bold text-white mt-0.5">
                        Your Annual Growth Potential
                      </h4>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-lime-accent/20 flex items-center justify-center text-lime-accent">
                      <TrendingUp size={20} />
                    </div>
                  </div>

                  {/* Primary Revenue Metric */}
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Estimated Monthly Revenue Recovered
                    </div>
                    <div className="text-4xl sm:text-5xl font-black text-lime-accent font-mono tracking-tight mt-2">
                      ₹{Math.round(roiOrders * roiTicket * 0.09).toLocaleString('en-IN')}
                      <span className="text-sm font-normal text-gray-400 font-sans ml-2">/ month</span>
                    </div>
                    <div className="text-xs text-green-400 font-medium mt-2 flex items-center gap-1.5">
                      <CheckCircle size={14} />
                      <span>₹{(Math.round(roiOrders * roiTicket * 0.09) * 12).toLocaleString('en-IN')} per year back into your venture</span>
                    </div>
                  </div>

                  {/* Secondary Impact Grid */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                      <div className="text-2xl font-bold text-yellow-400 font-mono">+0.5★</div>
                      <div className="text-[11px] text-gray-300 mt-1">Rating Jump (60d)</div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                      <div className="text-2xl font-bold text-cyan font-mono">{Math.max(6, Math.round((roiOrders / 120)))}h</div>
                      <div className="text-[11px] text-gray-300 mt-1">Saved / Week</div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                      <div className="text-2xl font-bold text-purple-400 font-mono">-42%</div>
                      <div className="text-[11px] text-gray-300 mt-1">Repeat Complaints</div>
                    </div>
                  </div>

                  <Button
                    size="large"
                    onClick={handleGetStarted}
                    className="w-full bg-lime-400 text-slate-950 hover:bg-lime-500 shadow-lg font-black text-base py-4"
                  >
                    Get Started Free
                    <ArrowRight className="inline ml-2" size={18} />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Integration Deep Dive */}
      <section ref={platformsRef} id="platforms" className="py-20 px-6 bg-gray-50 dark:bg-slate-800/50 relative">
        <div className="max-w-7xl mx-auto">
          <div className={`text-center mb-16 reveal-on-scroll ${platformsVisible ? 'visible' : ''}`}>
            <span className="inline-block px-4 py-2 rounded-full bg-lime-accent/10 text-lime-accent text-sm font-medium mb-4 dark:bg-lime-accent/20">Platform Integrations</span>
            <h2 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">Unified Analytics Across Every Platform</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">Connect all your review sources in one place. No more switching between dashboards.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 stagger-reveal">
            {[
              {
                name: "Zomato",
                icon: "🍽️",
                color: "#E23744",
                bg: "red",
                stats: ["50K+ reviews/month", "Real-time sync", "Menu-level insights"],
                features: ["Auto-import new reviews", "Rating trend analysis", "Competitor benchmarking", "Photo review analysis"]
              },
              {
                name: "Swiggy",
                icon: "🛵",
                color: "#FC8019",
                bg: "orange",
                stats: ["45K+ reviews/month", "Hourly updates", "Delivery insights"],
                features: ["Delivery time correlation", "Packaging feedback", "Order accuracy tracking", "Coupon impact analysis"]
              },
              {
                name: "Google Reviews",
                icon: "⭐",
                color: "#4285F4",
                bg: "blue",
                stats: ["Unlimited reviews", "Instant sync", "Local SEO boost"],
                features: ["Local search ranking", "Photo & video reviews", "Q&A monitoring", "Business profile insights"]
              }
            ].map((platform, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden border border-gray-100 dark:border-slate-700 hover:shadow-2xl hover:border-lime-accent/50 transition-all duration-500 reveal-on-scroll scale" style={{ transitionDelay: `${i * 100}ms` }}>
                <div className={`p-8 ${platform.bg}-50 dark:${platform.bg}-900/20`}>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl" style={{ background: platform.color + '15' }}>
                      {platform.icon}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{platform.name}</h3>
                      <span className="text-sm font-medium px-3 py-1 rounded-full" style={{ background: platform.color + '15', color: platform.color }}>
                        Official Integration
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center mb-6">
                    {platform.stats.map((stat, j) => (
                      <div key={j} className="p-3 rounded-xl bg-white/50 dark:bg-slate-700/50">
                        <div className="text-sm text-slate-600 dark:text-slate-400">{stat}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-6">
                  <h4 className="font-semibold text-deep-slate-800 mb-4 flex items-center gap-2">
                    <CheckCircle className="text-lime-accent" size={18} />
                    Key Features
                  </h4>
                  <ul className="space-y-3">
                    {platform.features.map((feature, j) => (
                      <li key={j} className="flex items-center gap-3 text-gray-600">
                        <div className="w-5 h-5 rounded-full bg-lime-accent/10 flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="text-lime-accent text-xs" />
                        </div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {/* Connection Flow */}
          <div className="mt-16 reveal-on-scroll">
            <div className="bg-gradient-to-r from-lime-accent/5 via-white to-cyan/5 rounded-3xl p-8 md:p-12 text-center border border-gray-100">
              <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-8">
                <div className="flex-1 text-center p-6">
                  <div className="w-16 h-16 rounded-2xl bg-lime-accent/10 flex items-center justify-center mx-auto mb-4">
                    <Upload className="text-lime-accent text-2xl" />
                  </div>
                  <h4 className="font-bold text-deep-slate-800 mb-2">One-Click Connect</h4>
                  <p className="text-gray-600">OAuth integration with Zomato, Swiggy & Google in seconds</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-lime-accent/10 flex items-center justify-center text-lime-accent text-2xl animate-pulse">
                  <ArrowRight className="size-6" />
                </div>
                <div className="flex-1 text-center p-6">
                  <div className="w-16 h-16 rounded-2xl bg-cyan/10 flex items-center justify-center mx-auto mb-4">
                    <Brain className="text-cyan text-2xl" />
                  </div>
                  <h4 className="font-bold text-deep-slate-800 mb-2">AI Unification</h4>
                  <p className="text-gray-600">Normalizes data across platforms for consistent analysis</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-cyan/10 flex items-center justify-center text-cyan text-2xl animate-pulse" style={{ animationDelay: '0.5s' }}>
                  <ArrowRight className="size-6" />
                </div>
                <div className="flex-1 text-center p-6">
                  <div className="w-16 h-16 rounded-2xl bg-purple/10 flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="text-purple text-2xl" />
                  </div>
                  <h4 className="font-bold text-deep-slate-800 mb-2">Unified Dashboard</h4>
                  <p className="text-gray-600">Single view with cross-platform insights & recommendations</p>
                </div>
              </div>
              <Button size="large" onClick={handleGetStarted} className="bg-lime-400 text-slate-950 font-black hover:bg-lime-500 shadow-lg">
                Get Started Free
                <ArrowRight className="inline ml-2" size={20} />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* AI Intelligence Deep Dive */}
      <section ref={aiRef} id="ai-intelligence" className="py-20 px-6 bg-white dark:bg-slate-900 relative">
        <div className="max-w-7xl mx-auto">
          <div className={`text-center mb-16 reveal-on-scroll ${aiVisible ? 'visible' : ''}`}>
            <span className="inline-block px-4 py-2 rounded-full bg-lime-accent/10 text-lime-accent text-sm font-medium mb-4 dark:bg-lime-accent/20">AI-Powered Intelligence</span>
            <h2 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">Meet Your AI Restaurant Analyst</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">Advanced NLP and ML models trained on millions of food reviews to give you actionable insights.</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            <div className="reveal-on-scroll left">
              <div className="relative">
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-lime-accent/10 via-transparent to-cyan/10" />
                  <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-lime-accent/20 rounded-xl flex items-center justify-center">
                        <Brain className="text-lime-accent text-xl" />
                      </div>
                      <div>
                        <div className="text-white font-semibold">SellSense AI Engine</div>
                        <div className="text-xs text-gray-400">v2.4 • Updated weekly</div>
                      </div>
                      <div className="ml-auto flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs text-green-400">Live</span>
                      </div>
                    </div>
                    <div className="border-t border-white/10 pt-6 space-y-4">
                      {[
                        { label: "Sentiment Accuracy", value: "94.2%", icon: Target },
                        { label: "Topic Detection", value: "247 topics", icon: Sparkles },
                        { label: "Languages Supported", value: "12+", icon: Globe },
                        { label: "Processing Speed", value: "< 2 sec/review", icon: ZapIcon },
                        { label: "False Positive Rate", value: "< 2.1%", icon: Shield },
                        { label: "Model Retraining", value: "Weekly", icon: RefreshCw },
                      ].map((metric, i) => (
                        <div key={i} className="flex items-center justify-between group">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center group-hover:bg-white/10 transition-colors">
                              <metric.icon className="text-lime-accent text-sm" size={16} />
                            </div>
                            <span className="text-gray-300">{metric.label}</span>
                          </div>
                          <span className="font-mono text-white font-semibold">{metric.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Floating AI sparkles */}
                <div className="absolute -top-4 -right-4 w-8 h-8">
                  <div className="ai-sparkle" style={{ top: '10%', left: '20%' }} />
                  <div className="ai-sparkle" style={{ top: '60%', left: '80%' }} />
                  <div className="ai-sparkle" style={{ top: '30%', left: '50%' }} />
                </div>
                <div className="absolute bottom-4 left-4 w-8 h-8">
                  <div className="ai-sparkle" style={{ top: '20%', left: '10%' }} />
                  <div className="ai-sparkle" style={{ top: '70%', left: '70%' }} />
                </div>
              </div>
            </div>
            <div className="reveal-on-scroll right">
              <h3 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-6">What Our AI Does For You</h3>
              <div className="space-y-6">
                {[
                  {
                    title: "Sentiment Classification",
                    desc: "Analyzes every review with context-aware NLP, understanding food-specific language like \"biryani was cold\" vs \"service was cold\".",
                    icon: Heart,
                    color: "text-red-500",
                    bg: "bg-red-500/10"
                  },
                  {
                    title: "Topic Clustering & Trends",
                    desc: "Automatically groups similar feedback into themes — taste, temperature, portion, delivery, service, ambiance — and tracks trends over time.",
                    icon: Sparkles,
                    color: "text-purple-500",
                    bg: "bg-purple-500/10"
                  },
                  {
                    title: "Actionable Recommendations",
                    desc: "Goes beyond \"what\" to tell you \"what to do\". E.g., \"Add vegan options\" or \"Fix delivery packaging\" with projected impact scores.",
                    icon: Target,
                    color: "text-orange-500",
                    bg: "bg-orange-500/10"
                  },
                  {
                    title: "Competitive Intelligence",
                    desc: "Benchmarks your ratings against local competitors on each platform, revealing where you win and where you're losing customers.",
                    icon: Award,
                    color: "text-yellow-500",
                    bg: "bg-yellow-500/10"
                  },
                  {
                    title: "Predictive Insights",
                    desc: "Forecasts rating trends based on current trajectory, seasonal patterns, and operational changes so you can act proactively.",
                    icon: TrendingUp,
                    color: "text-green-500",
                    bg: "bg-green-500/10"
                  },
                  {
                    title: "Multi-Language Support",
                    desc: "Processes reviews in Hindi, English, Tamil, Telugu, Bengali, Marathi and more — crucial for diverse Indian markets.",
                    icon: Globe,
                    color: "text-cyan-500",
                    bg: "bg-cyan-500/10"
                  }
                ].map((feature, i) => (
                  <div key={i} className="group relative p-6 rounded-2xl border border-gray-100 dark:border-slate-700 hover:border-lime-accent/50 hover:shadow-xl transition-all duration-500 card-shine">
                    <div className="flex gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${feature.bg} transition-colors group-hover:bg-opacity-20`}>
                        <feature.icon className={`text-xl ${feature.color}`} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-2 group-hover:text-lime-accent transition-colors">{feature.title}</h4>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{feature.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Demo Preview */}
          <div className="reveal-on-scroll scale">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 text-center mb-8">See AI Analysis in Action</h3>
            <div className="bg-slate-900 rounded-3xl p-8 overflow-hidden relative">
              <div className="absolute top-4 right-4 flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <pre className="text-green-400 text-sm font-mono leading-relaxed relative z-10 overflow-x-auto">
{`📥 Processing new review from Zomato...
🔍 Language detected: Hindi + English (Hinglish)
🎯 Sentiment: NEGATIVE (confidence: 92%)
📋 Topics: Temperature (0.89), Packaging (0.76), Delivery Time (0.65)
💡 Key phrases: "ठंडा खाना आया", "packaging फट गया", "45 min late"
⚡ AI Recommendation: "Urgent: Insulated bags for delivery.
  Priority: HIGH | Impact: +15% rating projected"
📊 Platform comparison: Zomato 3.2★ vs Swiggy 4.1★
   → Gap: -0.9★ (Packaging issue specific to Zomato orders)
✅ Analysis complete. Added to dashboard.`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* 1-Click Smart AI Review Reply Assistant Section */}
      <section id="ai-replies" className="py-20 px-6 bg-white dark:bg-slate-900 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14 reveal-on-scroll">
            <span className="inline-block px-4 py-2 rounded-full bg-lime-accent/10 text-lime-accent text-sm font-semibold mb-4 dark:bg-lime-accent/20">
              Venture Superpower
            </span>
            <h2 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Turn Angry Reviews into Lifelong Customers in 1 Click
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Replying to reviews protects your venture’s reputation and boosts conversion. Test how SellSense AI drafts authentic, brand-saving responses instantly.
            </p>
          </div>

          {/* Interactive Review Case Selector */}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            <button
              onClick={() => setReplyType('negative')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                replyType === 'negative'
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/20 scale-105'
                  : 'bg-gray-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-red-400 border border-transparent'
              }`}
            >
              <span>😡 1★ Critical Complaint (Zomato)</span>
            </button>
            <button
              onClick={() => setReplyType('mixed')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                replyType === 'mixed'
                  ? 'bg-orange text-white shadow-lg shadow-orange/20 scale-105'
                  : 'bg-gray-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-orange border border-transparent'
              }`}
            >
              <span>😐 3★ Mixed Feedback (Swiggy)</span>
            </button>
            <button
              onClick={() => setReplyType('positive')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                replyType === 'positive'
                  ? 'bg-green-600 text-white shadow-lg shadow-green-600/20 scale-105'
                  : 'bg-gray-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-green-500 border border-transparent'
              }`}
            >
              <span>⭐ 5★ Glowing Praise (Google)</span>
            </button>
          </div>

          {/* Interactive Comparison Split Card */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-3xl p-6 md:p-10 border border-gray-200 dark:border-slate-700 shadow-xl reveal-on-scroll">
            <div className="grid lg:grid-cols-2 gap-8 items-stretch">
              {/* Left Side: Incoming Review */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-slate-700 flex flex-col justify-between shadow-sm">
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-700 mb-4">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                        {replyTemplates[replyType].platform[0]}
                      </span>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                          {replyTemplates[replyType].reviewer}
                        </div>
                        <div className="text-xs text-slate-400">
                          via {replyTemplates[replyType].platform} • Verified Customer
                        </div>
                      </div>
                    </div>
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          className={i < replyTemplates[replyType].rating ? 'fill-current' : 'text-gray-200 dark:text-gray-700'}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      Ordered Dish:
                    </span>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                      {replyTemplates[replyType].dish}
                    </p>
                  </div>

                  <blockquote className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed italic bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-gray-100 dark:border-slate-800">
                    "{replyTemplates[replyType].review}"
                  </blockquote>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-700">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    AI Detected Sentiment & Themes:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {replyTemplates[replyType].tags.map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Side: SellSense AI Generated Reply */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white flex flex-col justify-between shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-lime-accent/10 rounded-full blur-2xl pointer-events-none" />

                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-lime-accent/20 flex items-center justify-center text-lime-accent">
                        <Brain size={18} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white flex items-center gap-2">
                          SellSense AI Smart Reply
                          <span className="text-[10px] bg-lime-accent/20 text-lime-400 px-2 py-0.5 rounded-full font-mono">
                            Auto-Drafted
                          </span>
                        </div>
                        <div className="text-xs text-gray-400">Tone: Empathetic, Brand-Safe, Action-Oriented</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-200 leading-relaxed font-sans">
                    {replyTemplates[replyType].suggestedReply}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
                  <div className="text-xs text-gray-400 flex items-center gap-1.5">
                    <CheckCircle size={14} className="text-lime-accent" />
                    <span>Includes retention voucher & kitchen fix guarantee</span>
                  </div>
                  <button
                    onClick={() => handleCopyReply(replyTemplates[replyType].suggestedReply)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-lime-accent text-slate-900 font-bold text-xs hover:bg-lime-hover shadow-sm transition-all cursor-pointer"
                  >
                    {copiedReply ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedReply ? 'Copied to Clipboard!' : 'Copy Reply'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section ref={benefitsRef} id="benefits" className="py-20 px-6 bg-gray-50 dark:bg-slate-800/50 relative">
        <div className="max-w-7xl mx-auto">
          <div className={`text-center mb-16 reveal-on-scroll ${benefitsVisible ? 'visible' : ''}`}>
            <span className="inline-block px-4 py-2 rounded-full bg-lime-accent/10 text-lime-accent text-sm font-medium mb-4 dark:bg-lime-accent/20">Why SellSense?</span>
            <h2 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">Built for Food Business Success</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">Every feature designed to solve real problems restaurant owners face daily.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 stagger-reveal">
            {[
              { icon: Clock, title: "Save 10+ Hours/Week", desc: "Automated review monitoring replaces manual checking across platforms", color: "lime" },
              { icon: TrendingUp, title: "Increase Ratings 0.5★+", desc: "Data-driven improvements typically boost average rating within 60 days", color: "green" },
              { icon: Shield, title: "Protect Revenue", desc: "Catch issues early — one fixed complaint can save dozens of lost customers", color: "blue" },
              { icon: Users, title: "Boost Repeat Orders", desc: "Understand what brings customers back and double down on it", color: "purple" },
              { icon: Smartphone, title: "Mobile-First Dashboard", desc: "Check insights on-the-go with our responsive web app", color: "cyan" },
              { icon: ChefHat, title: "Menu Optimization", desc: "Know which dishes to promote, improve, or remove based on real feedback", color: "orange" },
              { icon: Truck, title: "Delivery Intelligence", desc: "Track temperature, timing, packaging issues by delivery partner", color: "pink" },
              { icon: Settings, title: "Custom Alerts", desc: "Get notified instantly when ratings drop or specific issues spike", color: "red" },
            ].map((benefit, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 hover:shadow-xl hover:border-lime-accent/50 hover:-translate-y-1 transition-all duration-500 reveal-on-scroll scale card-shine" style={{ transitionDelay: `${i * 50}ms` }}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${benefit.color}-50 dark:${benefit.color}-900/20`}>
                  <benefit.icon className={`text-${benefit.color}-500 text-xl`} />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-2">{benefit.title}</h4>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{benefit.desc}</p>
              </div>
            ))}
          </div>

          {/* Comparison Table */}
          <div className="mt-16 reveal-on-scroll left">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 text-center mb-8">SellSense vs Manual Monitoring</h3>
            <div className="overflow-x-auto">
              <table className="w-full bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-slate-700">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="p-4 text-left font-medium">Capability</th>
                    <th className="p-4 text-center font-medium">Manual</th>
                    <th className="p-4 text-center font-medium">SellSense</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {[
                    { feature: "Multi-platform review aggregation", manual: "❌ Hours daily", sense: "✅ Automatic" },
                    { feature: "Sentiment analysis accuracy", manual: "~60% (human bias)", sense: "94%+ (AI)" },
                    { feature: "Trend detection speed", manual: "Weeks/months", sense: "Real-time" },
                    { feature: "Competitor benchmarking", manual: "Nearly impossible", sense: "One click" },
                    { feature: "Actionable recommendations", manual: "Guesswork", sense: "AI-powered" },
                    { feature: "Historical trend analysis", manual: "Spreadsheet hell", sense: "Visual dashboards" },
                    { feature: "Multi-language support", manual: "Requires translators", sense: "Built-in (12+)" },
                    { feature: "Alerting & notifications", manual: "Manual checking", sense: "Instant alerts" },
                    { feature: "Team collaboration", manual: "Email forwards", sense: "Shared workspace" },
                    { feature: "ROI tracking", manual: "Not measurable", sense: "Built-in metrics" },
                  ].map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-gray-50/50 dark:bg-slate-700/50' : ''}>
                      <td className="p-4 font-medium text-slate-900 dark:text-slate-100">{row.feature}</td>
                      <td className="p-4 text-center text-red-600 dark:text-red-400 font-medium">{row.manual}</td>
                      <td className="p-4 text-center text-green-600 dark:text-green-400 font-medium">{row.sense}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section ref={faqRef} id="faq" className="py-20 px-6 bg-white dark:bg-slate-900 relative">
        <div className="max-w-3xl mx-auto">
          <div className={`text-center mb-16 reveal-on-scroll ${faqVisible ? 'visible' : ''}`}>
            <span className="inline-block px-4 py-2 rounded-full bg-lime-accent/10 text-lime-accent text-sm font-medium mb-4 dark:bg-lime-accent/20">Frequently Asked</span>
            <h2 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">Questions? We've Got Answers</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">Everything you need to know before getting started.</p>
          </div>

          <div className="space-y-4 stagger-reveal">
            {[
              {
                q: "How does SellSense connect to Zomato, Swiggy, and Google?",
                a: "We use official OAuth integrations. You simply click 'Connect' for each platform, authorize access, and we securely import your reviews. No passwords shared, no manual exports needed. Sync happens automatically every hour."
              },
              {
                q: "What languages does the AI support?",
                a: "Our NLP models support 12+ languages including English, Hindi, Hinglish, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, Punjabi, and Urdu. The AI understands code-mixed reviews (like Hinglish) natively."
              },
              {
                q: "How accurate is the sentiment analysis?",
                a: "94.2% accuracy on food industry reviews, validated on 500K+ labeled samples. We continuously retrain models weekly with new data. For context-specific phrases (e.g., 'cold biryani' = negative, 'cold drink' = positive), accuracy is even higher."
              },
              {
                q: "Can I try it before committing?",
                a: "Absolutely! 14-day free trial with full access — no credit card required. Connect up to 3 platforms and analyze up to 1,000 reviews. Cancel anytime during the trial with one click."
              },
              {
                q: "Is my data secure and private?",
                a: "Yes. SOC 2 Type II certified, GDPR compliant, data encrypted at rest (AES-256) and in transit (TLS 1.3). Your reviews never leave our secure infrastructure. We don't sell data or use it for anything other than your analytics."
              },
              {
                q: "What if I have multiple restaurant locations?",
                a: "Perfect! SellSense supports multi-location accounts. Each location gets its own dashboard, plus a unified view for brand-level insights. Pricing scales with locations — contact us for enterprise plans."
              },
              {
                q: "How long until I see actionable insights?",
                a: "First insights appear within minutes of connecting. Meaningful trends typically emerge after 50+ reviews. Most restaurants see their first 'aha!' moment and make a change within the first week."
              },
              {
                q: "Can I export data for my own analysis?",
                a: "Yes! Export filtered reviews, sentiment reports, topic analysis, and trend data as CSV or PDF. API access available on Pro+ plans for custom integrations with your BI tools."
              }
            ].map((faq, i) => (
              <details key={i} className="group bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl overflow-hidden hover:border-lime-accent/50 hover:shadow-lg transition-all duration-300 reveal-on-scroll scale" style={{ transitionDelay: `${i * 50}ms` }}>
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100 pr-8">{faq.q}</h4>
                  <div className="w-6 h-6 bg-gray-100 dark:bg-slate-700 rounded-xl flex items-center justify-center group-open:rotate-180 transition-transform duration-300">
                    <ChevronDown className="text-slate-500 dark:text-slate-400 text-sm" />
                  </div>
                </summary>
                <div className="px-6 pb-6 text-slate-600 dark:text-slate-400 leading-relaxed animate-fade-in-up">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>

          <div className="mt-12 text-center reveal-on-scroll">
            <p className="text-slate-600 dark:text-slate-400 mb-4">Still have questions?</p>
            <Button variant="outline" size="large" onClick={() => scrollToSection('how-it-works')}>
              <Mail className="inline mr-2" size={18} />
              Contact Our Team
            </Button>
          </div>
        </div>
      </section>

      {/* Interactive Demo Preview */}
      <section ref={aiRef} id="interactive-demo" className="py-20 px-6 bg-white dark:bg-slate-900 relative">
        <div className="absolute inset-0 -z-10 pointer-events-none opacity-30 dark:opacity-10 grid-pattern" />
        <div className="absolute inset-0 -z-10 pointer-events-none opacity-20 dark:opacity-10 dots-pattern" />

        <div className="max-w-7xl mx-auto">
          <div className={`text-center mb-16 reveal-on-scroll ${aiVisible ? 'visible' : ''}`}>
            <span className="inline-block px-4 py-2 rounded-full bg-lime-accent/10 text-lime-accent text-sm font-medium mb-4 dark:bg-lime-accent/20">Interactive Preview</span>
            <h2 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">Try SellSense Live</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">Experience the dashboard with real sample data. No signup required.</p>
          </div>

          {/* Interactive Dashboard Demo */}
          <div className="reveal-on-scroll scale">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden">
              {/* Demo Header */}
              <div className="bg-slate-900 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <span className="text-sm text-gray-400 font-mono">dashboard.sellsense.ai</span>
                </div>
                <div className="flex items-center gap-4">
                  <select className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-lime-accent">
                    <option value="overview">Overview</option>
                    <option value="sentiment">Sentiment</option>
                    <option value="topics">Topics</option>
                    <option value="platforms">Platforms</option>
                    <option value="competitors">Competitors</option>
                  </select>
                  <Button size="small" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                    <Video className="inline mr-1" size={14} />
                    Watch Tour
                  </Button>
                </div>
              </div>

              {/* Dashboard Content */}
              <div className="p-6 md:p-8">
                {/* Top Metrics Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  {[
                    { label: "Total Reviews", value: "2,847", change: "+12%", trend: "up", icon: MessageSquare, color: "lime" },
                    { label: "Avg Rating", value: "4.3★", change: "+0.4★", trend: "up", icon: Star, color: "yellow" },
                    { label: "Positive %", value: "74%", change: "+8%", trend: "up", icon: TrendingUp, color: "green" },
                    { label: "Response Rate", value: "68%", change: "-3%", trend: "down", icon: Clock, color: "orange" }
                  ].map((metric, i) => (
                    <div key={i} className="bg-gray-50 dark:bg-slate-700/50 rounded-2xl p-5 border border-gray-100 dark:border-slate-700 hover:border-lime-accent/50 hover:shadow-lg transition-all duration-300 group card-shine">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm text-slate-500 dark:text-slate-400">{metric.label}</p>
                        <div className={`w-10 h-10 rounded-xl ${metric.color}-100 dark:${metric.color}-900/20 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                          <metric.icon className={`text-${metric.color}-500 text-lg`} />
                        </div>
                      </div>
                      <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-1">{metric.value}</div>
                      <div className="flex items-center gap-1 text-sm">
                        <span className={`font-medium ${metric.trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {metric.trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {metric.change}
                        </span>
                        <span className="text-slate-400 dark:text-slate-500">vs last month</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Charts Row */}
                <div className="grid lg:grid-cols-3 gap-6 mb-8">
                  {/* Sentiment Donut */}
                  <div className="lg:col-span-1 bg-gray-50 dark:bg-slate-700/50 rounded-2xl p-6 border border-gray-100 dark:border-slate-700">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-5 flex items-center gap-2">
                      <Sparkles className="text-lime-accent" size={18} />
                      Sentiment Breakdown
                    </h4>
                    <div className="flex items-center justify-center mb-6">
                      <div className="relative w-40 h-40">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="80" cy="80" r="60" fill="none" stroke="#E5E7EB" strokeWidth="12" />
                          <circle
                            cx="80"
                            cy="80"
                            r="60"
                            fill="none"
                            stroke="#84CC16"
                            strokeWidth="12"
                            strokeDasharray="377"
                            strokeDashoffset="98"
                            strokeLinecap="round"
                            className="progress-ring-animate"
                          />
                          <circle
                            cx="80"
                            cy="80"
                            r="60"
                            fill="none"
                            stroke="#EF4444"
                            strokeWidth="12"
                            strokeDasharray="377"
                            strokeDashoffset="316"
                            strokeLinecap="round"
                            className="progress-ring-animate"
                            style={{ animationDelay: '200ms' }}
                          />
                          <circle
                            cx="80"
                            cy="80"
                            r="60"
                            fill="none"
                            stroke="#9CA3AF"
                            strokeWidth="12"
                            strokeDasharray="377"
                            strokeDashoffset="342"
                            strokeLinecap="round"
                            className="progress-ring-animate"
                            style={{ animationDelay: '400ms' }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">74%</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">Positive</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span className="text-sm text-slate-600 dark:text-slate-400 flex-1">Positive</span>
                        <span className="font-bold text-green-600 dark:text-green-400">74%</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <span className="text-sm text-slate-600 dark:text-slate-400 flex-1">Negative</span>
                        <span className="font-bold text-red-600 dark:text-red-400">18%</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-gray-400" />
                        <span className="text-sm text-slate-600 dark:text-slate-400 flex-1">Neutral</span>
                        <span className="font-bold text-gray-600 dark:text-gray-400">8%</span>
                      </div>
                    </div>
                  </div>

                  {/* Rating Trend */}
                  <div className="lg:col-span-2 bg-gray-50 dark:bg-slate-700/50 rounded-2xl p-6 border border-gray-100 dark:border-slate-700">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-5 flex items-center gap-2">
                      <TrendingUp className="text-lime-accent" size={18} />
                      Rating Trend (90 Days)
                    </h4>
                    <div className="h-48 relative">
                      <svg className="w-full h-full" viewBox="0 0 500 180" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="trendFill" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#84CC16" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#84CC16" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        {/* Area */}
                        <path
                          d="M20,150 L50,135 L80,128 L110,115 L140,110 L170,105 L200,98 L230,92 L260,88 L290,85 L320,82 L350,78 L380,76 L410,74 L440,73 L470,72 L500,71"
                          fill="url(#trendFill)"
                          stroke="none"
                        />
                        {/* Line */}
                        <path
                          d="M20,150 L50,135 L80,128 L110,115 L140,110 L170,105 L200,98 L230,92 L260,88 L290,85 L320,82 L350,78 L380,76 L410,74 L440,73 L470,72 L500,71"
                          stroke="#84CC16"
                          strokeWidth="3"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="count-animate"
                          style={{
                            strokeDasharray: 550,
                            strokeDashoffset: 550,
                            transition: 'stroke-dashoffset 2s cubic-bezier(0.4, 0, 0.2, 1)'
                          }}
                        />
                        {/* Points */}
                        <g stroke="#84CC16" strokeWidth="2" fill="white">
                          <circle cx="20" cy="150" r="4" className="count-animate" style={{ animationDelay: '100ms' }} />
                          <circle cx="140" cy="110" r="4" className="count-animate" style={{ animationDelay: '300ms' }} />
                          <circle cx="260" cy="88" r="4" className="count-animate" style={{ animationDelay: '500ms' }} />
                          <circle cx="380" cy="76" r="4" className="count-animate" style={{ animationDelay: '700ms' }} />
                          <circle cx="500" cy="71" r="5" className="count-animate" style={{ animationDelay: '900ms' }} />
                        </g>
                      </svg>
                      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-slate-500 dark:text-slate-400 px-2">
                        <span>90d</span>
                        <span>60d</span>
                        <span>30d</span>
                        <span>Now</span>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Start: 3.7★</span>
                      <span className="text-green-600 dark:text-green-400 font-semibold">Now: 4.3★</span>
                      <span className="text-lime-accent font-bold">+0.6★</span>
                    </div>
                  </div>
                </div>

                {/* Platform Comparison & Top Topics */}
                <div className="grid lg:grid-cols-2 gap-6 mb-8">
                  <div className="bg-gray-50 dark:bg-slate-700/50 rounded-2xl p-6 border border-gray-100 dark:border-slate-700">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-5 flex items-center gap-2">
                      <Globe className="text-cyan-500" size={18} />
                      Platform Comparison
                    </h4>
                    <div className="space-y-4">
                      {[
                        { name: "Zomato", rating: 4.1, reviews: 1234, color: "#E23744", trend: "up" },
                        { name: "Swiggy", rating: 4.4, reviews: 987, color: "#FC8019", trend: "up" },
                        { name: "Google", rating: 4.5, reviews: 2156, color: "#4285F4", trend: "up" }
                      ].map((platform, i) => (
                        <div key={i} className="group flex items-center gap-4 p-3 rounded-xl hover:bg-white dark:hover:bg-slate-700/50 transition-colors">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold" style={{ background: platform.color }}>
                            {platform.name[0]}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-900 dark:text-slate-100">{platform.name}</span>
                              <span className="text-lg font-bold text-yellow-500">{platform.rating}★</span>
                            </div>
                            <div className="h-2 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-lime-accent to-cyan rounded-full" style={{ width: `${(platform.rating / 5) * 100}%` }} />
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{platform.reviews.toLocaleString()}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">reviews</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-slate-700/50 rounded-2xl p-6 border border-gray-100 dark:border-slate-700">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-5 flex items-center gap-2">
                      <Flag className="text-red-500" size={18} />
                      Top Topics This Week
                    </h4>
                    <div className="space-y-3">
                      {[
                        { topic: "Food Temperature", count: 89, sentiment: "negative", icon: AlertTriangle },
                        { topic: "Taste & Flavor", count: 156, sentiment: "positive", icon: Heart },
                        { topic: "Portion Size", count: 67, sentiment: "positive", icon: Utensils },
                        { topic: "Delivery Speed", count: 45, sentiment: "mixed", icon: Truck },
                        { topic: "Packaging Quality", count: 34, sentiment: "negative", icon: Shield },
                        { topic: "Staff Service", count: 78, sentiment: "positive", icon: Users }
                      ].map((item, i) => (
                        <div key={i} className="group flex items-center gap-3 p-3 rounded-xl hover:bg-white dark:hover:bg-slate-700/50 transition-colors">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: item.sentiment === 'positive' ? 'rgba(34,197,94,0.1)' : item.sentiment === 'negative' ? 'rgba(239,68,68,0.1)' : 'rgba(249,115,22,0.1)' }}>
                            <item.icon className={`text-lg ${item.sentiment === 'positive' ? 'text-green-500' : item.sentiment === 'negative' ? 'text-red-500' : 'text-orange-500'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{item.topic}</span>
                              <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">{item.count}</span>
                            </div>
                            <div className="h-1.5 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-500" style={{
                                width: `${(item.count / 156) * 100}%`,
                                background: item.sentiment === 'positive' ? '#22C55E' : item.sentiment === 'negative' ? '#EF4444' : '#F97316'
                              }} />
                            </div>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            item.sentiment === 'positive' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                            item.sentiment === 'negative' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                            'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                          }`}>
                            {item.sentiment}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* AI Insights Preview */}
                <div className="grid md:grid-cols-3 gap-4 mb-8">
                  {[
                    { type: "high", title: "HIGH PRIORITY", insight: "Insulated delivery bags needed", impact: "+15% rating projected", icon: AlertTriangle, bg: "bg-red-50 dark:bg-red-900/20", border: "border-red-200 dark:border-red-800", iconColor: "text-red-500" },
                    { type: "quick-win", title: "QUICK WIN", insight: "Promote Butter Naan (4.8★)", impact: "Top dish, low promotion", icon: Award, bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-200 dark:border-blue-800", iconColor: "text-blue-500" },
                    { type: "opportunity", title: "OPPORTUNITY", insight: "Add vegan menu section", impact: "23% demand increase", icon: Sparkles, bg: "bg-lime-50 dark:bg-lime-900/20", border: "border-lime-200 dark:border-lime-800", iconColor: "text-lime-500" }
                  ].map((insight, i) => (
                    <div key={i} className={`p-5 rounded-2xl border ${insight.bg} ${insight.border} hover:shadow-lg transition-all card-shine`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${insight.bg} ${insight.border.replace('border-', 'border-2 ')}`}>
                          <insight.icon className={`${insight.iconColor} text-lg`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: insight.bg, color: insight.iconColor.replace('text-', 'text-') }}>
                              {insight.type.toUpperCase()}
                            </span>
                          </div>
                          <p className="font-medium text-slate-900 dark:text-slate-100 mb-1">{insight.insight}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{insight.impact}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Sample Reviews */}
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-2xl p-6 border border-gray-100 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-5">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <MessageSquare className="text-lime-accent" size={18} />
                      Latest Reviews
                    </h4>
                    <Button variant="outline" size="small">View All</Button>
                  </div>
                  <div className="space-y-3">
                    {[
                      { platform: "Zomato", rating: 5, text: "Amazing biryani! Portion was generous and delivery was hot. Will definitely order again.", author: "Rahul K.", time: "2h ago", sentiment: "positive" },
                      { platform: "Swiggy", rating: 2, text: "Food arrived cold and packaging was torn. Butter naan was hard. Disappointed.", author: "Priya S.", time: "4h ago", sentiment: "negative" },
                      { platform: "Google", rating: 4, text: "Great taste but delivery took 50 mins. Paneer tikka was delicious though.", author: "Amit R.", time: "6h ago", sentiment: "mixed" },
                      { platform: "Zomato", rating: 5, text: "Best dal makhani in town! Creamy, flavorful, perfect with naan. Highly recommend.", author: "Neha P.", time: "8h ago", sentiment: "positive" }
                    ].map((review, i) => (
                      <div key={i} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-lime-accent/50 transition-all group">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 rounded-full text-xs font-medium" style={{
                              background: review.platform === 'Zomato' ? '#E2374415' : review.platform === 'Swiggy' ? '#FC801915' : '#4285F415',
                              color: review.platform === 'Zomato' ? '#E23744' : review.platform === 'Swiggy' ? '#FC8019' : '#4285F4'
                            }}>
                              {review.platform}
                            </span>
                            <div className="flex items-center gap-1 text-yellow-500">
                              {[...Array(review.rating)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                            </div>
                          </div>
                          <span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">{review.time}</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-2">"{review.text}"</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500 dark:text-slate-400">— {review.author}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            review.sentiment === 'positive' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                            review.sentiment === 'negative' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                            'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                          }`}>
                            {review.sentiment.charAt(0).toUpperCase() + review.sentiment.slice(1)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Demo Controls */}
          <div className="mt-8 text-center reveal-on-scroll">
            <p className="text-slate-600 dark:text-slate-400 mb-4">This is a live preview with sample data. Connect your accounts to see your real insights.</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="large" onClick={handleGetStarted} className="bg-lime-400 text-slate-950 font-black hover:bg-lime-500 shadow-lg hover:shadow-xl">
                Get Started Free
                <ArrowRight className="inline ml-2" size={20} />
              </Button>
              <Button variant="outline" size="large" onClick={() => scrollToSection('how-it-works')} className="border-gray-300 dark:border-slate-600 hover:border-lime-accent hover:text-lime-accent text-slate-700 dark:text-slate-300">
                <Video className="inline mr-2" size={18} />
                Watch Full Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Venture Mission & Founder Story Section */}
      <section id="venture-mission" className="py-20 px-6 bg-slate-50 dark:bg-slate-900/60 relative">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 rounded-3xl p-8 md:p-14 text-white relative overflow-hidden shadow-2xl reveal-on-scroll">
            <div className="absolute top-0 right-0 w-96 h-96 bg-lime-accent/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 grid lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-8 space-y-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-lime-accent/20 text-lime-400 text-xs font-bold uppercase tracking-wide">
                  <Heart size={14} className="fill-current text-lime-400" />
                  Our Venture Mission
                </div>
                <h3 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                  Born from Late Nights at Local Food Counters
                </h3>
                <p className="text-base text-gray-300 leading-relaxed">
                  Every food business starts with pure passion — a chef’s secret masala, early morning prep, and the joy of seeing happy customers. But today’s food entrepreneurs are forced to fight black-box algorithms on Swiggy and Zomato, unfair reviews, and scattered customer complaints across 3 different platforms.
                </p>
                <p className="text-base text-gray-300 leading-relaxed">
                  <strong>SellSense was founded on a conviction:</strong> A local restaurant shouldn't need a ₹20-lakh enterprise data analytics team to understand what their customers want. We democratize AI intelligence so small cafés, cloud kitchens, and beloved street food spots can compete, adapt, and build sustainable culinary empires.
                </p>

                <div className="grid sm:grid-cols-3 gap-4 pt-4 border-t border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-lime-accent/20 flex items-center justify-center text-lime-accent">
                      <Shield size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">100% Private</div>
                      <div className="text-[11px] text-gray-400">Your data stays yours</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan/20 flex items-center justify-center text-cyan">
                      <Zap size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Zero Tech Skill</div>
                      <div className="text-[11px] text-gray-400">Setup in under 2 mins</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple/20 flex items-center justify-center text-purple">
                      <Globe size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Desi-Trained NLP</div>
                      <div className="text-[11px] text-gray-400">Hinglish & Regional</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Founder Signature / Credibility Quote */}
              <div className="lg:col-span-4 bg-white/5 rounded-2xl p-6 border border-white/10 text-center space-y-4 backdrop-blur-sm">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-lime-accent to-cyan mx-auto flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  SS
                </div>
                <blockquote className="text-sm italic text-gray-300 leading-relaxed">
                  "Our goal is simple: ensure not a single great meal gets ruined by cold delivery, leaky packaging, or unheard customer feedback."
                </blockquote>
                <div className="pt-2 border-t border-white/10">
                  <div className="font-bold text-white text-sm">SellSense Venture Team</div>
                  <div className="text-xs text-lime-400">Building for India's 10M+ Food Creators</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section ref={ctaRef} className="py-20 px-6 bg-slate-900 text-white relative overflow-hidden reveal-on-scroll">
        <div className="absolute inset-0 bg-gradient-to-r from-lime-accent/5 via-transparent to-cyan/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-lime-accent/10 blur-3xl animate-float" />
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-cyan/10 blur-3xl animate-float" style={{ animationDelay: '-4s' }} />

        <div className="max-w-4xl mx-auto text-center relative z-10 stagger-reveal">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-reveal">
            <span style={{ transitionDelay: '0ms' }}>Your Customers Are</span>
            <br />
            <span style={{ transitionDelay: '100ms' }} className="gradient-text">Already Telling You</span>
            <br />
            <span style={{ transitionDelay: '200ms' }} className="gradient-text">What to Improve</span>
          </h2>
          <p className="text-xl mb-8 text-gray-300 max-w-2xl mx-auto reveal-on-scroll">
            Stop guessing. Start understanding. Join 500+ restaurants using SellSense.
          </p>
          <div className="flex flex-wrap gap-4 justify-center reveal-on-scroll">
            <Button
              size="large"
              onClick={handleGetStarted}
              className="bg-lime-400 text-slate-950 font-black hover:bg-lime-500 shadow-lg hover:shadow-xl"
            >
              Get Started Free
              <ArrowRight className="inline ml-2" size={20} />
            </Button>
            <Button
              variant="outline"
              size="large"
              onClick={() => scrollToSection('how-it-works')}
              className="border-white/30 text-white hover:bg-white/10"
            >
              Watch Demo
            </Button>
          </div>
          <div className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-400 reveal-on-scroll">
            <div className="flex items-center gap-2">
              <CheckCircle className="text-lime-accent" size={16} />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="text-lime-accent" size={16} />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="text-lime-accent" size={16} />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16 px-6 relative overflow-hidden reveal-on-scroll">
        {/* Background blobs */}
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="gradient-orb orb-1" style={{ width: '300px', height: '300px', top: '-50px', right: '-50px', opacity: 0.1 }} />
          <div className="gradient-orb orb-2" style={{ width: '200px', height: '200px', bottom: '-50px', left: '-50px', opacity: 0.1, background: 'var(--color-cyan)' }} />
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12 stagger-reveal">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-lime-accent to-cyan rounded-2xl flex items-center justify-center">
                  <Brain className="text-white text-xl" />
                </div>
                <span className="text-2xl font-bold">SellSense</span>
              </div>
              <p className="text-gray-400 text-base leading-relaxed mb-6 max-w-xs">
                AI-powered customer review intelligence for food businesses. Turn every review into actionable insights and grow your restaurant.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-gray-400 hover:bg-lime-accent hover:text-white transition-all duration-300 group">
                  <X className="size-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-gray-400 hover:bg-lime-accent hover:text-white transition-all duration-300 group">
                  <Globe className="size-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-gray-400 hover:bg-lime-accent hover:text-white transition-all duration-300 group">
                  <Send className="size-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-gray-400 hover:bg-lime-accent hover:text-white transition-all duration-300 group">
                  <Mail className="size-5" />
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-3 text-gray-400">
                <li><button onClick={() => scrollToSection('features')} className="hover:text-lime-accent transition-colors flex items-center gap-2 group"><ArrowRight className="size-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />Features</button></li>
                <li><button onClick={() => scrollToSection('how-it-works')} className="hover:text-lime-accent transition-colors flex items-center gap-2 group"><ArrowRight className="size-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />How It Works</button></li>
                <li><button onClick={() => scrollToSection('platforms')} className="hover:text-lime-accent transition-colors flex items-center gap-2 group"><ArrowRight className="size-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />Integrations</button></li>
                <li><button onClick={() => scrollToSection('ai-intelligence')} className="hover:text-lime-accent transition-colors flex items-center gap-2 group"><ArrowRight className="size-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />AI Intelligence</button></li>
                <li><button onClick={() => scrollToSection('dashboard-preview')} className="hover:text-lime-accent transition-colors flex items-center gap-2 group"><ArrowRight className="size-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />Dashboard</button></li>
                <li><button onClick={() => scrollToSection('faq')} className="hover:text-lime-accent transition-colors flex items-center gap-2 group"><ArrowRight className="size-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />FAQ</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-lime-accent transition-colors flex items-center gap-2 group"><ArrowRight className="size-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />About Us</a></li>
                <li><a href="#" className="hover:text-lime-accent transition-colors flex items-center gap-2 group"><ArrowRight className="size-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />Blog</a></li>
                <li><a href="#" className="hover:text-lime-accent transition-colors flex items-center gap-2 group"><ArrowRight className="size-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />Careers</a></li>
                <li><a href="#" className="hover:text-lime-accent transition-colors flex items-center gap-2 group"><ArrowRight className="size-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />Press</a></li>
                <li><a href="#" className="hover:text-lime-accent transition-colors flex items-center gap-2 group"><ArrowRight className="size-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-lime-accent transition-colors flex items-center gap-2 group"><ArrowRight className="size-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />Privacy Policy</a></li>
                <li><a href="#" className="hover:text-lime-accent transition-colors flex items-center gap-2 group"><ArrowRight className="size-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />Terms of Service</a></li>
                <li><a href="#" className="hover:text-lime-accent transition-colors flex items-center gap-2 group"><ArrowRight className="size-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />Cookie Policy</a></li>
                <li><a href="#" className="hover:text-lime-accent transition-colors flex items-center gap-2 group"><ArrowRight className="size-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />Data Processing</a></li>
                <li><a href="#" className="hover:text-lime-accent transition-colors flex items-center gap-2 group"><ArrowRight className="size-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Resources</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-lime-accent transition-colors flex items-center gap-2 group"><ArrowRight className="size-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />Help Center</a></li>
                <li><a href="#" className="hover:text-lime-accent transition-colors flex items-center gap-2 group"><ArrowRight className="size-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />API Docs</a></li>
                <li><a href="#" className="hover:text-lime-accent transition-colors flex items-center gap-2 group"><ArrowRight className="size-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />Case Studies</a></li>
                <li><a href="#" className="hover:text-lime-accent transition-colors flex items-center gap-2 group"><ArrowRight className="size-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />Webinars</a></li>
                <li><a href="#" className="hover:text-lime-accent transition-colors flex items-center gap-2 group"><ArrowRight className="size-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />Community</a></li>
              </ul>
            </div>
          </div>

          {/* Newsletter signup */}
          <div className="bg-white/5 rounded-3xl p-8 md:p-12 mb-10 border border-white/10 stagger-reveal">
            <div className="grid md:grid-cols-3 gap-8 items-center">
              <div className="text-center md:text-left">
                <h3 className="text-2xl font-bold text-white mb-2">Stay Updated</h3>
                <p className="text-gray-400">Get the latest insights, tips, and product updates delivered to your inbox.</p>
              </div>
              <div className="md:col-span-2">
                <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto md:mx-0">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 px-6 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-lime-accent focus:bg-white/20 transition-all"
                    required
                  />
                  <Button type="submit" size="large" className="bg-lime-400 text-slate-950 font-black hover:bg-lime-500 shadow-lg hover:shadow-xl flex items-center gap-2 whitespace-nowrap">
                    Subscribe
                    <ArrowRight className="size-4" />
                  </Button>
                </form>
                <p className="text-xs text-gray-500 mt-3 text-center">No spam. Unsubscribe anytime. <a href="#" className="text-lime-accent hover:underline">Privacy Policy</a></p>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-8 border-t border-white/10">
            <div className="text-center md:text-left">
              <p className="text-gray-500 text-sm">© 2026 SellSense. All rights reserved.</p>
              <p className="text-gray-600 text-xs mt-1">Made with ❤️ for food businesses everywhere</p>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Shield className="size-4 text-lime-accent" />
                SOC 2 Certified
              </span>
              <span className="flex items-center gap-1">
                <Globe className="size-4 text-lime-accent" />
                GDPR Compliant
              </span>
              <span className="flex items-center gap-1">
                <Lock className="size-4 text-lime-accent" />
                AES-256 Encrypted
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Scroll to Top Button */}
      <button
        ref={scrollTopRef}
        className={`fixed bottom-8 right-8 w-12 h-12 bg-lime-400 text-slate-950 rounded-xl shadow-lg hover:shadow-xl hover:bg-lime-500 transition-all duration-300 flex items-center justify-center z-50 ${
          scrollTopVisible ? 'opacity-100 pointer-auto translate-y-0' : 'opacity-0 pointer-events-none translate-y-4'
        }`}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Scroll to top"
      >
        <ArrowUpRight className="size-5" />
      </button>
    </div>
  );
};