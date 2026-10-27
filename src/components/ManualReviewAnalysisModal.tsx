import React, { useState, useEffect } from 'react';
import {
  X, Sparkles, TrendingUp, AlertTriangle, CheckCircle, ThumbsUp, ThumbsDown,
  Tag, RefreshCw, MessageSquare, ShieldAlert, ShieldCheck,
  Utensils, Package, Flame, DollarSign, Clock, Star, Percent, BarChart3,
  AlertOctagon, Check
} from 'lucide-react';
import { Button } from './Button';
import { backendApi } from '../services/backendApi';

interface ManualReviewAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  restaurantId: string;
}

export const ManualReviewAnalysisModal: React.FC<ManualReviewAnalysisModalProps> = ({
  isOpen,
  onClose,
  productName,
  restaurantId,
}) => {
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'paired' | 'percentages' | 'fake-detection' | 'reviews'>('paired');

  useEffect(() => {
    if (isOpen && productName) {
      loadAnalysis();
    }
  }, [isOpen, productName, restaurantId]);

  const loadAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await backendApi.getProductReviewAnalysis(productName, restaurantId);
      setAnalysis(data);
    } catch (err: any) {
      console.error('Failed to load review analysis:', err);
      setError(err?.message || 'Failed to analyze reviews');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const renderAspectIcon = (iconName: string) => {
    switch (iconName) {
      case 'Utensils':
        return <Utensils className="w-4 h-4 text-amber-500" />;
      case 'Package':
        return <Package className="w-4 h-4 text-blue-500" />;
      case 'Flame':
        return <Flame className="w-4 h-4 text-orange-500" />;
      case 'DollarSign':
        return <DollarSign className="w-4 h-4 text-emerald-500" />;
      case 'Clock':
        return <Clock className="w-4 h-4 text-purple-500" />;
      default:
        return <Utensils className="w-4 h-4 text-lime-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-lime-500 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-lime-500/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">{productName}</h2>
                <span className="px-2.5 py-0.5 bg-lime-100 text-lime-800 rounded-full text-xs font-bold">
                  Spreadsheet Analysis
                </span>
                {analysis?.totalReviews > 0 && (
                  <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold">
                    {analysis.totalReviews} Reviews
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                AI Deep Dive: Paired Themes, Good/Bad Percentages & Nonsense/Fake Review Detection
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="px-6 border-b border-slate-100 flex flex-wrap gap-2 bg-white pt-2">
          <button
            onClick={() => setActiveTab('paired')}
            className={`px-4 py-3 text-xs md:text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'paired'
                ? 'border-lime-500 text-lime-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Repetitive Good & Bad (By Category)</span>
          </button>

          <button
            onClick={() => setActiveTab('percentages')}
            className={`px-4 py-3 text-xs md:text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'percentages'
                ? 'border-lime-500 text-lime-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Percent className="w-4 h-4" />
            <span>Good vs Bad Percentages</span>
          </button>

          <button
            onClick={() => setActiveTab('fake-detection')}
            className={`px-4 py-3 text-xs md:text-sm font-bold border-b-2 flex items-center gap-2 transition-all relative ${
              activeTab === 'fake-detection'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-red-500" />
            <span>Fake & Nonsense Detection</span>
            {analysis?.qualityAnalysis?.totalFlagged > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] bg-red-100 text-red-700 font-bold rounded-full">
                {analysis.qualityAnalysis.totalFlagged}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-4 py-3 text-xs md:text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'reviews'
                ? 'border-lime-500 text-lime-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Raw Reviews ({analysis?.totalReviews || 0})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {loading && (
            <div className="py-24 text-center space-y-3">
              <RefreshCw className="w-9 h-9 text-lime-500 animate-spin mx-auto" />
              <p className="text-slate-700 font-bold text-base">Running AI Analysis on {productName}...</p>
              <p className="text-xs text-slate-400">Classifying good & bad themes, computing sentiment ratio, and scanning for fake/nonsense reviews...</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center gap-3 text-sm">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!loading && analysis && analysis.totalReviews === 0 && (
            <div className="py-16 text-center space-y-3">
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-700">No Uploaded Reviews Found</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                No reviews have been uploaded for {productName} yet. Upload a CSV or Excel spreadsheet to generate insights.
              </p>
            </div>
          )}

          {!loading && analysis && analysis.totalReviews > 0 && (
            <>
              {/* AI Summary Banner */}
              <div className="p-4 bg-gradient-to-r from-lime-50/80 via-emerald-50/50 to-white rounded-2xl border border-lime-200/80 shadow-sm flex items-start gap-3">
                <div className="p-2 rounded-xl bg-lime-500 text-white shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-lime-900 uppercase tracking-wider">AI Executive Synthesis</h4>
                  <p className="text-xs md:text-sm text-slate-800 font-medium leading-relaxed mt-0.5">
                    {analysis.aiSummary}
                  </p>
                </div>
              </div>

              {/* TAB 1: REPETITIVE GOOD & BAD UNDER THE SAME TYPE */}
              {activeTab === 'paired' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <span>Side-by-Side Category Analysis</span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        Comparing repetitive praises vs recurring complaints under matching categories (Taste, Packaging, Temperature, Portion & Delivery).
                      </p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    {analysis.pairedTypeAnalysis && analysis.pairedTypeAnalysis.length > 0 ? (
                      analysis.pairedTypeAnalysis.map((aspect: any) => (
                        <div key={aspect.id} className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 space-y-4">
                          {/* Aspect Header */}
                          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
                            <div className="flex items-center gap-2.5">
                              <div className="p-2 bg-white rounded-xl shadow-xs border border-slate-200">
                                {renderAspectIcon(aspect.icon)}
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-slate-900">{aspect.category}</h4>
                                <span className="text-[11px] text-slate-500">
                                  {aspect.positiveCount + aspect.negativeCount} total category mentions
                                </span>
                              </div>
                            </div>

                            {/* Aspect Sentiment Meter */}
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <span className="text-xs font-bold text-slate-700 block">{aspect.sentimentScore}% Satisfaction</span>
                                <span className="text-[10px] text-slate-400">
                                  {aspect.positiveCount} Good vs {aspect.negativeCount} Bad
                                </span>
                              </div>
                              <div className="w-24 h-2.5 bg-slate-200 rounded-full overflow-hidden flex">
                                <div
                                  className="bg-emerald-500 h-full transition-all"
                                  style={{ width: `${aspect.sentimentScore}%` }}
                                />
                                <div
                                  className="bg-red-400 h-full transition-all"
                                  style={{ width: `${100 - aspect.sentimentScore}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Side-by-Side Good vs Bad Cards */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Good Points Column */}
                            <div className="bg-emerald-50/40 border border-emerald-100 rounded-xl p-4 space-y-2.5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 uppercase tracking-wide">
                                  <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
                                  Repetitive Praises ({aspect.positiveCount})
                                </span>
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                                  Good Feedback
                                </span>
                              </div>

                              {aspect.goodPoints.length === 0 ? (
                                <p className="text-xs text-slate-400 italic py-2">No repetitive positive points mentioned in this category</p>
                              ) : (
                                <div className="space-y-2">
                                  {aspect.goodPoints.map((gp: any, idx: number) => (
                                    <div key={idx} className="bg-white/90 p-2.5 rounded-lg border border-emerald-100/80 space-y-1">
                                      <div className="flex items-center justify-between text-xs">
                                        <span className="font-semibold text-slate-800">{gp.point}</span>
                                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                          {gp.count}x
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-slate-600 italic">
                                        "{gp.quote}"
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Bad Points Column */}
                            <div className="bg-red-50/40 border border-red-100 rounded-xl p-4 space-y-2.5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-red-800 flex items-center gap-1.5 uppercase tracking-wide">
                                  <ThumbsDown className="w-3.5 h-3.5 text-red-600" />
                                  Recurring Complaints ({aspect.negativeCount})
                                </span>
                                <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-[10px] font-bold">
                                  Needs Attention
                                </span>
                              </div>

                              {aspect.badPoints.length === 0 ? (
                                <p className="text-xs text-emerald-700 font-medium py-2 flex items-center gap-1.5">
                                  <Check className="w-3.5 h-3.5 text-emerald-500" /> Zero customer complaints in this category!
                                </p>
                              ) : (
                                <div className="space-y-2">
                                  {aspect.badPoints.map((bp: any, idx: number) => (
                                    <div key={idx} className="bg-white/90 p-2.5 rounded-lg border border-red-100/80 space-y-1">
                                      <div className="flex items-center justify-between text-xs">
                                        <span className="font-semibold text-slate-800">{bp.point}</span>
                                        <span className="text-[10px] font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded">
                                          {bp.count}x
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-slate-600 italic">
                                        "{bp.quote}"
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 italic text-center py-6">
                        No category breakdown available yet.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: PERCENTAGE OF GOOD AND BAD REVIEWS */}
              {activeTab === 'percentages' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Good vs Bad Sentiment Percentages</h3>
                    <p className="text-xs text-slate-500">
                      Calculated percentage breakdown across all imported customer reviews for {productName}.
                    </p>
                  </div>

                  {/* Primary 3-Metric Sentiment Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Good / Positive */}
                    <div className="p-5 bg-gradient-to-br from-emerald-50 to-white border border-emerald-200 rounded-2xl shadow-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                          <ThumbsUp className="w-4 h-4 text-emerald-600" /> Good Reviews
                        </span>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-black">
                          {analysis.positivePercentage}%
                        </span>
                      </div>
                      <div className="text-3xl font-black text-emerald-700">{analysis.positivePercentage}%</div>
                      <p className="text-xs text-emerald-900/70">
                        {analysis.positiveCount} of {analysis.totalReviews} total customer ratings
                      </p>
                      <div className="w-full bg-emerald-100 h-2 rounded-full overflow-hidden mt-2">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${analysis.positivePercentage}%` }} />
                      </div>
                    </div>

                    {/* Bad / Negative */}
                    <div className="p-5 bg-gradient-to-br from-red-50 to-white border border-red-200 rounded-2xl shadow-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-red-800 uppercase tracking-wider flex items-center gap-1.5">
                          <ThumbsDown className="w-4 h-4 text-red-600" /> Bad Reviews
                        </span>
                        <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-xs font-black">
                          {analysis.negativePercentage}%
                        </span>
                      </div>
                      <div className="text-3xl font-black text-red-700">{analysis.negativePercentage}%</div>
                      <p className="text-xs text-red-900/70">
                        {analysis.negativeCount} of {analysis.totalReviews} total customer ratings
                      </p>
                      <div className="w-full bg-red-100 h-2 rounded-full overflow-hidden mt-2">
                        <div className="bg-red-500 h-full rounded-full" style={{ width: `${analysis.negativePercentage}%` }} />
                      </div>
                    </div>

                    {/* Neutral / Mixed */}
                    <div className="p-5 bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-2xl shadow-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          <Tag className="w-4 h-4 text-slate-500" /> Neutral / Mixed
                        </span>
                        <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full text-xs font-black">
                          {analysis.neutralPercentage}%
                        </span>
                      </div>
                      <div className="text-3xl font-black text-slate-700">{analysis.neutralPercentage}%</div>
                      <p className="text-xs text-slate-500">
                        {analysis.neutralCount} of {analysis.totalReviews} total customer ratings
                      </p>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-2">
                        <div className="bg-slate-400 h-full rounded-full" style={{ width: `${analysis.neutralPercentage}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Combined Visual Distribution Bar */}
                  <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span>Sentiment Distribution Ratio</span>
                      <span>Total: {analysis.totalReviews} Reviews</span>
                    </div>
                    <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                      <div
                        className="bg-emerald-500 h-full transition-all"
                        style={{ width: `${analysis.positivePercentage}%` }}
                        title={`Good: ${analysis.positivePercentage}%`}
                      />
                      <div
                        className="bg-slate-300 h-full transition-all"
                        style={{ width: `${analysis.neutralPercentage}%` }}
                        title={`Neutral: ${analysis.neutralPercentage}%`}
                      />
                      <div
                        className="bg-red-500 h-full transition-all"
                        style={{ width: `${analysis.negativePercentage}%` }}
                        title={`Bad: ${analysis.negativePercentage}%`}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Good ({analysis.positivePercentage}%)
                      </span>
                      <span className="flex items-center gap-1 text-slate-500 font-semibold">
                        <span className="w-2 h-2 rounded-full bg-slate-400"></span> Neutral ({analysis.neutralPercentage}%)
                      </span>
                      <span className="flex items-center gap-1 text-red-700 font-semibold">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span> Bad ({analysis.negativePercentage}%)
                      </span>
                    </div>
                  </div>

                  {/* Star Rating Breakdown & Action Opportunities */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* 5-Star Distribution */}
                    <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                          <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> Star Rating Distribution
                        </h4>
                        <span className="text-xs font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          Avg: {analysis.averageRating ? `${analysis.averageRating} ★` : 'N/A'}
                        </span>
                      </div>

                      {analysis.ratingDistribution ? (
                        <div className="space-y-2 pt-1">
                          {[5, 4, 3, 2, 1].map(stars => {
                            const data = analysis.ratingDistribution[stars.toString()] || { count: 0, percentage: 0 };
                            return (
                              <div key={stars} className="flex items-center gap-3 text-xs">
                                <span className="w-8 font-semibold text-slate-600">{stars} ★</span>
                                <div className="flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      stars >= 4 ? 'bg-emerald-500' : stars === 3 ? 'bg-amber-400' : 'bg-red-400'
                                    }`}
                                    style={{ width: `${data.percentage}%` }}
                                  />
                                </div>
                                <span className="w-12 text-right text-slate-500 font-medium">
                                  {data.percentage}% ({data.count})
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>

                    {/* Actionable Opportunities */}
                    <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-cyan-600" /> Actionable Opportunities
                      </h4>
                      <ul className="space-y-2.5">
                        {analysis.improvementOpportunities.slice(0, 4).map((opp: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200/80">
                            <CheckCircle className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                            <span>{opp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: FAKE AND DUPLICATE REVIEWS DETECTION */}
              {activeTab === 'fake-detection' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <span>Fake & Duplicate Review Detection</span>
                      <span className="text-xs px-2.5 py-0.5 bg-red-100 text-red-700 font-bold rounded-full">
                        AI Quality Filter
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Identifies reviews that don't make sense: nonsense/gibberish text, repeated words, identical duplicates, and score-text contradictions.
                    </p>
                  </div>

                  {/* Authenticity Score Banner */}
                  <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl shadow-lg flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
                          Review Authenticity Health
                        </span>
                        <div className="text-2xl font-black text-white">
                          {analysis.qualityAnalysis?.authenticityScore ?? 100}% Authentic
                        </div>
                        <span className="text-xs text-slate-300">
                          {analysis.totalReviews - (analysis.qualityAnalysis?.totalFlagged || 0)} of {analysis.totalReviews} reviews verified as genuine
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                      <div className="bg-white/10 px-3 py-2 rounded-xl">
                        <span className="text-slate-400 block text-[10px]">Duplicates</span>
                        <span className="text-base font-bold text-amber-300">
                          {analysis.qualityAnalysis?.duplicateCount || 0}
                        </span>
                      </div>
                      <div className="bg-white/10 px-3 py-2 rounded-xl">
                        <span className="text-slate-400 block text-[10px]">Nonsense / Gibberish</span>
                        <span className="text-base font-bold text-red-300">
                          {analysis.qualityAnalysis?.nonsenseCount || 0}
                        </span>
                      </div>
                      <div className="bg-white/10 px-3 py-2 rounded-xl">
                        <span className="text-slate-400 block text-[10px]">Contradictions</span>
                        <span className="text-base font-bold text-orange-300">
                          {analysis.qualityAnalysis?.contradictionCount || 0}
                        </span>
                      </div>
                      <div className="bg-white/10 px-3 py-2 rounded-xl">
                        <span className="text-slate-400 block text-[10px]">Spam / Links</span>
                        <span className="text-base font-bold text-purple-300">
                          {analysis.qualityAnalysis?.spamCount || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Flagged List */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                      Flagged Suspicious Reviews ({analysis.qualityAnalysis?.totalFlagged || 0})
                    </h4>

                    {(!analysis.qualityAnalysis?.flaggedReviews || analysis.qualityAnalysis.flaggedReviews.length === 0) ? (
                      <div className="p-8 text-center bg-emerald-50/50 border border-emerald-200/80 rounded-2xl space-y-2">
                        <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
                        <h4 className="text-sm font-bold text-emerald-900">100% Clean Customer Feedback</h4>
                        <p className="text-xs text-emerald-700 max-w-md mx-auto">
                          No duplicate copy-pastes, nonsense gibberish, or rating-text contradictions were detected for {productName}. All uploaded reviews appear legitimate.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {analysis.qualityAnalysis.flaggedReviews.map((flagged: any, i: number) => (
                          <div key={flagged.id || i} className="p-4 bg-white border border-red-200/90 rounded-2xl shadow-xs space-y-2.5">
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  flagged.issueType === 'gibberish' ? 'bg-red-100 text-red-800' :
                                  flagged.issueType === 'duplicate' ? 'bg-amber-100 text-amber-800' :
                                  flagged.issueType === 'mismatch' ? 'bg-orange-100 text-orange-800' : 'bg-purple-100 text-purple-800'
                                }`}>
                                  {flagged.reason}
                                </span>
                                {flagged.rating !== null && (
                                  <span className="font-bold text-amber-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                                    {flagged.rating} ★
                                  </span>
                                )}
                                <span className="text-slate-400 text-[11px]">{flagged.platform || 'Spreadsheet'}</span>
                              </div>
                              <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider">
                                Severity: {flagged.severity}
                              </span>
                            </div>

                            <p className="text-sm text-slate-800 font-semibold bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                              "{flagged.customerReview}"
                            </p>

                            <div className="flex items-start gap-2 text-xs text-slate-600 bg-red-50/50 p-2.5 rounded-xl border border-red-100">
                              <AlertOctagon className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                              <span>{flagged.explanation}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: RAW REVIEWS */}
              {activeTab === 'reviews' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Imported Spreadsheet Reviews</h3>
                      <p className="text-xs text-slate-500">
                        All individual customer reviews uploaded for {productName}.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {analysis.sampleReviews.map((r: any, idx: number) => (
                      <div key={r.id || idx} className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] font-bold">
                              {r.platform || 'Spreadsheet'}
                            </span>
                            {r.rating && (
                              <span className="text-amber-500 font-bold">{r.rating} ★</span>
                            )}
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              r.sentiment === 'positive' ? 'bg-emerald-100 text-emerald-800' :
                              r.sentiment === 'negative' ? 'bg-red-100 text-red-800' : 'bg-slate-200 text-slate-700'
                            }`}>
                              {r.sentiment.toUpperCase()}
                            </span>
                          </div>
                          <span className="text-slate-400 text-[11px]">{r.reviewDate}</span>
                        </div>
                        <p className="text-sm text-slate-800 font-medium">"{r.customerReview}"</p>
                        {r.theme && (
                          <div className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Tag className="w-3 h-3 text-slate-400" />
                            <span>Theme: {r.theme}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            SellSense AI Review Engine • Instant Spreadsheet Analysis
          </span>
          <Button onClick={onClose} className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl">
            Close Analysis
          </Button>
        </div>

      </div>
    </div>
  );
};
