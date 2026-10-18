import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authStorage } from '../utils/auth';
import { Menu, X, Brain, ArrowRight, Sun, Moon, Utensils } from 'lucide-react';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const isAuthenticated = authStorage.isAuthenticated();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const handleGetStarted = () => {
    if (isAuthenticated) {
      const restaurant = authStorage.getRestaurant();
      if (restaurant) {
        navigate('/products');
      } else {
        navigate('/setup');
      }
    } else {
      navigate('/signup');
    }
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled
        ? 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-slate-700 shadow-sm'
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-slate-100 hover:opacity-80 transition-opacity group">
            <div className="w-8 h-8 bg-gradient-to-br from-lime-500 to-cyan-500 rounded-xl flex items-center justify-center group-hover:rotate-3 transition-transform duration-300">
              <Brain className="text-white text-lg" />
            </div>
            SellSense
          </Link>

          <div className="hidden md:flex items-center gap-10">
            <div className="flex items-center gap-8">
              <button
                onClick={() => scrollToSection('features')}
                className="text-slate-700 dark:text-slate-300 hover:text-lime-600 dark:hover:text-lime-400 transition-colors font-medium text-sm relative group"
              >
                Features
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-lime-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              </button>
              <button
                onClick={() => scrollToSection('ventures')}
                className="text-slate-700 dark:text-slate-300 hover:text-lime-600 dark:hover:text-lime-400 transition-colors font-medium text-sm relative group"
              >
                Ventures
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-lime-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              </button>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="text-slate-700 dark:text-slate-300 hover:text-lime-600 dark:hover:text-lime-400 transition-colors font-medium text-sm relative group"
              >
                How It Works
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-lime-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              </button>
              <button
                onClick={() => scrollToSection('roi-calculator')}
                className="text-slate-700 dark:text-slate-300 hover:text-lime-600 dark:hover:text-lime-400 transition-colors font-medium text-sm relative group"
              >
                ROI Calculator
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-lime-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              </button>
              <button
                onClick={() => scrollToSection('dashboard-preview')}
                className="text-slate-700 dark:text-slate-300 hover:text-lime-600 dark:hover:text-lime-400 transition-colors font-medium text-sm relative group"
              >
                Dashboard
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-lime-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              </button>
              <button
                onClick={() => scrollToSection('success-stories')}
                className="text-slate-700 dark:text-slate-300 hover:text-lime-600 dark:hover:text-lime-400 transition-colors font-medium text-sm relative group"
              >
                Success Stories
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-lime-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              </button>
              <button
                onClick={() => scrollToSection('faq')}
                className="text-slate-700 dark:text-slate-300 hover:text-lime-600 dark:hover:text-lime-400 transition-colors font-medium text-sm relative group"
              >
                FAQ
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-lime-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              {!isAuthenticated && (
                <Link
                  to="/zomato-connect"
                  className="flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:text-lime-600 dark:hover:text-lime-400 transition-colors font-medium text-sm px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 group"
                >
                  <Utensils className="size-4" />
                  Connect Zomato
                  <ArrowRight className="inline transition-transform group-hover:translate-x-1" size={14} />
                </Link>
              )}
              {/* Theme Toggle */}
              <button
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors group"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? (
                  <Moon className="size-5 group-hover:rotate-90 transition-transform duration-300" />
                ) : (
                  <Sun className="size-5 group-hover:-rotate-90 transition-transform duration-300" />
                )}
              </button>

              {!isAuthenticated && (
                <Link to="/login" className="text-slate-700 dark:text-slate-300 hover:text-lime-600 dark:hover:text-lime-400 transition-colors font-medium text-sm px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 group">
                  Sign In
                  <ArrowRight className="inline ml-1 transition-transform group-hover:translate-x-1" size={14} />
                </Link>
              )}
              <button
                onClick={handleGetStarted}
                className="px-6 py-2.5 bg-gradient-to-r from-lime-500 to-lime-600 text-white rounded-xl hover:from-lime-600 hover:to-lime-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl group magnetic-btn"
              >
                Get Started Free
                <ArrowRight className="inline ml-2 transition-transform group-hover:translate-x-1" size={16} />
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden py-4 border-t border-gray-200 dark:border-slate-700 animate-fade-in-up bg-white dark:bg-slate-900">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col gap-4 pt-4">
              <button
                onClick={() => scrollToSection('features')}
                className="text-left px-4 py-3 text-slate-700 dark:text-slate-300 hover:text-lime-600 dark:hover:text-lime-400 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-all font-medium"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection('ventures')}
                className="text-left px-4 py-3 text-slate-700 dark:text-slate-300 hover:text-lime-600 dark:hover:text-lime-400 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-all font-medium"
              >
                Ventures
              </button>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="text-left px-4 py-3 text-slate-700 dark:text-slate-300 hover:text-lime-600 dark:hover:text-lime-400 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-all font-medium"
              >
                How It Works
              </button>
              <button
                onClick={() => scrollToSection('roi-calculator')}
                className="text-left px-4 py-3 text-slate-700 dark:text-slate-300 hover:text-lime-600 dark:hover:text-lime-400 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-all font-medium"
              >
                ROI Calculator
              </button>
              <button
                onClick={() => scrollToSection('platforms')}
                className="text-left px-4 py-3 text-slate-700 dark:text-slate-300 hover:text-lime-600 dark:hover:text-lime-400 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-all font-medium"
              >
                Integrations
              </button>
              <button
                onClick={() => scrollToSection('dashboard-preview')}
                className="text-left px-4 py-3 text-slate-700 dark:text-slate-300 hover:text-lime-600 dark:hover:text-lime-400 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-all font-medium"
              >
                Dashboard
              </button>
              <button
                onClick={() => scrollToSection('success-stories')}
                className="text-left px-4 py-3 text-slate-700 dark:text-slate-300 hover:text-lime-600 dark:hover:text-lime-400 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-all font-medium"
              >
                Success Stories
              </button>
              <button
                onClick={() => scrollToSection('faq')}
                className="text-left px-4 py-3 text-slate-700 dark:text-slate-300 hover:text-lime-600 dark:hover:text-lime-400 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-all font-medium"
              >
                FAQ
              </button>
              {!isAuthenticated && (
                <Link to="/zomato-connect" className="text-left px-4 py-3 text-slate-700 dark:text-slate-300 hover:text-lime-600 dark:hover:text-lime-400 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-all font-medium flex items-center gap-2">
                  <Utensils className="size-4" />
                  Connect Zomato
                </Link>
              )}
              {!isAuthenticated && (
                <Link to="/login" className="text-left px-4 py-3 text-slate-700 dark:text-slate-300 hover:text-lime-600 dark:hover:text-lime-400 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-all font-medium">
                  Sign In
                </Link>
              )}
              <button
                onClick={handleGetStarted}
                className="px-6 py-3 bg-gradient-to-r from-lime-500 to-lime-600 text-white rounded-xl hover:from-lime-600 hover:to-lime-700 transition-all duration-200 font-semibold shadow-lg text-center"
              >
                Get Started Free
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
