import express, { Request, Response } from "express";
import { Server as SocketIOServer } from "socket.io";
import { createServer } from "http";
import cors from "cors";

const app = express();
const port = 3001;

app.use(express.json());
app.use(cors());

app.get("/", (req: Request, res: Response) => {
  res.send("Server is running\n");
});

const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const userSockets = new Map<string, string>();
const collaborationRooms = new Map<string, string[]>();

io.on("connection", (socket) => {
  console.log("New client connected.\nSocket id: ", socket.id);

  const username = socket.handshake.query.username as string;
  if (username) {
    userSockets.set(username, socket.id);
    console.log(`${username} -> ${socket.id}`);
  }

  socket.on("message", (messageData: { message: string; sender: string }) => {
    console.log("Received message from client:", messageData);
    io.emit("message", messageData);
  });

  socket.on("roomInputChange", ({ newValue, roomName }) => {
    console.log(" Room A ", newValue);
    socket.to(roomName).emit("liveEdit", newValue);
  });

  socket.on("inputChange", (inputValue: string) => {
    console.log("", inputValue);
    socket.broadcast.emit("inputChange", inputValue);
  });

  socket.on("sendInvite", ({ fromUser, toUser }) => {
    console.log(`Invitation request from ${fromUser} to ${toUser}`);

    const toUserSocketId = userSockets.get(toUser);
    if (toUserSocketId) {
      io.to(toUserSocketId).emit("invitation", { from: fromUser });
      socket.emit("invitationSent", { status: "success", toUser });
    } else {
      socket.emit("invitationSent", { status: "error", toUser });
    }
  });

  socket.on("respondToInvite", ({ from, to, accepted }) => {
    console.log(
      `Invitation response from ${from} to ${to}: ${
        accepted ? "Accepted" : "Declined"
      }`
    );

    const fromSocketId = userSockets.get(from);
    const toUserSocketId = userSockets.get(to);
    if (fromSocketId && toUserSocketId) {
      if (accepted) {
        const roomName = `${from}-${to}`;
        io.to(fromSocketId).emit("invitationResponse", { accepted, roomName });
        io.to(toUserSocketId).emit("invitationResponse", {
          accepted,
          roomName,
        });
      } else {
        io.to(fromSocketId).emit("invitationResponse", { accepted });
      }
    }
  });

  socket.on("joinRoom", ({ roomName, storedUsername }) => {
    console.log("Joining room for", storedUsername);
    socket.join(roomName);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");

    for (const [username, socketId] of userSockets.entries()) {
      if (socketId === socket.id) {
        userSockets.delete(username);
        break;
      }
    }
  });
});

httpServer.listen(port, () => {
  console.log(`Server is listening on http://localhost:${port}`);
});
