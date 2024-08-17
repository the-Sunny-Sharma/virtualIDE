"use client";

import React, { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import IDEPage from "../ide/page";

export default function EditorPage() {
  const [message, setMessage] = useState("");
  const [receivedMessages, setReceivedMessages] = useState<
    { message: string; sender: string }[]
  >([]);
  const [inputValue, setInputValue] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const [username, setUsername] = useState<string>("");
  const [invitee, setInvitee] = useState("");
  const [liveEdit, setLiveEdit] = useState("");
  const [roomName, setRoomName] = useState("");

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    setUsername(storedUsername || "");

    const socketIo = io("http://localhost:3001", {
      query: {
        username: storedUsername,
      },
    });

    socketIo.on("connect", () => {
      console.log("Socket connected:", socketIo.id);
    });

    socketIo.on(
      "message",
      ({ message, sender }: { message: string; sender: string }) => {
        setReceivedMessages((prevMessages) => [
          ...prevMessages,
          { message, sender },
        ]);
      }
    );

    socketIo.on("inputChange", (newvalue: string) => {
      console.log("Received input change:", newvalue);
      setInputValue(newvalue);
    });

    socketIo.on("liveEdit", (newvalue: string) => {
      console.log("Received input change:", newvalue);
      setLiveEdit(newvalue);
    });

    socketIo.on("invitationSent", ({ status, toUser }) => {
      if (status === "success") {
        toast.success(`Invitation sent to ${toUser}`);
      } else {
        toast.error(`Failed to send invitation to ${toUser}`);
      }
    });

    socketIo.on("invitationResponse", ({ accepted, roomName }) => {
      console.log("invitaion REsponse emiiter eexxecuting");
      if (accepted) {
        toast.info("Your request got accepted.\nHappy Collaboration.");
        setRoomName(roomName);
        socketIo.emit("joinRoom", { roomName, storedUsername });
      } else toast.error("Your invitation was rejected");
    });

    socketIo.on("respondToInvite", ({ from, to, accepted }) => {
      console.log(`You `, accepted);
      if (accepted) {
        toast.success("Your invitation got acepted");
      }
    });

    socketIo.on("invitation", ({ from }) => {
      console.log("Invitation received from:", from);
      toast.info(
        <div className="p-2 ">
          <p className="">You have a collaboration invitation from {from}</p>
          <div className="flex flex-col justify-between">
            <button
              className="p-2 bg-green-500 text-white font-bold rounded-md"
              onClick={() => {
                // console.log("Invitation accepted");
                socketIo.emit("respondToInvite", {
                  from: from,
                  to: username,
                  accepted: true,
                });
                toast.success("Invitation accepted");
              }}
            >
              Accept
            </button>
            <button
              className="p-2 bg-red-500 text-white font-bold rounded-md"
              onClick={() => {
                // console.log("Invitation declined");
                socketIo.emit("respondToInvite", {
                  from: from,
                  to: username,
                  accepted: false,
                });
                toast.error("Invitation declined");
              }}
            >
              Decline
            </button>
          </div>
        </div>,
        {
          position: "top-right",
          autoClose: false,
          closeButton: false,
          draggable: false,
        }
      );
    });

    setSocket(socketIo);

    return () => {
      socketIo.disconnect();
    };
  }, [username]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message === "") {
      alert("Empty message");
      return;
    }
    if (socket && username) {
      const messageData = {
        message,
        sender: username,
      };
      socket.emit("message", messageData);
      setMessage("");
    } else {
      console.log("Socket not initialized or username not found");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    if (socket) {
      socket.emit("inputChange", newValue);
    }
  };

  const handleLiveEdit = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLiveEdit(newValue);
    console.log("New value ", newValue);
    if (socket) {
      socket.emit("roomInputChange", { newValue, roomName });
    }
  };

  const functionThatReturnsPromise = () =>
    new Promise((resolve, reject) => {
      if (socket && invitee && username) {
        console.log("Sending invitation from:", username, "to:", invitee);
        socket.emit("sendInvite", { fromUser: username, toUser: invitee });
        socket.once("invitationSent", ({ status }) => {
          if (status === "success") {
            resolve("Invitation sent successfully");
          } else {
            reject("Failed to send invitation");
          }
        });
      } else {
        reject("Socket not initialized or username/invitee missing");
      }
    });

  const sendInvite = () => {
    toast.promise(functionThatReturnsPromise(), {
      pending: "Sending Invitation...",
      success: "Invitation Sent",
      error: "Failed to Invite",
    });
  };

  return (
    <div className="max-w-[1240px] mx-auto py-16 text-center">
      <div className="community-chat grid grid-rows-none md:grid-cols-5 p-4 gap-4">
        <div className="bg-slate-800 text-white  w-full h-full col-span-2 p-4 -span-2 md:col-span-3 row-span-2">
          <p className="font-bold text-2xl p-2  ">Community Chat</p>
          <div className="messages ">
            <ul
              className={
                receivedMessages.length == 0
                  ? "min-h-[50px] text-slate-400"
                  : "min-h-[50px] text-slate-100"
              }
            >
              {receivedMessages.length == 0
                ? "No Messages to show"
                : receivedMessages.map((msg, index) => (
                    <li key={index} className="flex items-start text-sm">
                      <span className="font-bold pr-3 font-mono ">
                        {msg.sender}
                      </span>
                      {msg.message}
                    </li>
                  ))}
            </ul>
            <input
              className="text-slate-950 rounded p-1 w-[70%]"
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message"
            />
            <button
              disabled={message == ""}
              onClick={sendMessage}
              className={
                message == ""
                  ? "px-3 py-1 bg-slate-400 rounded-md cursor-not-allowed"
                  : "px-3 py-1 bg-slate-500 rounded-md "
              }
            >
              Send
            </button>
          </div>
        </div>

        <div className="w-full h-full col-span-2">
          <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
            Your message
          </label>
          <textarea
            id="message"
            rows={4}
            value={inputValue}
            onChange={handleInputChange}
            className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            placeholder="Write your thoughts here..."
          ></textarea>
        </div>
        <div className="w-full h-full col-span-2">
          <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
            Add a friend
          </label>
          <textarea
            id="message"
            rows={4}
            className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            placeholder="Let's collaborate..."
            value={liveEdit}
            onChange={handleLiveEdit}
          ></textarea>
          <input
            type="text"
            value={invitee}
            onChange={(e) => setInvitee(e.target.value)}
            placeholder="Username"
            className="m-2 px-2 py-1"
          />
          <button
            className="bg-cyan-400 text-white px-3 py-1 rounded-md hover:bg-cyan-700"
            // onClick={sendInvite}
            onClick={sendInvite}
          >
            Send Invitation
          </button>
        </div>
      </div>
      <ToastContainer
        position="top-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
}
