import React, { useState } from "react";
import Home from "./components/Home";
import MainPage from "./components/MainPage";
import "./App.css";

function App() {
  const [access, setAccess] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  const handleEnter = (code) => {
    if (code === "myLove") {
      setShowWelcome(true);
      setTimeout(() => {
        setAccess(true);
      }, 3000);
    } else {
      alert("Try again my love ❤️");
    }
  };

  if (access) return <MainPage />;
  if (showWelcome)
  return (
    <div className="welcome-screen">
      <h1 className="floating-text">Welcome my love, enjoy your stay 💖</h1>
      <div className="hearts-bg"></div>
    </div>
  );
  return <Home onEnter={handleEnter} />;
}

export default App;
