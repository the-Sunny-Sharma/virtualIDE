"use client";

import React, { useState } from "react";
import axios from "axios";

export default function RegisterPage() {
  const [username, setUsername] = useState<string>("");

  const handleUsername = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent the default form submission behavior
    console.log("Username:", username);
    const url = "http://localhost:3000/userData";

    try {
      const response = await axios.post(url, { username });
      alert(response.data.message || "User registered successfully");
      localStorage.setItem("username", username);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        alert(error.response.data.error || "An error occurred");
      } else {
        alert("An error occurred");
      }
    }
  };

  return (
    <div>
      <form onSubmit={handleUsername}>
        <div className="mt-[30px] relative z-0 sm:w-[400px] m-auto w-[300px]">
          <input
            type="text"
            id="floating_standard"
            className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
            placeholder=" "
            value={username || ""}
            onChange={(e) => {
              setUsername(e.target.value);
            }}
          />
          <label
            htmlFor="floating_standard"
            className="absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto"
          >
            Create Username
          </label>
        </div>
        <div className="w-min m-auto">
          <button
            type="submit"
            className="px-4 py-2 bg-purple-600 rounded-md mt-8 text-white"
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
}
