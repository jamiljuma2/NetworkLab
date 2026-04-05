/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      /* ================================================================
         TYPOGRAPHY - VULNLAB FONT STACK
         ================================================================ */
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
        display: ["Orbitron", "sans-serif"],
        orbitron: ["Orbitron", "sans-serif"],
      },

      /* ================================================================
         COLORS - HSL-BASED VULNLAB COLOR SYSTEM
         ================================================================ */
      colors: {
        /* Primary Neon Green */
        neon: "hsl(120 100% 50%)",
        
        /* Semantic Colors */
        primary: "hsl(120 100% 50%)",      /* Neon Green */
        secondary: "hsl(180 100% 40%)",    /* Cyan */
        accent: "hsl(280 100% 60%)",       /* Purple */
        destructive: "hsl(0 85% 55%)",     /* Red */
        
        /* Neutral Palette */
        background: "hsl(220 20% 4%)",
        foreground: "hsl(120 100% 80%)",
        muted: "hsl(220 15% 12%)",
        card: "hsl(220 20% 7%)",
        
        /* Severity Levels - CVSS Mapping */
        critical: "hsl(0 85% 55%)",        /* Red */
        high: "hsl(25 95% 55%)",           /* Orange */
        medium: "hsl(50 95% 55%)",         /* Yellow */
        low: "hsl(200 95% 60%)",           /* Blue */
      },

      /* ================================================================
         BACKGROUNDS
         ================================================================ */
      backgroundColor: {
        glass: "linear-gradient(180deg, hsla(220, 20%, 7%, 0.88), hsla(220, 20%, 4%, 0.9))",
      },

      /* ================================================================
         BOX SHADOWS - NEON GLOW EFFECTS
         ================================================================ */
      boxShadow: {
        neon: "0 0 24px hsla(120, 100%, 50%, 0.22)",
        "neon-sm": "0 0 12px hsla(120, 100%, 50%, 0.15)",
        "neon-lg": "0 0 32px hsla(120, 100%, 50%, 0.3)",
        "accent-glow": "0 0 16px hsla(280, 100%, 60%, 0.3)",
        glass: "0 8px 32px 0 hsla(120, 100%, 50%, 0.1)",
      },

      /* ================================================================
         ANIMATIONS - CYBERPUNK MOTION
         ================================================================ */
      animation: {
        blink: "blink 1s step-start infinite",
        scanline: "animate-scanline 8s linear infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
      },

      keyframes: {
        blink: {
          "0%, 49%": { opacity: "1" },
          "50%, 100%": { opacity: "0" },
        },
        "animate-scanline": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        "pulse-glow": {
          "0%, 100%": {
            opacity: "1",
            boxShadow: "0 0 8px hsla(120, 100%, 50%, 0.3)",
          },
          "50%": {
            opacity: "0.7",
            boxShadow: "0 0 16px hsla(120, 100%, 50%, 0.5)",
          },
        },
      },

      /* ================================================================
         BORDER RADIUS
         ================================================================ */
      borderRadius: {
        panel: "0.75rem",
      },

      /* ================================================================
         SPACING & SIZING
         ================================================================ */
      spacing: {
        gutter: "1rem",
      },

      /* ================================================================
         OPACITY UTILITIES
         ================================================================ */
      opacity: {
        glass: "0.88",
      },

      /* ================================================================
         BACKDROP FILTER (GLASSMORPHISM)
         ================================================================ */
      backdropBlur: {
        glass: "14px",
      },
    },
  },

  /* ====================================================================
     PLUGINS - Custom utility generation
     ==================================================================== */
  plugins: [
    function ({ addUtilities, theme }) {
      const glassUtilities = {
        ".glass-panel": {
          background: "linear-gradient(180deg, hsla(220, 20%, 7%, 0.88), hsla(220, 20%, 4%, 0.9))",
          backdropFilter: "blur(14px)",
          "-webkit-backdrop-filter": "blur(14px)",
          border: "1px solid hsla(120, 100%, 50%, 0.3)",
          borderRadius: "0.75rem",
          boxShadow: "0 8px 32px 0 hsla(120, 100%, 50%, 0.1), inset 0 0 16px hsla(120, 100%, 50%, 0.05)",
        },
        ".glow-text": {
          color: "hsl(120 100% 80%)",
          textShadow: `
            0 0 4px hsla(120, 100%, 50%, 0.4),
            0 0 8px hsla(120, 100%, 50%, 0.3),
            0 0 16px hsla(120, 100%, 50%, 0.2),
            0 0 32px hsla(120, 100%, 50%, 0.15)
          `,
          fontWeight: "600",
          letterSpacing: "0.05em",
        },
        ".glow-border": {
          border: "1px solid hsl(120 100% 50%)",
          boxShadow: `
            0 0 8px hsla(120, 100%, 50%, 0.3),
            0 0 16px hsla(120, 100%, 50%, 0.2),
            inset 0 0 8px hsla(120, 100%, 50%, 0.1)
          `,
        },
        ".glow-border-accent": {
          border: "1px solid hsl(280 100% 60%)",
          boxShadow: `
            0 0 8px hsla(280, 100%, 60%, 0.3),
            0 0 16px hsla(280, 100%, 60%, 0.2),
            inset 0 0 8px hsla(280, 100%, 60%, 0.1)
          `,
        },
        ".terminal-bg": {
          background: "hsl(220 20% 4%)",
          backgroundImage: `
            repeating-linear-gradient(
              0deg,
              hsla(120, 100%, 50%, 0.03),
              hsla(120, 100%, 50%, 0.03) 2px,
              transparent 2px,
              transparent 4px),
            repeating-linear-gradient(
              90deg,
              hsla(120, 100%, 50%, 0.02) 0px,
              hsla(120, 100%, 50%, 0.02) 1px,
              transparent 1px,
              transparent 2px)
          `,
          border: "1px solid hsla(120, 100%, 50%, 0.2)",
          borderRadius: "0.5rem",
          padding: "1rem",
        },
        ".text-terminal": {
          fontFamily: '"JetBrains Mono", monospace',
          color: "hsl(120 100% 80%)",
          fontSize: "0.875rem",
          lineHeight: "1.6",
          letterSpacing: "0.04em",
        },
      };

      addUtilities(glassUtilities);
    },
  ],
};
