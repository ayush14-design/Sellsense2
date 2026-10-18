import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, BarChart3, MapPin, Settings, LogOut } from 'lucide-react';
import { authStorage } from '../utils/auth';
import { useNavigate } from 'react-router-dom';

interface SidebarProps {
  restaurantName?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ restaurantName }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    authStorage.logout();
    navigate('/login');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Overview', path: '/products' },
    { icon: Package, label: 'Food Products', path: '/products' },
    { icon: BarChart3, label: 'Review Analytics', path: '/products' },
    { icon: MapPin, label: 'Google Reviews', path: '/products' },
    { icon: Settings, label: 'Settings', path: '/setup' },
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
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? 'bg-lime-500 text-white shadow-sm'
                  : 'text-slate-900 hover:bg-gray-50'
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
