import { useMemo } from "react";

export default function TerminalOutput({ lines }) {
  const visible = useMemo(() => lines.slice(-18), [lines]);
  const startIndex = Math.max(0, lines.length - 18);

  return (
    <div className="terminal-output rounded-xl border border-neon/30 bg-black/70 p-3 font-mono text-xs text-neon shadow-neon">
      {visible.length === 0 ? <p className="text-slate-500">No terminal output yet.</p> : null}
      {visible.map((line, visibleIndex) => (
        <p key={`line-${startIndex + visibleIndex}`} className="leading-relaxed">
          {line}
        </p>
      ))}
    </div>
  );
}
