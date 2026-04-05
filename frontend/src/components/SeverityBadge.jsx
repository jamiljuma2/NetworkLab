const styles = {
  Critical: "bg-red-500/20 text-red-300 border-red-400/70",
  High: "bg-orange-500/20 text-orange-300 border-orange-400/70",
  Medium: "bg-yellow-500/20 text-yellow-300 border-yellow-400/70",
  Low: "bg-cyan-500/20 text-cyan-300 border-cyan-400/70",
};

export function cvssToSeverity(score) {
  if (score >= 9) return "Critical";
  if (score >= 7) return "High";
  if (score >= 4) return "Medium";
  return "Low";
}

export default function SeverityBadge({ severity }) {
  return (
    <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${styles[severity] || styles.Low}`}>
      {severity}
    </span>
  );
}
