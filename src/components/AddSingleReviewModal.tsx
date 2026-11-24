import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  X, Star, MessageSquare, UtensilsCrossed, Calendar, Check,
  Loader2, User, Globe
} from 'lucide-react';
import { Button } from './Button';

interface AddSingleReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId: string;
  existingDishes?: string[];
  onSuccess: (newReview: any) => void;
}

const REVIEW_PLATFORMS = [
  'Google Reviews',
  'Zomato',
  'Swiggy',
  'Dine-In (In-Restaurant)',
  'Direct Customer Feedback',
  'Online Delivery',
  'WhatsApp / Call Order'
];

const DISH_CATEGORIES = [
  'Main Course',
  'Starters & Appetizers',
  'Desserts',
  'Beverages & Drinks',
  'Breads & Roti',
  'Biryani & Rice',
  'Snacks'
];

export const AddSingleReviewModal: React.FC<AddSingleReviewModalProps> = ({
  isOpen,
  onClose,
  restaurantId,
  existingDishes = [],
  onSuccess,
}) => {
  const [dishName, setDishName] = useState('');
  const [category, setCategory] = useState('Main Course');
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [platform, setPlatform] = useState<string>('Google Reviews');
  const [customerName, setCustomerName] = useState('');
  const [reviewDate, setReviewDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanDish = dishName.trim();
    const cleanReview = reviewText.trim();

    if (!cleanDish) {
      setError('Please provide a dish or food item name.');
      return;
    }
    if (!cleanReview) {
      setError('Please enter the customer review feedback.');
      return;
    }

    setSubmitting(true);

    try {
      const isPositive = rating >= 4;
      const isNegative = rating <= 2;
      const sentiment = isPositive ? 'positive' : isNegative ? 'negative' : 'neutral';

      const newReview = {
        id: `rev_single_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        restaurant_id: restaurantId,
        product_name: cleanDish,
        customer_review: cleanReview,
        rating,
        review_date: reviewDate || new Date().toISOString().split('T')[0],
        platform,
        reviewer_name: customerName.trim() || 'Direct Customer',
        sentiment,
        theme: isPositive ? 'Taste & Quality' : isNegative ? 'Portion & Preparation' : 'General Experience',
        created_at: new Date().toISOString(),
      };

      // 1. Update localStorage sellsense_manual_reviews_
      try {
        const rawReviews = localStorage.getItem(`sellsense_manual_reviews_${restaurantId}`);
        const storedReviews = rawReviews ? JSON.parse(rawReviews) : [];
        storedReviews.unshift(newReview);
        localStorage.setItem(`sellsense_manual_reviews_${restaurantId}`, JSON.stringify(storedReviews));
      } catch (e) {
        console.warn('LocalStorage manual reviews update error:', e);
      }

      // 2. Update or create product in sellsense_uploaded_products_
      try {
        const rawProds = localStorage.getItem(`sellsense_uploaded_products_${restaurantId}`);
        const storedProds = rawProds ? JSON.parse(rawProds) : [];
        const existingIdx = storedProds.findIndex(
          (p: any) => p.name?.toLowerCase() === cleanDish.toLowerCase()
        );

        if (existingIdx >= 0) {
          storedProds[existingIdx] = {
            ...storedProds[existingIdx],
            totalReviews: (storedProds[existingIdx].totalReviews || 0) + 1,
            positiveCount: (storedProds[existingIdx].positiveCount || 0) + (isPositive ? 1 : 0),
            negativeCount: (storedProds[existingIdx].negativeCount || 0) + (isNegative ? 1 : 0),
            neutralCount: (storedProds[existingIdx].neutralCount || 0) + (!isPositive && !isNegative ? 1 : 0),
            lastAnalyzed: new Date().toISOString(),
          };
        } else {
          storedProds.unshift({
            id: `prod_${Date.now()}`,
            restaurantId,
            name: cleanDish,
            category,
            platforms: [platform],
            totalReviews: 1,
            positiveCount: isPositive ? 1 : 0,
            negativeCount: isNegative ? 1 : 0,
            neutralCount: !isPositive && !isNegative ? 1 : 0,
            lastAnalyzed: new Date().toISOString(),
            dataMode: 'LIVE',
          });
        }

        localStorage.setItem(`sellsense_uploaded_products_${restaurantId}`, JSON.stringify(storedProds));
      } catch (e) {
        console.warn('LocalStorage products update error:', e);
      }

      // 3. Send to backend if available (best-effort, silent fail)
      try {
        const token = localStorage.getItem('sellsense_token') || localStorage.getItem('auth_token') || '';
        await fetch('/api/manual-reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            restaurantId,
            batchName: `Direct Entry - ${cleanDish}`,
            reviews: [{ productName: cleanDish, customerReview: cleanReview, rating, reviewDate, platform }]
          })
        });
      } catch {}

      onSuccess(newReview);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200"
      >
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 to-slate-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-lime-400 text-slate-950 flex items-center justify-center font-black shadow-md shadow-lime-400/20">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white leading-tight">Add Customer Review</h3>
              <p className="text-xs text-lime-400 font-medium">Record direct feedback & analyze AI sentiment</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition p-1.5 rounded-xl hover:bg-slate-800"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Dish / Product Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Dish / Food Item Name *
            </label>
            <div className="relative">
              <UtensilsCrossed className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={dishName}
                onChange={(e) => setDishName(e.target.value)}
                list="dishes-suggestions"
                placeholder="e.g. Butter Chicken, Paneer Tikka..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                required
              />
              <datalist id="dishes-suggestions">
                {existingDishes.map((dish, i) => (
                  <option key={i} value={dish} />
                ))}
              </datalist>
            </div>
            {existingDishes.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="text-[11px] text-slate-400 font-medium self-center">Existing dishes:</span>
                {existingDishes.slice(0, 4).map((dish, i) => (
                  <button
                    type="button"
                    key={i}
                    onClick={() => setDishName(dish)}
                    className="text-[11px] px-2 py-0.5 bg-slate-100 hover:bg-lime-100 text-slate-700 hover:text-lime-900 rounded-md font-semibold transition"
                  >
                    {dish}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Food Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-lime-500"
            >
              {DISH_CATEGORIES.map((cat, i) => (
                <option key={i} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Star Rating */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Customer Rating (1 to 5 Stars) *
            </label>
            <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFilled = (hoverRating !== null ? hoverRating : rating) >= star;
                  return (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      className="p-1 rounded-lg hover:scale-110 transition-transform focus:outline-none"
                    >
                      <Star
                        size={26}
                        className={isFilled ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
                      />
                    </button>
                  );
                })}
              </div>
              <span className="text-xs font-black text-slate-700 ml-2">
                {rating === 5 && '⭐⭐⭐⭐⭐ Excellent'}
                {rating === 4 && '⭐⭐⭐⭐ Very Good'}
                {rating === 3 && '⭐⭐⭐ Average'}
                {rating === 2 && '⭐⭐ Needs Improvement'}
                {rating === 1 && '⭐ Poor'}
              </span>
            </div>
          </div>

          {/* Customer Review Feedback */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Review Content / Feedback Text *
            </label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={3}
              placeholder="e.g. Delicious gravy, tender chicken and was piping hot! Only complaint is that naan was slightly chewy."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-lime-500 font-medium"
              required
            />
          </div>

          {/* Source Platform & Review Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Review Source / Platform
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-lime-500"
                >
                  {REVIEW_PLATFORMS.map((plat, i) => (
                    <option key={i} value={plat}>{plat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Date of Review
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  value={reviewDate}
                  onChange={(e) => setReviewDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-lime-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Customer Name (Optional) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Reviewer Name (Optional)
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Ramesh Patel"
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-lime-500"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="secondary" size="small" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-lime-400 hover:bg-lime-500 text-slate-950 font-black px-5 py-2.5 rounded-xl shadow-md shadow-lime-400/20 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save & Analyze Review</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
