"use client";
import { useState, useEffect } from "react";
import useKeyPress from "../components/useKeyPress";

export default function Home() {
  const player_right = "/assets/left_walk.gif";
  const player_left = "/assets/right_walk.gif";
  const player_front = "/assets/walk_front.gif";
  const player_back = "/assets/walk_up.gif";

  const [Player_sprite, setPlayerSprite] = useState(player_front);
  const [top, setTop] = useState(280); 
  const [left, setLeft] = useState(490); 
  const [speed, setSpeed] = useState(5); 

  const [doors, setDoors] = useState([
    { name: "Door1", top: 100, left: 150, link: "/", isNearby: false },
    { name: "Door2", top: 500, left: 250, link: "/", isNearby: false },
    { name: "Door3", top: 100, left: 700, link: "/", isNearby: false },
    { name: "Door4", top: 400, left: 800, link: "/", isNearby: false },
  ]);

  const proximityThreshold = 50; 

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

  const setUpDirection = () => {
    setTop((prev) => Math.max(prev - speed, 0)); 
    setPlayerSprite(player_back);
  };

  const setDownDirection = () => {
    setTop((prev) => Math.min(prev + speed, window.innerHeight - 100)); 
    setPlayerSprite(player_front);
  };

  const setRightDirection = () => {
    setLeft((prev) => Math.min(prev + speed, window.innerWidth - 100)); 
    setPlayerSprite(player_left);
  };
  
  const setLeftDirection = () => {
    setLeft((prev) => Math.max(prev - speed, 0)); 
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

  return (
    <div className="h-screen w-screen bg-white relative flex justify-center items-center bg-[url('/assets/back2.jpg')] bg-cover bg-no-repeat">
      <img
        id="player"
        src={Player_sprite}
        style={{
          top: `${top}px`,
          left: `${left}px`,
        }}
        className="h-[5em] w-[5em] absolute duration-100"
        alt="Running Player"
      />

      {doors.map((door, index) => (
        <a
          key={index}
          href={door.isNearby ? door.link : "#"}
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
            if (!door.isNearby) {
              e.preventDefault();
            }
          }}
        ></a>
      ))}
    </div>
  );
}
