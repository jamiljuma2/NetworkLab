require("dotenv").config();

const env = {
  port: Number(process.env.PORT || 4000),
  jwtSecret: process.env.JWT_SECRET || "change-me-in-production",
  jwtTtl: process.env.JWT_TTL || "8h",
  databaseUrl: process.env.DATABASE_URL || "",
  clientOrigins: (process.env.CLIENT_ORIGINS || process.env.CLIENT_ORIGIN || "http://localhost:5173,http://localhost:4173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
};

module.exports = { env };
