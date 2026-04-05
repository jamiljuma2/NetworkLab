const http = require("http");
const { Server } = require("socket.io");
const { createApp } = require("./app");
const { env } = require("./config/env");
const { initSocket } = require("./sockets");
const { seedAdmin, addActivity } = require("./services/store");
const { hashPassword } = require("./utils/security");

async function bootstrap() {
  const app = createApp();
  const server = http.createServer(app);
  const isProduction = process.env.NODE_ENV === "production";
  const socketAllowedOrigins = [env.clientOrigin];
  const devOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/;

  if (!isProduction) {
    socketAllowedOrigins.push("http://localhost:5173", "http://127.0.0.1:5173", devOriginPattern);
  }

  const io = new Server(server, {
    cors: {
      origin: socketAllowedOrigins,
      methods: ["GET", "POST"],
    },
  });

  initSocket(io);

  const adminName = process.env.ADMIN_NAME || "Hacker Jamil";
  const adminEmail = process.env.ADMIN_EMAIL || "jumajamil314@gmail.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "Jamil2003";
  const adminHash = await hashPassword(adminPassword);
  seedAdmin({ name: adminName, email: adminEmail, passwordHash: adminHash });
  addActivity("system", "NetworkLab platform initialized", "system");

  server.listen(env.port, () => {
    console.log(`Backend listening on http://localhost:${env.port}`);
    console.log(`Default admin: ${adminEmail} / ${adminPassword}`);
  });
}

bootstrap();
