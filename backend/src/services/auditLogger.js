const fs = require("fs");
const path = require("path");
const { generateId } = require("./store");

/**
 * Comprehensive audit logging for all security-sensitive operations
 * Logs are persisted to disk and indexed in memory
 */

const logsDir = path.join(__dirname, "../../logs");
const auditLogsFile = path.join(logsDir, "audit.log");

// Ensure logs directory exists
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const auditLogs = [];

function parseDate(isoString) {
  return new Date(isoString);
}

function logEvent(eventType, details) {
  const event = {
    id: generateId("aud"),
    timestamp: new Date().toISOString(),
    eventType,
    ...details,
  };

  auditLogs.unshift(event);
  if (auditLogs.length > 5000) {
    auditLogs.pop(); // Keep only recent logs in memory
  }

  // Persist to disk asynchronously
  const logLine = JSON.stringify(event) + "\n";
  fs.appendFile(auditLogsFile, logLine, (err) => {
    if (err) console.error("Failed to write audit log:", err);
  });

  return event;
}

// ===== EVENT TYPES =====

/**
 * Log scan initiation
 */
function logScanInitiated({ scanId, userId, userRole, target, scanType, isProduction, consentProvided }) {
  return logEvent("SCAN_INITIATED", {
    scanId,
    userId,
    userRole,
    target,
    scanType,
    isProduction,
    consentProvided,
    severity: isProduction ? "HIGH" : "MEDIUM",
  });
}

/**
 * Log scan completion
 */
function logScanCompleted({ scanId, userId, status, hostsFound, portsFound, duration }) {
  return logEvent("SCAN_COMPLETED", {
    scanId,
    userId,
    status,
    hostsFound,
    portsFound,
    duration,
  });
}

/**
 * Log scan stopped by user
 */
function logScanStopped({ scanId, userId, reason }) {
  return logEvent("SCAN_STOPPED", {
    scanId,
    userId,
    reason,
  });
}

/**
 * Log access to production/sensitive targets
 */
function logProductionAccess({ userId, userRole, target, action, allowed, reason }) {
  return logEvent("PRODUCTION_ACCESS_ATTEMPT", {
    userId,
    userRole,
    target,
    action,
    allowed,
    reason,
    severity: "HIGH",
  });
}

/**
 * Log authorization failures
 */
function logAuthorizationFailure({ userId, userRole, action, reason }) {
  return logEvent("AUTHORIZATION_FAILURE", {
    userId,
    userRole,
    action,
    reason,
    severity: "HIGH",
  });
}

/**
 * Log rate limit violations
 */
function logRateLimitViolation({ userId, userRole, action, limit, current }) {
  return logEvent("RATE_LIMIT_VIOLATION", {
    userId,
    userRole,
    action,
    limit,
    current,
  });
}

/**
 * Log validation failures (input validation, etc.)
 */
function logValidationFailure({ userId, target, error, reason }) {
  return logEvent("VALIDATION_FAILURE", {
    userId,
    target,
    error,
    reason,
  });
}

/**
 * Log vulnerability discovered
 */
function logVulnerabilityDetected({ scanId, userId, ip, port, service, vulnerability, severity }) {
  return logEvent("VULNERABILITY_DETECTED", {
    scanId,
    userId,
    ip,
    port,
    service,
    vulnerability,
    severity,
  });
}

/**
 * Retrieve audit logs with filtering
 */
function getAuditLogs({
  eventType = null,
  userId = null,
  startDate = null,
  endDate = null,
  limit = 100,
} = {}) {
  let results = [...auditLogs];

  if (eventType) {
    results = results.filter((log) => log.eventType === eventType);
  }

  if (userId) {
    results = results.filter((log) => log.userId === userId);
  }

  if (startDate) {
    const start = parseDate(startDate);
    results = results.filter((log) => parseDate(log.timestamp) >= start);
  }

  if (endDate) {
    const end = parseDate(endDate);
    results = results.filter((log) => parseDate(log.timestamp) <= end);
  }

  return results.slice(0, limit);
}

/**
 * Generate audit report
 */
function generateAuditReport({ startDate, endDate } = {}) {
  const logs = getAuditLogs({
    startDate,
    endDate,
    limit: 10000,
  });

  const report = {
    generatedAt: new Date().toISOString(),
    period: {
      start: startDate,
      end: endDate,
    },
    summary: {
      totalEvents: logs.length,
      byEventType: {},
      byUserRole: {},
      highSeverityEvents: 0,
    },
    events: logs,
  };

  logs.forEach((log) => {
    report.summary.byEventType[log.eventType] = (report.summary.byEventType[log.eventType] || 0) + 1;
    report.summary.byUserRole[log.userRole] = (report.summary.byUserRole[log.userRole] || 0) + 1;
    if (log.severity === "HIGH") {
      report.summary.highSeverityEvents += 1;
    }
  });

  return report;
}

module.exports = {
  logEvent,
  logScanInitiated,
  logScanCompleted,
  logScanStopped,
  logProductionAccess,
  logAuthorizationFailure,
  logRateLimitViolation,
  logValidationFailure,
  logVulnerabilityDetected,
  getAuditLogs,
  generateAuditReport,
};
