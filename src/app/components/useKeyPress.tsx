import { useEffect } from "react";

function useKeyPress(targetKey: string, handler: (event: KeyboardEvent) => void) {
    useEffect(() => {
        const keyHandler = (event: KeyboardEvent): void => {
            if (event.key === targetKey) {
                handler(event);
            }
        };

        window.addEventListener("keydown", keyHandler as EventListener);
        return () => {
            window.removeEventListener("keydown", keyHandler as EventListener);
        };
    }, [targetKey, handler]); 
}

export default useKeyPress;
