import React from 'react';
import { motion } from 'framer-motion';
import { ActivityFeedItem } from '../types/index';
import { formatRelativeTime } from '../utils/helpers';

interface ActivityItemProps extends ActivityFeedItem {
  index?: number;
}

/**
 * ActivityFeedItem - Individual activity stream item
 * Displays notifications and system events
 */
const ActivityFeedItemComponent: React.FC<ActivityItemProps> = ({
  timestamp,
  type,
  title,
  description,
  index = 0,
}) => {
  const typeConfig = {
    critical: {
      color: 'text-severity-critical',
      bgColor: 'bg-severity-critical/10',
      icon: '⚠️',
    },
    warning: {
      color: 'text-severity-medium',
      bgColor: 'bg-severity-medium/10',
      icon: '⚡',
    },
    success: {
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      icon: '✓',
    },
    info: {
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
      icon: 'ⓘ',
    },
  };

  const config = typeConfig[type];

  return (
    <motion.div
      className={`
        rounded-lg p-3 mb-2
        border border-border
        ${config.bgColor}
        hover:border-border/50 transition-all
      `}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ x: 2 }}
    >
      <div className="flex items-start gap-3">
        <span className={`
          text-lg flex-shrink-0 mt-0.5
          ${config.color}
        `}>
          {config.icon}
        </span>

        <div className="flex-1 min-w-0">
          <p className={`
            text-sm font-mono font-semibold
            ${config.color}
          `}>
            {title}
          </p>

          {description && (
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {description}
            </p>
          )}

          <p className="text-[10px] text-muted-foreground/60 mt-1.5 font-mono">
            {formatRelativeTime(timestamp)}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default ActivityFeedItemComponent;
