import React from 'react';
import type { Product } from '../types';
import { Button } from './Button';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Activity, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProductCardProps {
  product: Product;
  onAnalyzeUploadedReviews?: (productName: string) => void;
  hasUploadedData?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAnalyzeUploadedReviews,
  hasUploadedData,
}) => {
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
        <div className="absolute top-4 left-4 flex flex-col gap-1.5">
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

          {hasUploadedData && (
            <div className="bg-lime-500 text-slate-950 font-black px-2.5 py-0.5 rounded-lg text-xs shadow-md uppercase tracking-wider">
              Uploaded Data
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
          {hasUploadedData && (
            <span className="px-3 py-1.5 bg-lime-100 text-lime-800 text-xs font-bold rounded-full border border-lime-300">
              Excel / CSV Upload
            </span>
          )}
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
        <div className="flex flex-col gap-2">
          {onAnalyzeUploadedReviews && (
            <Button
              variant="primary"
              size="small"
              className="w-full bg-gradient-to-r from-lime-400 to-lime-500 hover:from-lime-500 hover:to-lime-600 font-black shadow-md hover:shadow-lg text-slate-950 flex items-center justify-center gap-1.5 cursor-pointer"
              onClick={() => onAnalyzeUploadedReviews(product.name)}
            >
              Analyze Reviews
            </Button>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="small"
              className="flex-1 font-bold border-slate-300 hover:bg-slate-50 text-slate-700"
              onClick={() => onAnalyzeUploadedReviews ? onAnalyzeUploadedReviews(product.name) : navigate(`/analysis/${product.id}`)}
            >
              View Insights
            </Button>
            <button
              className="px-3 py-2 bg-amber-50 hover:bg-amber-100 rounded-xl transition-all font-bold text-amber-800 border border-amber-200 hover:border-amber-300 flex items-center gap-1.5 cursor-pointer shadow-xs"
              onClick={() => navigate(`/google-reviews?product=${encodeURIComponent(product.name)}`)}
              title={`View Google Maps Reviews for ${product.name}`}
            >
              <MapPin size={15} className="text-amber-600" />
              <span className="text-xs font-bold hidden sm:inline">Maps</span>
            </button>
          </div>
        </div>
      </div>

      {/* Decorative Corner Element */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-lime-400/20 to-cyan-400/20 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    </motion.div>
  );
};
