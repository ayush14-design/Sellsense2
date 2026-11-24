import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from '../components/Navbar';
import {
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  UtensilsCrossed,
  Layers,
  Sparkles,
  ChevronDown,
  FileSpreadsheet,
  Store,
  ExternalLink,
  ChefHat,
  ThumbsUp,
  ThumbsDown,
  PackageCheck,
  Star,
  Eye,
  Check,
  BarChart2,
  Zap,
  Shield,
  Clock,
  Globe,
  MousePointer2,
  Cpu,
  Rocket,
  Target,
  Users,
  ArrowUpRight,
  Loader2,
  Upload,
} from 'lucide-react';
import { authStorage } from '../utils/auth';

interface DishData {
  id: string;
  name: string;
  category: string;
  rating: number;
  totalReviews: number;
  positivePct: number;
  negativePct: number;
  neutralPct: number;
  positiveThemes: string[];
  negativeThemes: string[];
  aiRecommendation: string;
  sampleQuote: string;
  sampleQuoteAuthor: string;
}

const DEMO_DISHES: Record<string, DishData> = {
  paneer_tikka: {
    id: 'paneer_tikka',
    name: 'Paneer Tikka',
    category: 'Starters',
    rating: 4.6,
    totalReviews: 45,
    positivePct: 71,
    negativePct: 18,
    neutralPct: 11,
    positiveThemes: ['Smoky tandoor aroma', 'Tender & fresh paneer', 'Zesty mint chutney'],
    negativeThemes: ['Container leaked in transit', 'Lukewarm when delivered'],
    aiRecommendation: 'Switch to tamper-evident sealed curry & starter containers to eliminate leakage complaints on delivery platforms.',
    sampleQuote: 'The paneer was exceptionally soft and flavorful, but the mint chutney lid had popped open during transit.',
    sampleQuoteAuthor: 'Zomato Review • 2 days ago',
  },
  veg_biryani: {
    id: 'veg_biryani',
    name: 'Dum Veg Biryani',
    category: 'Main Course',
    rating: 4.8,
    totalReviews: 62,
    positivePct: 82,
    negativePct: 10,
    neutralPct: 8,
    positiveThemes: ['Long-grain aged basmati', 'Authentic saffron fragrance', 'Generous portion size'],
    negativeThemes: ['Raita quantity felt low in combos'],
    aiRecommendation: 'Increase standard accompaniment raita from 50ml to 80ml to secure consistent 5-star ratings on meal combos.',
    sampleQuote: 'Aromatic and cooked to perfection! Could have included a bit more raita, but the biryani itself is top tier.',
    sampleQuoteAuthor: 'Google Review • Yesterday',
  },
  butter_chicken: {
    id: 'butter_chicken',
    name: 'Murgh Butter Masala',
    category: 'Curries',
    rating: 4.5,
    totalReviews: 54,
    positivePct: 76,
    negativePct: 16,
    neutralPct: 8,
    positiveThemes: ['Rich cashew cream gravy', 'Succulent chicken pieces', 'Perfect balance of butter'],
    negativeThemes: ['Slightly too sweet for spicy food lovers'],
    aiRecommendation: 'Add an explicit "Spice Level" modifier (Mild / Traditional Spicy) in online menus to align diner expectations.',
    sampleQuote: 'Super creamy gravy and tender chicken. A touch sweet for my palate, but my family loved it.',
    sampleQuoteAuthor: 'Swiggy Review • 3 days ago',
  },
};

// Custom hook for scroll-triggered animations
const useScrollAnimation = (threshold = 0.1) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold, rootMargin: '0px 0px -50px 0px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
};

// Animated Counter Component
const AnimatedCounter = ({ value, suffix = '', prefix = '', className = '', duration = 1.5 }: {
  value: number;
  suffix?: string;
  prefix?: string;
  className?: string;
  duration?: number;
}) => {
  const [count, setCount] = useState(0);
  const { ref, isVisible } = useScrollAnimation(0.5);

  useEffect(() => {
    if (isVisible) {
      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / (duration * 1000), 1);
        const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
        setCount(Math.floor(eased * value));
        if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }
  }, [isVisible, value, duration]);

  return (
    <div ref={ref} className={className}>
      {prefix}<span className="font-extrabold">{count.toLocaleString()}</span>{suffix}
    </div>
  );
};

// Magnetic Button Wrapper - simplified without mouse move for compatibility
const MagneticButton = ({
  children,
  className = '',
  onClick,
  disabled,
  type = 'button',
  whileHover = { scale: 1.02 },
  whileTap = { scale: 0.96 },
  transition = { type: 'spring', stiffness: 300, damping: 30 },
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  whileHover?: any;
  whileTap?: any;
  transition?: any;
}) => {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      type={type}
      className={className}
      whileHover={whileHover}
      whileTap={whileTap}
      transition={transition}
    >
      {children}
    </motion.button>
  );
};

// Type-safe wrapper for buttons with size prop
const SizedButton = ({ children, className = '', onClick, size = 'md', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode; size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };
  return (
    <MagneticButton
      onClick={onClick ? (e: React.MouseEvent<HTMLButtonElement>) => onClick(e) : undefined}
      className={`${className} ${sizeClasses[size]}`}
      {...props}
    >
      {children}
    </MagneticButton>
  );
};

// Scroll Progress Indicator
const ScrollProgress = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(scrollTop / docHeight);
    };

    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
    return () => window.removeEventListener('scroll', updateProgress);
  }, []);

  return (
    <motion.div
      className="fixed top-0 left-0 h-1 bg-gradient-to-r from-lime-500 via-emerald-500 to-cyan-500 z-50 origin-left"
      style={{ transform: `scaleX(${progress})` }}
      animate={{ scaleX: progress }}
      transition={{ duration: 0.1, ease: 'linear' }}
    />
  );
};

// Floating Particles Background
const FloatingParticles = () => {
  const particles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 2,
    delay: Math.random() * 5,
    duration: 10 + Math.random() * 20,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-lime-500/10 dark:bg-lime-500/15"
          style={{ width: p.size, height: p.size, left: `${p.x}%`, top: `${p.y}%` }}
          initial={{ opacity: 0 }}
          animate={{
            y: [-20, 20, -20],
            x: [-10, 10, -10],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};

// Animated Gradient Mesh Background
const GradientMesh = ({ className = '' }: { className?: string }) => {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none -z-20 ${className}`}>
      <motion.div
        className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-gradient-to-r from-lime-500/8 via-emerald-500/6 to-cyan-500/8 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.15, 1],
          borderRadius: ['60% 40% 30% 70%/60% 30% 70% 40%', '40% 60% 70% 30%/40% 70% 30% 60%', '60% 40% 30% 70%/60% 30% 70% 40%'],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-gradient-to-l from-cyan-500/6 via-emerald-500/4 to-lime-500/6 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.1, 1],
          borderRadius: ['30% 70% 70% 30%/30% 70% 70% 30%', '70% 30% 30% 70%/70% 30% 30% 70%', '30% 70% 70% 30%/30% 70% 70% 30%'],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-lime-500/3 via-transparent to-cyan-500/3 rounded-full blur-3xl"
        animate={{
          opacity: [0.15, 0.3, 0.15],
          rotate: [0, 180, 360],
        }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
};

// Shimmer Text Effect
const ShimmerText = ({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => {
  return (
    <motion.span
      className={`relative inline bg-clip-text text-transparent bg-gradient-to-r from-lime-500 via-emerald-400 to-cyan-400 ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay }}
    >
      {children}
    </motion.span>
  );
};

