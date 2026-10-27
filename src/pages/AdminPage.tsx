import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { backendApi } from '../services/backendApi';
import { authStorage } from '../utils/auth';
import {
  Users, Activity, BarChart3, Crown, Briefcase, CreditCard,
  Package, Zap, Bell, Trash2, Edit, Plus,
  Menu, X, LogOut, Eye, CheckCircle, AlertCircle, Loader2, ChevronRight,
  Calendar, DollarSign, TrendingUp, Archive, Key,
  ChevronLeft, PauseCircle, PlayCircle, RotateCcw, XCircle, ShieldCheck,
  Sparkles, Clock, Lock, Check, UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type AdminTab =
  | 'overview'
  | 'users'
  | 'payments'
  | 'subscriptions'
  | 'plans'
  | 'addons'
  | 'features'
  | 'restaurants'
  | 'activity'
  | 'notifications';

interface TabConfig {
  id: AdminTab;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  count?: number;
}

const TABS: TabConfig[] = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'subscriptions', label: 'Subscriptions', icon: Package },
  { id: 'plans', label: 'Plans', icon: Crown },
  { id: 'addons', label: 'Add-ons', icon: Zap },
  { id: 'features', label: 'Features', icon: ShieldCheck },
  { id: 'restaurants', label: 'Restaurants', icon: Briefcase },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'notifications', label: 'Notifications', icon: Bell },
];

