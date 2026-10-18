import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { MetricCard } from '../components/MetricCard';
import { SentimentBadge } from '../components/SentimentBadge';
import { authStorage } from '../utils/auth';
import { demoProducts, demoReviews } from '../data/sampleData';
import { analyzeGoogleReviews, formatDate } from '../utils/analysis';
import { ArrowLeft, Search, MapPin } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

export const GoogleReviewsPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const restaurant = authStorage.getRestaurant();

  const [searchQuery, setSearchQuery] = useState('');

  // Find product
  const product = demoProducts.find((p) => p.id === productId);

  // Analyze Google reviews
  const analysis = useMemo(() => {
    if (!productId) return null;
    return analyzeGoogleReviews(productId, demoReviews);
  }, [productId]);

  // Filter Google reviews for table
  const filteredReviews = useMemo(() => {
    if (!productId) return [];

    return demoReviews
      .filter((r) => r.productId === productId && r.platform === 'Google')
      .filter((r) => r.reviewText.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [productId, searchQuery]);

  if (!product || !analysis) {
    return <div>Product not found</div>;
  }

  // Chart colors
  const COLORS = {
    positive: '#10b981',
    negative: '#dc2626',
    neutral: '#77716A',
  };

  // Prepare pie chart data
  const pieData = [
    { name: 'Positive', value: analysis.positiveCount, color: COLORS.positive },
    { name: 'Negative', value: analysis.negativeCount, color: COLORS.negative },
    { name: 'Neutral', value: analysis.neutralCount, color: COLORS.neutral },
  ];

  // Check if reviews are restaurant-level
  const hasRestaurantLevelReviews = filteredReviews.some((r) => r.scope === 'restaurant');

  return (
    <div className="flex min-h-screen bg-warm-stone">
      <Sidebar restaurantName={restaurant?.name} />

      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <button
            onClick={() => navigate('/products')}
            className="flex items-center gap-2 text-muted-gray hover:text-deep-charcoal mb-6 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Products
          </button>

          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <MapPin className="text-deep-charcoal" size={32} />
              <h1 className="font-serif text-4xl font-bold text-deep-charcoal">
                What Customers Say on Google
              </h1>
            </div>
            <p className="text-muted-gray">
              Understand the feedback customers leave about your restaurant on Google
            </p>
          </div>

          {/* Restaurant Level Notice */}
          {hasRestaurantLevelReviews && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
              <p className="text-sm text-blue-900">
                <strong>Note:</strong> Google reviews often describe the overall restaurant
                experience rather than specific food items. These reviews provide insights into
                service, ambiance, and general dining experience.
              </p>
            </div>
          )}

          {/* Summary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <MetricCard title="Total Google Reviews" value={analysis.totalReviews} />
            <MetricCard
              title="Positive Reviews"
              value={analysis.positiveCount}
              subtitle={`${Math.round((analysis.positiveCount / analysis.totalReviews) * 100)}%`}
            />
            <MetricCard
              title="Negative Reviews"
              value={analysis.negativeCount}
              subtitle={`${Math.round((analysis.negativeCount / analysis.totalReviews) * 100)}%`}
            />
            <MetricCard
              title="Neutral Reviews"
              value={analysis.neutralCount}
              subtitle={`${Math.round((analysis.neutralCount / analysis.totalReviews) * 100)}%`}
            />
          </div>

          {/* Sentiment Distribution */}
          <div className="bg-white rounded-xl p-6 border border-border-beige mb-8">
            <h2 className="text-2xl font-bold text-deep-charcoal mb-6">
              Google Reviews Sentiment Distribution
            </h2>
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
          </div>

          {/* Positive Themes */}
          {analysis.positiveThemes.length > 0 && (
            <div className="bg-white rounded-xl p-6 border border-border-beige mb-8">
              <h2 className="text-2xl font-bold text-deep-charcoal mb-6">
                What Customers Appreciate
              </h2>
              <div className="space-y-6">
                {analysis.positiveThemes.slice(0, 5).map((theme, index) => (
                  <div key={index} className="border-l-4 border-green-500 pl-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-deep-charcoal">{theme.theme}</h3>
                      <span className="text-sm text-muted-gray">
                        {theme.count} mentions ({theme.percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <p className="text-sm text-muted-gray italic">"{theme.representativeQuote}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Negative Themes */}
          {analysis.negativeThemes.length > 0 && (
            <div className="bg-white rounded-xl p-6 border border-border-beige mb-8">
              <h2 className="text-2xl font-bold text-deep-charcoal mb-6">Areas for Improvement</h2>
              <div className="space-y-6">
                {analysis.negativeThemes.slice(0, 5).map((theme, index) => (
                  <div key={index} className="border-l-4 border-red-500 pl-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-deep-charcoal">{theme.theme}</h3>
                      <span className="text-sm text-muted-gray">
                        {theme.count} mentions ({theme.percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <p className="text-sm text-muted-gray italic">"{theme.representativeQuote}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trends Over Time */}
          {analysis.trends && analysis.trends.length > 0 && (
            <div className="bg-white rounded-xl p-6 border border-border-beige mb-8">
              <h2 className="text-2xl font-bold text-deep-charcoal mb-6">
                Google Reviews Trend Over Time
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
                    />
                    <Line
                      type="monotone"
                      dataKey="negative"
                      stroke={COLORS.negative}
                      name="Negative"
                    />
                    <Line type="monotone" dataKey="neutral" stroke={COLORS.neutral} name="Neutral" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* AI Recommendations */}
          {analysis.recommendations.length > 0 && (
            <div className="bg-white rounded-xl p-6 border border-border-beige mb-8">
              <h2 className="text-2xl font-bold text-deep-charcoal mb-6">
                Recommended Actions Based on Google Reviews
              </h2>
              <div className="space-y-4">
                {analysis.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-deep-charcoal text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    <p className="text-muted-gray pt-1">{recommendation}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-900">
                  <strong>Note:</strong> These are AI-generated suggestions based on Google review
                  patterns. Always verify recommendations with your team before implementing changes.
                </p>
              </div>
            </div>
          )}

          {/* Google Reviews Records */}
          <div className="bg-white rounded-xl p-6 border border-border-beige">
            <h2 className="text-2xl font-bold text-deep-charcoal mb-6">Google Review Records</h2>

            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-gray"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search Google reviews..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-border-beige rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-charcoal"
                />
              </div>
            </div>

            {/* Reviews Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-light-beige">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-deep-charcoal">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-deep-charcoal">
                      Review
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-deep-charcoal">
                      Sentiment
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-deep-charcoal">
                      Theme
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-deep-charcoal">
                      Scope
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReviews.map((review) => (
                    <tr key={review.id} className="border-b border-border-beige">
                      <td className="px-4 py-4 text-sm text-muted-gray whitespace-nowrap">
                        {formatDate(review.createdAt)}
                      </td>
                      <td className="px-4 py-4 text-sm text-deep-charcoal max-w-md">
                        {review.reviewText}
                      </td>
                      <td className="px-4 py-4">
                        <SentimentBadge sentiment={review.sentiment} />
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-gray">{review.theme}</td>
                      <td className="px-4 py-4">
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            review.scope === 'restaurant'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {review.scope === 'restaurant' ? 'Restaurant' : 'Product'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredReviews.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-gray">No Google reviews found</p>
                </div>
              )}
            </div>
          </div>

          {/* Integration Info */}
          <div className="mt-8 bg-light-beige rounded-lg p-6">
            <h3 className="font-bold text-deep-charcoal mb-2">About Google Reviews Integration</h3>
            <p className="text-sm text-muted-gray mb-4">
              This prototype displays sample Google reviews data. A production implementation would
              require authorized access to the Google Business Profile API and proper OAuth
              authentication.
            </p>
            <p className="text-sm text-muted-gray">
              Google Maps reviews frequently describe overall restaurant experiences. When reviews
              cannot reliably be linked to specific products, they are classified as restaurant-level
              feedback.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};
