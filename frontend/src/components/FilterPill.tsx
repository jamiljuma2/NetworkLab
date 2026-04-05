import React from 'react';
import { motion } from 'framer-motion';

interface FilterPillProps {
  label: string;
  count?: number;
  active?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * FilterPill - Reusable filter button component
 * Used in filtering interfaces with optional badge count
 */
const FilterPill: React.FC<FilterPillProps> = ({
  label,
  count,
  active = false,
  onClick,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'px-2 py-1 text-[11px]',
    md: 'px-3 py-1.5 text-xs',
  };

  return (
    <motion.button
      onClick={onClick}
      className={`
        rounded-full font-mono uppercase tracking-wider
        transition-all duration-200
        flex items-center gap-2
        ${sizeClasses[size]}
        ${
          active
            ? 'bg-primary/20 text-primary glow-border'
            : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
        }
        ${className}
      `}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {label}
      {count !== undefined && (
        <motion.span
          className={`
            text-[10px] font-bold px-1.5 py-0.5 rounded-full
            ${active ? 'bg-primary/30' : 'bg-muted/80'}
          `}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          {count}
        </motion.span>
      )}
    </motion.button>
  );
};

export default FilterPill;
