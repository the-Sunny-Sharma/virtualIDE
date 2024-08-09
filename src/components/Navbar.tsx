"use client";

import Link from "next/link";
import ThemeSwitcher from "./ThemeSwitcher";
import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { IoCodeSlash } from "react-icons/io5";
import { usePathname } from "next/navigation";
import { SiPinetwork } from "react-icons/si";
import { FaLaptopCode } from "react-icons/fa";

export default function Navbar() {
  const { systemTheme, theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    setUsername(storedUsername);
  }, []);

  if (!mounted) return null;
  const currentTheme = theme === "system" ? systemTheme : theme;

  return (
    <nav className="navbar w-full px-5 py-3 shadow-lg sm:px-20">
      <div className="flex items-center">
        <section className="nav-left mr-auto text-xl sm:text-2xl">
          <Link className="font-bold" href={"/"}>
            CodeNest
          </Link>{" "}
          {pathname === "/ide" ? "IDE" : ""}
          {pathname === "/liveEditor" ? "Collaborative IDE" : ""}
        </section>
        <p className="m-auto lg:text-lg md:text-md text-sm">Phase - 1</p>
        <ul className="nav-links flex  gap-4 md:gap-2 items-center ">
          <li
            className={
              currentTheme === "dark"
                ? "hover:bg-white hover:rounded-md p-2 hover:text-black md:block hidden"
                : "hover:bg-purple-400 hover:rounded-md p-2 hover:text-white md:block hidden"
            }
          >
            <Link href="/ide" className="flex justify-center align-middle p-1">
              <IoCodeSlash className="inline text-2xl mr-2" />
              Code
            </Link>
          </li>
          <li
            className={
              currentTheme === "dark"
                ? "hover:bg-white hover:rounded-md p-2 hover:text-black md:block hidden"
                : "hover:bg-purple-400 hover:rounded-md p-2 hover:text-white md:block hidden"
            }
          >
            <Link
              href="/liveEditor"
              className="flex justify-center align-middle p-1"
            >
              <SiPinetwork className="inline text-2xl mr-2" />
              CodeRoom
            </Link>
          </li>
          <li
            className={
              currentTheme === "dark"
                ? "hover:bg-white hover:rounded-md p-2 hover:text-black md:block hidden"
                : "hover:bg-purple-400 hover:rounded-md p-2 hover:text-white md:block hidden"
            }
          >
            <Link
              href="/liveIDE"
              className="flex justify-center align-middle p-1"
            >
              <FaLaptopCode className="inline text-2xl mr-2" />
              LiveIDE
            </Link>
          </li>

          {/* ---------------Mobile view START------------------ */}
          <li
            className={
              currentTheme === "dark"
                ? "hover:bg-white hover:rounded-md p-1 hover:text-black md:hidden"
                : "hover:bg-purple-400 hover:rounded-md p-1 hover:text-white md:hidden"
            }
          >
            <Link href="/ide" className="flex justify-center align-middle p-1">
              <IoCodeSlash className="inline text-2xl mr-1" />
            </Link>
          </li>
          <li
            className={
              currentTheme === "dark"
                ? "hover:bg-white hover:rounded-md p-1 hover:text-black md:hidden"
                : "hover:bg-purple-400 hover:rounded-md p-1 hover:text-white md:hidden"
            }
          >
            <Link
              href="/liveEditor"
              className="flex justify-center align-middle p-1"
            >
              <SiPinetwork className="inline text-2xl mr-1" />
            </Link>
          </li>
          <li
            className={
              currentTheme === "dark"
                ? "hover:bg-white hover:rounded-md p-1 hover:text-black md:hidden"
                : "hover:bg-purple-400 hover:rounded-md p-1 hover:text-white md:hidden"
            }
          >
            <Link
              href="/liveIDE"
              className="flex justify-center align-middle p-1"
            >
              <FaLaptopCode className="inline text-2xl mr-1" />
            </Link>
          </li>
          {/* ---------------Mobile view END------------------ */}

          <li
            className={
              currentTheme === "dark"
                ? "py-2 px-4 rounded bg-purple-600 hover:bg-purple-400 text-black"
                : "py-2 px-4 rounded bg-purple-500 hover:bg-purple-800 text-white"
            }
          >
            {username ? (
              <Link href="/#">{username}</Link>
            ) : (
              <Link href="/register">Register</Link>
            )}
          </li>
        </ul>

        <ThemeSwitcher />
      </div>
    </nav>
  );
}
