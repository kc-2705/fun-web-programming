import React, { useState } from "react";
import "./styles/Home.css";

function Home({ onEnter }) {
  const [code, setCode] = useState("");
  const [placeholder, setPlaceholder] = useState("Enter Secret Code myLove");

  const handleClick = () => {
    if (code === "myLove") {
      onEnter(code);
    } else {
      setPlaceholder("Try again my love 💕");
      setCode("");
    }
  };

  return (
    <div className="home-bg">
      <div className="home-container">
        <h2>Enter Secret Code</h2>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={placeholder}
        />
        <button onClick={handleClick}>Enter</button>
      </div>
    </div>
  );
}

export default Home;
