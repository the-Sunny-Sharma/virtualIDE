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
const collaborationRooms = new Map<string, string[]>(); // roomId => [userId1, userId2]
const pendingInvitations = new Map<string, { from: string; to: string }>();

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

  socket.on("inputChange", (inputValue: string) => {
    console.log("Received input change:", inputValue);
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

  socket.on("respondToInvite", ({ fromUser, toUser, accepted }) => {
    console.log(
      `Invitation response from ${toUser} to ${fromUser}: ${
        accepted ? "Accepted" : "Declined"
      }`
    );

    const fromUserSocketId = userSockets.get(fromUser);
    const toUserSocketId = userSockets.get(toUser);

    if (accepted) {
      const roomId = `${fromUser}-${toUser}`;
      collaborationRooms.set(roomId, [fromUser, toUser]);

      if (fromUserSocketId) {
        io.to(fromUserSocketId).emit("invitationResponse", { status: true });
        io.to(fromUserSocketId).emit("collaborationStarted", { withU: toUser });
      }
      if (toUserSocketId) {
        io.to(toUserSocketId).emit("collaborationStarted", { withU: fromUser });
      }

      pendingInvitations.delete(toUser);
    } else {
      if (fromUserSocketId) {
        io.to(fromUserSocketId).emit("invitationResponse", { status: false });
      }
      pendingInvitations.delete(toUser);
    }
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
