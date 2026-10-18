import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { MetricCard } from '../components/MetricCard';
import { authStorage } from '../utils/auth';
import { demoProducts, demoReviews } from '../data/sampleData';
import { analyzeReviews, formatDate } from '../utils/analysis';
import { ArrowLeft, TrendingUp, AlertTriangle, CheckCircle, Copy, Star } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';
import { motion } from 'framer-motion';

export const AnalysisPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const restaurant = authStorage.getRestaurant();

  // Find product
  const product = demoProducts.find((p) => p.id === productId);

  // Analyze reviews
  const analysis = useMemo(() => {
    if (!productId) return null;
    return analyzeReviews(productId, demoReviews);
  }, [productId]);

  if (!product || !analysis) {
    return <div>Product not found</div>;
  }

  // Chart colors
  const COLORS = {
    positive: '#10b981',
    negative: '#dc2626',
    neutral: '#64748B',
  };

  // Prepare pie chart data
  const pieData = [
    { name: 'Positive', value: analysis.positiveCount, color: COLORS.positive },
    { name: 'Negative', value: analysis.negativeCount, color: COLORS.negative },
    { name: 'Neutral', value: analysis.neutralCount, color: COLORS.neutral },
  ];

  // Prepare platform bar chart data
  const platformData = analysis.platformDistribution.map((p) => ({
    platform: p.platform,
    positive: p.positive,
    negative: p.negative,
    neutral: p.neutral,
  }));

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-cyan-50/30">
      <Sidebar restaurantName={restaurant?.name} />

      <main className="flex-1 p-8 overflow-x-hidden">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ x: -5 }}
            onClick={() => navigate('/products')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors font-bold group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            Back to Products
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl shadow-lg">
                <TrendingUp className="text-white" size={28} />
              </div>
              <div>
                <h1 className="text-4xl font-black text-slate-900">
                  {product.name} <span className="gradient-text">Analytics</span>
                </h1>
                <p className="text-slate-600 text-lg font-medium">
                  Comprehensive review insights and sentiment analysis
                </p>
              </div>
            </div>
          </motion.div>

          {/* Summary Metrics */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          >
            <motion.div variants={item}>
              <MetricCard
                title="Total Reviews"
                value={analysis.totalReviews}
                className="bg-gradient-to-br from-white to-slate-50 border-2 border-slate-200"
              />
            </motion.div>
            <motion.div variants={item}>
              <MetricCard
                title="Positive Reviews"
                value={analysis.positiveCount}
                subtitle={`${Math.round((analysis.positiveCount / analysis.totalReviews) * 100)}%`}
                className="bg-gradient-to-br from-green-50 to-emerald-100 border-2 border-green-200"
              />
            </motion.div>
            <motion.div variants={item}>
              <MetricCard
                title="Negative Reviews"
                value={analysis.negativeCount}
                subtitle={`${Math.round((analysis.negativeCount / analysis.totalReviews) * 100)}%`}
                className="bg-gradient-to-br from-red-50 to-rose-100 border-2 border-red-200"
              />
            </motion.div>
            <motion.div variants={item}>
              <MetricCard
                title="Neutral Reviews"
                value={analysis.neutralCount}
                subtitle={`${Math.round((analysis.neutralCount / analysis.totalReviews) * 100)}%`}
                className="bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-200"
              />
            </motion.div>
          </motion.div>

          {/* Sentiment Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-3xl p-8 border-2 border-white/50 shadow-xl mb-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-lime-400 to-cyan-400 rounded-xl">
                <Star className="text-white" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Sentiment Distribution</h2>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Most Repetitive Review Types */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-3xl p-8 border-2 border-white/50 shadow-xl mb-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-cyan-400 to-blue-400 rounded-xl">
                <Copy className="text-white" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Most Repetitive Review Types</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Positive Reviews */}
              <div>
                <h3 className="text-lg font-bold text-green-600 mb-4 flex items-center gap-2">
                  <CheckCircle size={20} />
                  Positive Reviews
                </h3>
                <div className="space-y-4">
                  {analysis.positiveThemes.slice(0, 3).map((theme, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      whileHover={{ scale: 1.02, x: 5 }}
                      className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-5 border-2 border-green-200 shadow-md hover:shadow-lg transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-slate-900 text-lg">{theme.theme}</h4>
                        <span className="text-sm font-black text-green-600 bg-white px-3 py-1 rounded-full">
                          {theme.count} ({theme.percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 italic">"{theme.representativeQuote}"</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Negative Reviews */}
              <div>
                <h3 className="text-lg font-bold text-red-600 mb-4 flex items-center gap-2">
                  <AlertTriangle size={20} />
                  Negative Reviews
                </h3>
                <div className="space-y-4">
                  {analysis.negativeThemes.slice(0, 3).map((theme, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      whileHover={{ scale: 1.02, x: -5 }}
                      className="bg-gradient-to-r from-red-50 to-rose-50 rounded-2xl p-5 border-2 border-red-200 shadow-md hover:shadow-lg transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-slate-900 text-lg">{theme.theme}</h4>
                        <span className="text-sm font-black text-red-600 bg-white px-3 py-1 rounded-full">
                          {theme.count} ({theme.percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 italic">"{theme.representativeQuote}"</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Fake and Duplicate Reviews Detection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass rounded-3xl p-8 border-2 border-white/50 shadow-xl mb-8"
          >
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Review Quality Analysis</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Fake Reviews */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-orange-50 to-amber-100 rounded-3xl p-6 border-2 border-orange-300 shadow-lg"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-orange-800 flex items-center gap-2">
                    <AlertTriangle size={20} />
                    Potentially Fake Reviews
                  </h3>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-orange-600">
                    {analysis.fakeReviewsCount}
                  </span>
                  <span className="text-3xl font-bold text-orange-500">
                    ({analysis.fakeReviewsPercentage.toFixed(1)}%)
                  </span>
                </div>
                <p className="text-sm text-orange-900 mt-3 leading-relaxed font-medium">
                  Reviews flagged as potentially fake based on suspicious patterns like very short text,
                  generic phrases, or excessive character repetition.
                </p>
              </motion.div>

              {/* Duplicate Reviews */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-blue-50 to-cyan-100 rounded-3xl p-6 border-2 border-blue-300 shadow-lg"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-blue-800 flex items-center gap-2">
                    <Copy size={20} />
                    Duplicate Reviews
                  </h3>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-blue-600">
                    {analysis.duplicateReviewsCount}
                  </span>
                  <span className="text-3xl font-bold text-blue-500">
                    ({analysis.duplicateReviewsPercentage.toFixed(1)}%)
                  </span>
                </div>
                <p className="text-sm text-blue-900 mt-3 leading-relaxed font-medium">
                  Reviews with identical or very similar text content, which may indicate spam or
                  coordinated review campaigns.
                </p>
              </motion.div>
            </div>
          </motion.div>

          {/* Platform Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass rounded-3xl p-8 border-2 border-white/50 shadow-xl mb-8"
          >
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              Platform-Wise Review Distribution
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={platformData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="platform" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="positive" fill={COLORS.positive} name="Positive" />
                  <Bar dataKey="negative" fill={COLORS.negative} name="Negative" />
                  <Bar dataKey="neutral" fill={COLORS.neutral} name="Neutral" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Trends Over Time */}
          {analysis.trends && analysis.trends.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="glass rounded-3xl p-8 border-2 border-white/50 shadow-xl mb-8"
            >
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                Customer Feedback Trends
              </h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analysis.trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(date) => formatDate(date)} />
                    <YAxis />
                    <Tooltip labelFormatter={(date) => formatDate(date as string)} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="positive"
                      stroke={COLORS.positive}
                      name="Positive"
                      strokeWidth={3}
                    />
                    <Line
                      type="monotone"
                      dataKey="negative"
                      stroke={COLORS.negative}
                      name="Negative"
                      strokeWidth={3}
                    />
                    <Line
                      type="monotone"
                      dataKey="neutral"
                      stroke={COLORS.neutral}
                      name="Neutral"
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
};
