require("dotenv").config();

const env = {
  port: Number(process.env.PORT || 4000),
  jwtSecret: process.env.JWT_SECRET || "change-me-in-production",
  jwtTtl: process.env.JWT_TTL || "8h",
  databaseUrl: process.env.DATABASE_URL || "",
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  nmapPath: process.env.NMAP_PATH || "",
  nmapUseRaw: process.env.NMAP_USE_RAW === "true",
};

module.exports = { env };
