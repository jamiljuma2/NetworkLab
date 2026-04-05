import React from 'react';
import { motion } from 'framer-motion';
import GlassCard from './GlassCard';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  color?: 'primary' | 'secondary' | 'accent' | 'critical' | 'medium';
  className?: string;
}

/**
 * StatCard - Dashboard metric card component
 * Displays key metrics with icons and optional trend indicators
 */
const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  trend,
  color = 'primary',
  className = '',
}) => {
  const colorClasses = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    accent: 'text-accent',
    critical: 'text-severity-critical',
    medium: 'text-severity-medium',
  };

  return (
    <GlassCard className={`${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
            {label}
          </p>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <p className={`
              text-3xl font-display font-bold
              ${colorClasses[color]}
              glow-text
            `}>
              {value}
            </p>
          </motion.div>

          {trend && (
            <motion.div
              className={`
                text-xs mt-2 font-mono
                ${trend.direction === 'up' ? 'text-primary' : 'text-severity-critical'}
              `}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <span className="mr-1">
                {trend.direction === 'up' ? '↑' : '↓'}
              </span>
              {Math.abs(trend.value)}% from last scan
            </motion.div>
          )}
        </div>

        <motion.div
          className={`
            w-12 h-12 rounded-lg
            flex items-center justify-center
            ${color === 'primary' ? 'bg-primary/20' : 
              color === 'critical' ? 'bg-severity-critical/20' :
              color === 'secondary' ? 'bg-secondary/20' :
              'bg-accent/20'}
            ${colorClasses[color]}
            opacity-40
          `}
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          {icon}
        </motion.div>
      </div>
    </GlassCard>
  );
};

export default StatCard;
