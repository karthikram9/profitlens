import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth-context';
import { useDashboard } from '../../lib/dashboard-context';
import { UploadCloud, User as UserIcon, LogOut, Settings, Download } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const DashboardTopbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { currentUpload } = useDashboard();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <header className="h-16 bg-surface border-b border-border flex items-center justify-end md:justify-between px-md md:px-xl sticky top-0 z-30 shadow-sm">
      {/* Left side: Mobile spacing (sidebar toggle is absolute), Desktop dataset info */}
      <div className="hidden md:flex flex-col justify-center">
        {currentUpload ? (
          <>
            <span className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <DatabaseIcon /> {currentUpload.originalFilename}
            </span>
            <span className="text-xs text-text-muted">
              Uploaded: {new Date(currentUpload.uploadedAt).toLocaleDateString()}
            </span>
          </>
        ) : (
          <span className="text-sm font-medium text-text-muted">No active dataset</span>
        )}
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-md">
        <Button 
          variant="secondary" 
          onClick={() => navigate('/upload')}
          className="hidden sm:flex text-sm py-1.5 px-3 h-auto"
        >
          <UploadCloud size={16} className="mr-2" />
          Re-upload Data
        </Button>

        {/* User Menu Toggle */}
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors border border-primary/20"
            aria-label="User menu"
            aria-expanded={isMenuOpen}
          >
            <UserIcon size={18} />
          </button>

          {/* Dropdown */}
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-surface border border-border rounded-lg shadow-lg py-1 z-50">
              <div className="px-md py-sm border-b border-border mb-1">
                <p className="text-sm font-medium text-text-primary truncate">
                  {user?.email || 'User'}
                </p>
                <p className="text-xs text-text-muted">Seller Account</p>
              </div>
              
              <button
                onClick={() => { setIsMenuOpen(false); navigate('/dashboard/settings'); }}
                className="w-full text-left px-md py-sm text-sm text-text-primary hover:bg-bg transition-colors flex items-center gap-sm"
              >
                <Settings size={16} />
                Settings
              </button>
              
              <button
                onClick={() => { setIsMenuOpen(false); navigate('/dashboard/export'); }}
                className="w-full text-left px-md py-sm text-sm text-text-primary hover:bg-bg transition-colors flex items-center gap-sm"
              >
                <Download size={16} />
                Export Reports
              </button>

              <button
                onClick={handleLogout}
                className="w-full text-left px-md py-sm text-sm text-danger hover:bg-bg transition-colors flex items-center gap-sm"
              >
                <LogOut size={16} />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

const DatabaseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted">
    <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
  </svg>
);
