import React from "react";
import "./styles/Notes.css";

function Notes() {
  const reminders = [
    "Take care always 💕",
    "Eat on time 🍽️",
    "Sleep well 🌙",
    "Smile often 😊",
    "Remember I love you ❤️",
  ];

  return (
    <div className="notes-wrapper">
      <h2 className="notes-heading">Small reminders for you</h2>
      <div className="notes-container">
        {reminders.map((note, index) => (
          <div key={index} className="note-card">
            {note}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Notes;
