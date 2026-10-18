import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { authStorage } from '../utils/auth';
import { Eye, EyeOff, Sparkles, TrendingUp, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    // Simulate login
    setTimeout(() => {
      const user = {
        id: 'user_001',
        email,
        fullName: 'Demo User',
        createdAt: new Date().toISOString(),
      };

      authStorage.setUser(user);
      setLoading(false);

      // Check if restaurant exists
      const restaurant = authStorage.getRestaurant();
      if (restaurant) {
        navigate('/products');
      } else {
        navigate('/setup');
      }
    }, 1000);
  };

  const handleDemoLogin = () => {
    setEmail('demo@nelamrestaurants.com');
    setPassword('demo123');
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 gradient-mesh">
        <div className="absolute top-20 left-10 w-72 h-72 bg-lime-400/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-6xl grid md:grid-cols-2 gap-12 items-center">

          {/* Left Side - Branding */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="hidden md:block"
          >
            <div className="space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Link to="/" className="inline-block">
                  <h1 className="text-6xl font-black text-slate-900 mb-4">
                    Sell<span className="gradient-text">Sense</span>
                  </h1>
                </Link>
                <p className="text-2xl font-semibold text-slate-700 mb-6">
                  Transform Customer Reviews Into Actionable Insights
                </p>
                <p className="text-lg text-slate-600 leading-relaxed">
                  Join hundreds of restaurants using AI to understand what customers really think about their food.
                </p>
              </motion.div>

              {/* Feature Highlights */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-4"
              >
                {[
                  { icon: TrendingUp, text: 'Real-time Sentiment Analysis', color: 'text-lime-600' },
                  { icon: Sparkles, text: 'AI-Powered Insights', color: 'text-cyan-600' },
                  { icon: Zap, text: 'Instant Review Aggregation', color: 'text-purple-600' }
                ].map((feature, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + idx * 0.1 }}
                    className="flex items-center gap-4 bg-white/60 backdrop-blur-sm p-4 rounded-2xl"
                  >
                    <div className={`p-3 bg-gradient-to-br from-lime-100 to-cyan-100 rounded-xl ${feature.color}`}>
                      <feature.icon size={24} />
                    </div>
                    <span className="font-semibold text-slate-800">{feature.text}</span>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.div>

          {/* Right Side - Login Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="glass rounded-3xl shadow-2xl p-8 border border-white/50">
              <div className="text-center mb-8">
                <motion.h2
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl font-bold text-slate-900 mb-2"
                >
                  Welcome Back! 👋
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-slate-600"
                >
                  Sign in to continue to your dashboard
                </motion.p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-red-50 text-red-700 px-4 py-3 rounded-2xl text-sm font-medium border border-red-100"
                  >
                    {error}
                  </motion.div>
                )}

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-gradient-to-r from-lime-50 to-cyan-50 px-4 py-3 rounded-2xl text-sm border border-lime-200"
                >
                  <p className="font-semibold text-lime-900 mb-1">🎯 Demo Account Available</p>
                  <p className="text-xs text-lime-800">
                    Click{' '}
                    <button
                      type="button"
                      onClick={handleDemoLogin}
                      className="underline font-bold hover:text-lime-600 transition-colors"
                    >
                      here
                    </button>{' '}
                    to fill demo credentials instantly
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <label htmlFor="email" className="block text-sm font-bold text-slate-900 mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent shadow-sm hover:border-slate-300 transition-all"
                    placeholder="you@example.com"
                    required
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <label htmlFor="password" className="block text-sm font-bold text-slate-900 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent pr-12 shadow-sm hover:border-slate-300 transition-all"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="flex items-center justify-between"
                >
                  <label className="flex items-center group cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-5 h-5 text-lime-500 border-slate-300 rounded-lg focus:ring-2 focus:ring-lime-500 cursor-pointer"
                    />
                    <span className="ml-3 text-sm text-slate-900 font-medium group-hover:text-lime-600 transition-colors">
                      Remember me
                    </span>
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-sm text-slate-900 hover:text-lime-600 font-semibold transition-colors"
                  >
                    Forgot password?
                  </Link>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                >
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-600 hover:to-lime-700 text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all btn-ripple"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="spinner border-2 border-white border-t-transparent rounded-full w-5 h-5"></span>
                        Signing in...
                      </span>
                    ) : (
                      'Sign In →'
                    )}
                  </Button>
                </motion.div>
              </form>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-6 text-center text-sm text-slate-600"
              >
                Don't have an account?{' '}
                <Link to="/signup" className="text-slate-900 font-bold hover:text-lime-600 transition-colors">
                  Create account →
                </Link>
              </motion.p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
