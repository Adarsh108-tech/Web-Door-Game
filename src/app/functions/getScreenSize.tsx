"use client";

import { useState, useEffect } from "react";

function useScreenSize() {
  const [screenWidth, setScreenWidth] = useState<number>(1024);
  const [screenHeight, setScreenHeight] = useState<number>(768);
  const [isClient, setIsClient] = useState<boolean>(false);

  useEffect(() => {
    setIsClient(true);
    const handleResize = () => {
      setScreenHeight(window.innerHeight);
      setScreenWidth(window.innerWidth);
    };

    handleResize();

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return { screenWidth, screenHeight, isClient };
}

export default useScreenSize;
