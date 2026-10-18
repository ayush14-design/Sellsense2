import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { authStorage } from '../utils/auth';
import { Eye, EyeOff, CheckCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    restaurantName: '',
    acceptTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (
      !formData.fullName ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword ||
      !formData.restaurantName
    ) {
      setError('Please fill in all fields');
      return;
    }

    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!formData.acceptTerms) {
      setError('Please accept the terms and conditions');
      return;
    }

    setLoading(true);

    // Simulate account creation
    setTimeout(() => {
      const user = {
        id: 'user_' + Date.now(),
        email: formData.email,
        fullName: formData.fullName,
        createdAt: new Date().toISOString(),
      };

      authStorage.setUser(user);
      setLoading(false);
      navigate('/setup');
    }, 1000);
  };

  const benefits = [
    "AI-powered sentiment analysis",
    "Real-time review monitoring",
    "Multi-platform aggregation",
    "Actionable insights & reports"
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 gradient-mesh">
        <div className="absolute top-10 right-20 w-96 h-96 bg-lime-400/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-10 left-20 w-80 h-80 bg-cyan-400/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute top-1/3 left-1/3 w-72 h-72 bg-purple-400/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }}></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-6xl grid md:grid-cols-2 gap-12 items-center">

          {/* Left Side - Benefits */}
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
                <Link to="/" className="inline-block mb-6">
                  <h1 className="text-6xl font-black text-slate-900">
                    Sell<span className="gradient-text">Sense</span>
                  </h1>
                </Link>
                <h2 className="text-4xl font-bold text-slate-900 mb-4">
                  Start Your Journey
                </h2>
                <p className="text-xl text-slate-600 leading-relaxed">
                  Join restaurants that are already making smarter decisions with customer feedback.
                </p>
              </motion.div>

              {/* Benefits List */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-bold text-slate-900 mb-4">What you'll get:</h3>
                {benefits.map((benefit, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + idx * 0.1 }}
                    className="flex items-center gap-4 bg-white/60 backdrop-blur-sm p-4 rounded-2xl"
                  >
                    <div className="p-2 bg-gradient-to-br from-lime-400 to-lime-600 rounded-xl">
                      <CheckCircle size={20} className="text-white" />
                    </div>
                    <span className="font-semibold text-slate-800">{benefit}</span>
                  </motion.div>
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="bg-gradient-to-r from-lime-50 to-cyan-50 p-6 rounded-3xl border border-lime-200"
              >
                <p className="text-sm text-slate-700">
                  <span className="font-bold text-lime-700">🎉 Limited Time:</span> Get 30 days free trial when you sign up today!
                </p>
              </motion.div>
            </div>
          </motion.div>

          {/* Right Side - Signup Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="glass rounded-3xl shadow-2xl p-8 border border-white/50">
              <div className="text-center mb-6">
                <motion.h2
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl font-bold text-slate-900 mb-2"
                >
                  Create Account 🚀
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-slate-600"
                >
                  Get started in less than 2 minutes
                </motion.p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
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
                >
                  <label htmlFor="fullName" className="block text-sm font-bold text-slate-900 mb-2">
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent shadow-sm hover:border-slate-300 transition-all"
                    placeholder="John Doe"
                    required
                  />
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
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent shadow-sm hover:border-slate-300 transition-all"
                    placeholder="you@example.com"
                    required
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <label htmlFor="restaurantName" className="block text-sm font-bold text-slate-900 mb-2">
                    Restaurant Name
                  </label>
                  <input
                    id="restaurantName"
                    name="restaurantName"
                    type="text"
                    value={formData.restaurantName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent shadow-sm hover:border-slate-300 transition-all"
                    placeholder="Your Restaurant Name"
                    required
                  />
                </motion.div>

                <div className="grid md:grid-cols-2 gap-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                  >
                    <label htmlFor="password" className="block text-sm font-bold text-slate-900 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent pr-10 shadow-sm hover:border-slate-300 transition-all"
                        placeholder="Min 6 chars"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                  >
                    <label htmlFor="confirmPassword" className="block text-sm font-bold text-slate-900 mb-2">
                      Confirm
                    </label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent pr-10 shadow-sm hover:border-slate-300 transition-all"
                        placeholder="Re-enter"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0 }}
                >
                  <label className="flex items-start group cursor-pointer">
                    <input
                      type="checkbox"
                      name="acceptTerms"
                      checked={formData.acceptTerms}
                      onChange={handleChange}
                      className="w-5 h-5 text-lime-500 border-slate-300 rounded-lg focus:ring-2 focus:ring-lime-500 mt-0.5 cursor-pointer"
                      required
                    />
                    <span className="ml-3 text-sm text-slate-900">
                      I agree to the{' '}
                      <a href="#" className="font-bold hover:text-lime-600 transition-colors">
                        Terms of Service
                      </a>{' '}
                      and{' '}
                      <a href="#" className="font-bold hover:text-lime-600 transition-colors">
                        Privacy Policy
                      </a>
                    </span>
                  </label>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1 }}
                >
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-lime-500 to-cyan-500 hover:from-lime-600 hover:to-cyan-600 text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all btn-ripple"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="spinner border-2 border-white border-t-transparent rounded-full w-5 h-5"></span>
                        Creating account...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        Create Account <ArrowRight size={20} />
                      </span>
                    )}
                  </Button>
                </motion.div>
              </form>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="mt-6 text-center text-sm text-slate-600"
              >
                Already have an account?{' '}
                <Link to="/login" className="text-slate-900 font-bold hover:text-lime-600 transition-colors">
                  Sign in →
                </Link>
              </motion.p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
