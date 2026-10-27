import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, BarChart3, MapPin, Settings, LogOut, CreditCard, Crown, FileSpreadsheet } from 'lucide-react';
import { authStorage } from '../utils/auth';
import { useNavigate } from 'react-router-dom';

interface SidebarProps {
  restaurantName?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ restaurantName }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = authStorage.getUser();
  const isAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'admin' || currentUser?.email === 'admin@sellsense.ai';

  const handleLogout = () => {
    authStorage.logout();
    navigate('/login');
  };

  const menuItems = [
    ...(isAdmin ? [{ icon: Crown, label: 'Admin Panel', path: '/admin' }] : []),
    { icon: LayoutDashboard, label: 'Overview', path: '/products' },
    { icon: FileSpreadsheet, label: 'Upload Reviews', path: '/products?action=upload' },
    { icon: BarChart3, label: 'Review Analytics', path: '/analysis' },
    { icon: MapPin, label: 'Google Reviews', path: '/google-reviews' },
    { icon: CreditCard, label: 'Subscription Plan (₹531)', path: '/payment/plan_basic' },
    ...(isAdmin ? [] : [{ icon: Settings, label: 'Settings', path: '/settings' }]),
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen sticky top-0 flex flex-col shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <Link to="/" className="text-2xl font-bold text-slate-900">
          SellSense
        </Link>
        {restaurantName && (
          <p className="text-sm text-gray-600 mt-2 font-medium">{restaurantName}</p>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.path ||
            (item.path.startsWith('/analysis') && location.pathname.startsWith('/analysis')) ||
            (item.path.startsWith('/google-reviews') && location.pathname.startsWith('/google-reviews')) ||
            (item.path.startsWith('/payment') && location.pathname.startsWith('/payment')) ||
            (item.path === '/settings' && (location.pathname === '/settings' || location.search.includes('settings')));

          return (
            <Link
              key={item.label}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? 'bg-lime-400 text-slate-950 shadow-md font-black'
                  : 'text-slate-800 hover:text-slate-950 hover:bg-slate-100 font-semibold'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-900 hover:bg-red-50 hover:text-red-600 transition-colors w-full"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
};
