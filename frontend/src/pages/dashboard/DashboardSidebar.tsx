import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { dashboardNavigation } from './dashboardNavigation';
import { Menu, X } from 'lucide-react';

export const DashboardSidebar: React.FC = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-surface border border-border rounded-md text-text-primary shadow-sm"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label="Toggle navigation menu"
      >
        {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Backdrop for mobile */}
      {isMobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:sticky top-0 left-0 z-40 h-screen w-64
        bg-surface border-r border-border
        transform transition-transform duration-300 ease-in-out
        flex flex-col
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Brand Header */}
        <div className="h-16 flex items-center px-lg border-b border-border mb-md md:mb-0">
          <div className="flex items-center gap-sm text-primary font-bold text-xl tracking-tight">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            ProfitLens
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-md py-md space-y-xs overflow-y-auto">
          <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-sm px-sm">
            Analytics
          </div>
          
          {dashboardNavigation.map((item) => (
            <NavLink
              key={item.route}
              to={item.route}
              onClick={() => setIsMobileOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-md px-sm py-2 rounded-md transition-colors duration-fast text-sm font-medium
                ${isActive 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-text-secondary hover:bg-bg/50 hover:text-text-primary'
                }
              `}
            >
              <item.icon size={18} className="opacity-80" />
              {item.title}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};
