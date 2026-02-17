import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { NotificationCenter } from './NotificationCenter';


interface HeaderProps {
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
            {title}
          </Link>
          <div className="flex items-center gap-4">
            <NotificationCenter />
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" />
              <span className="text-sm text-gray-700">Welcome, {user?.name || 'User'}</span>
              {(user?.role === 'Administrator' || user?.role === 'QA') && (
                <>
                  <Link
                    to="/admin/upload"
                    className="ml-4 px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                  >
                    Upload & Assign
                  </Link>
                  <Link
                    to="/admin/trainings"
                    className="ml-2 px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700"
                  >
                    Admin Panel
                  </Link>
                </>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};