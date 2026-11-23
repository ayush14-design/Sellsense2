import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { authStorage } from '../utils/auth';
import { backendApi } from '../services/backendApi';
import { ShieldCheck, Lock, Mail, Eye, EyeOff, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('ayushmandalkar14@gmail.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both admin email and password.');
      return;
    }

    setLoading(true);

    try {
      const loginRes = await backendApi.login(email.trim(), password);

      if (loginRes?.token && loginRes?.user) {
        const user = loginRes.user;
        const isAdmin = user.role === 'super_admin' || user.email?.toLowerCase() === 'ayushmandalkar14@gmail.com';

        if (!isAdmin) {
          setError('Access Denied: This account does not have administrative privileges. Please use the restaurant login portal.');
          setLoading(false);
          return;
        }

        // Save auth state
        localStorage.setItem('auth_token', loginRes.token);
        authStorage.setUser(user);

        // Directly navigate to Admin Dashboard
        navigate('/admin');
      } else {
        setError('Login failed. Invalid response from server.');
      }
    } catch (err: any) {
      setError(err?.message || 'Admin authentication failed. Please verify your credentials and ensure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden selection:bg-purple-500 selection:text-white">
      {/* Background Glow Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-b from-purple-600/20 via-indigo-600/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[350px] bg-cyan-600/10 blur-3xl pointer-events-none" />

      {/* Top Navigation */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/25 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                SellSense
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-widest">
                Admin
              </span>
            </div>
          </div>
        </Link>

        <Link
          to="/login"
          className="text-xs sm:text-sm font-medium text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800"
        >
          <ArrowLeft size={14} />
          <span>Restaurant Portal Login</span>
        </Link>
      </header>

      {/* Main Login Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-black/80 relative">
            {/* Top Security Indicator */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-semibold">
                <ShieldCheck size={14} className="text-purple-400" />
                <span>Restricted Admin Portal</span>
              </div>
            </div>

            <div className="text-center mb-8">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Admin Sign In
              </h1>
              <p className="text-sm text-slate-400 mt-2">
                Enter your administrative credentials to access the SellSense SaaS Control Center.
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-3"
              >
                <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Admin Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 size-4" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@sellsense.com"
                    required
                    className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Admin Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 size-4" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full pl-11 pr-11 py-3 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-purple-600/30 hover:shadow-purple-600/50 transition-all flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In to Admin Portal</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </Button>
            </form>

            {/* Quick Demo Credential Helper */}
            <div className="mt-6 pt-5 border-t border-slate-800/80">
              <div className="text-[11px] text-slate-500 flex items-center justify-between mb-2">
                <span>Super Admin Account</span>
                <span className="text-purple-400 font-medium">Auto-configured</span>
              </div>
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-[11px] text-slate-400 font-mono space-y-1">
                <div>Email: <span className="text-slate-200">ayushmandalkar14@gmail.com</span></div>
                <div>Pass: <span className="text-slate-200">Ayush@14.</span></div>
              </div>
            </div>
          </div>

          {/* Switch to Regular User Portal */}
          <div className="text-center mt-6">
            <p className="text-xs text-slate-500">
              Are you a restaurant owner or staff?{' '}
              <Link to="/login" className="text-lime-400 hover:text-lime-300 font-semibold hover:underline">
                Go to Restaurant Login &rarr;
              </Link>
            </p>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-4 text-center text-xs text-slate-600 border-t border-slate-900">
        SellSense Enterprise Review Intelligence &bull; Administrative Systems Control
      </footer>
    </div>
  );
};
