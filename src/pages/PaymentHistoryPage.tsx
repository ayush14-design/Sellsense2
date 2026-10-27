import React, { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import { backendApi } from '../services/backendApi';
import { CreditCard, FileText, CheckCircle, XCircle, AlertCircle, Loader2, Clock, Eye, Download, RefreshCw, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

export const PaymentHistoryPage: React.FC = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [filters, setFilters] = useState({ status: '', search: '' });

  useEffect(() => {
    fetchPayments();
  }, [pagination.page, filters.status, filters.search]);

  const fetchPayments = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await backendApi.getPaymentHistory();
      setPayments(res.payments || []);
      setPagination(p => ({ ...p, total: res.payments?.length || 0 }));
    } catch (err: any) {
      setError(err.message || 'Failed to load payment history');
      console.error('Payment history fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
      pending_submission: {
        label: 'Pending Submission',
        className: 'bg-blue-100 text-blue-700',
        icon: <Clock className="w-4 h-4" />
      },
      pending_verification: {
        label: 'Pending Verification',
        className: 'bg-yellow-100 text-yellow-700',
        icon: <Clock className="w-4 h-4" />
      },
      approved: {
        label: 'Approved',
        className: 'bg-green-100 text-green-700',
        icon: <CheckCircle className="w-4 h-4" />
      },
      rejected: {
        label: 'Rejected',
        className: 'bg-red-100 text-red-700',
        icon: <XCircle className="w-4 h-4" />
      },
      needs_correction: {
        label: 'Needs Correction',
        className: 'bg-orange-100 text-orange-700',
        icon: <AlertCircle className="w-4 h-4" />
      },
      cancelled: {
        label: 'Cancelled',
        className: 'bg-gray-100 text-gray-700',
        icon: <XCircle className="w-4 h-4" />
      },
    };
    return configs[status] || { label: status, className: 'bg-gray-100 text-gray-700', icon: <FileText className="w-4 h-4" /> };
  };

  const handleRetry = async (paymentId: string) => {
    if (!confirm('Resubmit this payment for verification?')) return;
    try {
      await backendApi.adminAction(`payments/${paymentId}/retry`, {});
      fetchPayments();
    } catch (err) {
      alert('Failed to resubmit payment');
    }
  };

  const handleViewDetails = (payment: any) => {
    alert(`
Payment Details:
- Plan: ${payment.plan_name}
- Restaurant: ${payment.restaurant_name}
- Amount: ${formatPrice(payment.amount_inr)}
- Transaction Ref: ${payment.transaction_reference}
- Payment Date: ${formatDate(payment.payment_date)}
- Submitted: ${formatDate(payment.submitted_at)}
- Status: ${getStatusConfig(payment.status).label}
- Admin Note: ${payment.admin_note || '—'}
- Notes: ${payment.notes || '—'}
    `);
  };

  if (loading && payments.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-lime-500 animate-spin" />
          <p className="text-slate-600">Loading payment history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-slate-900 mb-2">Payment History</h1>
          <p className="text-lg text-slate-600">Track all your payment submissions and their verification status</p>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <Button variant="ghost" size="small" onClick={fetchPayments}>
              <RefreshCw className="w-4 h-4 mr-1" /> Retry
            </Button>
          </motion.div>
        )}

        {/* Filters */}
        <div className="glass rounded-2xl p-4 border border-white/50 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex gap-3">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(f => ({ ...f, status: e.target.value, page: 1 }))}
                  className="pl-10 pr-10 py-2.5 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-lime-500 text-sm appearance-none"
                >
                  <option value="">All Status</option>
                  <option value="pending_submission">Pending Submission</option>
                  <option value="pending_verification">Pending Verification</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="needs_correction">Needs Correction</option>
                </select>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by transaction ref, plan, restaurant..."
                  value={filters.search}
                  onChange={(e) => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))}
                  className="pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-lime-500 text-sm w-64"
                />
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
            </div>
            <Button variant="ghost" size="small" onClick={fetchPayments}>
              <RefreshCw className="w-4 h-4 mr-1" /> Refresh
            </Button>
          </div>
        </div>

        {/* Payments Table */}
        <div className="glass rounded-2xl border border-white/50 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 text-lime-500 animate-spin mx-auto mb-3" />
              <p className="text-slate-500">Loading payments...</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="p-12 text-center">
              <CreditCard className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No payments found</h3>
              <p className="text-slate-500 mb-6">Start by purchasing a plan</p>
              <Button onClick={() => window.location.href = '/pricing'} className="bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-600 hover:to-lime-700">
                <CreditCard className="w-4 h-4 mr-2" />
                Browse Plans
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Plan</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Restaurant</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Transaction Ref</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Payment Date</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Submitted</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {payments.map((payment, idx) => (
                      <motion.tr
                        key={payment.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className="hover:bg-slate-50"
                      >
                        <td className="px-6 py-4">
                          <p className="font-medium text-slate-900">{payment.plan_name}</p>
                          <p className="text-xs text-slate-500">{payment.plan_duration_days} days</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-slate-900">{payment.restaurant_name}</p>
                          <p className="text-xs text-slate-500">{payment.restaurant_city}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900">{formatPrice(payment.amount_inr)}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm text-slate-600">{payment.transaction_reference}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-500">{formatDate(payment.payment_date)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-500">{formatDate(payment.submitted_at)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusConfig(payment.status).className}`}>
                              {getStatusConfig(payment.status).icon}
                              {getStatusConfig(payment.status).label}
                            </span>
                            {payment.verified_at && (
                              <span className="text-xs text-slate-400">Verified: {formatDate(payment.verified_at).split(',')[0]}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="small" onClick={() => handleViewDetails(payment)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            {payment.screenshot_path && (
                              <Button variant="ghost" size="small" onClick={() => window.open(payment.screenshot_path, '_blank')}>
                                <Download className="w-4 h-4" />
                              </Button>
                            )}
                            {payment.status === 'rejected' && (
                              <Button variant="ghost" size="small" className="text-orange-600 hover:bg-orange-50" onClick={() => handleRetry(payment.id)}>
                                <RefreshCw className="w-4 h-4" />
                              </Button>
                            )}
                            {payment.status === 'needs_correction' && (
                              <Button variant="ghost" size="small" className="text-blue-600 hover:bg-blue-50" onClick={() => handleRetry(payment.id)}>
                                <RefreshCw className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.total > pagination.limit && (
                <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                  <div className="text-sm text-slate-600">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="small"
                      onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                      disabled={pagination.page === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    {Array.from({ length: Math.min(Math.ceil(pagination.total / pagination.limit), 5) }, (_, i) => {
                      const totalPages = Math.ceil(pagination.total / pagination.limit);
                      let pageNum;
                      if (totalPages <= 5) pageNum = i + 1;
                      else if (pagination.page <= 3) pageNum = i + 1;
                      else if (pagination.page >= totalPages - 2) pageNum = totalPages - 4 + i;
                      else pageNum = pagination.page - 2 + i;
                      return (
                        <Button
                          key={pageNum}
                          variant={pagination.page === pageNum ? 'primary' : 'ghost'}
                          size="small"
                          onClick={() => setPagination(p => ({ ...p, page: pageNum }))}
                          className="w-8 h-8"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    <Button
                      variant="ghost"
                      size="small"
                      onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                      disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentHistoryPage;
