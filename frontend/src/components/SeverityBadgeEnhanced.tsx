import React from 'react';
import { SeverityBadgeProps } from '../types/index';
import { getSeverityBg, getSeverityTextColor, getSeverityBorderColor } from '../utils/severity';

/**
 * SeverityBadge - Color-coded severity indicator
 * Displays severity level with CVSS score if provided
 */
const SeverityBadge: React.FC<SeverityBadgeProps> = ({
  severity,
  cvss,
  className = '',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  const bgClass = getSeverityBg(severity);
  const textClass = getSeverityTextColor(severity);
  const borderClass = getSeverityBorderColor(severity);

  const severityText =
    severity.charAt(0).toUpperCase() + severity.slice(1).toUpperCase();

  return (
    <div
      className={`
        rounded-full inline-flex items-center gap-2
        border font-mono font-semibold
        ${sizeClasses[size]}
        ${bgClass}
        ${textClass}
        ${borderClass}
        ${className}
      `}
    >
      <span className="flex-1">{severityText}</span>
      {cvss !== undefined && (
        <span className="ml-1 opacity-80">{cvss.toFixed(1)}</span>
      )}
    </div>
  );
};

export default SeverityBadge;