export const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Data states
  const [overview, setOverview] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [addons, setAddons] = useState<any[]>([]);
  const [features, setFeatures] = useState<any[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Pagination & filters
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [filters, setFilters] = useState({ search: '', status: '', role: '' });

  const currentUser = authStorage.getUser();

  const [loadedTabs, setLoadedTabs] = useState<Record<string, boolean>>({});

  // Check admin access
  useEffect(() => {
    const isAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'admin' || currentUser?.email === 'admin@sellsense.ai';
    if (!currentUser || !isAdmin) {
      navigate('/login');
    } else {
      loadTabData(activeTab);
    }
  }, [currentUser, navigate, activeTab]);

  const getFallbackDataForTab = (tab: AdminTab): any => {
    switch (tab) {
      case 'overview': {
        const defaultStats = {
          totalUsers: 0,
          activeUsers: 0,
          totalRestaurants: 0,
          activeRestaurants: 0,
          totalSubscriptions: 0,
          activeSubscriptions: 0,
          expiredSubscriptions: 0,
          suspendedSubscriptions: 0,
          pendingPayments: 0,
          totalRevenue: 0,
          monthlyRevenue: 0,
        };
        return {
          ...defaultStats,
          stats: defaultStats,
          recentUsers: [],
          recentPayments: [],
          expiringSubscriptions: [],
          systemHealth: { status: 'healthy', activeSessions: 1, errorRate: 0, uptimeHours: 24 }
        };
      }
      case 'users':
        return {
          users: [],
          total: 0
        };
      case 'payments': {
        const localSubs = JSON.parse(localStorage.getItem('sellsense_payment_submissions') || '[]');
        return {
          payments: localSubs,
          total: localSubs.length
        };
      }
      case 'subscriptions':
        return {
          subscriptions: [],
          total: 0
        };
      case 'plans':
        return {
          plans: []
        };
      case 'addons':
        return {
          addons: []
        };
      case 'features':
        return {
          features: []
        };
      case 'restaurants':
        return {
          restaurants: [],
          total: 0
        };
      case 'activity':
        return {
          logs: [],
          total: 0
        };
      case 'notifications':
        return {
          notifications: [],
          total: 0
        };
      default:
        return null;
    }
  };

  const loadTabData = async (tab: AdminTab, force = false) => {
    if (!loadedTabs[tab] || force) {
      setLoading(true);
    }
    setError('');
    try {
      switch (tab) {
        case 'overview': {
          try {
            const ov = await backendApi.getAdminOverview();
            setOverview(ov);
          } catch (e) {
            setOverview(getFallbackDataForTab('overview'));
          }
          break;
        }
        case 'users': {
          try {
            const usersRes = await backendApi.getAdminUsers({
              page: pagination.page,
              limit: pagination.limit,
              search: filters.search,
              role: filters.role,
              status: filters.status,
            });
            setUsers(usersRes.users || []);
            setPagination(p => ({ ...p, total: usersRes.total || 0 }));
          } catch (e) {
            const fb = getFallbackDataForTab('users');
            setUsers(fb.users);
            setPagination(p => ({ ...p, total: fb.total }));
          }
          break;
        }
        case 'payments': {
          try {
            const paymentsRes = await backendApi.getAdminPayments({
              page: pagination.page,
              limit: pagination.limit,
              status: filters.status,
              search: filters.search,
            });
            setPayments(paymentsRes.payments || []);
            setPagination(p => ({ ...p, total: paymentsRes.total || 0 }));
          } catch (e) {
            const fb = getFallbackDataForTab('payments');
            setPayments(fb.payments);
            setPagination(p => ({ ...p, total: fb.total }));
          }
          break;
        }
        case 'subscriptions': {
          try {
            const subsRes = await backendApi.getAdminSubscriptions({
              page: pagination.page,
              limit: pagination.limit,
              status: filters.status,
              search: filters.search,
            });
            setSubscriptions(subsRes.subscriptions || []);
            setPagination(p => ({ ...p, total: subsRes.total || 0 }));
          } catch (e) {
            const fb = getFallbackDataForTab('subscriptions');
            setSubscriptions(fb.subscriptions);
            setPagination(p => ({ ...p, total: fb.total }));
          }
          break;
        }
        case 'plans': {
          try {
            const plansRes = await backendApi.getAdminPlans();
            setPlans(plansRes.plans || []);
          } catch (e) {
            setPlans(getFallbackDataForTab('plans').plans);
          }
          break;
        }
        case 'addons': {
          try {
            const addonsRes = await backendApi.getAdminAddons();
            setAddons(addonsRes.addons || []);
          } catch (e) {
            setAddons(getFallbackDataForTab('addons').addons);
          }
          break;
        }
        case 'features': {
          try {
            const featuresRes = await backendApi.getAdminFeatures();
            setFeatures(featuresRes.features || []);
          } catch (e) {
            setFeatures(getFallbackDataForTab('features').features);
          }
          break;
        }
        case 'restaurants': {
          try {
            const restsRes = await backendApi.getAdminRestaurants({
              page: pagination.page,
              limit: pagination.limit,
              search: filters.search,
              status: filters.status,
            });
            setRestaurants(restsRes.restaurants || []);
            setPagination(p => ({ ...p, total: restsRes.total || 0 }));
          } catch (e) {
            const fb = getFallbackDataForTab('restaurants');
            setRestaurants(fb.restaurants);
            setPagination(p => ({ ...p, total: fb.total }));
          }
          break;
        }
        case 'activity': {
          try {
            const actRes = await backendApi.getAdminActivity({
              page: pagination.page,
              limit: 50,
            });
            setActivity(actRes.logs || []);
            setPagination(p => ({ ...p, total: actRes.total || 0 }));
          } catch (e) {
            const fb = getFallbackDataForTab('activity');
            setActivity(fb.logs);
            setPagination(p => ({ ...p, total: fb.total }));
          }
          break;
        }
        case 'notifications': {
          try {
            const notifRes = await backendApi.getAdminNotifications({
              page: pagination.page,
              limit: pagination.limit,
            });
            setNotifications(notifRes.notifications || []);
            setPagination(p => ({ ...p, total: notifRes.total || 0 }));
          } catch (e) {
            const fb = getFallbackDataForTab('notifications');
            setNotifications(fb.notifications);
            setPagination(p => ({ ...p, total: fb.total }));
          }
          break;
        }
      }
      setLoadedTabs(prev => ({ ...prev, [tab]: true }));
    } catch (err: any) {
      console.warn(`Load ${tab} error:`, err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => loadTabData(activeTab);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const styles: Record<string, string> = {
      active: 'bg-green-100 text-green-700',
      inactive: 'bg-gray-100 text-gray-700',
      pending: 'bg-yellow-100 text-yellow-700',
      pending_submission: 'bg-blue-100 text-blue-700',
      pending_verification: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      needs_correction: 'bg-orange-100 text-orange-700',
      expired: 'bg-gray-100 text-gray-700',
      suspended: 'bg-red-100 text-red-700',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
        {status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </span>
    );
  };

  const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
    const styles: Record<string, string> = {
      super_admin: 'bg-purple-100 text-purple-700',
      admin: 'bg-blue-100 text-blue-700',
      manager: 'bg-green-100 text-green-700',
      viewer: 'bg-gray-100 text-gray-700',
      restaurant_owner: 'bg-lime-100 text-lime-700',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[role] || 'bg-gray-100 text-gray-700'}`}>
        {role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </span>
    );
  };

  // Render tab content based on activeTab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'users':
        return renderUsersTab();
      case 'payments':
        return renderPaymentsTab();
      case 'subscriptions':
        return renderSubscriptionsTab();
      case 'plans':
        return renderPlansTab();
      case 'addons':
        return renderAddonsTab();
      case 'features':
        return renderFeaturesTab();
      case 'restaurants':
        return renderRestaurantsTab();
      case 'activity':
        return renderActivityTab();
      case 'notifications':
        return renderNotificationsTab();
      default:
        return null;
    }
  };

  const renderOverview = () => {
    if (!overview) return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-lime-500 animate-spin" />
      </div>
    );

    const stats = overview.stats || overview || {};
    const parseNum = (val: any, fallback = 0): number => {
      if (val === null || val === undefined) return fallback;
      if (typeof val === 'number') return val;
      if (typeof val === 'object') return val.count ?? val.total ?? fallback;
      const parsed = Number(val);
      return isNaN(parsed) ? fallback : parsed;
    };

    const statCards = [
      { label: 'Total Users', value: parseNum(stats.totalUsers, 0), icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
      { label: 'Active Users', value: parseNum(stats.activeUsers, 0), icon: Users, color: 'text-green-500', bg: 'bg-green-50' },
      { label: 'Restaurants', value: parseNum(stats.totalRestaurants, 0), icon: Briefcase, color: 'text-purple-500', bg: 'bg-purple-50' },
      { label: 'Active Subscriptions', value: parseNum(stats.activeSubscriptions, 0), icon: Package, color: 'text-lime-500', bg: 'bg-lime-50' },
      { label: 'Pending Payments', value: parseNum(stats.pendingPayments, 0), icon: CreditCard, color: 'text-yellow-500', bg: 'bg-yellow-50' },
      { label: 'Total Revenue', value: formatCurrency(parseNum(stats.totalRevenue, 0)), icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-50' },
      { label: 'Monthly Revenue', value: formatCurrency(parseNum(stats.monthlyRevenue, 0)), icon: TrendingUp, color: 'text-cyan-500', bg: 'bg-cyan-50' },
      { label: 'Expiring Soon', value: overview.expiringSubscriptions?.length || 0, icon: Calendar, color: 'text-orange-500', bg: 'bg-orange-50' },
    ];

    return (
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`glass rounded-2xl p-6 border border-white/50 ${stat.bg}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">{stat.label}</p>
                  <p className="text-3xl font-black text-slate-900 mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Recent Activity & Expiring */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Payments */}
          <div className="glass rounded-2xl p-6 border border-white/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Recent Payments</h3>
              <Button variant="ghost" size="small" onClick={() => setActiveTab('payments')}>
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <div className="space-y-3">
              {overview.recentPayments?.length === 0 ? (
                <p className="text-slate-500 text-center py-4">No recent payments</p>
              ) : (
                overview.recentPayments?.slice(0, 5).map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-lime-100 rounded-lg flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-lime-500" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{p.user_name}</p>
                        <p className="text-sm text-slate-500">{p.restaurant_name} • {p.plan_name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">{formatCurrency(p.amount_inr)}</p>
                      <StatusBadge status={p.status} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Expiring Subscriptions */}
          <div className="glass rounded-2xl p-6 border border-white/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Expiring Soon</h3>
              <Button variant="ghost" size="small" onClick={() => setActiveTab('subscriptions')}>
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <div className="space-y-3">
              {overview.expiringSubscriptions?.length === 0 ? (
                <p className="text-slate-500 text-center py-4">No subscriptions expiring soon</p>
              ) : (
                overview.expiringSubscriptions?.slice(0, 5).map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-orange-500" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{s.user_name}</p>
                        <p className="text-sm text-slate-500">{s.restaurant_name} • {s.plan_name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-orange-600">{formatDate(s.expires_at).split(',')[0]}</p>
                      <span className="text-xs text-slate-500">
                        {Math.ceil((new Date(s.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days left
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Users */}
          <div className="glass rounded-2xl p-6 border border-white/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Recent Users</h3>
              <Button variant="ghost" size="small" onClick={() => setActiveTab('users')}>
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <div className="space-y-3">
              {overview.recentUsers?.length === 0 ? (
                <p className="text-slate-500 text-center py-4">No recent users</p>
              ) : (
                overview.recentUsers?.slice(0, 5).map((u: any) => (
                  <div key={u.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{u.full_name}</p>
                        <p className="text-sm text-slate-500">{u.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <RoleBadge role={u.role} />
                      <p className="text-xs text-slate-500 mt-1">{formatDate(u.created_at)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass rounded-2xl p-6 border border-white/50">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Button variant="outline" onClick={() => setActiveTab('plans')} className="h-24 flex flex-col items-center gap-2">
                <Crown className="w-6 h-6" />
                Manage Plans
              </Button>
              <Button variant="outline" onClick={() => setActiveTab('addons')} className="h-24 flex flex-col items-center gap-2">
                <Zap className="w-6 h-6" />
                Manage Add-ons
              </Button>
              <Button variant="outline" onClick={() => setActiveTab('features')} className="h-24 flex flex-col items-center gap-2">
                <ShieldCheck className="w-6 h-6" />
                Feature Flags
              </Button>
              <Button variant="outline" onClick={() => setActiveTab('notifications')} className="h-24 flex flex-col items-center gap-2">
                <Bell className="w-6 h-6" />
                Send Notification
              </Button>
            </div>
          </div>
        </div>
      </div>
      );
    }

    const renderUsersTab = () => (
      <DataTable
        title="Users"
        subtitle={`${users.length} users${pagination.total > 0 ? ` • ${pagination.total} total` : ''}`}
        columns={[
          { key: 'user', header: 'User', render: (u: any) => (
            <div>
              <p className="font-medium text-slate-900">{u.full_name}</p>
              <p className="text-sm text-slate-500">{u.email}</p>
              {u.phone && <p className="text-xs text-slate-400">{u.phone}</p>}
            </div>
          )},
          { key: 'role', header: 'Role', render: (u: any) => <RoleBadge role={u.role} /> },
          { key: 'status', header: 'Status', render: (u: any) => <StatusBadge status={u.status || (u.is_active ? 'active' : 'inactive')} /> },
          { key: 'restaurants', header: 'Restaurants', render: (u: any) => (
            <span className="text-sm text-slate-500">{u.restaurant_count || 0}</span>
          )},
          { key: 'subscriptions', header: 'Active Subs', render: (u: any) => (
            <span className="text-sm text-slate-500">{u.active_subscriptions || 0}</span>
          )},
          { key: 'lastLogin', header: 'Last Login', render: (u: any) => <span className="text-sm text-slate-500">{formatDate(u.last_login_at)}</span> },
          { key: 'joined', header: 'Joined', render: (u: any) => <span className="text-sm text-slate-500">{formatDate(u.created_at)}</span> },
          { key: 'actions', header: 'Actions', render: (u: any) => (
            <div className="flex items-center justify-end gap-1.5">
              <Button
                variant="ghost"
                size="small"
                className="text-lime-600 hover:bg-lime-50"
                title="Grant Premium Features Permission"
                onClick={() => handleGrantUserPremium(u)}
              >
                <ShieldCheck className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="small" onClick={() => navigate(`/admin/users/${u.id}`)}>
                <Eye className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="small" className="text-red-600 hover:bg-red-50" onClick={() => handleDeleteUser(u.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )},
        ]}
        data={users}
        loading={loading}
        pagination={pagination}
        onPageChange={(page) => { setPagination(p => ({ ...p, page })); loadTabData('users'); }}
        onSearch={(search) => { setFilters(f => ({ ...f, search })); setPagination(p => ({ ...p, page: 1 })); loadTabData('users'); }}
        onFilterChange={(key, value) => { setFilters(f => ({ ...f, [key]: value })); setPagination(p => ({ ...p, page: 1 })); loadTabData('users'); }}
        filterOptions={{
          role: [
            { value: '', label: 'All Roles' },
            { value: 'restaurant_owner', label: 'Restaurant Owner' },
            { value: 'admin', label: 'Admin' },
            { value: 'manager', label: 'Manager' },
            { value: 'viewer', label: 'Viewer' },
          ],
          status: [
            { value: '', label: 'All Status' },
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
            { value: 'pending', label: 'Pending' },
          ]
        }}
      />
    );

    const renderPaymentsTab = () => {
      const pendingPayments = payments.filter((p: any) =>
        (p.status === 'pending_verification' || p.status === 'pending_submission') &&
        !p.has_active_subscription
      );

      return (
        <div className="space-y-6">
          {/* Pending Access Requests Banner */}
          {pendingPayments.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-5 text-white shadow-lg"
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black tracking-tight">
                      🔔 {pendingPayments.length} Access Request{pendingPayments.length > 1 ? 's' : ''} Awaiting Your Approval
                    </h3>
                    <p className="text-sm text-amber-50 mt-0.5">
                      Restaurant owners below have submitted payment proof and are waiting for premium feature access.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {pendingPayments.slice(0, 6).map((p: any) => (
                  <div key={p.id} className="bg-white/15 backdrop-blur rounded-xl p-3 border border-white/20 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-white text-sm truncate">{p.restaurant_owner_name || p.user_name || 'Owner'}</p>
                      <p className="text-xs text-amber-100 truncate">{p.restaurant_name} • {formatCurrency(p.amount_inr)}</p>
                      <p className="text-[11px] text-amber-200 truncate">Ref: {p.transaction_reference || '—'}</p>
                    </div>
                    <button
                      onClick={() => handleGrantPremium(p)}
                      className="flex-shrink-0 px-3 py-1.5 bg-white text-amber-800 rounded-lg text-xs font-black hover:bg-amber-50 transition shadow-sm flex items-center gap-1"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Grant Access
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Empty state when no payments at all */}
          {payments.length === 0 && !loading && (
            <div className="glass rounded-2xl p-12 border border-white/50 text-center">
              <CreditCard className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No Payment Requests Yet</h3>
              <p className="text-slate-500">Payment submissions from restaurant owners will appear here for your review and access approval.</p>
            </div>
          )}

          {/* Full payments data table */}
          {payments.length > 0 && (
            <DataTable
              title="Payments & Feature Permissions"
              subtitle={`${payments.length} payment requests${pagination.total > 0 ? ` • ${pagination.total} total` : ''}`}
              columns={[
                {
                  key: 'owner',
                  header: 'Owner & Restaurant',
                  render: (p: any) => (
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4 text-lime-600 flex-shrink-0" />
                        <span>{p.restaurant_owner_name || p.user_name || 'Owner'}</span>
                        <span className="text-[10px] font-black uppercase tracking-wider bg-lime-100 text-lime-800 px-1.5 py-0.5 rounded border border-lime-200">
                          Owner
                        </span>
                      </p>
                      <p className="text-xs font-semibold text-slate-700">{p.restaurant_name}</p>
                      <p className="text-[11px] text-slate-400">{p.user_email}</p>
                    </div>
                  ),
                },
                {
                  key: 'plan_amount',
                  header: 'Plan & Amount',
                  render: (p: any) => (
                    <div>
                      <p className="font-black text-slate-900 text-sm">{formatCurrency(p.amount_inr)}</p>
                      <p className="text-xs font-medium text-slate-600">{p.plan_name}</p>
                      <span className="font-mono text-[11px] text-slate-400">Ref: {p.transaction_reference}</span>
                    </div>
                  ),
                },
                {
                  key: 'payment_status',
                  header: 'Payment Status',
                  render: (p: any) => {
                    const isApproved = p.status === 'approved';
                    const isPending = p.status === 'pending_verification' || p.status === 'pending_submission';
                    return (
                      <div className="flex flex-col gap-1">
                        {isApproved ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            Payment Done: YES
                          </span>
                        ) : isPending ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            Payment Done: NO (Pending)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300">
                            <XCircle className="w-3.5 h-3.5 text-red-600" />
                            Payment Done: NO ({p.status})
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400">{formatDate(p.submitted_at)}</span>
                      </div>
                    );
                  },
                },
                {
                  key: 'feature_permission',
                  header: 'Feature Permission',
                  render: (p: any) => {
                    const hasPermission = p.status === 'approved' || p.has_active_subscription > 0;
                    return (
                      <div>
                        {hasPermission ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-lime-100 text-lime-900 border border-lime-300">
                              <Sparkles className="w-3.5 h-3.5 text-lime-600" />
                              Premium Unlocked
                            </span>
                            <span className="text-[11px] text-emerald-600 font-semibold">Permission Granted</span>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 border border-slate-300">
                              <Lock className="w-3.5 h-3.5 text-slate-500" />
                              Features Locked
                            </span>
                            <span className="text-[11px] text-amber-600 font-medium">Needs Admin Approval</span>
                          </div>
                        )}
                      </div>
                    );
                  },
                },
                {
                  key: 'actions',
                  header: 'Admin Permission & Action',
                  render: (p: any) => {
                    const hasPermission = p.status === 'approved' || p.has_active_subscription > 0;
                    return (
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {!hasPermission ? (
                          <Button
                            size="small"
                            className="bg-lime-400 hover:bg-lime-500 text-slate-950 font-black text-xs py-2 px-3.5 rounded-xl shadow-sm flex items-center gap-1.5 whitespace-nowrap"
                            onClick={() => handleGrantPremium(p)}
                          >
                            <ShieldCheck className="w-4 h-4" />
                            Give Permission & Unlock
                          </Button>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              Active
                            </span>
                            <Button
                              variant="ghost"
                              size="small"
                              className="text-red-500 hover:bg-red-50 text-xs px-2 py-1"
                              title="Revoke Permission & Lock Features"
                              onClick={() => handleRevokePremium(p)}
                            >
                              Revoke
                            </Button>
                          </div>
                        )}
                        <Button variant="ghost" size="small" onClick={() => handleViewPayment(p.id)} title="View Payment Details">
                          <Eye className="w-4 h-4 text-slate-500" />
                        </Button>
                        {p.status !== 'rejected' && (
                          <Button variant="ghost" size="small" className="text-red-600 hover:bg-red-50" onClick={() => handleRejectPayment(p.id)} title="Reject Payment">
                            <XCircle className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    );
                  },
                },
              ]}
              data={payments}
              loading={loading}
              pagination={pagination}
              onPageChange={(page) => { setPagination(p => ({ ...p, page })); loadTabData('payments'); }}
              onSearch={(search) => { setFilters(f => ({ ...f, search })); setPagination(p => ({ ...p, page: 1 })); loadTabData('payments'); }}
              onFilterChange={(key, value) => { setFilters(f => ({ ...f, [key]: value })); setPagination(p => ({ ...p, page: 1 })); loadTabData('payments'); }}
              filterOptions={{
                status: [
                  { value: '', label: 'All Status' },
                  { value: 'pending_verification', label: 'Pending Verification' },
                  { value: 'pending_submission', label: 'Pending Submission' },
                  { value: 'approved', label: 'Approved (Payment Done)' },
                  { value: 'rejected', label: 'Rejected' },
                  { value: 'needs_correction', label: 'Needs Correction' },
                ]
              }}
            />
          )}
        </div>
      );
    };


    const renderSubscriptionsTab = () => (
      <DataTable
        title="Subscriptions"
        subtitle={`${subscriptions.length} subscriptions${pagination.total > 0 ? ` • ${pagination.total} total` : ''}`}
        columns={[
          { key: 'user', header: 'User', render: (s: any) => (
            <div>
              <p className="font-medium text-slate-900">{s.user_name}</p>
              <p className="text-sm text-slate-500">{s.user_email}</p>
            </div>
          )},
          { key: 'restaurant', header: 'Restaurant', render: (s: any) => <p className="text-sm text-slate-500">{s.restaurant_name}</p> },
          { key: 'plan', header: 'Plan', render: (s: any) => <p className="font-medium text-slate-900">{s.plan_name}</p> },
          { key: 'status', header: 'Status', render: (s: any) => <StatusBadge status={s.status} /> },
          { key: 'startsAt', header: 'Started', render: (s: any) => <span className="text-sm text-slate-500">{formatDate(s.starts_at)}</span> },
          { key: 'expiresAt', header: 'Expires', render: (s: any) => (
            <div>
              <p className={`font-medium ${new Date(s.expires_at) < new Date() ? 'text-red-600' : 'text-slate-900'}`}>
                {formatDate(s.expires_at).split(',')[0]}
              </p>
              {new Date(s.expires_at) > new Date() && (
                <p className="text-xs text-slate-500">
                  {Math.ceil((new Date(s.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days left
                </p>
              )}
            </div>
          )},
          { key: 'actions', header: 'Actions', render: (s: any) => (
            <div className="flex items-center justify-end gap-1">
              {s.status === 'active' && (
                <>
                  <Button variant="ghost" size="small" className="text-orange-600 hover:bg-orange-50" onClick={() => handleExtendSubscription(s.id)}>
                    <Calendar className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="small" className="text-red-600 hover:bg-red-50" onClick={() => handleSuspendSubscription(s.id)}>
                    <PauseCircle className="w-4 h-4" />
                  </Button>
                </>
              )}
              {s.status === 'suspended' && (
                <Button variant="ghost" size="small" className="text-green-600 hover:bg-green-50" onClick={() => handleActivateSubscription(s.id)}>
                  <PlayCircle className="w-4 h-4" />
                </Button>
              )}
              {s.status === 'expired' && (
                <Button variant="ghost" size="small" className="text-blue-600 hover:bg-blue-50" onClick={() => handleExtendSubscription(s.id)}>
                  <RotateCcw className="w-4 h-4" />
                </Button>
              )}
            </div>
          )},
        ]}
        data={subscriptions}
        loading={loading}
        pagination={pagination}
        onPageChange={(page) => { setPagination(p => ({ ...p, page })); loadTabData('subscriptions'); }}
        onSearch={(search) => { setFilters(f => ({ ...f, search })); setPagination(p => ({ ...p, page: 1 })); loadTabData('subscriptions'); }}
        onFilterChange={(key, value) => { setFilters(f => ({ ...f, [key]: value })); setPagination(p => ({ ...p, page: 1 })); loadTabData('subscriptions'); }}
        filterOptions={{
          status: [
            { value: '', label: 'All Status' },
            { value: 'active', label: 'Active' },
            { value: 'expired', label: 'Expired' },
            { value: 'suspended', label: 'Suspended' },
            { value: 'inactive', label: 'Inactive' },
          ]
        }}
      />
    );

    const renderPlansTab = () => (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Subscription Plans</h2>
            <p className="text-slate-600">Manage pricing plans and features</p>
          </div>
          <Button onClick={() => handleOpenPlanModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Create Plan
          </Button>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan, idx) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              index={idx}
              onEdit={() => handleOpenPlanModal(plan)}
              onDelete={() => handleDeletePlan(plan.id)}
              onArchive={() => handleArchivePlan(plan.id)}
            />
          ))}
        </div>
        {plans.length === 0 && (
          <div className="glass rounded-2xl p-12 border border-white/50 text-center">
            <Crown className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No plans yet</h3>
            <p className="text-slate-500 mb-6">Create your first subscription plan</p>
            <Button onClick={() => handleOpenPlanModal()}>
              <Plus className="w-4 h-4 mr-2" />
              Create Plan
            </Button>
          </div>
        )}
        {planModalOpen && (
          <PlanModal
            plan={editingPlan}
            onClose={() => setPlanModalOpen(false)}
            onSave={handleSavePlan}
            loading={savingPlan}
          />
        )}
      </div>
    );

    const renderAddonsTab = () => (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Add-ons</h2>
            <p className="text-slate-600">Manage additional features and services</p>
          </div>
          <Button onClick={() => handleOpenAddonModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Create Add-on
          </Button>
        </div>
        <div className="glass rounded-2xl border border-white/50 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Add-on</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Price</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Features</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {addons.map((addon) => {
                const billingType = addon.billingType || addon.billing_type || 'one_time';
                const price = addon.priceInr ?? addon.price_inr ?? 0;
                const duration = addon.durationDays ?? addon.duration_days;
                const isActive = addon.isActive ?? (addon.is_active === 1 || addon.is_active === true);
                let featuresList: string[] = [];
                if (Array.isArray(addon.featurePermissions)) {
                  featuresList = addon.featurePermissions;
                } else if (Array.isArray(addon.feature_permissions)) {
                  featuresList = addon.feature_permissions;
                } else if (typeof addon.feature_permissions === 'string') {
                  try { featuresList = JSON.parse(addon.feature_permissions); } catch { featuresList = []; }
                }

                return (
                  <tr key={addon.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{addon.name}</p>
                      <p className="text-sm text-slate-500">{addon.identifier || addon.id}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                        {billingType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {price > 0 ? formatCurrency(price) : <span className="text-slate-500">Free</span>}
                      {duration && <span className="text-sm text-slate-500 ml-2">/ {duration} days</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {featuresList.slice(0, 3).map((f: string, i: number) => (
                          <span key={i} className="px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded">{f}</span>
                        ))}
                        {featuresList.length > 3 && (
                          <span className="px-2 py-0.5 text-xs bg-slate-100 text-slate-500 rounded">+{featuresList.length - 3}</span>
                        )}
                        {featuresList.length === 0 && <span className="text-xs text-slate-400">Standard</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="small" onClick={() => handleOpenAddonModal(addon)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="small" className={isActive ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'} onClick={() => handleToggleAddon(addon.id, !isActive)}>
                          {isActive ? <Archive className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {addons.length === 0 && (
            <div className="p-12 text-center">
              <Zap className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No add-ons yet</h3>
              <p className="text-slate-500 mb-6">Create your first add-on</p>
              <Button onClick={() => handleOpenAddonModal()}>
                <Plus className="w-4 h-4 mr-2" />
                Create Add-on
              </Button>
            </div>
          )}
        </div>
        {addonModalOpen && (
          <AddonModal
            addon={editingAddon}
            plans={plans}
            onClose={() => setAddonModalOpen(false)}
            onSave={handleSaveAddon}
            loading={savingAddon}
          />
        )}
      </div>
    );

    const renderFeaturesTab = () => (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Feature Flags</h2>
            <p className="text-slate-600">Control feature access across plans and accounts</p>
          </div>
          <Button onClick={() => handleOpenFeatureModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Create Feature
          </Button>
        </div>
        <div className="glass rounded-2xl border border-white/50 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase w-48">Feature</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Global</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Restricted To Plans</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Trial</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {features.map((feature) => (
                <tr key={feature.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-900">{feature.name}</p>
                    <p className="text-sm text-slate-500">{feature.identifier}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700">
                      {feature.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={feature.isGloballyEnabled}
                        onChange={(e) => handleToggleFeatureGlobal(feature.id, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-lime-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-lime-500"></div>
                    </label>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-500">
                      {feature.restrictedToPlans?.length > 0
                        ? feature.restrictedToPlans.join(', ')
                        : 'All plans'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={feature.trialEnabled}
                        onChange={(e) => handleToggleFeatureTrial(feature.id, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-lime-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-lime-500"></div>
                    </label>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="small" onClick={() => handleOpenFeatureModal(feature)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="small" onClick={() => handleOpenFeatureOverride(feature)}>
                      <Key className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {featureModalOpen && (
          <FeatureModal
            feature={editingFeature}
            plans={plans}
            onClose={() => setFeatureModalOpen(false)}
            onSave={handleSaveFeature}
            loading={savingFeature}
          />
        )}
      </div>
    );

    const renderRestaurantsTab = () => (
      <DataTable
        title="Restaurants"
        subtitle={`${restaurants.length} restaurants${pagination.total > 0 ? ` • ${pagination.total} total` : ''}`}
        columns={[
          { key: 'name', header: 'Restaurant', render: (r: any) => (
            <div>
              <p className="font-medium text-slate-900">{r.name}</p>
              <p className="text-xs text-slate-400">{r.id}</p>
            </div>
          )},
          { key: 'owner', header: 'Owner', render: (r: any) => (
            <div>
              <p className="font-medium text-slate-900">{r.owner_name}</p>
              <p className="text-sm text-slate-500">{r.owner_email || r.contact_email}</p>
            </div>
          )},
          { key: 'city', header: 'City', render: (r: any) => <span className="text-sm text-slate-500">{r.city}</span> },
          { key: 'status', header: 'Status', render: (r: any) => <StatusBadge status={r.is_active ? 'active' : 'inactive'} /> },
          { key: 'dataMode', header: 'Mode', render: (r: any) => (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${r.data_mode === 'LIVE' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
              {r.data_mode}
            </span>
          )},
          { key: 'zomato', header: 'Zomato', render: (r: any) => (
            <span className={r.zomato_res_id ? 'text-green-600' : 'text-slate-400'}>
              {r.zomato_res_id ? 'Connected' : 'Not Connected'}
            </span>
          )},
          { key: 'created', header: 'Created', render: (r: any) => <span className="text-sm text-slate-500">{formatDate(r.created_at)}</span> },
          { key: 'actions', header: 'Actions', render: (r: any) => (
            <div className="flex items-center justify-end gap-1">
              <Button variant="ghost" size="small" onClick={() => navigate(`/admin/restaurants/${r.id}`)}>
                <Eye className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="small" className={r.is_active ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'} onClick={() => handleToggleRestaurant(r.id, !r.is_active)}>
                {r.is_active ? <Archive className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
              </Button>
            </div>
          )},
        ]}
        data={restaurants}
        loading={loading}
        pagination={pagination}
        onPageChange={(page) => { setPagination(p => ({ ...p, page })); loadTabData('restaurants'); }}
        onSearch={(search) => { setFilters(f => ({ ...f, search })); setPagination(p => ({ ...p, page: 1 })); loadTabData('restaurants'); }}
        onFilterChange={(key, value) => { setFilters(f => ({ ...f, [key]: value })); setPagination(p => ({ ...p, page: 1 })); loadTabData('restaurants'); }}
        filterOptions={{
          status: [
            { value: '', label: 'All Status' },
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
          ]
        }}
      />
    );

    const renderActivityTab = () => (
      <DataTable
        title="Activity Log"
        subtitle={`${activity.length} entries${pagination.total > 0 ? ` • ${pagination.total} total` : ''}`}
        columns={[
          { key: 'timestamp', header: 'Time', render: (a: any) => <span className="text-sm text-slate-500 font-mono">{formatDate(a.created_at)}</span> },
          { key: 'admin', header: 'Admin', render: (a: any) => (
            <div>
              <p className="font-medium text-slate-900">{a.admin_name || a.admin_email}</p>
              <p className="text-xs text-slate-400">{a.admin_email}</p>
            </div>
          )},
          { key: 'action', header: 'Action', render: (a: any) => (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-lime-100 text-lime-700">{a.action}</span>
          )},
          { key: 'entity', header: 'Entity', render: (a: any) => (
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">{a.entity_type}</span>
              <span className="font-mono text-xs text-slate-400">{a.entity_id.slice(0, 12)}...</span>
            </div>
          )},
          { key: 'reason', header: 'Reason', render: (a: any) => <span className="text-sm text-slate-500 max-w-xs truncate block">{a.reason || '—'}</span> },
          { key: 'changes', header: 'Changes', render: (a: any) => (
            <Button variant="ghost" size="small" onClick={() => handleViewAuditDetails(a)}>
              <Eye className="w-4 h-4" />
            </Button>
          )},
        ]}
        data={activity}
        loading={loading}
        pagination={pagination}
        onPageChange={(page) => { setPagination(p => ({ ...p, page })); loadTabData('activity'); }}
        onSearch={(search) => { setFilters(f => ({ ...f, search })); setPagination(p => ({ ...p, page: 1 })); loadTabData('activity'); }}
        onFilterChange={(key, value) => { setFilters(f => ({ ...f, [key]: value })); setPagination(p => ({ ...p, page: 1 })); loadTabData('activity'); }}
        filterOptions={{
          entityType: [
            { value: '', label: 'All Entities' },
            { value: 'user', label: 'User' },
            { value: 'restaurant', label: 'Restaurant' },
            { value: 'payment', label: 'Payment' },
            { value: 'subscription', label: 'Subscription' },
            { value: 'addon', label: 'Add-on' },
            { value: 'feature', label: 'Feature' },
            { value: 'plan', label: 'Plan' },
            { value: 'settings', label: 'Settings' },
          ]
        }}
      />
    );

    const renderNotificationsTab = () => (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Notifications</h2>
            <p className="text-slate-600">Send notifications to users</p>
          </div>
          <Button onClick={() => setNotificationModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Send Notification
          </Button>
        </div>
        <div className="glass rounded-2xl border border-white/50 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Title</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Message</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Recipients</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Sent</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {notifications.map((n) => (
                <tr key={n.id} className={`hover:bg-slate-50 ${!n.is_read ? 'bg-blue-50/50' : ''}`}>
                  <td className="px-6 py-4 font-medium text-slate-900">{n.title}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 max-w-md truncate block">{n.message}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {n.recipient_type === 'all' ? 'All Users' : n.recipient_type === 'selected' ? `${(n.recipient_ids || []).length} users` : 'Single User'}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700">{n.category}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${n.is_read ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {n.is_read ? 'Read' : 'Unread'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{n.sent_at ? formatDate(n.sent_at) : 'Not sent'}</td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="small" onClick={() => handleViewNotification(n.id)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {notifications.length === 0 && (
            <div className="p-12 text-center">
              <Bell className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No notifications yet</h3>
              <p className="text-slate-500 mb-6">Send your first notification to users</p>
              <Button onClick={() => setNotificationModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Send Notification
              </Button>
            </div>
          )}
        </div>
        {notificationModalOpen && (
          <NotificationModal
            users={users}
            onClose={() => setNotificationModalOpen(false)}
            onSave={handleSendNotification}
            loading={sendingNotification}
          />
        )}
      </div>
    );

    // Handler functions
    const handleGrantPremium = async (payment: any) => {
      const ownerName = payment.restaurant_owner_name || payment.user_name || 'the restaurant owner';
      const confirmed = window.confirm(
        `Verify payment of ₹${payment.amount_inr} and grant permission of locked / premium features to owner "${ownerName}"?`
      );
      if (!confirmed) return;
      try {
        await backendApi.adminAction(`payments/${payment.id}/grant-premium`, {
          adminNote: `Payment verified & premium features permission granted to owner ${ownerName}`
        });

        // Update local storage payment submissions if present
        try {
          const stored = JSON.parse(localStorage.getItem('sellsense_payment_submissions') || '[]');
          const updated = stored.map((p: any) => p.id === payment.id ? { ...p, status: 'approved', permission_granted: true } : p);
          localStorage.setItem('sellsense_payment_submissions', JSON.stringify(updated));
          localStorage.setItem('sellsense_features_unlocked', 'true');
        } catch (e) {}

        // Immediate optimistic UI update
        setPayments(prev => prev.map(p => p.id === payment.id ? { ...p, status: 'approved', has_active_subscription: 1 } : p));
        alert(`Success! Payment marked as DONE and premium features permission granted to ${ownerName}.`);
        loadTabData('payments');
      } catch (err: any) {
        // Fallback for purely client-side payment requests
        try {
          const stored = JSON.parse(localStorage.getItem('sellsense_payment_submissions') || '[]');
          const idx = stored.findIndex((p: any) => p.id === payment.id);
          if (idx !== -1) {
            stored[idx].status = 'approved';
            stored[idx].permission_granted = true;
            localStorage.setItem('sellsense_payment_submissions', JSON.stringify(stored));
            localStorage.setItem('sellsense_features_unlocked', 'true');
            setPayments(prev => prev.map(p => p.id === payment.id ? { ...p, status: 'approved', has_active_subscription: 1 } : p));
            alert(`Success! Payment marked as DONE and premium features permission granted to ${ownerName} (locally saved).`);
            loadTabData('payments');
            return;
          }
        } catch (e) {}
        alert(err?.message || 'Failed to grant premium features permission');
      }
    };

    const handleRevokePremium = async (payment: any) => {
      const ownerName = payment.restaurant_owner_name || payment.user_name || 'the restaurant owner';
      const confirmed = window.confirm(
        `Are you sure you want to revoke permission and lock premium features for owner "${ownerName}"?`
      );
      if (!confirmed) return;
      try {
        await backendApi.adminAction(`payments/${payment.id}/revoke-premium`, {});
        try {
          const stored = JSON.parse(localStorage.getItem('sellsense_payment_submissions') || '[]');
          const updated = stored.map((p: any) => p.id === payment.id ? { ...p, status: 'rejected', permission_granted: false } : p);
          localStorage.setItem('sellsense_payment_submissions', JSON.stringify(updated));
        } catch (e) {}
        setPayments(prev => prev.map(p => p.id === payment.id ? { ...p, status: 'rejected', has_active_subscription: 0 } : p));
        alert(`Permission revoked. Premium features are now locked for ${ownerName}.`);
        loadTabData('payments');
      } catch (err: any) {
        alert(err?.message || 'Failed to revoke premium permission');
      }
    };

    const handleGrantUserPremium = async (u: any) => {
      const days = prompt(`Grant premium features to owner ${u.full_name}. Enter duration in days:`, '30');
      if (!days || isNaN(parseInt(days))) return;
      try {
        await backendApi.adminAction(`users/${u.id}/grant-premium`, {
          durationDays: parseInt(days),
          adminNote: `Manual permission granted by admin for ${days} days`,
        });
        localStorage.setItem('sellsense_features_unlocked', 'true');
        alert(`Success! Premium features permission granted to ${u.full_name} for ${days} days.`);
        loadTabData('users');
      } catch (err: any) {
        alert(err?.message || 'Failed to grant user premium features');
      }
    };

    const handleViewPayment = (id: string) => navigate(`/admin/payments/${id}`);
    const handleRejectPayment = async (id: string) => {
      const reason = prompt('Rejection reason (required):');
      if (!reason) return;
      try {
        await backendApi.adminAction(`payments/${id}/reject`, { adminReason: reason });
        loadTabData('payments');
      } catch (err) { alert('Failed to reject payment'); }
    };
    const handleExtendSubscription = async (id: string) => {
      const days = prompt('Days to extend:');
      if (!days || isNaN(parseInt(days))) return;
      try {
        await backendApi.adminAction(`subscriptions/${id}/extend`, { days: parseInt(days) });
        loadTabData('subscriptions');
      } catch (err) { alert('Failed to extend subscription'); }
    };
    const handleSuspendSubscription = async (id: string) => {
      const reason = prompt('Suspension reason (optional):');
      if (reason === null) return;
      try {
        await backendApi.adminAction(`subscriptions/${id}/suspend`, { adminNote: reason });
        loadTabData('subscriptions');
      } catch (err) { alert('Failed to suspend subscription'); }
    };
    const handleActivateSubscription = async (id: string) => {
      try {
        await backendApi.adminAction(`subscriptions/${id}/activate`, {});
        loadTabData('subscriptions');
      } catch (err) { alert('Failed to activate subscription'); }
    };
    const handleDeleteUser = async (id: string) => {
      if (!confirm('Are you sure you want to deactivate this user?')) return;
      try {
        await backendApi.adminAction(`users/${id}`, { _method: 'DELETE' });
        loadTabData('users');
      } catch (err) { alert('Failed to delete user'); }
    };
    const handleToggleRestaurant = async (id: string, isActive: boolean) => {
      try {
        await backendApi.adminPatch(`restaurants/${id}`, { is_active: isActive });
        loadTabData('restaurants');
      } catch (err) { alert('Failed to update restaurant'); }
    };
    const handleToggleAddon = async (id: string, isActive: boolean) => {
      try {
        await backendApi.adminPatch(`addons/${id}`, { isActive });
        loadTabData('addons');
      } catch (err) { alert('Failed to update addon'); }
    };
    const handleToggleFeatureGlobal = async (id: string, enabled: boolean) => {
      try {
        await backendApi.adminPatch(`features/${id}`, { isGloballyEnabled: enabled });
        loadTabData('features');
      } catch (err) { alert('Failed to update feature'); }
    };
    const handleToggleFeatureTrial = async (id: string, enabled: boolean) => {
      try {
        await backendApi.adminPatch(`features/${id}`, { trialEnabled: enabled });
        loadTabData('features');
      } catch (err) { alert('Failed to update feature'); }
    };
    const handleViewAuditDetails = (audit: any) => {
      alert(`Previous: ${JSON.stringify(audit.previousValue, null, 2)}\n\nNew: ${JSON.stringify(audit.newValue, null, 2)}`);
    };
    const handleViewNotification = (id: string) => {
      const notif = notifications.find(n => n.id === id);
      if (notif) alert(`${notif.title}\n\n${notif.message}\n\nCategory: ${notif.category}\nRecipients: ${notif.recipient_type}`);
    };

    // Modal states
    const [planModalOpen, setPlanModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<any>(null);
    const [savingPlan, setSavingPlan] = useState(false);

    const handleOpenPlanModal = (plan?: any) => {
      setEditingPlan(plan || null);
      setPlanModalOpen(true);
    };

    const handleSavePlan = async (data: any) => {
      setSavingPlan(true);
      try {
        if (editingPlan) {
          await backendApi.adminPatch(`plans/${editingPlan.id}`, data);
        } else {
          await backendApi.adminAction('plans', data);
        }
        setPlanModalOpen(false);
        loadTabData('plans');
      } catch (err) { alert('Failed to save plan'); }
      finally { setSavingPlan(false); }
    };

    const handleDeletePlan = async (id: string) => {
      if (!confirm('Archive this plan? Active subscriptions will prevent deletion.')) return;
      try {
        await backendApi.adminDelete(`plans/${id}`);
        loadTabData('plans');
      } catch (err) { alert('Failed to archive plan'); }
    };

    const handleArchivePlan = async (id: string) => {
      try {
        await backendApi.adminPatch(`plans/${id}`, { status: 'archived' });
        loadTabData('plans');
      } catch (err) { alert('Failed to archive plan'); }
    };

    // Addon modal
    const [addonModalOpen, setAddonModalOpen] = useState(false);
    const [editingAddon, setEditingAddon] = useState<any>(null);
    const [savingAddon, setSavingAddon] = useState(false);

    const handleOpenAddonModal = (addon?: any) => {
      setEditingAddon(addon || null);
      setAddonModalOpen(true);
    };

    const handleSaveAddon = async (data: any) => {
      setSavingAddon(true);
      try {
        if (editingAddon) {
          await backendApi.adminPatch(`addons/${editingAddon.id}`, data);
        } else {
          await backendApi.adminAction('addons', data);
        }
        setAddonModalOpen(false);
        loadTabData('addons');
      } catch (err) { alert('Failed to save addon'); }
      finally { setSavingAddon(false); }
    };

    // Feature modal
    const [featureModalOpen, setFeatureModalOpen] = useState(false);
    const [editingFeature, setEditingFeature] = useState<any>(null);
    const [savingFeature, setSavingFeature] = useState(false);

    const handleOpenFeatureModal = (feature?: any) => {
      setEditingFeature(feature || null);
      setFeatureModalOpen(true);
    };

    const handleSaveFeature = async (data: any) => {
      setSavingFeature(true);
      try {
        if (editingFeature) {
          await backendApi.adminPatch(`features/${editingFeature.id}`, data);
        } else {
          await backendApi.adminAction('features', data);
        }
        setFeatureModalOpen(false);
        loadTabData('features');
      } catch (err) { alert('Failed to save feature'); }
      finally { setSavingFeature(false); }
    };

    const handleOpenFeatureOverride = (feature: any) => {
      // Navigate to user management with feature filter or open override modal
      navigate(`/admin/users?feature=${feature.id}`);
    };

    // Notification modal
    const [notificationModalOpen, setNotificationModalOpen] = useState(false);
    const [sendingNotification, setSendingNotification] = useState(false);

    const handleSendNotification = async (data: any) => {
      setSendingNotification(true);
      try {
        await backendApi.adminAction('notifications', data);
        setNotificationModalOpen(false);
        loadTabData('notifications');
      } catch (err) { alert('Failed to send notification'); }
      finally { setSendingNotification(false); }
    };

    const inputClass = "w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent bg-white";

    // Helper Components
    const DataTable: React.FC<{
      title: string;
      subtitle?: string;
      columns: Array<{
        key: string;
        header: string;
        render: (item: any) => React.ReactNode;
        width?: string;
      }>;
      data: any[];
      loading: boolean;
      pagination: { page: number; limit: number; total: number };
      onPageChange: (page: number) => void;
      onSearch?: (search: string) => void;
      onFilterChange?: (key: string, value: string) => void;
      filterOptions?: Record<string, Array<{ value: string; label: string }>>;
    }> = ({ title, subtitle, columns, data, loading, pagination, onPageChange, onSearch: _onSearch, onFilterChange: _onFilterChange, filterOptions: _filterOptions }) => {
      const totalPages = Math.ceil(pagination.total / pagination.limit);

      return (
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
            {subtitle && <p className="text-slate-600">{subtitle}</p>}
          </div>

          <div className="glass rounded-2xl border border-white/50 overflow-hidden">
            {loading && data.length === 0 ? (
              <div className="p-12 text-center">
                <Loader2 className="w-8 h-8 text-lime-500 animate-spin mx-auto mb-3" />
                <p className="text-slate-500">Loading...</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        {columns.map(col => (
                          <th key={col.key} className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider" style={{ width: col.width }}>
                            {col.header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {data.length === 0 ? (
                        <tr>
                          <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-500">
                            No data found
                          </td>
                        </tr>
                      ) : (
                        data.map((item, idx) => (
                          <tr key={`${item.id}-${idx}`} className="hover:bg-slate-50">
                            {columns.map(col => (
                              <td key={col.key} className="px-6 py-4">
                                {col.render(item)}
                              </td>
                            ))}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                    <div className="text-sm text-slate-600">
                      Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="small"
                        onClick={() => onPageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
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
                            onClick={() => onPageChange(pageNum)}
                            className="w-8 h-8"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                      <Button
                        variant="ghost"
                        size="small"
                        onClick={() => onPageChange(pagination.page + 1)}
                        disabled={pagination.page === totalPages}
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
      );
    };

    const PlanCard: React.FC<{
      plan: any;
      index: number;
      onEdit: () => void;
      onDelete: () => void;
      onArchive: () => void;
    }> = ({ plan, index, onEdit, onDelete, onArchive }) => (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className={`relative rounded-2xl border-2 transition-all duration-300 ${
          plan.status === 'active'
            ? 'border-lime-200 bg-gradient-to-br from-lime-50 to-white'
            : 'border-slate-200 bg-white'
        }`}
      >
        {plan.status === 'archived' && (
          <div className="absolute inset-0 bg-black/10 rounded-2xl flex items-center justify-center">
            <span className="bg-white/90 px-4 py-2 rounded-lg font-semibold text-slate-600">Archived</span>
          </div>
        )}
        <div className="p-6 relative">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
              <p className="text-sm text-slate-500 mt-1">{plan.description}</p>
            </div>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${plan.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
              {plan.status}
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 mb-2">
            {formatCurrency(plan.priceInr)}
            <span className="text-lg font-normal text-slate-500">/{plan.durationDays} days</span>
          </div>
          <ul className="space-y-2 mb-6 max-h-40 overflow-y-auto pr-2">
            {plan.features.map((f: string, i: number) => (
              <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                <CheckCircle className="w-4 h-4 text-lime-500 flex-shrink-0" />
                {f.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <Button variant="outline" size="small" className="flex-1" onClick={onEdit}>
              <Edit className="w-4 h-4 mr-1" /> Edit
            </Button>
            <Button variant="ghost" size="small" onClick={plan.status === 'active' ? onArchive : onDelete} className="text-red-600 hover:bg-red-50">
              {plan.status === 'active' ? <Archive className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </motion.div>
    );

    const FormField: React.FC<{ label: string; children: React.ReactNode; colSpan?: number }> = ({ label, children, colSpan = 1 }) => (
      <div className={colSpan > 1 ? 'md:col-span-2' : ''}>
        <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
        {children}
      </div>
    );

    // Modals
    const PlanModal: React.FC<{
      plan: any;
      onClose: () => void;
      onSave: (data: any) => void;
      loading: boolean;
    }> = ({ plan, onClose, onSave, loading }) => {
      const [form, setForm] = useState({
        name: '',
        description: '',
        priceInr: 0,
        durationDays: 30,
        features: [] as string[],
        usageLimits: { products: 5, reviews_per_month: 500, api_calls_per_day: 100 },
        availableAddonIds: [] as string[],
        status: 'active',
        displayOrder: 0,
      });

      useEffect(() => {
        if (plan) {
          setForm({
            name: plan.name,
            description: plan.description,
            priceInr: plan.priceInr,
            durationDays: plan.durationDays,
            features: plan.features,
            usageLimits: plan.usageLimits,
            availableAddonIds: plan.availableAddonIds,
            status: plan.status,
            displayOrder: plan.displayOrder,
          });
        }
      }, [plan]);

      const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(form);
      };

      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-lg">{plan ? 'Edit Plan' : 'Create Plan'}</h3>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField label="Plan Name"><input type="text" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} className={inputClass} required /></FormField>
                <FormField label="Price (₹)"><input type="number" value={form.priceInr} onChange={(e) => setForm(f => ({ ...f, priceInr: parseInt(e.target.value) }))} className={inputClass} min="0" required /></FormField>
                <FormField label="Duration (days)"><input type="number" value={form.durationDays} onChange={(e) => setForm(f => ({ ...f, durationDays: parseInt(e.target.value) }))} className={inputClass} min="1" required /></FormField>
                <FormField label="Display Order"><input type="number" value={form.displayOrder} onChange={(e) => setForm(f => ({ ...f, displayOrder: parseInt(e.target.value) }))} className={inputClass} /></FormField>
                <FormField label="Status" colSpan={2}>
                  <select value={form.status} onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))} className={inputClass}>
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </FormField>
                <FormField label="Description" colSpan={2}>
                  <textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} className={inputClass} rows={3} required />
                </FormField>
                <FormField label="Features (one per line)" colSpan={2}>
                  <textarea value={form.features.join('\n')} onChange={(e) => setForm(f => ({ ...f, features: e.target.value.split('\n').filter(Boolean) }))} className={inputClass} rows={6} placeholder="review_monitoring&#10;sentiment_analysis&#10;basic_insights" />
                </FormField>
                <FormField label="Usage Limits" colSpan={2}>
                  <div className="grid grid-cols-3 gap-4">
                    <div><label className="block text-xs text-slate-500 mb-1">Products</label><input type="number" value={form.usageLimits.products} onChange={(e) => { const val = parseInt(e.target.value) || -1; setForm(f => ({ ...f, usageLimits: { ...f.usageLimits, products: val } })); }} className={inputClass} placeholder="-1 for unlimited" /></div>
                    <div><label className="block text-xs text-slate-500 mb-1">Reviews/Month</label><input type="number" value={form.usageLimits.reviews_per_month} onChange={(e) => { const val = parseInt(e.target.value) || -1; setForm(f => ({ ...f, usageLimits: { ...f.usageLimits, reviews_per_month: val } })); }} className={inputClass} placeholder="-1 for unlimited" /></div>
                    <div><label className="block text-xs text-slate-500 mb-1">API Calls/Day</label><input type="number" value={form.usageLimits.api_calls_per_day} onChange={(e) => { const val = parseInt(e.target.value) || 100; setForm(f => ({ ...f, usageLimits: { ...f.usageLimits, api_calls_per_day: val } })); }} className={inputClass} /></div>
                  </div>
                </FormField>
                <FormField label="Available Add-on IDs (comma separated)" colSpan={2}>
                  <input type="text" value={form.availableAddonIds.join(', ')} onChange={(e) => setForm(f => ({ ...f, availableAddonIds: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))} className={inputClass} placeholder="addon_advanced_analytics, addon_competitor_analysis" />
                </FormField>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
                <Button type="submit" disabled={loading} className="bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-600 hover:to-lime-700">
                  {loading ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Saving...</span> : (plan ? 'Save Changes' : 'Create Plan')}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      );
    };

    const AddonModal: React.FC<{
      addon: any;
      plans: any[];
      onClose: () => void;
      onSave: (data: any) => void;
      loading: boolean;
    }> = ({ addon, plans, onClose, onSave, loading }) => {
      const [form, setForm] = useState({
        name: '',
        identifier: '',
        description: '',
        icon: '',
        priceInr: 0,
        billingType: 'one_time',
        durationDays: 30,
        eligibilityRules: { minPlan: '' },
        featurePermissions: [] as string[],
        isActive: true,
        displayOrder: 0,
      });

      useEffect(() => {
        if (addon) {
          setForm({
            name: addon.name,
            identifier: addon.identifier,
            description: addon.description,
            icon: addon.icon || '',
            priceInr: addon.priceInr || 0,
            billingType: addon.billingType,
            durationDays: addon.durationDays || 30,
            eligibilityRules: addon.eligibilityRules,
            featurePermissions: addon.featurePermissions,
            isActive: addon.isActive,
            displayOrder: addon.displayOrder,
          });
        }
      }, [addon]);

      const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(form);
      };

      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-lg">{addon ? 'Edit Add-on' : 'Create Add-on'}</h3>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField label="Name"><input type="text" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} className={inputClass} required /></FormField>
                <FormField label="Identifier (unique)"><input type="text" value={form.identifier} onChange={(e) => setForm(f => ({ ...f, identifier: e.target.value }))} className={inputClass} required /></FormField>
                <FormField label="Price (₹)"><input type="number" value={form.priceInr} onChange={(e) => setForm(f => ({ ...f, priceInr: parseInt(e.target.value) || 0 }))} className={inputClass} min="0" /></FormField>
                <FormField label="Billing Type">
                  <select value={form.billingType} onChange={(e) => setForm(f => ({ ...f, billingType: e.target.value }))} className={inputClass}>
                    <option value="one_time">One Time</option>
                    <option value="recurring">Recurring</option>
                    <option value="complimentary">Complimentary</option>
                  </select>
                </FormField>
                <FormField label="Duration (days)"><input type="number" value={form.durationDays} onChange={(e) => setForm(f => ({ ...f, durationDays: parseInt(e.target.value) || 30 }))} className={inputClass} min="1" /></FormField>
                <FormField label="Display Order"><input type="number" value={form.displayOrder} onChange={(e) => setForm(f => ({ ...f, displayOrder: parseInt(e.target.value) }))} className={inputClass} /></FormField>
                <FormField label="Icon (emoji)"><input type="text" value={form.icon} onChange={(e) => setForm(f => ({ ...f, icon: e.target.value }))} className={inputClass} placeholder="📊" /></FormField>
                <FormField label="Status">
                  <select value={form.isActive ? 'active' : 'inactive'} onChange={(e) => setForm(f => ({ ...f, isActive: e.target.value === 'active' }))} className={inputClass}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </FormField>
                <FormField label="Description" colSpan={2}>
                  <textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} className={inputClass} rows={3} required />
                </FormField>
                <FormField label="Eligibility - Min Plan" colSpan={2}>
                  <select value={form.eligibilityRules.minPlan} onChange={(e) => { const val = e.target.value; setForm(f => ({ ...f, eligibilityRules: { ...f.eligibilityRules, minPlan: val } })); }} className={inputClass}>
                    <option value="">None</option>
                    {plans.filter(p => p.status === 'active').map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </FormField>
                <FormField label="Feature Permissions (one per line)" colSpan={2}>
                  <textarea value={form.featurePermissions.join('\n')} onChange={(e) => setForm(f => ({ ...f, featurePermissions: e.target.value.split('\n').filter(Boolean) }))} className={inputClass} rows={4} placeholder="cohort_analysis&#10;clv_prediction&#10;churn_prediction" />
                </FormField>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
                <Button type="submit" disabled={loading} className="bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-600 hover:to-lime-700">
                  {loading ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Saving...</span> : (addon ? 'Save Changes' : 'Create Add-on')}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      );
    };

    const FeatureModal: React.FC<{
      feature: any;
      plans: any[];
      onClose: () => void;
      onSave: (data: any) => void;
      loading: boolean;
    }> = ({ feature, plans, onClose, onSave, loading }) => {
      const [form, setForm] = useState({
        identifier: '',
        name: '',
        description: '',
        category: 'core',
        isGloballyEnabled: true,
        restrictedToPlans: [] as string[],
        restrictedToAccounts: [] as string[],
        trialEnabled: false,
        trialDurationDays: 14,
      });

      useEffect(() => {
        if (feature) {
          setForm({
            identifier: feature.identifier,
            name: feature.name,
            description: feature.description,
            category: feature.category,
            isGloballyEnabled: feature.isGloballyEnabled,
            restrictedToPlans: feature.restrictedToPlans,
            restrictedToAccounts: feature.restrictedToAccounts,
            trialEnabled: feature.trialEnabled,
            trialDurationDays: feature.trialDurationDays || 14,
          });
        }
      }, [feature]);

      const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(form);
      };

      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-lg">{feature ? 'Edit Feature' : 'Create Feature'}</h3>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField label="Identifier (unique)"><input type="text" value={form.identifier} onChange={(e) => setForm(f => ({ ...f, identifier: e.target.value }))} className={inputClass} required disabled={!!feature} /></FormField>
                <FormField label="Name"><input type="text" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} className={inputClass} required /></FormField>
                <FormField label="Category">
                  <select value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))} className={inputClass}>
                    <option value="core">Core</option>
                    <option value="analytics">Analytics</option>
                    <option value="notifications">Notifications</option>
                    <option value="support">Support</option>
                    <option value="limits">Limits</option>
                    <option value="integrations">Integrations</option>
                    <option value="security">Security</option>
                    <option value="branding">Branding</option>
                    <option value="reporting">Reporting</option>
                  </select>
                </FormField>
                <FormField label="Trial Duration (days)"><input type="number" value={form.trialDurationDays} onChange={(e) => setForm(f => ({ ...f, trialDurationDays: parseInt(e.target.value) || 14 }))} className={inputClass} min="1" /></FormField>
                <FormField label="Global Enabled" colSpan={2}>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={form.isGloballyEnabled} onChange={(e) => setForm(f => ({ ...f, isGloballyEnabled: e.target.checked }))} className="w-5 h-5 text-lime-500 rounded border-slate-300" />
                    <span className="text-sm text-slate-700">Enabled for all users by default</span>
                  </label>
                </FormField>
                <FormField label="Trial Enabled" colSpan={2}>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={form.trialEnabled} onChange={(e) => setForm(f => ({ ...f, trialEnabled: e.target.checked }))} className="w-5 h-5 text-lime-500 rounded border-slate-300" />
                    <span className="text-sm text-slate-700">Available during trial period</span>
                  </label>
                </FormField>
                <FormField label="Description" colSpan={2}>
                  <textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} className={inputClass} rows={3} required />
                </FormField>
                <FormField label="Restricted To Plans (hold Ctrl/Cmd to select multiple)" colSpan={2}>
                  <select multiple value={form.restrictedToPlans} onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions).map(o => o.value);
                    setForm(f => ({ ...f, restrictedToPlans: selected }));
                  }} className={inputClass} size={6}>
                    {plans.filter(p => p.status === 'active').map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <p className="text-xs text-slate-500 mt-1">Leave empty for all plans</p>
                </FormField>
                <FormField label="Restricted To Account IDs (comma separated)" colSpan={2}>
                  <input type="text" value={form.restrictedToAccounts.join(', ')} onChange={(e) => setForm(f => ({ ...f, restrictedToAccounts: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))} className={inputClass} placeholder="user_123, user_456" />
                  <p className="text-xs text-slate-500 mt-1">Leave empty for no account restrictions</p>
                </FormField>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
                <Button type="submit" disabled={loading} className="bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-600 hover:to-lime-700">
                  {loading ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Saving...</span> : (feature ? 'Save Changes' : 'Create Feature')}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      );
    };

    const NotificationModal: React.FC<{
      users: any[];
      onClose: () => void;
      onSave: (data: any) => void;
      loading: boolean;
    }> = ({ users, onClose, onSave, loading }) => {
      const [form, setForm] = useState({
        title: '',
        message: '',
        recipientType: 'all',
        recipientIds: [] as string[],
        category: 'general',
      });

      const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(form);
      };

      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-lg">Send Notification</h3>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <FormField label="Title"><input type="text" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} className={inputClass} required /></FormField>
              <FormField label="Message"><textarea value={form.message} onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))} className={inputClass} rows={4} required /></FormField>
              <FormField label="Category">
                <select value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))} className={inputClass}>
                  <option value="payment">Payment</option>
                  <option value="subscription">Subscription</option>
                  <option value="addon">Add-on</option>
                  <option value="feature">Feature</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="general">General</option>
                </select>
              </FormField>
              <FormField label="Recipient Type">
                <select value={form.recipientType} onChange={(e) => setForm(f => ({ ...f, recipientType: e.target.value, recipientIds: [] }))} className={inputClass}>
                  <option value="all">All Users</option>
                  <option value="selected">Selected Users</option>
                  <option value="single">Single User</option>
                </select>
              </FormField>
              {(form.recipientType === 'selected' || form.recipientType === 'single') && (
                <FormField label="Select Users">
                  <select
                    multiple={form.recipientType === 'selected'}
                    value={form.recipientIds}
                    onChange={(e) => {
                      if (form.recipientType === 'selected') {
                        const selected = Array.from(e.target.selectedOptions).map(o => o.value);
                        setForm(f => ({ ...f, recipientIds: selected }));
                      } else {
                        setForm(f => ({ ...f, recipientIds: [e.target.value] }));
                      }
                    }}
                    className={inputClass}
                    size={6}
                  >
                    {users.map((u: any) => <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>)}
                  </select>
                </FormField>
              )}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
                <Button type="submit" disabled={loading} className="bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-600 hover:to-lime-700">
                  {loading ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Sending...</span> : 'Send Notification'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      );
    };

    return (
      <div className="min-h-screen bg-slate-50/80">
        {/* Admin Header - Modern SaaS Command Center */}
        <header className="bg-slate-950 text-white border-b border-slate-800 sticky top-0 z-40 shadow-xl backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                  aria-label="Toggle menu"
                >
                  {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>

                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-lime-400 via-emerald-400 to-cyan-400 p-0.5 shadow-lg shadow-lime-400/20">
                    <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                      <Crown className="text-lime-400" size={22} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-xl text-white tracking-tight">SellSense</span>
                      <span className="px-2 py-0.5 bg-lime-400 text-slate-950 text-[10px] font-black rounded-md tracking-wider uppercase">
                        Admin
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>Live SaaS Control Center</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Header Right Actions */}
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2.5 px-3.5 py-1.5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xs">
                  <div className="w-7 h-7 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-400">
                    <ShieldCheck size={16} />
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold text-white block leading-tight">{currentUser?.fullName || 'Super Admin'}</span>
                    <span className="text-[10px] text-purple-300 uppercase tracking-wider font-semibold">Super Admin</span>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="small"
                  onClick={handleRefresh}
                  className="text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl px-3 py-2 text-xs font-semibold flex items-center gap-1.5 border border-slate-800"
                  title="Refresh Data"
                >
                  <RotateCcw size={14} className={loading ? 'animate-spin' : ''} />
                  <span className="hidden md:inline">Refresh</span>
                </Button>

                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => navigate('/products')}
                  className="!bg-lime-400 !text-slate-950 hover:!bg-lime-500 font-bold rounded-xl px-3.5 py-2 text-xs shadow-md shadow-lime-400/10 flex items-center gap-1.5"
                >
                  <LogOut size={14} />
                  <span>Live Menu</span>
                </Button>
              </div>
            </div>

            {/* Mobile Tab Navigation */}
            <AnimatePresence>
              {mobileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="lg:hidden pb-4 overflow-hidden border-t border-slate-800 pt-3"
                >
                  <nav className="flex gap-2 px-1 overflow-x-auto" role="tablist">
                    {TABS.map(tab => (
                      <button
                        key={tab.id}
                        role="tab"
                        aria-selected={activeTab === tab.id}
                        onClick={() => { setActiveTab(tab.id); setMobileMenuOpen(false); }}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                          activeTab === tab.id
                            ? 'bg-lime-400 text-slate-950 shadow-md shadow-lime-400/20'
                            : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-slate-800'
                        }`}
                      >
                        <tab.icon size={15} />
                        {tab.label}
                        {tab.count !== undefined && (
                          <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${activeTab === tab.id ? 'bg-slate-950 text-white' : 'bg-slate-800 text-slate-300'}`}>
                            {tab.count}
                          </span>
                        )}
                      </button>
                    ))}
                  </nav>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Desktop Tab Navigation - Refined Pill Bar */}
          <div className="hidden lg:block border-t border-slate-800/80 bg-slate-950/90">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-1.5 py-2 overflow-x-auto" role="tablist">
              {TABS.map(tab => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-lime-400 text-slate-950 shadow-md shadow-lime-400/25 ring-1 ring-lime-300'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <tab.icon size={15} />
                    <span>{tab.label}</span>
                    {tab.count !== undefined && (
                      <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-black ${isActive ? 'bg-slate-950 text-white' : 'bg-slate-800 text-slate-400'}`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </header>

        {/* Error Banner */}
        {error && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-2xl flex items-center justify-between shadow-xs"
            >
              <div className="flex items-center gap-3 text-sm font-semibold">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <span>{error}</span>
              </div>
              <Button variant="ghost" size="small" onClick={handleRefresh}>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" /> Retry
              </Button>
            </motion.div>
          </div>
        )}

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {renderTabContent()}
        </main>
      </div>
    );
  };

export default AdminPage;