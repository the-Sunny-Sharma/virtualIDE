"use client";
import React, { useState, useEffect } from "react";
import Loading from "./loading";

// code editor starts here
import Landing from "./_components/Landing";
// code editor ends here

export default function LiveIDE() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div>
      <Landing />
    </div>
  );
}
