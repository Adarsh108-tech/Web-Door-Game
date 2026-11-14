import { useEffect, useRef } from "react";

function useKeyPress(
  targetKey: string | string[],
  handler: (event: KeyboardEvent) => void
) {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const keys = Array.isArray(targetKey) ? targetKey : [targetKey];

    const keyHandler = (event: KeyboardEvent): void => {
      if (keys.includes(event.key) || keys.includes(event.code)) {
        handlerRef.current(event);
      }
    };

    window.addEventListener("keydown", keyHandler);
    return () => {
      window.removeEventListener("keydown", keyHandler);
    };
  }, [targetKey]);
}

export default useKeyPress;