// Floating Badge Component
const FloatingBadge = ({ children, className = '', icon: Icon, iconColor = 'lime', delay = 0 }: {
  children: React.ReactNode;
  className?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconColor?: string;
  delay?: number;
}) => {
  return (
    <motion.div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 text-sm font-semibold text-slate-900 dark:text-white ${className}`}
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: [0, -3, 0],
      }}
      transition={{
        duration: 0.5,
        delay,
        y: { duration: 3, repeat: Infinity, ease: 'easeInOut' }
      }}
      whileHover={{ scale: 1.05, y: -5 }}
    >
      <Icon size={14} className={`text-${iconColor}-600 dark:text-${iconColor}-400`} />
      {children}
    </motion.div>
  );
};

// Scroll Reveal Stagger Container
const StaggerContainer = ({ children, className = '', stagger = 0.1, delay = 0 }: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  delay?: number;
}) => {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ staggerChildren: stagger, delayChildren: delay }}
    >
      {children}
    </motion.div>
  );
};

const StaggerItem = ({ children, className = '', y = 20 }: {
  children: React.ReactNode;
  className?: string;
  y?: number;
}) => {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  );
};

// Pulse Glow Effect for CTAs
const PulseGlow = ({ children, className = '', color = 'lime' }: {
  children: React.ReactNode;
  className?: string;
  color?: string;
}) => {
  return (
    <motion.div
      className={className}
      animate={{
        boxShadow: [
          `0 0 0 0 ${color}-500/40`,
          `0 0 30px 10px ${color}-500/20`,
          `0 0 0 0 ${color}-500/40`,
        ],
      }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  );
};

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedDishKey, setSelectedDishKey] = useState<string>('paneer_tikka');
  const [activePreviewTab, setActivePreviewTab] = useState<'dishes' | 'themes' | 'recommendations'>('dishes');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const selectedDish = DEMO_DISHES[selectedDishKey];

  const handleGetStarted = () => {
    if (authStorage.isAuthenticated()) {
      navigate('/products');
    } else {
      navigate('/login');
    }
  };

  const handleExploreDemo = () => {
    localStorage.setItem('auth_token', 'demo_token_' + Date.now());
    authStorage.setUser({
      id: 'user_demo_001',
      email: 'demo@nelamrestaurants.com',
      fullName: 'Nelam Owner (Demo)',
      role: 'restaurant_owner',
      createdAt: '2026-09-01T00:00:00Z',
      isActive: true,
    });
    authStorage.setRestaurant({
      id: 'restaurant_nelam_001',
      name: 'Nelam Restaurants',
      ownerName: 'Demo Owner',
      businessType: 'Restaurant',
      city: 'Pune',
      location: 'Koregaon Park, Pune',
      contactEmail: 'owner@nelamrestaurants.com',
      description: 'Fine dining with traditional Indian flavors',
      reviewSources: ['Zomato', 'Swiggy', 'Google'],
      dataMode: 'DEMO',
      createdAt: '2026-09-01T00:00:00Z',
      ownerId: 'user_demo_001',
      isActive: true,
    });
    navigate('/products');
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Mouse move for subtle parallax on hero
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 relative overflow-x-hidden">
      <ScrollProgress />
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 px-6 overflow-hidden">
        {/* Animated Gradient Mesh Background */}
        <GradientMesh />

        {/* Floating Particles */}
        <FloatingParticles />

        {/* Subtle Ambient Background Gradients with Parallax */}
        <motion.div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-lime-500/10 via-emerald-500/10 to-cyan-500/10 dark:from-lime-500/15 dark:via-emerald-500/10 dark:to-cyan-500/15 blur-3xl rounded-full pointer-events-none -z-10"
          style={{
            transform: `translate(-50%, -50%) translate(${mousePosition.x * 15}px, ${mousePosition.y * 15}px)`,
          }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />

        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Content */}
            <StaggerContainer className="lg:col-span-7 space-y-6 sm:space-y-8" stagger={0.1} delay={0.1}>
              <StaggerItem y={30}>
                <motion.div
                  className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-lime-500/10 dark:bg-lime-500/20 text-lime-700 dark:text-lime-300 border border-lime-500/20 text-xs font-semibold tracking-wide"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-lime-600 dark:bg-lime-400" />
                  </span>
                  Restaurant Review Intelligence Platform
                </motion.div>
              </StaggerItem>

              <StaggerItem>
                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.12]"
                >
                  Turn Customer Reviews Into{' '}
                  <ShimmerText className="bg-gradient-to-r from-lime-600 via-emerald-600 to-cyan-600 dark:from-lime-400 dark:via-emerald-400 dark:to-cyan-400 bg-clip-text text-transparent">
                    Smarter Food Decisions
                  </ShimmerText>
                </motion.h1>
              </StaggerItem>

              <StaggerItem>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl"
                >
                  Stop guessing why ratings fluctuate. SellSense consolidates reviews across Zomato, Google Maps, and Swiggy into clear, dish-level sentiment analytics so you know what customers love and what needs fixing.
                </motion.p>
              </StaggerItem>

              {/* Action Buttons */}
              <StaggerItem>
                <motion.div
                  className="flex flex-wrap items-center gap-4 pt-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <PulseGlow color="lime">
                    <motion.button
                      onClick={handleGetStarted}
                      className="px-8 py-4 text-lg rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer relative z-10"
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.96 }}
                    >
                      Get Started Free
                      <ArrowRight size={18} />
                    </motion.button>
                  </PulseGlow>
                  <motion.button
                    onClick={handleExploreDemo}
                    className="px-6 py-4 rounded-xl font-semibold text-base bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-sm transition-all flex items-center gap-2 cursor-pointer relative overflow-hidden"
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Eye size={18} className="text-lime-600 dark:text-lime-400" />
                    Explore Live Demo
                    <motion.span
                      className="absolute inset-0 bg-gradient-to-r from-lime-500/20 to-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </motion.button>
                </motion.div>
              </StaggerItem>

              {/* Key Metrics Strip */}
              <StaggerItem>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="flex flex-wrap gap-8 pt-6 border-t border-slate-200 dark:border-slate-800"
                >
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                      className="text-lime-600 dark:text-lime-400"
                    >
                      <Rocket size={20} />
                    </motion.div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">2 min</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Setup time</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                      className="text-emerald-600 dark:text-emerald-400"
                    >
                      <Users size={20} />
                    </motion.div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">3</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Platforms</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
                      className="text-cyan-600 dark:text-cyan-400"
                    >
                      <Target size={20} />
                    </motion.div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">92%+</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Accuracy</div>
                    </div>
                  </div>
                </motion.div>
              </StaggerItem>

              {/* Core Value Chips */}
              <StaggerItem>
                <div className="flex flex-wrap gap-2 pt-6 border-t border-slate-200 dark:border-slate-800">
                  <FloatingBadge icon={CheckCircle2} iconColor="emerald" delay={0.1}>
                    Dish-by-dish analysis
                  </FloatingBadge>
                  <FloatingBadge icon={AlertCircle} iconColor="rose" delay={0.2}>
                    Detect repeated complaints
                  </FloatingBadge>
                  <FloatingBadge icon={Sparkles} iconColor="purple" delay={0.3}>
                    Practical AI kitchen advice
                  </FloatingBadge>
                </div>
              </StaggerItem>
            </StaggerContainer>

            {/* Right Interactive Visual */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-lg lg:max-w-none">
                {/* Decorative glow */}
                <motion.div
                  className="absolute -inset-1 bg-gradient-to-r from-lime-500/20 via-emerald-500/20 to-cyan-500/20 rounded-3xl blur-xl opacity-70 dark:opacity-50"
                  animate={{ scale: [1, 1.02, 1], opacity: [0.5, 0.7, 0.5] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                />

                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  whileHover={{ y: -3, transition: { duration: 0.2 } }}
                  className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-sm w-full"
                >
                  {/* Card Header & Dish Selector */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <motion.div
                        whileHover={{ rotate: 180, scale: 1.1 }}
                        transition={{ duration: 0.3 }}
                        className="w-8 h-8 rounded-lg bg-lime-500/10 dark:bg-lime-500/20 flex items-center justify-center text-lime-600 dark:text-lime-400 cursor-pointer"
                      >
                        <UtensilsCrossed size={16} />
                      </motion.div>
                      <div>
                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Interactive Preview</div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">Dish Intelligence</div>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      Live Data
                    </span>
                  </div>

                  {/* Dish Selector Tabs */}
                  <div className="grid grid-cols-3 gap-1.5 p-1 my-4 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
                    {Object.keys(DEMO_DISHES).map((key) => {
                      const dish = DEMO_DISHES[key];
                      const isSelected = selectedDishKey === key;
                      return (
                        <motion.button
                          key={key}
                          onClick={() => setSelectedDishKey(key)}
                          className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center truncate cursor-pointer relative overflow-hidden ${
                            isSelected
                              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          layout
                        >
                          {dish.name}
                          {isSelected && (
                            <motion.div
                              layoutId="dishSelector"
                              className="absolute inset-0 bg-lime-500/10 rounded-lg"
                              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Active Dish Overview */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedDishKey}
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.98 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                            {selectedDish.name}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {selectedDish.category} • Based on {selectedDish.totalReviews} verified reviews
                          </p>
                        </div>
                        <motion.div
                          className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-2.5 py-1 rounded-lg text-amber-700 dark:text-amber-300 text-xs font-bold"
                          whileHover={{ scale: 1.05 }}
                        >
                          <Star size={13} className="fill-current text-amber-500" />
                          <span>{selectedDish.rating}</span>
                        </motion.div>
                      </div>

                      {/* Sentiment Bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                            <ThumbsUp size={12} /> {selectedDish.positivePct}% Positive
                          </span>
                          <span className="text-rose-700 dark:text-rose-400 flex items-center gap-1">
                            <ThumbsDown size={12} /> {selectedDish.negativePct}% Negative
                          </span>
                        </div>
                        <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${selectedDish.positivePct}%` }}
                            transition={{ duration: 1, delay: 0.2, type: 'spring', stiffness: 100 }}
                            className="bg-emerald-500"
                          />
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${selectedDish.neutralPct}%` }}
                            transition={{ duration: 1, delay: 0.3, type: 'spring', stiffness: 100 }}
                            className="bg-slate-300 dark:bg-slate-700"
                          />
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${selectedDish.negativePct}%` }}
                            transition={{ duration: 1, delay: 0.4, type: 'spring', stiffness: 100 }}
                            className="bg-rose-500"
                          />
                        </div>
                      </div>

                      {/* Detected Themes */}
                      <div className="space-y-2 pt-1">
                        <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Customer Praise & Pain Points
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedDish.positiveThemes.map((theme, i) => (
                            <motion.span
                              key={i}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.3, delay: 0.1 + i * 0.05 }}
                              whileHover={{ scale: 1.05 }}
                              className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 cursor-default"
                            >
                              <Check size={11} className="text-emerald-600 dark:text-emerald-400" />
                              {theme}
                            </motion.span>
                          ))}
                          {selectedDish.negativeThemes.map((theme, i) => (
                            <motion.span
                              key={i}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.3, delay: 0.1 + i * 0.05 }}
                              whileHover={{ scale: 1.05 }}
                              className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50 cursor-default"
                            >
                              <AlertCircle size={11} className="text-rose-600 dark:text-rose-400" />
                              {theme}
                            </motion.span>
                          ))}
                        </div>
                      </div>

                      {/* AI Recommendation Box */}
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ duration: 0.4, delay: 0.5 }}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1"
                      >
                        <div className="flex items-center gap-1.5 text-xs font-bold text-lime-700 dark:text-lime-400">
                          <Sparkles size={13} />
                          AI Action Plan
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                          {selectedDish.aiRecommendation}
                        </p>
                      </motion.div>

                      {/* Customer Quote */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.6 }}
                        className="text-[11px] text-slate-500 dark:text-slate-400 italic pt-1 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center"
                      >
                        <span className="truncate pr-2">"{selectedDish.sampleQuote}"</span>
                        <span className="shrink-0 font-medium">{selectedDish.sampleQuoteAuthor}</span>
                      </motion.div>
                    </motion.div>
                  </AnimatePresence>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Platforms Strip */}
      <section id="integrations" className="py-16 border-y border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="text-center mb-10"
          >
            <span className="inline-block px-3.5 py-1 rounded-full bg-lime-500/10 dark:bg-lime-500/20 text-lime-700 dark:text-lime-300 border border-lime-500/20 text-xs font-bold uppercase tracking-wider">
              Platform Integrations
            </span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-6 items-center justify-items-center"
          >
            {[
              { label: 'Zomato Reviews', color: 'red', icon: 'Z' },
              { label: 'Google Maps & Places', color: 'blue', icon: 'G' },
              { label: 'Swiggy Orders', color: 'orange', icon: 'S' },
              { label: 'CSV & Excel Uploads', color: 'emerald', icon: <FileSpreadsheet size={16} /> },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                whileHover={{ y: -4, scale: 1.02 }}
                className="flex items-center gap-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                <motion.div
                  whileHover={{ rotate: 12, scale: 1.1 }}
                  className={`w-8 h-8 rounded-lg bg-${item.color}-500/10 text-${item.color}-600 flex items-center justify-center font-black text-sm`}
                >
                  {item.icon}
                </motion.div>
                <span>{item.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Core Features Section */}
      <section id="features" className="py-24 px-6 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto mb-16 space-y-3"
          >
            <span className="inline-block px-3.5 py-1 rounded-full bg-lime-500/10 dark:bg-lime-500/20 text-lime-700 dark:text-lime-300 border border-lime-500/20 text-xs font-bold uppercase tracking-wider">
              Core Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Everything You Need to Understand Customer Sentiment
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400">
              No complex dashboards or confusing metrics. Just clear insights on which dishes are winning and what needs attention.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, staggerChildren: 0.1 }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {[
              {
                icon: UtensilsCrossed,
                iconColor: 'lime',
                title: 'Dish-Specific Sentiment',
                description: 'Look beyond generic 3-star ratings. Uncover exactly how customers evaluate specific menu items like your Biryani, Thali, or Paneer Tikka.',
                badge: 'Item-level granularity',
                badgeColor: 'lime',
                iconHover: 'rotate-12',
              },
              {
                icon: AlertCircle,
                iconColor: 'emerald',
                title: 'Recurring Pain Points',
                description: 'Automatically flags repeat operational issues such as cold food deliveries, leaking curry packaging, or portion inconsistencies.',
                badge: 'Root-cause detection',
                badgeColor: 'emerald',
                iconHover: 'scale-110',
              },
              {
                icon: Layers,
                iconColor: 'cyan',
                title: 'Multi-Source Hub',
                description: 'Combine feedback from Zomato, Google Maps, and Swiggy with manual review uploads into a single, clean workspace.',
                badge: 'Unified platform view',
                badgeColor: 'cyan',
                iconHover: 'rotate-360',
              },
              {
                icon: ChefHat,
                iconColor: 'purple',
                title: 'Actionable AI Advice',
                description: 'Receive straightforward, actionable recommendations your kitchen team, chef, and packaging staff can implement today.',
                badge: 'Practical kitchen advice',
                badgeColor: 'purple',
                iconHover: 'scale-115',
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-lime-500/40 transition-all duration-300 flex flex-col justify-between overflow-hidden group"
              >
                {/* Subtle gradient overlay on hover */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-lime-500/0 via-transparent to-emerald-500/0 group-hover:from-lime-500/5 group-hover:to-emerald-500/5 transition-opacity duration-300 pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                />
                <div className="relative z-10 space-y-4">
                  <motion.div
                    whileHover={{ rotate: feature.iconHover === 'rotate-12' ? 12 : feature.iconHover === 'rotate-360' ? 360 : 0, scale: feature.iconHover.includes('scale') ? 1.1 : 1 }}
                    transition={{ duration: 0.4 }}
                    className={`w-12 h-12 rounded-xl bg-${feature.iconColor}-500/10 dark:bg-${feature.iconColor}-500/20 flex items-center justify-center text-${feature.iconColor}-600 dark:text-${feature.iconColor}-400`}
                  >
                    <feature.icon size={22} />
                  </motion.div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  className="relative z-10 pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 text-xs font-semibold"
                  style={{ color: `var(--color-${feature.badgeColor}-700)` }}
                >
                  <motion.span
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                  >
                    <CheckCircle2 size={14} className="text-lime-600 dark:text-lime-400" />
                  </motion.span>
                  {feature.badge}
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Interactive ROI Calculator */}
      <section id="roi-calculator" className="py-24 px-6 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto mb-16 space-y-3"
          >
            <span className="inline-block px-3.5 py-1 rounded-full bg-lime-500/10 dark:bg-lime-500/20 text-lime-700 dark:text-lime-300 border border-lime-500/20 text-xs font-bold uppercase tracking-wider">
              ROI Calculator
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Estimate Your Revenue Impact
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400">
              See how improving ratings drives real revenue growth. Adjust the sliders below.
            </p>
          </motion.div>

          <ROICalculator />
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 px-6 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto mb-16 space-y-3"
          >
            <span className="inline-block px-3.5 py-1 rounded-full bg-lime-500/10 dark:bg-lime-500/20 text-lime-700 dark:text-lime-300 border border-lime-500/20 text-xs font-bold uppercase tracking-wider">
              Simple 3-Step Process
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              From Scattered Reviews to Clear Action
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400">
              Get up and running in under two minutes with no technical training required.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, staggerChildren: 0.15 }}
            className="grid md:grid-cols-3 gap-8 relative"
          >
            {/* Connecting lines between steps - decorative */}
            <motion.div
              className="hidden md:block absolute top-10 left-1/2 w-full h-0.5 bg-gradient-to-r from-lime-500/30 via-emerald-500/30 to-cyan-500/30 -z-10"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
              style={{ transformOrigin: 'center' }}
            />

            {[
              {
                number: 1,
                color: 'lime',
                icon: Store,
                title: 'Connect or Upload Reviews',
                description: 'Connect your Zomato or Google listings with our guided setup, or drag and drop customer feedback spreadsheets directly into SellSense.',
                badge: 'Supports Zomato, Google, Swiggy, & Excel',
                subIcon: Upload,
              },
              {
                number: 2,
                color: 'emerald',
                icon: Sparkles,
                title: 'AI Isolates Dishes & Themes',
                description: 'SellSense\'s NLP models scan review text, map feedback to specific menu items, and detect recurring patterns in taste, delivery, and service.',
                badge: 'Automatic sentiment classification',
                subIcon: Cpu,
              },
              {
                number: 3,
                color: 'cyan',
                icon: TrendingUp,
                title: 'Implement Fixes & Boost Ratings',
                description: 'Follow targeted recommendations to fix packaging leaks, adjust recipes, or recalibrate portion sizes before negative reviews stack up.',
                badge: 'Higher ratings & repeat orders',
                subIcon: Target,
              },
            ].map((step, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 space-y-4 group"
              >
                {/* Step number with animated ring */}
                <div className="relative">
                  <motion.div
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                    className={`w-10 h-10 rounded-xl bg-${step.color}-500 text-slate-950 font-black text-lg flex items-center justify-center shadow-sm relative z-10`}
                  >
                    {step.number}
                  </motion.div>
                  {/* Pulsing ring animation */}
                  <motion.div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-xl border-2"
                    style={{ borderColor: `var(--color-${step.color}-500)` }}
                    animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0.1, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                  />
                  <motion.div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-xl border-2"
                    style={{ borderColor: `var(--color-${step.color}-500)` }}
                    animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.05, 0.4] }}
                    transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.5 + 1 }}
                  />
                </div>

                <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">
                  {step.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {step.description}
                </p>

                {/* Interactive icon badge */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="pt-2 text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5"
                  style={{ color: `var(--color-${step.color}-600)` }}
                >
                  <motion.div
                    whileHover={{ scale: 1.15, rotate: 12 }}
                    className={`w-6 h-6 rounded-lg bg-${step.color}-500/10 dark:bg-${step.color}-500/20 flex items-center justify-center`}
                  >
                    <step.subIcon size={12} className={`text-${step.color}-600 dark:text-${step.color}-400`} />
                  </motion.div>
                  <step.icon size={14} className="text-lime-600 dark:text-lime-400" />
                  {step.badge}
                </motion.div>

                {/* Arrow indicator */}
                <motion.div
                  className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                  whileHover={{ x: [0, 4, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                >
                  <ArrowUpRight size={16} className={`text-${step.color}-500`} />
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Live Dashboard Preview */}
      <section id="preview" className="py-24 px-6 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto mb-16 space-y-3"
          >
            <span className="inline-block px-3.5 py-1 rounded-full bg-lime-500/10 dark:bg-lime-500/20 text-lime-700 dark:text-lime-300 border border-lime-500/20 text-xs font-bold uppercase tracking-wider">
              Live Prototype Preview
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              See the Actual SellSense Dashboard
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400">
              Sample data pre-loaded from our demo restaurant: Nelam Restaurants (Pune).
            </p>
          </motion.div>

          {/* Dashboard Preview Shell */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl max-w-5xl mx-auto"
          >
            {/* Top Stats Strip with Animated Counters */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, staggerChildren: 0.1 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-8 border-b border-slate-100 dark:border-slate-800"
            >
              <StatCard
                label="Total Analyzed Reviews"
                value={214}
                trend="+18% this month"
                trendColor="emerald"
                icon={BarChart2}
              />
              <StatCard
                label="Positive Sentiment"
                value={74}
                suffix="%"
                detail="158 happy customers"
                icon={ThumbsUp}
                iconColor="emerald"
              />
              <StatCard
                label="Needs Attention"
                value={18}
                suffix="%"
                detail="38 critical complaints"
                icon={AlertCircle}
                iconColor="rose"
              />
              <StatCard
                label="Neutral / Mixed"
                value={8}
                suffix="%"
                detail="18 mixed reviews"
                icon={ThumbsDown}
                iconColor="slate"
              />
            </motion.div>

            {/* Dashboard Sub-Tab Switcher */}
            <div className="flex flex-wrap items-center justify-between gap-4 py-6 border-b border-slate-100 dark:border-slate-800">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, staggerChildren: 0.05 }}
                className="flex gap-2"
              >
                {[
                  { id: 'dishes', label: 'Dish Sentiment Overview' },
                  { id: 'themes', label: 'Frequent Pain Points' },
                  { id: 'recommendations', label: 'AI Action Recommendations' },
                ].map((tab) => (
                  <motion.button
                    key={tab.id}
                    onClick={() => setActivePreviewTab(tab.id as any)}
                    layout
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activePreviewTab === tab.id
                        ? 'bg-lime-500 text-slate-950 shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {tab.label}
                  </motion.button>
                ))}
              </motion.div>

              <motion.button
                onClick={handleExploreDemo}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="text-xs font-bold text-lime-700 dark:text-lime-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                Launch Interactive Dashboard <ExternalLink size={13} />
              </motion.button>
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              {activePreviewTab === 'dishes' && (
                <motion.div
                  key="dishes"
                  initial={{ opacity: 0, y: 20, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                  className="pt-6 space-y-4"
                >
                  <DishSentimentTable onExplore={handleExploreDemo} />
                </motion.div>
              )}
              {activePreviewTab === 'themes' && (
                <motion.div
                  key="themes"
                  initial={{ opacity: 0, y: 20, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                  className="pt-6"
                >
                  <ThemesPreview />
                </motion.div>
              )}
              {activePreviewTab === 'recommendations' && (
                <motion.div
                  key="recommendations"
                  initial={{ opacity: 0, y: 20, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                  className="pt-6"
                >
                  <RecommendationsPreview />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Floating Action Button on Preview */}
            <motion.button
              onClick={handleExploreDemo}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.2 }}
              whileHover={{ scale: 1.08, boxShadow: '0 10px 40px -10px var(--color-lime-500)' }}
              whileTap={{ scale: 0.95 }}
              className="absolute bottom-6 right-6 sm:bottom-8 sm:right-8 z-20 p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-lime-500 to-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg flex items-center gap-2 cursor-pointer"
            >
              <Loader2 size={16} className="animate-spin" />
              <span className="hidden sm:inline">Enter Full Dashboard</span>
              <ArrowUpRight size={14} />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-16 px-6 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, staggerChildren: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center"
          >
            {[
              { icon: Shield, label: 'Enterprise Security', desc: 'SOC 2 compliant, data encrypted at rest & in transit', color: 'blue' },
              { icon: Zap, label: 'Real-time Analysis', desc: 'Reviews processed within minutes of posting', color: 'amber' },
              { icon: Globe, label: 'Multi-platform', desc: 'Zomato, Swiggy, Google Maps, CSV/Excel', color: 'cyan' },
              { icon: Clock, label: '2-min Setup', desc: 'No code, no training, instant insights', color: 'purple' },
            ].map((item, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="relative group p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 overflow-hidden"
              >
                {/* Animated background glow */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br"
                  style={{
                    opacity: 0,
                    background: `var(--color-${item.color}-500/10)`
                  }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
                <motion.div
                  whileHover={{ rotate: 12, scale: 1.1 }}
                  className={`w-12 h-12 rounded-xl bg-${item.color}-500/10 dark:bg-${item.color}-500/20 flex items-center justify-center mx-auto mb-4 relative z-10 transition-all duration-300 group-hover:bg-${item.color}-500/20 dark:group-hover:bg-${item.color}-500/30`}
                >
                  <item.icon size={22} className={`text-${item.color}-600 dark:text-${item.color}-400 group-hover:text-${item.color}-500 dark:group-hover:text-${item.color}-300 transition-colors`} />
                </motion.div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-1 relative z-10 group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">{item.label}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 relative z-10">{item.desc}</p>

                {/* Sparkle decoration on hover */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileHover={{ opacity: 1, scale: 1 }}
                  className="absolute top-3 right-3 w-4 h-4 text-lime-500"
                  animate={{ rotate: [0, 180, 360] }}
                  transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
                >
                  <Sparkles size={16} />
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section id="faq" className="py-24 px-6 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16 space-y-3"
          >
            <span className="inline-block px-3.5 py-1 rounded-full bg-lime-500/10 dark:bg-lime-500/20 text-lime-700 dark:text-lime-300 border border-lime-500/20 text-xs font-bold uppercase tracking-wider">
              Common Questions
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400">
              Everything you need to know about setting up and using SellSense.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, staggerChildren: 0.1 }}
            className="space-y-4"
          >
            {[
              {
                question: 'Which platforms does SellSense connect with?',
                answer: 'SellSense integrates directly with Zomato Partner API and Google Business Profile. It also supports Swiggy reviews and allows you to upload any CSV or Excel spreadsheet of customer reviews with a single click.',
              },
              {
                question: 'How does dish-level sentiment analysis work?',
                answer: 'Our NLP algorithms scan the text of every review to identify food mentions (e.g., Paneer Tikka, Veg Biryani). It isolates the exact adjectives and feedback tied to that dish, determining positive, negative, and neutral percentages per menu item.',
              },
              {
                question: 'Can I test SellSense without connecting my real restaurant accounts?',
                answer: 'Yes! Click "Explore Live Demo" anywhere on this page to jump directly into our pre-populated Nelam Restaurants workspace with real sample reviews, charts, and recommendations.',
              },
              {
                question: 'Do I need any technical or data skills to use SellSense?',
                answer: 'None at all. SellSense is designed for busy restaurant owners, managers, and cloud kitchen operators. Setup takes under 2 minutes, and all insights are presented in plain language with clear action steps.',
              },
              {
                question: 'How accurate is the sentiment analysis?',
                answer: 'Our models achieve 92%+ accuracy on food-specific sentiment classification, trained on millions of restaurant reviews. The system continuously improves as it processes more data from your restaurant.',
              },
              {
                question: 'What happens after the free trial?',
                answer: 'You can continue with our flexible plans starting at ₹999/month, or export all your data. No lock-in, no hidden fees, and you can cancel anytime.',
              },
            ].map((item, index) => (
              <FAQItem key={index} index={index} item={item} openFaqIndex={openFaqIndex} setOpenFaqIndex={setOpenFaqIndex} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section id="cta" className="py-24 px-6 bg-slate-900 text-white relative overflow-hidden">
        <FloatingParticles />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-lime-500/10 blur-3xl rounded-full pointer-events-none"
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, staggerChildren: 0.1 }}
          className="max-w-3xl mx-auto text-center relative z-10 space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime-500/20 text-lime-400 text-xs font-bold uppercase tracking-wider">
            Ready to upgrade your restaurant?
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
            Stop Guessing. Know Exactly What Your Diners Love.
          </h2>
          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Consolidate reviews from Zomato, Google, and Swiggy into clear kitchen action plans. Start free today with our demo or connect your real store.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <SizedButton
              size="lg"
              onClick={handleGetStarted}
              className="w-full sm:w-auto bg-lime-400 hover:bg-lime-300 text-slate-950 font-black shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              Start Free Now
              <ArrowRight size={18} />
            </SizedButton>
            <motion.button
              onClick={handleExploreDemo}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-base bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Eye size={18} className="text-lime-400" />
              Try Live Demo
            </motion.button>
          </div>

          <div className="pt-8 text-sm text-slate-400 flex flex-wrap items-center justify-center gap-4 sm:gap-8">
            <motion.span whileHover={{ scale: 1.1 }} className="cursor-default flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-lime-500" /> No credit card required
            </motion.span>
            <motion.span whileHover={{ scale: 1.1 }} className="cursor-default flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-lime-500" /> Instant demo access
            </motion.span>
            <motion.span whileHover={{ scale: 1.1 }} className="cursor-default flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-lime-500" /> Setup in 2 minutes
            </motion.span>
          </div>
        </motion.div>
      </section>

      {/* Minimal Clean Footer */}
      <footer className="py-16 px-6 bg-slate-950 text-slate-400 border-t border-slate-900 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-lime-500 to-cyan-500 flex items-center justify-center font-black text-white text-xs">
              SS
            </div>
            <div>
              <div className="font-bold text-sm text-white">SellSense</div>
              <div className="text-slate-500 text-xs">AI Restaurant Review Intelligence</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6">
            <motion.button onClick={() => scrollToSection('features')} whileHover={{ scale: 1.05 }} className="hover:text-white transition-colors cursor-pointer text-sm">
              Features
            </motion.button>
            <motion.button onClick={() => scrollToSection('how-it-works')} whileHover={{ scale: 1.05 }} className="hover:text-white transition-colors cursor-pointer text-sm">
              How It Works
            </motion.button>
            <motion.button onClick={() => scrollToSection('preview')} whileHover={{ scale: 1.05 }} className="hover:text-white transition-colors cursor-pointer text-sm">
              Live Preview
            </motion.button>
            <motion.button onClick={() => scrollToSection('faq')} whileHover={{ scale: 1.05 }} className="hover:text-white transition-colors cursor-pointer text-sm">
              FAQ
            </motion.button>
            <motion.button onClick={handleExploreDemo} whileHover={{ scale: 1.05 }} className="text-lime-400 font-bold hover:underline cursor-pointer text-sm">
              Demo Login
            </motion.button>
          </div>

          <div className="text-slate-500 text-sm">
            © 2026 SellSense. Built for food creators.
          </div>
        </div>
      </footer>
    </div>
  );
};

// ============ Supporting Components ============

const StatCard = ({ label, value, suffix = '', trend, trendColor, detail, icon: Icon, iconColor = 'lime' }: {
  label: string;
  value: number;
  suffix?: string;
  trend?: string;
  trendColor?: string;
  detail?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconColor?: string;
}) => {
  const { ref } = useScrollAnimation(0.3);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 relative overflow-hidden group"
    >
      {/* Subtle top border animation */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-lime-500 to-emerald-500"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        style={{ transformOrigin: 'left' }}
      />
      <div className="flex items-center justify-between relative z-10">
        <motion.div
          whileHover={{ scale: 1.1, rotate: 6 }}
          className={`w-8 h-8 rounded-lg bg-${iconColor}-500/10 text-${iconColor}-600 flex items-center justify-center`}
        >
          <Icon size={18} />
        </motion.div>
        {trend && (
          <motion.div
            className={`text-[11px] font-semibold ${trendColor === 'emerald' ? 'text-emerald-600' : 'text-rose-600'}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <TrendingUp size={10} className="inline" />
            {trend}
          </motion.div>
        )}
      </div>
      <AnimatedCounter
        value={value}
        suffix={suffix}
        className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2 relative z-10"
        duration={1.5}
      />
      {detail && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className={`text-[11px] font-medium mt-1 ${trendColor === 'emerald' ? 'text-emerald-600' : trendColor === 'rose' ? 'text-rose-600' : 'text-slate-500'} relative z-10`}
        >
          {detail}
        </motion.div>
      )}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 relative z-10"
      >
        {label}
      </motion.div>

      {/* Sparkle on hover */}
      <motion.div
        className="absolute top-3 right-3 w-5 h-5 text-lime-500/50 group-hover:text-lime-500/100 transition-opacity"
        initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
        whileHover={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Sparkles size={16} />
      </motion.div>
    </motion.div>
  );
};

const DishSentimentTable = ({ onExplore }: { onExplore: () => void }) => {
  const dishes = [
    { name: 'Dum Veg Biryani', category: 'Main Course', positive: 82, neutral: 8, negative: 10, rating: 4.8 },
    { name: 'Paneer Tikka', category: 'Starters', positive: 71, neutral: 11, negative: 18, rating: 4.6 },
    { name: 'Murgh Butter Masala', category: 'Curries', positive: 76, neutral: 8, negative: 16, rating: 4.5 },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-xs font-bold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
            <th className="pb-3">Menu Item</th>
            <th className="pb-3">Category</th>
            <th className="pb-3">Sentiment Breakdown</th>
            <th className="pb-3 text-right">Avg Rating</th>
            <th className="pb-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
          {dishes.map((dish, i) => (
            <motion.tr
              key={dish.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.1 }}
              whileHover={{ x: 4 }}
            >
              <td className="py-3.5 font-bold text-slate-900 dark:text-white">{dish.name}</td>
              <td className="py-3.5 text-xs text-slate-500 dark:text-slate-400">{dish.category}</td>
              <td className="py-3.5">
                <div className="flex items-center gap-2 max-w-[200px]">
                  <span className="text-xs font-bold text-emerald-600">{dish.positive}%</span>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${dish.positive}%` }}
                      transition={{ duration: 0.8, delay: 0.1, type: 'spring', stiffness: 100 }}
                      className="bg-emerald-500"
                    />
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${dish.neutral}%` }}
                      transition={{ duration: 0.8, delay: 0.2, type: 'spring', stiffness: 100 }}
                      className="bg-slate-300 dark:bg-slate-700"
                    />
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${dish.negative}%` }}
                      transition={{ duration: 0.8, delay: 0.3, type: 'spring', stiffness: 100 }}
                      className="bg-rose-500"
                    />
                  </div>
                </div>
              </td>
              <td className="py-3.5 text-right font-bold text-slate-900 dark:text-white">{dish.rating} ★</td>
              <td className="py-3.5 text-right">
                <motion.button
                  onClick={onExplore}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-xs text-lime-700 dark:text-lime-400 font-bold hover:underline cursor-pointer"
                >
                  Analyze →
                </motion.button>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const ThemesPreview = () => {
  const positiveThemes = [
    { text: 'Authentic aroma & spice balance', count: 42 },
    { text: 'Generous portion size', count: 28 },
    { text: 'Fresh paneer texture & tenderness', count: 19 },
  ];
  const negativeThemes = [
    { text: 'Curry leaked through delivery box', count: 11 },
    { text: 'Lukewarm food on arrival', count: 8 },
    { text: 'Raita portion insufficient for combos', count: 5 },
  ];

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 space-y-3"
      >
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
          <ThumbsUp size={15} /> Top Praised Attributes (89 mentions)
        </div>
        <ul className="text-xs space-y-2 text-slate-700 dark:text-slate-300">
          {positiveThemes.map((theme, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.1 }}
              className="flex items-center justify-between"
            >
              <span>• {theme.text}</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400">{theme.count} reviews</span>
            </motion.li>
          ))}
        </ul>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-800/40 space-y-3"
      >
        <div className="flex items-center gap-2 text-xs font-bold text-rose-800 dark:text-rose-300">
          <AlertCircle size={15} /> Critical Complaints (24 mentions)
        </div>
        <ul className="text-xs space-y-2 text-slate-700 dark:text-slate-300">
          {negativeThemes.map((theme, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.1 }}
              className="flex items-center justify-between"
            >
              <span>• {theme.text}</span>
              <span className="font-bold text-rose-700 dark:text-rose-400">{theme.count} reviews</span>
            </motion.li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
};

const RecommendationsPreview = () => {
  const recommendations = [
    {
      title: 'Upgrade Curry Container Lids',
      impact: 'High Impact',
      impactColor: 'rose',
      icon: PackageCheck,
      iconColor: 'rose',
      description: '11 reviews cited gravy leakage on delivery orders. Switching to screw-lock polypropylene containers will directly safeguard your 4.6★ rating on Zomato.',
    },
    {
      title: 'Adjust Biryani Combo Raita Size',
      impact: 'Quick Fix',
      impactColor: 'amber',
      icon: UtensilsCrossed,
      iconColor: 'amber',
      description: 'A simple increase of raita tub volume from 50ml to 80ml resolves 80% of negative feedback on Veg Biryani combo meals with minimal food cost impact.',
    },
    {
      title: 'Add Spice Level Modifiers',
      impact: 'Expectation Alignment',
      impactColor: 'cyan',
      icon: Sparkles,
      iconColor: 'cyan',
      description: 'Butter Chicken reviews show 16% negative sentiment from spice mismatch. Adding Mild/Spicy tags on menus sets correct expectations.',
    },
  ];

  return (
    <div className="space-y-3">
      {recommendations.map((rec, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20, x: -20 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          transition={{ duration: 0.4, delay: i * 0.1 }}
          whileHover={{ x: 6, transition: { duration: 0.2 } }}
          className="relative p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start gap-3 group overflow-hidden"
        >
          {/* Left accent bar */}
          <motion.div
            className="absolute left-0 top-0 bottom-0 w-1"
            style={{ background: `var(--color-${rec.impactColor}-500)`, transformOrigin: 'bottom' }}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.3, delay: i * 0.1 + 0.2 }}
          />
          <motion.div
            whileHover={{ rotate: 12, scale: 1.15 }}
            className={`w-8 h-8 rounded-lg bg-${rec.iconColor}-500/10 text-${rec.iconColor}-600 flex items-center justify-center shrink-0 mt-0.5 relative z-10`}
          >
            <rec.icon size={16} />
          </motion.div>
          <div className="relative z-10">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">{rec.title}</span>
              <motion.span
                whileHover={{ scale: 1.05 }}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${rec.impactColor === 'rose' ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300' : rec.impactColor === 'amber' ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300' : 'bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300'}`}
              >
                {rec.impact}
              </motion.span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{rec.description}</p>
          </div>

          {/* Arrow indicator on hover */}
          <motion.div
            className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
            whileHover={{ x: [0, 4, 0] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          >
            <ArrowUpRight size={14} className={`text-${rec.impactColor}-500`} />
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
};

const FAQItem = ({ index, item, openFaqIndex, setOpenFaqIndex }: {
  index: number;
  item: { question: string; answer: string };
  openFaqIndex: number | null;
  setOpenFaqIndex: (index: number | null) => void;
}) => {
  const isOpen = openFaqIndex === index;

  return (
    <motion.div
      key={index}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden"
    >
      <motion.button
        onClick={() => setOpenFaqIndex(isOpen ? null : index)}
        className="w-full text-left p-6 flex items-center justify-between gap-4 font-bold text-base text-slate-900 dark:text-white hover:text-lime-600 dark:hover:text-lime-400 transition-colors cursor-pointer"
        whileHover={{ x: 4 }}
      >
        <span>{item.question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 text-slate-500"
        >
          <ChevronDown size={20} />
        </motion.div>
      </motion.button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="px-6 pb-6 text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-200/60 dark:border-slate-700/60 pt-4"
          >
            {item.answer}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ROI Calculator Component
const ROICalculator = () => {
  const navigate = useNavigate();
  const [monthlyOrders, setMonthlyOrders] = useState(500);
  const [avgOrderValue, setAvgOrderValue] = useState(350);
  const [currentRating, setCurrentRating] = useState(3.8);
  const [targetRating, setTargetRating] = useState(4.5);

  const handleExploreDemo = () => {
    localStorage.setItem('auth_token', 'demo_token_' + Date.now());
    authStorage.setUser({
      id: 'user_demo_001',
      email: 'demo@nelamrestaurants.com',
      fullName: 'Nelam Owner (Demo)',
      role: 'restaurant_owner',
      createdAt: '2026-09-01T00:00:00Z',
      isActive: true,
    });
    authStorage.setRestaurant({
      id: 'restaurant_nelam_001',
      name: 'Nelam Restaurants',
      ownerName: 'Demo Owner',
      businessType: 'Restaurant',
      city: 'Pune',
      location: 'Koregaon Park, Pune',
      contactEmail: 'owner@nelamrestaurants.com',
      description: 'Fine dining with traditional Indian flavors',
      reviewSources: ['Zomato', 'Swiggy', 'Google'],
      dataMode: 'DEMO',
      createdAt: '2026-09-01T00:00:00Z',
      ownerId: 'user_demo_001',
      isActive: true,
    });
    navigate('/products');
  };

  // Calculation based on industry research: ~5-9% revenue increase per 0.5 star improvement
  const ratingImprovement = targetRating - currentRating;
  const revenueIncreasePct = Math.min(ratingImprovement * 10, 50); // ~10% per 0.5 star, capped at 50%
  const currentMonthlyRevenue = monthlyOrders * avgOrderValue;
  const projectedMonthlyRevenue = currentMonthlyRevenue * (1 + revenueIncreasePct / 100);
  const monthlyGain = projectedMonthlyRevenue - currentMonthlyRevenue;
  const annualGain = monthlyGain * 12;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="max-w-3xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-lg"
    >
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Inputs */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MousePointer2 size={20} className="text-lime-600" />
            Adjust Your Numbers
          </h3>

          <SliderInput
            label="Monthly Orders"
            value={monthlyOrders}
            min={100}
            max={5000}
            step={50}
            onChange={setMonthlyOrders}
            format={(v) => v.toLocaleString()}
            icon="📦"
          />
          <SliderInput
            label="Average Order Value (₹)"
            value={avgOrderValue}
            min={100}
            max={1000}
            step={25}
            onChange={setAvgOrderValue}
            format={(v) => `₹${v.toLocaleString()}`}
            icon="💰"
          />
          <SliderInput
            label="Current Rating"
            value={currentRating}
            min={2.0}
            max={4.5}
            step={0.1}
            onChange={setCurrentRating}
            format={(v) => `${v.toFixed(1)} ⭐`}
            icon="⭐"
            disableAbove={targetRating}
          />
          <SliderInput
            label="Target Rating (with SellSense)"
            value={targetRating}
            min={3.5}
            max={5.0}
            step={0.1}
            onChange={setTargetRating}
            format={(v) => `${v.toFixed(1)} ⭐`}
            icon="🎯"
            disableBelow={currentRating}
          />
        </div>

        {/* Results */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp size={20} className="text-emerald-600" />
            Projected Impact
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <ResultCard
              label="Current Monthly Revenue"
              value={currentMonthlyRevenue}
              prefix="₹"
              icon="📊"
            />
            <ResultCard
              label="Projected Monthly Revenue"
              value={projectedMonthlyRevenue}
              prefix="₹"
              icon="🚀"
              highlight
            />
            <ResultCard
              label="Monthly Gain"
              value={monthlyGain}
              prefix="₹"
              icon="💵"
              positive
            />
            <ResultCard
              label="Annual Gain"
              value={annualGain}
              prefix="₹"
              icon="📈"
              positive
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40"
          >
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-800 dark:text-emerald-300 mb-2">
              <Sparkles size={16} />
              Key Insight
            </div>
            <p className="text-sm text-emerald-700 dark:text-emerald-400">
              Improving your rating from <strong>{currentRating.toFixed(1)}</strong> to <strong>{targetRating.toFixed(1)}</strong> could drive <strong>+{revenueIncreasePct}% revenue growth</strong> — that's <strong>₹{monthlyGain.toLocaleString()}/month</strong> extra from better reviews alone.
            </p>
          </motion.div>

          <motion.button
            onClick={handleExploreDemo}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-bold transition-colors flex items-center justify-center gap-2"
          >
            See This In Action →
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

const SliderInput = ({ label, value, min, max, step, onChange, format, icon, disableAbove, disableBelow }: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
  icon: string;
  disableAbove?: number;
  disableBelow?: number;
}) => {
  const clampedValue = Math.max(min, Math.min(max, value));
  const progress = ((clampedValue - min) / (max - min)) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
          <span className="text-lg">{icon}</span>
          {label}
        </span>
        <motion.span
          key={value}
          className="font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg"
        >
          {format(clampedValue)}
        </motion.span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={clampedValue}
          onChange={(e) => {
            const newVal = parseFloat(e.target.value);
            if (disableAbove && newVal > disableAbove) return;
            if (disableBelow && newVal < disableBelow) return;
            onChange(newVal);
          }}
          className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-lime-500"
        />
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 h-2 rounded-lg bg-lime-500"
          style={{ width: `${progress}%` }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.2 }}
        />
      </div>
    </div>
  );
};

const ResultCard = ({ label, value, prefix = '', icon, highlight, positive }: {
  label: string;
  value: number;
  prefix?: string;
  icon: string;
  highlight?: boolean;
  positive?: boolean;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className={`p-4 rounded-xl text-center ${highlight ? 'bg-lime-500/10 dark:bg-lime-500/20 border-2 border-lime-500' : 'bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80'}`}
    whileHover={{ scale: highlight ? 1 : 1.02 }}
  >
    <span className="text-2xl block mb-1">{icon}</span>
    <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">{label}</div>
    <AnimatedCounter
      value={Math.round(value)}
      prefix={prefix}
      className={`text-2xl sm:text-3xl font-extrabold ${positive ? 'text-emerald-600 dark:text-emerald-400' : highlight ? 'text-lime-700 dark:text-lime-300' : 'text-slate-900 dark:text-white'}`}
      duration={1.2}
    />
  </motion.div>
);

export default LandingPage;