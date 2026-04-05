/**
 * VULNLAB Utility Helpers
 * Common utility functions for UI and data manipulation
 */

import { Severity } from '../types/index';

/**
 * Format bytes to human-readable size
 */
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Format time difference to relative string
 */
export const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString();
};

/**
 * Format percentage with decimals
 */
export const formatPercentage = (value: number, decimals = 1): string => {
  return (value * 100).toFixed(decimals) + '%';
};

/**
 * Truncate text to specified length
 */
export const truncateText = (text: string, length: number): string => {
  return text.length > length ? text.substring(0, length) + '...' : text;
};

/**
 * Check if IP is private
 */
export const isPrivateIP = (ip: string): boolean => {
  const privateRanges = [
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
    /^192\.168\./,
    /^127\./,
    /^::1$/, // IPv6 localhost
    /^fc00:/i, // IPv6 private
  ];
  return privateRanges.some((pattern) => pattern.test(ip));
};

/**
 * Validate IP address format
 */
export const isValidIP = (ip: string): boolean => {
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Pattern = /^(:|([0-9a-fA-F]{0,4}:)){2,7}([0-9a-fA-F]{0,4})?$/;
  
  if (ipv4Pattern.test(ip)) {
    return ip.split('.').every((octet) => parseInt(octet) <= 255);
  }
  return ipv6Pattern.test(ip);
};

/**
 * Validate port number
 */
export const isValidPort = (port: number): boolean => {
  return port >= 1 && port <= 65535;
};

/**
 * Convert CVSS score to severity level
 */
export const cvssToSeverity = (score: number): Severity => {
  if (score >= 9.0) return 'critical';
  if (score >= 7.0) return 'high';
  if (score >= 4.0) return 'medium';
  return 'low';
};

/**
 * Format IP address
 */
export const formatIP = (ip: string): string => {
  return ip.toLowerCase();
};

/**
 * Generate random color for charts
 */
export const getRandomColor = (): string => {
  const colors = ['#00FF00', '#00D4FF', '#FF00FF', '#FFFF00', '#00FFFF'];
  return colors[Math.floor(Math.random() * colors.length)];
};

/**
 * Sanitize user input
 */
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .trim();
};

/**
 * Escape HTML special characters
 */
export const escapeHTML = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

/**
 * Format date and time
 */
export const formatDateTime = (date: Date, includeTime = true): string => {
  const dateStr = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  if (!includeTime) return dateStr;
  
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  return `${dateStr} ${timeStr}`;
};

/**
 * Parse CVSS vector string
 */
export const parseCVSSVector = (vector: string): Record<string, string> => {
  const parts: Record<string, string> = {};
  const metrics = vector.split('/').slice(1);
  metrics.forEach((metric) => {
    const [key, value] = metric.split(':');
    if (key && value) parts[key] = value;
  });
  return parts;
};

/**
 * Download file
 */
export const downloadFile = (data: string, filename: string, type = 'text/plain'): void => {
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Copy to clipboard
 */
export const copyToClipboard = async (text: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.error('Failed to copy:', err);
  }
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number,
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Throttle function
 */
export const throttle = <T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number,
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Generate UUID v4
 */
export const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Deep merge objects
 */
export const deepMerge = <T extends Record<string, any>>(
  target: T,
  source: Partial<T>,
): T => {
  const result: Record<string, any> = { ...target };
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key as keyof T];
      const targetValue = target[key as keyof T];
      if (
        sourceValue &&
        typeof sourceValue === 'object' &&
        !Array.isArray(sourceValue)
      ) {
        result[key] = deepMerge((targetValue || {}) as Record<string, any>, sourceValue as Record<string, any>);
      } else {
        result[key] = sourceValue;
      }
    }
  }
  return result as T;
};
