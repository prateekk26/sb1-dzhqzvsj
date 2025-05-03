import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Settings, LogOut, ChevronDown, User, MessageCircle, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext'; 
import { useTheme } from '../context/ConfigContext';
import { Button } from './Button';

interface HeaderProps {
  title?: string;
}

export const Header = React.memo(function Header({ title }: HeaderProps) {
  const navigate = useNavigate();
  const { user, signOut, profile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Display user's first name or fallback to email
  const displayName = profile?.firstName || (user?.email ? user.email.split('@')[0] : 'User');
  
  const handleProfileClick = () => {
    navigate('/complete-profile');
    setShowDropdown(false);
  };
  
  const handleLogout = () => {
   // First close the dropdown
    setShowDropdown(false);
   // Then sign out with a small delay to ensure UI updates first
   setTimeout(() => {
     signOut();
   }, 100);
  };

  return (
    <header className="bg-gray-800 border-b border-gray-700">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center text-4xl md:text-5xl">
            <h1 className="text-4xl md:text-5xl font-bold uppercase text-[#FF8A00] mr-8 cursor-pointer" onClick={() => navigate('/dashboard')}>
              HIRE IQ
            </h1>
            {title && <h2 className="text-white text-lg hidden md:block">{title}</h2>}
          </div>
          
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="mr-2 text-gray-400 hover:text-white"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            
            {user && (
              <div className="relative" ref={dropdownRef}>
                <div 
                  className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  <div className="bg-[#FF8A00]/20 rounded-full p-1.5">
                    <User className="h-5 w-5 text-[#FF8A00]" />
                  </div>
                  <span className="text-white hidden sm:inline">{displayName}</span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </div>
                
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 animate-fadeIn">
                    <div className="py-1">
                      <div className="border-b border-gray-700 pb-2 mb-2 px-4 py-2">
                        <p className="text-white font-medium">{displayName}</p>
                        <p className="text-gray-400 text-sm truncate">{user.email}</p>
                      </div>
                      <button
                        className="w-full text-left px-4 py-2 hover:bg-gray-700 text-white flex items-center"
                        onClick={handleProfileClick}
                      >
                        <Settings className="h-4 w-4 mr-2 text-gray-400" />
                        Profile Settings
                      </button>
                      <button
                        className="w-full text-left px-4 py-2 hover:bg-gray-700 text-white flex items-center"
                        onClick={handleLogout}
                      >
                        <LogOut className="h-4 w-4 mr-2 text-gray-400" />
                        Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
});