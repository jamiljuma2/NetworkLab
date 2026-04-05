/**
 * VULNLAB Type Definitions
 * Production-ready TypeScript types for the cybersecurity dashboard
 */

/* ================================================================
   SEVERITY LEVELS & CVSS
   ================================================================ */

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type ScanStatus = 'idle' | 'running' | 'completed' | 'failed';
export type ScanType = 'tcp' | 'udp' | 'syn' | 'aggressive';
export type UserRole = 'admin' | 'analyst' | 'student';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

/* ================================================================
   NETWORK & SECURITY ENTITIES
   ================================================================ */

export interface Host {
  id: string;
  ip: string;
  hostname?: string;
  os?: string;
  ports: Port[];
  lastScanned: Date;
  vulnerabilities: number;
}

export interface Port {
  number: number;
  protocol: 'tcp' | 'udp';
  service: string;
  version?: string;
  status: 'open' | 'closed' | 'filtered';
  vulnerable: boolean;
}

export interface Vulnerability {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  cvss: number;
  cvssVector?: string;
  cwe?: string;
  affected: {
    host: string;
    port?: number;
    service?: string;
  };
  solution: string;
  references: Array<{
    title: string;
    url: string;
  }>;
  discoveredAt: Date;
}

export interface Packet {
  id: string;
  timestamp: Date;
  source: {
    ip: string;
    port: number;
  };
  destination: {
    ip: string;
    port: number;
  };
  protocol: 'tcp' | 'udp' | 'icmp' | 'dns' | 'http' | 'smb';
  size: number;
  suspicious: boolean;
  severity?: Severity;
  details?: string;
}

export interface ScanResult {
  id: string;
  target: string;
  scanType: ScanType;
  status: ScanStatus;
  progress: number;
  startTime: Date;
  endTime?: Date;
  hostsFound: number;
  portsFound: number;
  vulnerabilitiesFound: number;
  output: string[];
}

export interface LabScenario {
  id: string;
  title: string;
  category: 'Application Security' | 'Network Security' | 'Authentication';
  scenario: string;
  objectives: string[];
  difficulty: Difficulty;
  hints: string[];
  terminal: string[];
  solution: string;
  timeLimit?: number;
  completed?: boolean;
}

export interface ActivityFeedItem {
  id: string;
  timestamp: Date;
  type: 'critical' | 'warning' | 'success' | 'info';
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface SystemStatus {
  overall: 'healthy' | 'degraded' | 'critical';
  components: {
    scanner: boolean;
    database: boolean;
    analysis: boolean;
    reporting: boolean;
  };
  metrics: {
    uptime: string;
    lastUpdate: Date;
    activeSessions: number;
  };
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  avatar?: string;
  lastLogin: Date;
  status: 'active' | 'inactive' | 'locked';
}

export interface DashboardMetrics {
  totalHosts: number;
  vulnerabilities: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  scanProgress: number;
  activeScans: number;
  threatsDetected: number;
}

export interface TrafficData {
  timestamp: Date;
  normal: number;
  suspicious: number;
}

export interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glowing?: boolean;
  accent?: boolean;
  onClick?: () => void;
  animated?: boolean;
}

export interface SeverityBadgeProps {
  severity: Severity;
  cvss?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export interface TerminalOutputProps {
  lines: string[];
  blinking?: boolean;
  className?: string;
}
