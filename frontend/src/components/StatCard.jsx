import { motion } from "framer-motion";

export default function StatCard({ label, value, tone = "neon", icon }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass rounded-xl border p-4 ${tone === "danger" ? "border-red-400/50" : "border-neon/30"}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-widest text-slate-400">{label}</p>
        {icon ? <span className="text-base opacity-80">{icon}</span> : null}
      </div>
      <p className={`mt-2 font-orbitron text-2xl ${tone === "danger" ? "text-red-300" : "text-neon"}`}>{value}</p>
    </motion.div>
  );
}
