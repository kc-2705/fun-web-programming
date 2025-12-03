import React, { useState } from "react";
import LoveLetter from "./LoveLetter";
import Songs from "./Songs";
import Notes from "./Notes";
import Gallery from "./Gallery";
import "./styles/MainPage.css";
import { FaHeart, FaMusic, FaStickyNote, FaImage } from "react-icons/fa";

function MainPage() {
  const [tab, setTab] = useState("loveletter");

  const renderTab = () => {
    switch (tab) {
      case "loveletter": return <LoveLetter />;
      case "songs": return <Songs />;
      case "notes": return <Notes />;
      case "gallery": return <Gallery />;
      default: return null;
    }
  };

  return (
    <div className="main-bg">
      <nav>
        <button
          className={tab === "loveletter" ? "active" : ""}
          onClick={() => setTab("loveletter")}
        >
          <FaHeart /> Love Letter
        </button>
        <button
          className={tab === "songs" ? "active" : ""}
          onClick={() => setTab("songs")}
        >
          <FaMusic /> Music
        </button>
        <button
          className={tab === "notes" ? "active" : ""}
          onClick={() => setTab("notes")}
        >
          <FaStickyNote /> Reminders
        </button>
        <button
          className={tab === "gallery" ? "active" : ""}
          onClick={() => setTab("gallery")}
        >
          <FaImage /> Gallery
        </button>
      </nav>

      <div className="main-container">{renderTab()}</div>
    </div>
  );
}

export default MainPage;
