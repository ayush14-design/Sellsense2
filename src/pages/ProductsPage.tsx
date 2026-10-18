import React, { useState, useMemo } from 'react';
import { Sidebar } from '../components/Sidebar';
import { ProductCard } from '../components/ProductCard';
import { authStorage } from '../utils/auth';
import { demoProducts } from '../data/sampleData';
import { Search, Filter, Grid3x3, List, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export const ProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const restaurant = authStorage.getRestaurant();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!authStorage.isAuthenticated()) {
      navigate('/login');
    }
  }, [navigate]);

  // Extract unique categories
  const categories = ['All', ...Array.from(new Set(demoProducts.map((p) => p.category)))];

  // Filter products
  const filteredProducts = useMemo(() => {
    return demoProducts.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  if (!restaurant) {
    return null;
  }

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
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-lime-50/30">
      <Sidebar restaurantName={restaurant.name} />

      <main className="flex-1 p-8 overflow-x-hidden">
        <div className="max-w-7xl mx-auto">
          {/* Header with Animation */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-gradient-to-br from-lime-400 to-cyan-400 rounded-2xl shadow-lg">
                <Sparkles className="text-white" size={28} />
              </div>
              <div>
                <h1 className="text-4xl font-black text-slate-900">
                  Your Food Products
                </h1>
                <p className="text-slate-600 text-lg font-medium">
                  Discover insights from {filteredProducts.length} menu items
                </p>
              </div>
            </div>
          </motion.div>

          {/* Search and Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8"
          >
            <div className="glass rounded-3xl p-6 shadow-lg border border-white/50">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                  <Search
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="Search your products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent bg-white shadow-sm hover:border-slate-300 transition-all font-medium"
                  />
                </div>

                {/* Category Filter */}
                <div className="relative">
                  <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="pl-12 pr-8 py-3.5 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent bg-white shadow-sm font-bold text-slate-900 cursor-pointer hover:border-slate-300 transition-all appearance-none"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* View Toggle */}
                <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-3 rounded-xl transition-all ${
                      viewMode === 'grid'
                        ? 'bg-white shadow-md text-lime-600'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <Grid3x3 size={20} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-3 rounded-xl transition-all ${
                      viewMode === 'list'
                        ? 'bg-white shadow-md text-lime-600'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <List size={20} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Demo Data Banner */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-2xl p-4 mb-8 shadow-sm"
          >
            <p className="text-sm text-blue-900 font-semibold">
              <span className="text-lg">📊</span> <strong>Demo Mode:</strong> Viewing sample products for {restaurant.name}. This data is for demonstration purposes only.
            </p>
          </motion.div>

          {/* Products Grid */}
          {filteredProducts.length > 0 ? (
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className={viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-6'}
            >
              {filteredProducts.map((product) => (
                <motion.div
                  key={product.id}
                  variants={item}
                  whileHover={{ scale: 1.03 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center py-20"
            >
              <div className="inline-block p-6 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full mb-6">
                <Search size={48} className="text-slate-400" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">No products found</h3>
              <p className="text-slate-600 text-lg">Try adjusting your search or filters</p>
            </motion.div>
          )}

          {/* Stats Footer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-12 glass rounded-3xl p-6 border border-white/50 shadow-lg"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-black text-slate-900 mb-1">{filteredProducts.length}</div>
                <div className="text-sm text-slate-600 font-semibold">Total Products</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black text-lime-600 mb-1">
                  {filteredProducts.reduce((acc, p) => acc + p.positiveCount, 0)}
                </div>
                <div className="text-sm text-slate-600 font-semibold">Positive Reviews</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black text-red-600 mb-1">
                  {filteredProducts.reduce((acc, p) => acc + p.negativeCount, 0)}
                </div>
                <div className="text-sm text-slate-600 font-semibold">Negative Reviews</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black text-cyan-600 mb-1">
                  {filteredProducts.reduce((acc, p) => acc + p.totalReviews, 0)}
                </div>
                <div className="text-sm text-slate-600 font-semibold">Total Reviews</div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};
