import React from 'react';
import type { Product } from '../types';
import { Button } from './Button';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Activity, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const navigate = useNavigate();

  const positivePercentage = Math.round((product.positiveCount / product.totalReviews) * 100);
  const negativePercentage = Math.round((product.negativeCount / product.totalReviews) * 100);
  const neutralPercentage = Math.round((product.neutralCount / product.totalReviews) * 100);

  return (
    <motion.div
      whileHover={{ y: -8 }}
      className="bg-white rounded-3xl border-2 border-slate-100 overflow-hidden hover:border-lime-400 transition-all duration-300 group relative shadow-lg hover:shadow-2xl"
    >
      {/* Image Section */}
      <div className="relative h-52 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />

        {/* Overlay Badge */}
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-2xl shadow-lg border border-slate-100">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-lime-600" />
            <span className="font-bold text-slate-900 text-sm">{product.totalReviews} Reviews</span>
          </div>
        </div>

        {/* Sentiment Badge */}
        <div className="absolute top-4 left-4">
          {positivePercentage > negativePercentage ? (
            <div className="bg-green-500 text-white px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 font-bold text-sm">
              <TrendingUp size={16} />
              {positivePercentage}% Positive
            </div>
          ) : (
            <div className="bg-red-500 text-white px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 font-bold text-sm">
              <TrendingDown size={16} />
              {negativePercentage}% Negative
            </div>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-2xl font-black text-slate-900 mb-1 group-hover:text-lime-600 transition-colors">
              {product.name}
            </h3>
            <p className="text-sm text-slate-600 font-bold uppercase tracking-wider">{product.category}</p>
          </div>
        </div>

        {/* Platform Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {product.platforms.map((platform) => (
            <span
              key={platform}
              className="px-3 py-1.5 bg-gradient-to-r from-slate-100 to-slate-200 text-xs font-bold rounded-full text-slate-800 border border-slate-200"
            >
              {platform}
            </span>
          ))}
        </div>

        {/* Sentiment Distribution */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-700 font-bold">Sentiment Analysis</span>
          </div>

          {/* Enhanced Progress Bar */}
          <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden shadow-inner">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${positivePercentage}%` }}
              transition={{ duration: 1, delay: 0.2 }}
              className="absolute left-0 h-full bg-gradient-to-r from-green-400 to-green-600"
              title={`${positivePercentage}% Positive`}
            />
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${negativePercentage}%` }}
              transition={{ duration: 1, delay: 0.4 }}
              className="absolute h-full bg-gradient-to-r from-red-400 to-red-600"
              style={{ left: `${positivePercentage}%` }}
              title={`${negativePercentage}% Negative`}
            />
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${neutralPercentage}%` }}
              transition={{ duration: 1, delay: 0.6 }}
              className="absolute h-full bg-gradient-to-r from-gray-300 to-gray-500"
              style={{ left: `${positivePercentage + negativePercentage}%` }}
              title={`${neutralPercentage}% Neutral`}
            />
          </div>

          {/* Percentage Labels */}
          <div className="flex justify-between mt-2 text-xs font-bold">
            <span className="text-green-600">✓ {positivePercentage}%</span>
            <span className="text-red-600">✗ {negativePercentage}%</span>
            <span className="text-gray-600">− {neutralPercentage}%</span>
          </div>
        </div>

        {/* Last Analyzed */}
        <div className="text-xs text-slate-500 mb-4 font-semibold flex items-center gap-2">
          <div className="w-2 h-2 bg-lime-400 rounded-full animate-pulse"></div>
          Last analyzed: {new Date(product.lastAnalyzed).toLocaleDateString()}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="primary"
            size="small"
            className="flex-1 bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-600 hover:to-lime-700 font-bold shadow-md hover:shadow-lg"
            onClick={() => navigate(`/analysis/${product.id}`)}
          >
            View Insights
          </Button>
          <button
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all font-bold text-slate-700 border-2 border-slate-200 hover:border-slate-300"
            onClick={() => navigate(`/google-reviews/${product.id}`)}
            title="Google Reviews"
          >
            <ExternalLink size={18} />
          </button>
        </div>
      </div>

      {/* Decorative Corner Element */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-lime-400/20 to-cyan-400/20 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    </motion.div>
  );
};
