import React from 'react';
import { motion } from 'framer-motion';
import {
  GlassCard,
  SeverityBadge,
  TerminalOutput,
  PageHeader,
  StatCard,
  FilterPill,
  ActivityFeedItem,
} from './index';
import { formatDateTime } from '../utils/helpers';
import { api } from '../api/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

/**
 * DashboardShowcase - Comprehensive component demonstrating VULNLAB UI patterns
 * Shows usage of all reusable components in a realistic dashboard context
 */
const DashboardShowcase: React.FC = () => {
  const [activeFilter, setActiveFilter] = React.useState('all');
  const [overview, setOverview] = React.useState<any>(null);
  const [vulnerabilities, setVulnerabilities] = React.useState<any[]>([]);
  const [latestScan, setLatestScan] = React.useState<any>(null);

  const loadData = React.useCallback(async () => {
    try {
      const [overviewRes, vulnRes, scanRes] = await Promise.all([
        api.get('/api/dashboard/overview'),
        api.get('/api/vulnerabilities', { params: { severity: 'all', q: '' } }),
        api.get('/api/scans'),
      ]);

      setOverview(overviewRes.data);
      setVulnerabilities(vulnRes.data || []);
      setLatestScan(scanRes.data?.[0] || null);
    } catch {
      setOverview(null);
      setVulnerabilities([]);
      setLatestScan(null);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Prepare chart data
  const chartData = overview
    ? [
        { severity: 'Critical', count: overview.vulnerabilitiesBySeverity?.Critical || 0 },
        { severity: 'High', count: overview.vulnerabilitiesBySeverity?.High || 0 },
        { severity: 'Medium', count: overview.vulnerabilitiesBySeverity?.Medium || 0 },
        { severity: 'Low', count: overview.vulnerabilitiesBySeverity?.Low || 0 },
      ]
    : [];

  const filteredVulns = vulnerabilities.filter((vuln) =>
    activeFilter === 'all' ? true : vuln.severity?.toLowerCase() === activeFilter
  );

  const feedItems = (overview?.feed || []).slice(0, 8).map((item: any) => ({
    id: item.id,
    timestamp: new Date(item.createdAt || Date.now()),
    type:
      item.type === 'critical'
        ? 'critical'
        : item.type === 'warning'
          ? 'warning'
          : item.type === 'success'
            ? 'success'
            : 'info',
    title: item.message || 'System activity',
    description: item.actor ? `Actor: ${item.actor}` : undefined,
  }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Security Dashboard"
        subtitle="Real-time network monitoring and vulnerability assessment"
        icon="🛡️"
        action={
          <motion.button
            className="btn-primary"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={loadData}
          >
            ↻ Refresh
          </motion.button>
        }
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Hosts"
          value={latestScan?.hosts?.length || 0}
          icon="🖥️"
          color="primary"
          trend={{ value: 23, direction: 'up' }}
        />
        <StatCard
          label="Critical Vulns"
          value={overview?.vulnerabilitiesBySeverity?.Critical || 0}
          icon="⚠️"
          color="critical"
          trend={{ value: 8, direction: 'down' }}
        />
        <StatCard
          label="Active Scans"
          value={overview?.activeScans || 0}
          icon="🔍"
          color="secondary"
          trend={{ value: 12, direction: 'up' }}
        />
        <StatCard
          label="Threats"
          value={(overview?.vulnerabilitiesBySeverity?.Critical || 0) + (overview?.vulnerabilitiesBySeverity?.High || 0)}
          icon="🚨"
          color="medium"
          trend={{ value: 5, direction: 'down' }}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Vulnerability Chart */}
        <GlassCard className="lg:col-span-2" glowing>
          <h3 className="text-xl font-display font-bold text-primary glow-text mb-4">
            Vulnerability Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(120, 120, 120, 0.2)" />
              <XAxis dataKey="severity" stroke="rgba(120, 120, 120, 0.5)" />
              <YAxis stroke="rgba(120, 120, 120, 0.5)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(220 20% 7%)',
                  border: '1px solid hsl(120 100% 50%)',
                }}
              />
              <Bar
                dataKey="count"
                fill="hsl(120 100% 50%)"
                radius={[4, 4, 0, 0]}
                opacity={0.8}
              />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Activity Feed */}
        <GlassCard accent className="h-fit">
          <h3 className="text-lg font-display font-bold text-primary glow-text mb-4">
            Activity Feed
          </h3>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {feedItems.map((item: any, index: number) => (
              <ActivityFeedItem
                key={item.id}
                {...item}
                index={index}
              />
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Vulnerabilities Section */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-display font-bold text-primary glow-text">
            Recent Vulnerabilities
          </h3>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-border">
          <FilterPill
            label="All"
            count={vulnerabilities.length}
            active={activeFilter === 'all'}
            onClick={() => setActiveFilter('all')}
          />
          <FilterPill
            label="Critical"
            count={vulnerabilities.filter((v) => v.severity?.toLowerCase() === 'critical').length}
            active={activeFilter === 'critical'}
            onClick={() => setActiveFilter('critical')}
          />
          <FilterPill
            label="High"
            count={vulnerabilities.filter((v) => v.severity?.toLowerCase() === 'high').length}
            active={activeFilter === 'high'}
            onClick={() => setActiveFilter('high')}
          />
        </div>

        {/* Vulnerability List */}
        <div className="space-y-3">
          {filteredVulns.slice(0, 3).map((vuln, index) => (
            <motion.div
              key={vuln.id}
              className="p-3 rounded-lg bg-muted/40 border border-border hover:border-border/50 transition-all"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-foreground mb-1">
                    {vuln.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mb-2">
                    {vuln.description}
                  </p>
                  <p className="text-xs font-mono text-muted-foreground/60">
                    Affected: {vuln.affected.host}:{vuln.affected.port || 'N/A'}
                  </p>
                </div>
                <SeverityBadge severity={vuln.severity} cvss={vuln.cvss} size="sm" />
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>

      {/* Scan Terminal */}
      <GlassCard>
        <h3 className="text-lg font-display font-bold text-primary glow-text mb-4">
          Latest Scan Output
        </h3>
        <TerminalOutput
          lines={latestScan?.logs || []}
          blinking
        />
      </GlassCard>

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground">
        Last updated: {formatDateTime(new Date())}
      </div>
    </div>
  );
};

export default DashboardShowcase;
