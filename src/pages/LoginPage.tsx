import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { authStorage } from '../utils/auth';
import { backendApi } from '../services/backendApi';
import { Eye, EyeOff, Sparkles, TrendingUp, Zap, Utensils, Shield, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { GoogleAuthModal } from '../components/GoogleAuthModal';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [loginRole, setLoginRole] = useState<'owner' | 'admin'>('owner');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSelectRole = (role: 'owner' | 'admin') => {
    setLoginRole(role);
    setError('');
    // Clear fields when switching roles — no demo prefill
    setEmail('');
    setPassword('');
  };

  const [googleModalOpen, setGoogleModalOpen] = useState(false);

  const handleGoogleAuthenticate = async (data: { credential: string; email: string; fullName: string }) => {
    setLoading(true);
    setError('');
    try {
      // Send the real Google credential to backend for verification
      const res = await backendApi.googleAuth({
        credential: data.credential,
        email: data.email,
        fullName: data.fullName,
      });

      const { user, token, hasRestaurant, restaurant } = res;

      authStorage.setUser(user);
      localStorage.setItem('auth_token', token);

      if (restaurant) {
        authStorage.setRestaurant(restaurant);
      }

      setGoogleModalOpen(false);

      if (user.role === 'super_admin' || user.email === 'admin@sellsense.ai') {
        navigate('/admin');
      } else if (hasRestaurant) {
        navigate('/products');
      } else {
        navigate('/setup');
      }
    } catch (err: any) {
      setError(err?.message || 'Google authentication failed. Please ensure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setError('');
    setGoogleModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

    try {
      // Always try real backend login first
      const loginRes = await backendApi.login(email, password);
      if (loginRes?.token && loginRes?.user) {
        localStorage.setItem('auth_token', loginRes.token);
        authStorage.setUser(loginRes.user);

        if (loginRes.user.role === 'super_admin' || loginRes.user.email === 'admin@sellsense.ai') {
          navigate('/admin');
        } else {
          const restaurant = authStorage.getRestaurant();
          if (restaurant) {
            navigate('/products');
          } else {
            navigate('/setup');
          }
        }
      } else {
        setError('Login failed. Invalid response from server.');
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please check your credentials and ensure the server is running.');
    } finally {
      setLoading(false);
    }
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

                {/* Two Account Switcher Buttons: Restaurant Owner vs Admin */}
                <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-2xl mb-2 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => handleSelectRole('owner')}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                      loginRole === 'owner'
                        ? 'bg-white text-slate-900 shadow-md border border-lime-400 scale-[1.02]'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Utensils size={18} className={loginRole === 'owner' ? 'text-lime-500' : ''} />
                    Restaurant Owner
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectRole('admin')}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                      loginRole === 'admin'
                        ? 'bg-purple-600 text-white shadow-md scale-[1.02]'
                        : 'text-slate-600 hover:text-purple-600'
                    }`}
                  >
                    <Shield size={18} className={loginRole === 'admin' ? 'text-white' : ''} />
                    Admin Access
                  </button>
                </div>

                {/* Role Description Badge */}
                {loginRole === 'admin' ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-purple-50 border border-purple-200 rounded-2xl p-4 text-purple-950"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider bg-purple-200 text-purple-900 px-2.5 py-1 rounded-full">
                        <Crown size={13} /> Admin Portal Mode
                      </span>
                      <span className="text-xs text-purple-700">Directly opens Admin tab</span>
                    </div>
                    <p className="text-xs text-purple-800">
                      Admin login requires valid credentials. Enter your admin email and password below.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-lime-50 border border-lime-200 rounded-2xl p-3 text-slate-700 text-xs flex items-center"
                  >
                    <span className="font-medium text-slate-800">
                      👨‍🍳 Owner Mode: Manage food products, reviews & subscription.
                    </span>
                  </motion.div>
                )}

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
                    className="w-full px-4 py-3.5 bg-white text-slate-900 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent shadow-sm hover:border-slate-300 transition-all placeholder:text-slate-400"
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
                      className="w-full px-4 py-3.5 bg-white text-slate-900 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent pr-12 shadow-sm hover:border-slate-300 transition-all placeholder:text-slate-400"
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
                    className={`w-full text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all btn-ripple ${
                      loginRole === 'admin'
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
                        : 'bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-600 hover:to-lime-700'
                    }`}
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="spinner border-2 border-white border-t-transparent rounded-full w-5 h-5"></span>
                        Signing in...
                      </span>
                    ) : loginRole === 'admin' ? (
                      'Sign In as Administrator →'
                    ) : (
                      'Sign In as Restaurant Owner →'
                    )}
                  </Button>
                </motion.div>

                {/* Google Authentication for Restaurant Owners */}
                {loginRole === 'owner' && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.95 }}
                    className="pt-2"
                  >
                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200"></div>
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-3 text-slate-500 font-bold">Or continue with</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm rounded-2xl border-2 border-slate-200 hover:border-slate-300 shadow-sm hover:shadow transition-all group"
                    >
                      <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      Sign in with Google
                    </button>
                  </motion.div>
                )}
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

      {/* Google Authentication Modal */}
      <GoogleAuthModal
        isOpen={googleModalOpen}
        onClose={() => setGoogleModalOpen(false)}
        onAuthenticate={handleGoogleAuthenticate}
        loading={loading}
        mode="signin"
      />
    </div>
  );
};
