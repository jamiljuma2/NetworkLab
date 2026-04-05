import React from 'react';
import { motion } from 'framer-motion';

interface StatusIndicatorProps {
  status: 'active' | 'idle' | 'error';
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * StatusIndicator - Animated status dot with label
 * Used throughout the dashboard for system health and activity status
 */
const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status = 'idle',
  label = 'SYSTEM',
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const textSizeClasses = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
  };

  const statusConfig = {
    active: {
      color: 'bg-primary',
      textColor: 'text-primary',
      animation: 'pulse-glow',
    },
    idle: {
      color: 'bg-secondary',
      textColor: 'text-secondary',
      animation: 'opacity',
    },
    error: {
      color: 'bg-severity-critical',
      textColor: 'text-severity-critical',
      animation: 'pulse-glow',
    },
  };

  const config = statusConfig[status];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <motion.div
        className={`
          ${sizeClasses[size]}
          ${config.color}
          rounded-full
          ${config.animation}
        `}
        animate={{
          opacity: status === 'active' ? [1, 0.5, 1] : 1,
        }}
        transition={{
          duration: 2,
          repeat: status === 'active' || status === 'error' ? Infinity : 0,
          ease: 'easeInOut',
        }}
      />
      <span className={`
        font-mono uppercase tracking-widest
        ${textSizeClasses[size]}
        ${config.textColor}
      `}>
        {label} {status === 'active' ? 'ACTIVE' : status === 'error' ? 'ERROR' : 'IDLE'}
      </span>
    </div>
  );
};

export default StatusIndicator;
