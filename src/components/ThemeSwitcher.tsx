"use client";

import React, { useState, useEffect } from "react";
import { IoMoon, IoSunny } from "react-icons/io5";
import { useTheme } from "next-themes";

export default function ThemeSwitcher() {
  const { systemTheme, theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  const currentTheme = theme === "system" ? systemTheme : theme;

  return (
    <div className="theme-switcher items-center ml-5 md:ml-12">
      {currentTheme === "dark" ? (
        <button
          type="button"
          className={`dark-mode-switch cursor-pointer mr-6 w-[40px] h-[40px] p-[10px] rounded-full border `}
          onClick={() => setTheme("light")}
        >
          <IoMoon className="w-[18px] h-[18px]" />
        </button>
      ) : (
        <button
          type="button"
          className={`light-mode-switch cursor-pointer mr-6 w-[40px] h-[40px] p-[10px] rounded-full border`}
          onClick={() => setTheme("dark")}
        >
          <IoSunny className="w-[18px] h-[18px]" />
        </button>
      )}
    </div>
  );
}
