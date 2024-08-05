"use client";
import React, { useState, useEffect } from "react";
import Loading from "./loading";

// code editor starts here
import Landing from "./_components/Landing";
// code editor ends here

export default function IDEPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000); // Adjust the delay as needed (2000ms = 2 seconds)

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
