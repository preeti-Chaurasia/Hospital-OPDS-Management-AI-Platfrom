const { createServer } = require("http");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });

const handle = app.getRequestHandler();

app.prepare().then(() => {

  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    socket.on(
"medicineUpdated",
()=>{


io.emit(
"medicineUpdated"
)


}
)

    console.log("Client Connected:", socket.id);

    socket.on("refreshQueue", () => {

      io.emit("queueUpdated");

    });

    socket.on("refreshBeds", () => {

      io.emit("bedsUpdated");

    });

socket.on("prescriptionSaved", () => {


io.emit(
"medicineUpdated"
)


});

    socket.on("labRequested", () => {

      io.emit("labRequested");

    });

    socket.on("disconnect", () => {

      console.log("Disconnected:", socket.id);

    });

  });

  global.io = io;

  httpServer.listen(3000, () => {

    console.log("Server Running on http://localhost:3000");

  });

});