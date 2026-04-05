let ioRef = null;

function initSocket(io) {
  ioRef = io;
  io.on("connection", (socket) => {
    socket.emit("system:hello", { message: "Connected to NetworkLab realtime stream" });
  });
}

function broadcast(event, payload) {
  if (ioRef) {
    ioRef.emit(event, payload);
  }
}

module.exports = { initSocket, broadcast };
