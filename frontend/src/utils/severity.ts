import { Severity } from "../types/index";

export const getSeverityBg = (severity: Severity): string => {
  const backgrounds: Record<Severity, string> = {
    critical: "bg-severity-critical/10",
    high: "bg-severity-high/10",
    medium: "bg-severity-medium/10",
    low: "bg-severity-low/10",
    info: "bg-secondary/10",
  };
  return backgrounds[severity] || backgrounds.low;
};

export const getSeverityTextColor = (severity: Severity): string => {
  const colors: Record<Severity, string> = {
    critical: "text-severity-critical",
    high: "text-severity-high",
    medium: "text-severity-medium",
    low: "text-severity-low",
    info: "text-secondary",
  };
  return colors[severity] || colors.low;
};

export const getSeverityBorderColor = (severity: Severity): string => {
  const borders: Record<Severity, string> = {
    critical: "border-severity-critical",
    high: "border-severity-high",
    medium: "border-severity-medium",
    low: "border-severity-low",
    info: "border-secondary",
  };
  return borders[severity] || borders.low;
};
