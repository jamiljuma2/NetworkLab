const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const authRoutes = require("./routes/auth");
const scansRoutes = require("./routes/scans");
const dashboardRoutes = require("./routes/dashboard");
const vulnRoutes = require("./routes/vulnerabilities");
const packetRoutes = require("./routes/packets");
const labsRoutes = require("./routes/labs");
const topologyRoutes = require("./routes/topology");
const reportsRoutes = require("./routes/reports");
const adminRoutes = require("./routes/admin");
const { env } = require("./config/env");

function createApp() {
  const app = express();
  const allowedOrigins = new Set(env.clientOrigins);

  // Render (and most PaaS providers) sit behind a reverse proxy.
  app.set("trust proxy", 1);

  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.has(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`CORS blocked for origin: ${origin}`));
      },
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan("dev"));

  app.get("/health", (req, res) => {
    res.json({ status: "ok", service: "networklab-backend", time: new Date().toISOString() });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/scans", scansRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/vulnerabilities", vulnRoutes);
  app.use("/api/packets", packetRoutes);
  app.use("/api/labs", labsRoutes);
  app.use("/api/topology", topologyRoutes);
  app.use("/api/reports", reportsRoutes);
  app.use("/api/admin", adminRoutes);

  app.use((err, req, res, next) => {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  });

  return app;
}

module.exports = { createApp };
