import React, { useState } from 'react';
import { motion } from 'framer-motion';
import StatusIndicator from './StatusIndicator';
import { useMobile } from '../hooks/useMobile';

interface AppLayoutProps {
  children: React.ReactNode;
  currentPage?: string;
  onNavigate?: (page: string) => void;
}

/**
 * AppLayout - Root application shell with sidebar and top bar
 * Provides consistent layout structure for all pages
 */
const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  currentPage = 'dashboard',
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const isMobile = useMobile();

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'scanner', label: 'Scanner', icon: '🔍' },
    { id: 'vulnerabilities', label: 'Vulns', icon: '⚠️' },
    { id: 'packets', label: 'Packets', icon: '📡' },
    { id: 'labs', label: 'Labs', icon: '🧪' },
    { id: 'reports', label: 'Reports', icon: '📝' },
    { id: 'admin', label: 'Admin', icon: '⚙️' },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <motion.div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        className={`
          fixed lg:relative flex flex-col border-r border-border
          bg-card/50 backdrop-blur-sm z-50 lg:z-0
          h-full overflow-y-auto -translate-x-full lg:translate-x-0
          ${mobileOpen ? 'translate-x-0' : ''}
        `}
        animate={{
          width: isMobile ? 256 : sidebarExpanded ? 240 : 72,
          transition: { duration: 0.25 },
        }}
        initial={false}
      >
        {/* Logo Section */}
        <div className="p-4 flex items-center justify-between border-b border-border">
          <motion.div
            className="flex items-center gap-3"
            whileHover={{ scale: 1.05 }}
          >
            <div className="w-8 h-8 rounded-lg bg-primary/20 glow-border flex items-center justify-center">
              <span className="text-primary text-sm">🛡</span>
            </div>
            {sidebarExpanded && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-display text-sm font-bold text-primary glow-text"
              >
                VULNLAB
              </motion.span>
            )}
          </motion.div>

          {/* Collapse button */}
          <button
            onClick={() => setSidebarExpanded(!sidebarExpanded)}
            className="hidden lg:flex p-1 hover:bg-muted rounded transition-colors"
            aria-label="Toggle sidebar"
          >
            {sidebarExpanded ? '←' : '→'}
          </button>

          {/* Close button on mobile */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1 hover:bg-muted rounded transition-colors"
          >
            <span className="text-sm">✕</span>
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-2">
          {navigationItems.map((item) => (
            <motion.button
              key={item.id}
              className={`
                w-full flex items-center gap-3 px-3 py-2 rounded-lg
                transition-all duration-200
                ${
                  currentPage === item.id
                    ? 'bg-primary/10 text-primary glow-border relative'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }
              `}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="text-lg w-6">{item.icon}</span>
              {sidebarExpanded && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="font-mono text-xs uppercase tracking-wider"
                >
                  {item.label}
                </motion.span>
              )}
              {currentPage === item.id && (
                <motion.div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6
                    bg-primary rounded-r-full"
                  layoutId="active-nav"
                  transition={{ type: 'spring', stiffness: 380, damping: 40 }}
                />
              )}
            </motion.button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <StatusIndicator
            status="active"
            label={sidebarExpanded ? 'SYSTEM' : ''}
            size="sm"
          />
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Bar */}
        <motion.header
          className="h-14 border-b border-border bg-card/50 backdrop-blur-sm
            flex items-center justify-between px-4 md:px-6"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Menu button on mobile */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 hover:bg-muted rounded transition-colors"
            aria-label="Toggle menu"
          >
            <span className="text-base">☰</span>
          </button>

          <div className="flex-1" />

          {/* Status */}
          <div className="flex items-center gap-4">
            <StatusIndicator status="active" label="SYSTEM" size="sm" />

            {/* Avatar */}
            <motion.div
              className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30
                flex items-center justify-center cursor-pointer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-xs font-bold text-primary">AD</span>
            </motion.div>
          </div>
        </motion.header>

        {/* Page Content */}
        <main className="flex-1 min-w-0 overflow-y-auto p-4 md:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
