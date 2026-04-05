import React from 'react';
import { motion } from 'framer-motion';
import { GlassCardProps } from '../types/index';

/**
 * GlassCard - Reusable glassmorphism card component
 * Foundation component for all dashboard cards and panels
 */
const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  glowing = false,
  accent = false,
  onClick,
  animated = true,
}) => {
  const baseClasses = 'glass-panel w-full max-w-full min-w-0 rounded-lg p-4';
  
  const glassClasses = glowing
    ? `${baseClasses} glow-border`
    : accent
      ? `${baseClasses} glow-border-accent`
      : baseClasses;

  const finalClasses = `${glassClasses} ${className}`;

  if (!animated) {
    return (
      <div
        className={`${finalClasses} ${onClick ? 'cursor-pointer' : ''}`}
        onClick={onClick}
      >
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={`${finalClasses} ${onClick ? 'cursor-pointer' : ''}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        ease: 'easeOut',
      }}
      whileHover={onClick ? { scale: 1.02 } : {}}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
};

export default GlassCard;
