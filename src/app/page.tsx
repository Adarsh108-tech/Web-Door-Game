"use client"

import { useState, useEffect } from "react";
import useKeyPress from "./components/useKeyPress";
import useScreenSize from "./functions/getScreenSize";
import Data from "../../public/assets/Data.json";

export default function Home() {
  const player_right = "/assets/left_walk.gif";
  const player_left = "/assets/right_walk.gif";
  const player_front = "/assets/walk_front.gif";
  const player_back = "/assets/walk_up.gif";

  const [currentPage, setCurrentPage] = useState(16);
  const { screenHeight, screenWidth } = useScreenSize();

  const [Player_sprite, setPlayerSprite] = useState(player_front);
  const [direction, setDirection] = useState("");
  const [top, setTop] = useState(280); // Initial vertical position
  const [left, setLeft] = useState(490); // Initial horizontal position
  const [speed, setSpeed] = useState(15); // Movement speed

  // Door positions and properties
  const [doors, setDoors] = useState([
    { name: "Door1", top: 50, left:  550, change: -6, isNearby: false },
    { name: "Door2", top: screenHeight - 375, left: 150, change: -1, isNearby: false },
    { name: "Door3", top: 250, left: screenWidth - 150, change: +1, isNearby: false },
    { name: "Door4", top: screenHeight - 150, left: 550, change: +6, isNearby: false },
  ]);

  const proximityThreshold = 50; // Distance in pixels to detect proximity

  // Update proximity to doors
  useEffect(() => {
    const updatedDoors = doors.map((door) => {
      const distance = Math.sqrt(
        Math.pow(door.top - top, 2) + Math.pow(door.left - left, 2)
      );

      return {
        ...door,
        isNearby: distance <= proximityThreshold,
      };
    });

    setDoors(updatedDoors);
  }, [top, left]);

  // Movement functions
  const setUpDirection = () => {
    setDirection("Up");
    setTop((prev) => Math.max(prev - speed, 0)); // Prevent moving out of bounds
    setPlayerSprite(player_back);
  };

  const setDownDirection = () => {
    setDirection("Down");
    setTop((prev) => Math.min(prev + speed, window.innerHeight - 100)); // Prevent moving out of bounds
    setPlayerSprite(player_front);
  };

  const setRightDirection = () => {
    setDirection("Right");
    setLeft((prev) => Math.min(prev + speed, window.innerWidth - 100)); // Prevent moving out of bounds
    setPlayerSprite(player_left);
  };

  const setLeftDirection = () => {
    setDirection("Left");
    setLeft((prev) => Math.max(prev - speed, 0)); // Prevent moving out of bounds
    setPlayerSprite(player_right);
  };

  const increaseSpeed = () => {
    setSpeed((prev) => prev + 5);
  };

  // Key bindings
  useKeyPress("ArrowUp", setUpDirection);
  useKeyPress("ArrowDown", setDownDirection);
  useKeyPress("ArrowLeft", setLeftDirection);
  useKeyPress("ArrowRight", setRightDirection);
  useKeyPress("Space", increaseSpeed);

  // Get current background based on the currentPage state
  const currentBackground =
    Data.find((item) => item.index === currentPage)?.["background_img "] ||
    "/assets/default.jpg";

  return (
  
    <div
      className="h-screen w-screen bg-white relative flex justify-center bg-cover bg-no-repeat"
      style={{ backgroundImage: `url(${currentBackground})` }}
    >
      <h1 className=" mt-0 text-4xl text-white">{currentPage}</h1>
      {/* Player */}
      <img
        id="player"
        src={Player_sprite}
        style={{
          top: `${top}px`,
          left: `${left}px`,
        }}
        className="h-[5em] w-[4em] absolute duration-100 z-10"
        alt="Running Player"
      />

      {/* Doors */}
      {doors.map((door, index) => (
        <a
          key={index}
          href="#"
          className={`absolute text-black p-4 rounded-lg bg-[url('/assets/door_img.png')] bg-contain ${
            door.isNearby
              ? "cursor-pointer text-purple-500 border-2 border-green-500"
              : "cursor-default text-black"
          }`}
          style={{
            top: `${door.top}px`,
            left: `${door.left}px`,
            width: "100px",
            height: "100px",
          }}
          onClick={(e) => {
            if (door.isNearby) {
              e.preventDefault();
              setCurrentPage((prev) => {
                const newPage = prev + door.change;
                // Ensure page index is valid
                return Math.max(1, Math.min(newPage, Data.length));
              });
            } else {
              e.preventDefault();
            }
          }}
        ></a>
      ))}
    </div>
  );
}
