"use client";

import React, { useState, useEffect } from "react";
import CodeEditorWindow from "./CodeEditorWindow";
import axios from "axios";
import { classnames } from "../_utils/general";
import { languageOptions } from "../_constants/languageOptions";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { defineTheme } from "../_lib/defineTheme";
import useKeyPress from "../_hooks/useKeyPress";
//Footer
import OutputWindow from "./OutputWindow";
import CustomInput from "./CustomInput";
import OutputDetails from "./OutputDetails";
import ThemeDropdown from "./ThemeDropdown";
import LanguagesDropdown from "./LanguagesDropdown";
import { io, Socket } from "socket.io-client";

interface LanguageOption {
  id: number;
  label: string;
  name: string;
  value: string;
}

interface ThemeOption {
  label: string;
  value: string;
  key: string;
}

interface OutputDetails {
  // Define the properties of output details according to your API response
  status?: {
    id: number;
  };
  stdout?: string;
  stderr?: string;
  compile_output?: string;
}

const javascriptDefault = "//Code here";

export default function Landing() {
  const [username, setUsername] = useState<string>("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const [code, setCode] = useState<string>(javascriptDefault);
  const [customInput, setCustomInput] = useState<string>("");
  const [outputDetails, setOutputDetails] = useState<OutputDetails | undefined>(
    undefined
  );
  const [processing, setProcessing] = useState<boolean | null>(null);
  const [theme, setTheme] = useState<ThemeOption>({
    label: "Cobalt",
    value: "cobalt",
    key: "cobalt",
  });
  const [language, setLanguage] = useState<LanguageOption | null>(
    languageOptions[0]
  );
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [isButtonFrozen, setIsButtonFrozen] = useState(false);

  const [isCollaborating, setIsCollaborting] = useState<boolean>(false);
  const [receiverName, setReceiverName] = useState("");
  const [roomName, setRoomName] = useState("");
  const [studentCode, setStudentCode] = useState<string>(code);
  const [myStoredCode, setMyStoredCode] = useState<string>("");

  const enterPress = useKeyPress("Enter");
  const ctrlPress = useKeyPress("Control");

  const onSelectChange = (sl: LanguageOption | null) => {
    console.log("selected Option...", sl);
    setLanguage(sl);
  };

  useEffect(() => {
    if (enterPress && ctrlPress) {
      console.log("enterPress", enterPress);
      console.log("ctrlPress", ctrlPress);
      handleCompile();
    }
  }, [ctrlPress, enterPress]);

  useEffect(() => {
    defineTheme("oceanic-next").then(() =>
      setTheme({
        value: "oceanic-next",
        label: "Oceanic Next",
        key: "oceanic-next",
      })
    );
  }, []);

  const handleCompile = () => {
    setProcessing(true);
    const formData = {
      language_id: language?.id,
      source_code: btoa(code),
      stdin: btoa(customInput),
    };

    // console.log("formData:", formData);
    // console.log("API URL:", process.env.NEXT_PUBLIC_RAPID_API_URL);
    // console.log("API Host:", process.env.NEXT_PUBLIC_RAPID_API_HOST);
    // console.log("API Key:", process.env.NEXT_PUBLIC_RAPID_API_KEY);

    const options = {
      method: "POST",
      url: process.env.NEXT_PUBLIC_RAPID_API_URL + "/submissions/",
      params: { base64_encoded: "true", fields: "*" },
      headers: {
        "content-type": "application/json",
        "X-RapidAPI-Host": process.env.NEXT_PUBLIC_RAPID_API_HOST,
        "X-RapidAPI-Key": process.env.NEXT_PUBLIC_RAPID_API_KEY,
      },
      data: formData,
    };
    axios
      .request(options)
      .then(function (response) {
        console.log("res.data", response.data);
        const token = response.data.token;
        checkStatus(token);
      })
      .catch((err) => {
        let error = err.response ? err.response.data : err;
        // get error status
        let status = err.response ? err.response.status : "Network Error";
        console.log("status", status);
        if (status === 429) {
          console.log("too many requests", status);

          showErrorToast(
            `Quota of 100 requests exceeded for the Day! Please read the blog on freeCodeCamp to learn how to setup your own RAPID API Judge0!`,
            10000
          );
        }
        setProcessing(false);
        console.log("catch block...", error);
      });
  };

  const handleThemeChange = (theme: ThemeOption | null) => {
    if (theme) {
      console.log("theme...", theme);
      if (["light", "vs-dark"].includes(theme.value)) {
        setTheme(theme);
      } else {
        defineTheme(theme.value).then(() => setTheme(theme));
      }
    }
  };

  const checkStatus = async (token: string) => {
    const options = {
      method: "GET",
      url: process.env.NEXT_PUBLIC_RAPID_API_URL + "/submissions/" + token,
      params: { base64_encoded: "true", fields: "*" },
      headers: {
        "X-RapidAPI-Host": process.env.NEXT_PUBLIC_RAPID_API_HOST,
        "X-RapidAPI-Key": process.env.NEXT_PUBLIC_RAPID_API_KEY,
      },
    };
    try {
      let response = await axios.request(options);
      let statusId = response.data.status?.id;

      // Processed - we have a result
      if (statusId === 1 || statusId === 2) {
        // still processing
        setTimeout(() => {
          checkStatus(token);
        }, 2000);
        return;
      } else {
        setProcessing(false);
        setOutputDetails(response.data);
        showSuccessToast(`Compiled Successfully!`);
        console.log("response.data", response.data);
        return;
      }
    } catch (err) {
      console.log("err", err);
      setProcessing(false);
      showErrorToast();
    }
  };

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    setUsername(storedUsername || "");

    const socketIo = io("http://localhost:3001", {
      query: {
        username: storedUsername,
      },
    });

    socketIo.on("connect", () => {
      console.log(socketIo);
      console.log(`Socket Connected\n@${socketIo.id}`);
    });

    socketIo.on("helpRequest", (student: string) => {
      const date = new Date();
      console.log("Help request from : ", student, " ", date.toString());
      toast.info(
        <div className="p-2">
          <p className="text-sm text-gray-600">Help Request from {student}</p>
          <div className="flex flex-col justify-between">
            <button
              className="p-2 bg-green-500 text-white font-bold rounded-md"
              onClick={() => {
                socketIo.emit("helpResponse", {
                  teacher: username,
                  student,
                  accepted: true,
                });
                // toast.success(
                //   "Your current code is on hold.\nHappy Collaboration"
                // );
              }}
            >
              Accept
            </button>
            <button
              className="p-2 bg-red-500 text-white font-bold rounded-md"
              onClick={() => {
                socketIo.emit("helpResponse", {
                  teacher: username,
                  student,
                  accepted: false,
                });
                // toast.error(`Request Declined from ${from}`);
              }}
            >
              Decline
            </button>
          </div>
        </div>,
        {
          position: "top-right",
          autoClose: 10000,
          closeButton: false,
          draggable: false,
        }
      );
    });

    socketIo.on("responseFeedback", ({ roomName, student }) => {
      setMyStoredCode(studentCode);
      toast.info("Your current code is on hold.\nHappy Collaboration");
      setIsCollaborting(true);
      setIsButtonFrozen(true);
      setRoomName(roomName);
      socketIo.emit("teacherRoomJoin", {
        roomName,
        teacher: username,
        student,
      });
    });

    socketIo.on("updateCode", ({ studentCode, student }) => {
      setCode(studentCode);
      console.log("You are viewing code of ", student, "\n", studentCode);
    });

    socketIo.on("codeUpdate", ({ code }) => {
      console.log("code updating ", code);
      setCode(code);
      setStudentCode(code);
    });

    socketIo.on("requestDenied", ({ teacherName }) => {
      toast.error(`Request Rejected by ${teacherName}`);
    });

    setSocket(socketIo);

    return () => {
      console.log("Socket Disconnected");
      socketIo.disconnect();
    };
  }, [username]);

  useEffect(() => {
    if (socket) {
      socket.on("getCode", ({ teacher, roomName }) => {
        console.log("Student code:", studentCode); // studentCode will be the latest value
        setIsCollaborting(true);
        setIsButtonFrozen(true);
        socket.emit("studentJoinRoom", {
          student: username,
          teacher,
          roomName,
          studentCode,
        });
      });
    }

    // Clean up the event listener when the component unmounts
    return () => {
      socket?.off("getCode");
    };
  }, [studentCode, socket]); // This effect runs whenever `studentCode` or `socket` changes

  const onChange = (action: string, data: string) => {
    switch (action) {
      case "code": {
        setCode(data);
        setStudentCode(data);
        console.log(`code is ${code}`);
        console.log(`Student cxode is ${studentCode}`);
        console.log(`Stored code is ${myStoredCode}`);
        if (socket && roomName) {
          socket.emit("codeUpdateInRoom", { roomName, code: data });
        }
        break;
      }
      default: {
        console.warn("case not handled!", action, data);
      }
    }
  };

  const showSuccessToast = (msg?: string) => {
    toast.success(msg || `Compiled Successfully!`, {
      position: "top-right",
      autoClose: 1000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  };

  const showErrorToast = (msg?: string, timer?: number) => {
    toast.error(msg || `Something went wrong! Please try again.`, {
      position: "top-right",
      autoClose: timer ? timer : 1000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  };

  const sendRequest = (receiverName: string) =>
    new Promise((resolve, reject) => {
      if (socket && username && receiverName) {
        socket.emit("askHelp", { student: username, teacher: receiverName });
        socket.once("helpStatus", ({ status, teacher }) => {
          if (status === "success") {
            resolve("Request sent");
          } else {
            reject("Failed to send");
          }
        });
      } else {
        alert("Can't send invitation");
      }
    });

  const hAskHelp = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    // console.log(studentCode);
    setIsButtonDisabled(true); //Disable the button
    console.log("Button Disabled");
    toast.promise(sendRequest(receiverName), {
      pending: "Sending Request",
      success: "Request Sent",
      error: "Failed to send request",
    });

    // Re-enable the button after 10 seconds
    setTimeout(() => {
      setIsButtonDisabled(false);
      console.log("Button Enabled");
    }, 10000); // 10 seconds delay
  };

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <div className="h-4 w-full bg-gradient-to-r from-pink-500 via-blue-500 to-purple-500" />
      <div className="flex flex-row justify-between">
        <div className="flex flex-row">
          <div className="px-4 py-2">
            <LanguagesDropdown onSelectChange={onSelectChange} />
          </div>
          <div className="px-4 py-2">
            <ThemeDropdown
              handleThemeChange={handleThemeChange}
              theme={theme}
            />
          </div>
        </div>
        <div className="flex flex-row p-2 justify-evenly mr-8">
          <input
            type="text"
            placeholder="Enter username"
            className="outline-none border border-purple-800 rounded-md p-1 mr-2"
            value={receiverName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setReceiverName(e.target.value)
            }
          />
          <button
            className={
              isButtonDisabled || isButtonFrozen
                ? "bg-purple-600 hover:bg-purple-800 hover:cursor-not-allowed text-white rounded-md py-1 px-2"
                : "bg-purple-600 hover:bg-purple-400 text-white rounded-md py-1 px-2"
            }
            onClick={hAskHelp}
            disabled={isButtonDisabled || isButtonFrozen} // Disable the button based on state
          >
            Ask Help
          </button>
        </div>
      </div>
      <div className="flex flex-row space-x-4 items-start px-4 py-4 h-[85%]">
        <div className="flex flex-col w-full h-full justify-start items-end">
          <CodeEditorWindow
            code={code}
            onChange={onChange}
            language={language?.value}
            theme={theme.value}
          />
        </div>

        <div className="right-container flex flex-shrink-0 w-[30%] flex-col">
          <OutputWindow outputDetails={outputDetails} />
          <div className="flex flex-col items-end">
            <CustomInput
              customInput={customInput}
              setCustomInput={setCustomInput}
            />
            <button
              onClick={handleCompile}
              disabled={!code}
              className={classnames(
                "mt-4 border-2 border-black z-10 rounded-md shadow-[5px_5px_0px_0px_rgba(0,0,0)] px-4 py-2 hover:shadow transition duration-200 bg-white flex-shrink-0",
                !code ? "opacity-50" : ""
              )}
            >
              {processing ? "Processing..." : "Compile and Execute"}
            </button>
          </div>
          {outputDetails && <OutputDetails outputDetails={outputDetails} />}
        </div>
      </div>
    </>
  );
}
