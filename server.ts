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

  ///////////////////////////////////////////////////////////////

  // Message handling
  socket.on("message", (messageData: { message: string; sender: string }) => {
    console.log("Received message from client:", messageData);
    io.emit("message", messageData);
  });

  // Room input change handling
  socket.on("roomInputChange", ({ newValue, roomName }) => {
    console.log(" Room A ", newValue);
    socket.to(roomName).emit("liveEdit", newValue);
  });

  // Input change handling
  socket.on("inputChange", (inputValue: string) => {
    // console.log("", inputValue);
    socket.broadcast.emit("inputChange", inputValue);
  });

  // Sending and responding to invites
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
        io.to(fromSocketId).emit("invitationResponse", {
          accepted,
          roomName,
          from,
          to,
        });
        io.to(toUserSocketId).emit("invitationResponse", {
          accepted,
          roomName,
          from,
          to,
        });
      } else {
        io.to(fromSocketId).emit("invitationResponse", { accepted });
      }
    }
  });

  // Room joining
  socket.on("joinRoom", ({ roomName, storedUsername }) => {
    console.log("Joining room for", storedUsername);
    socket.join(roomName);
  });
  ////////////////////////////////////////////////////////////////////

  //---------------------listerner for liveIDE-----------------------
  // Live IDE help request handling
  socket.on("askHelp", ({ student, teacher }) => {
    const date = new Date();
    console.log(`Help request from ${student} to ${teacher} `, date.toString());
    const teacherSocID = userSockets.get(teacher);
    const studentSocID = userSockets.get(student);
    if (teacherSocID && studentSocID) {
      io.to(teacherSocID).emit("helpRequest", student);
      io.to(studentSocID).emit("helpStatus", { status: "success", teacher });
    } else {
      if (studentSocID)
        io.to(studentSocID).emit("helpStatus", { status: "error", teacher });
    }
  });

  socket.on("helpResponse", ({ teacher, student, accepted }) => {
    console.log(
      `response from ${teacher} to ${student}: ${
        accepted ? "Accepted" : "Declined"
      }`
    );
    const teacherSocID = userSockets.get(teacher);
    const studentSocID = userSockets.get(student);
    if (teacherSocID && studentSocID) {
      if (accepted) {
        //generate room id
        const roomName = `${teacherSocID}-${studentSocID}`;

        //get student code and send roomName
        io.to(studentSocID).emit("getCode", { teacher, roomName });

        //give teacher roomName to join
        io.to(teacherSocID).emit("responseFeedback", {
          roomName,
          student,
        });
      } else {
        io.to(studentSocID).emit("requestDenied", { teacherName: teacher });
      }
    }
  });

  socket.on("teacherRoomJoin", ({ roomName, teacher, student }) => {
    console.log(`teacher ${teacher} joined room ${roomName}`);
    socket.join(roomName);
    // io.to(roomName).emit("teacherJoined", {teacher, student});
  });

  socket.on(
    "studentJoinRoom",
    ({ student, teacher, roomName, studentCode }) => {
      console.log(`student ${student} joined room ${roomName}`);
      const teacherSocID = userSockets.get(teacher);
      if (teacherSocID)
        io.to(teacherSocID).emit("updateCode", { studentCode, student });
      socket.join(roomName);
    }
  );

  socket.on("codeUpdateInRoom", ({ roomName, code }) => {
    console.log("Detected changes in room", roomName, " -> ", code);
    io.to(roomName).emit("codeUpdate", { code });
  });
  //---------------------------------------------

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
