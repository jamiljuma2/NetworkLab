import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { TerminalOutputProps } from '../types/index';

/**
 * TerminalOutput - CRT-style terminal emulator
 * Displays command output with monospace font and syntax highlighting
 */
const TerminalOutput: React.FC<TerminalOutputProps> = ({
  lines = [],
  blinking = true,
  className = '',
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  const getLineColor = (line: string): string => {
    if (!line) return 'text-foreground';
    if (line.startsWith('[!]')) return 'text-severity-critical';
    if (line.startsWith('[+]')) return 'text-primary';
    if (line.startsWith('[*]')) return 'text-secondary';
    if (line.startsWith('[~]')) return 'text-severity-medium';
    if (line.startsWith('[?]')) return 'text-secondary';
    return 'text-foreground';
  };

  return (
    <div
      className={`
        terminal-bg rounded-lg overflow-hidden
        font-mono text-xs leading-6
        ${className}
      `}
    >
      {/* Terminal Header (macOS style) */}
      <div className="bg-card/80 px-4 py-2 flex items-center gap-2 border-b border-border">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-severity-critical/60" />
          <div className="w-3 h-3 rounded-full bg-severity-high/60" />
          <div className="w-3 h-3 rounded-full bg-severity-medium/60" />
        </div>
        <span className="text-muted-foreground text-xs ml-2">VULNLAB TERMINAL</span>
      </div>

      {/* Terminal Body */}
      <div
        ref={scrollRef}
        className="p-4 max-h-96 overflow-y-auto text-terminal space-y-0"
      >
        {lines.length === 0 ? (
          <div className="text-muted-foreground/50 italic">
            $ Ready for command execution...
          </div>
        ) : (
          lines.map((line, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`${getLineColor(line)} whitespace-pre-wrap break-words`}
            >
              {line}
            </motion.div>
          ))
        )}

        {/* Blinking cursor */}
        {blinking && lines.length > 0 && (
          <span className="inline-block w-2 h-4 bg-primary animate-blink ml-1" />
        )}
      </div>
    </div>
  );
};

export default TerminalOutput;
