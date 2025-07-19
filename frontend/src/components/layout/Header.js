import React, { useState } from 'react';
import { 
  UserCircleIcon, 
  Cog6ToothIcon, 
  MagnifyingGlassIcon,
  BellIcon,
  ArrowRightOnRectangleIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useWebSocket } from '../../contexts/WebSocketContext';
import Button from '../common/Button';
import Modal from '../common/Modal';
import AuthModal from '../auth/AuthModal';
import SearchModal from '../search/SearchModal';
import NotificationPanel from '../notifications/NotificationPanel';

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { connected, liveUpdates } = useWebSocket();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const unreadNotifications = liveUpdates.filter(update => !update.read).length;

  return (
    <>
      <header className="app-header">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          {/* Left - Logo and Brand */}
          <div className="flex items-center space-x-4">
            <div className="gradient-border rounded-full p-2">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">I</span>
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">Confessions</h1>
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-gray-400">Powered by Irys</span>
                <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              </div>
            </div>
          </div>

          {/* Center - Search */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <button
              onClick={() => setShowSearchModal(true)}
              className="w-full flex items-center space-x-3 px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl hover:border-cyan-400 transition-colors"
            >
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
              <span className="text-gray-400 text-sm">Search confessions...</span>
              <div className="ml-auto">
                <kbd className="hidden sm:inline-block px-2 py-1 text-xs bg-gray-700 rounded">⌘K</kbd>
              </div>
            </button>
          </div>

          {/* Right - Actions */}
          <div className="flex items-center space-x-4">
            {/* Mobile Search */}
            <button
              onClick={() => setShowSearchModal(true)}
              className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
            >
              <MagnifyingGlassIcon className="w-5 h-5" />
            </button>

            {/* Notifications */}
            <button
              onClick={() => setShowNotifications(true)}
              className="relative p-2 text-gray-400 hover:text-white transition-colors"
            >
              <BellIcon className="w-5 h-5" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              )}
            </button>

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <UserCircleIcon className="w-6 h-6 text-cyan-400" />
                  <span className="hidden sm:block text-sm font-medium">{user?.username}</span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-xl shadow-lg z-50">
                    <div className="py-2">
                      <div className="px-4 py-2 border-b border-gray-700">
                        <p className="text-sm font-medium">{user?.username}</p>
                        <p className="text-xs text-gray-400">
                          {user?.stats?.confession_count || 0} confessions
                        </p>
                      </div>
                      
                      <button className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors">
                        <UserCircleIcon className="w-4 h-4" />
                        <span>Profile</span>
                      </button>
                      
                      <button className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors">
                        <Cog6ToothIcon className="w-4 h-4" />
                        <span>Settings</span>
                      </button>
                      
                      <div className="border-t border-gray-700 mt-2 pt-2">
                        <button
                          onClick={logout}
                          className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-400 hover:bg-gray-700 transition-colors"
                        >
                          <ArrowRightOnRectangleIcon className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAuthModal(true)}
                  icon={UserPlusIcon}
                >
                  <span className="hidden sm:inline">Sign In</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Search Modal */}
      <SearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      {/* Notification Panel */}
      <NotificationPanel
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={liveUpdates}
      />

      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </>
  );
};

export default Header;