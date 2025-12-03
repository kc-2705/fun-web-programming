import React from "react";
import { FaMusic } from "react-icons/fa";
import "./styles/Songs.css";

function Songs() {
  const songs = [
    { name: "Perfect", singer: "Ed Sheeran" },
    { name: "All of Me", singer: "John Legend" },
    { name: "Until I Found You", singer: "Stephen Sanchez" },
  ];

  return (
    <div className="songs-container">
      <h2 className="songs-heading">Songs that remind me of you</h2>
      {songs.map((song, index) => (
        <div key={index} className="song-card">
          <div className="song-header">
            <FaMusic className="music-icon" />
            <span className="song-name">{song.name}</span>
          </div>
          <p className="song-singer">{song.singer}</p>
        </div>
      ))}
    </div>
  );
}

export default Songs;
