import React, { useState } from "react";
import "./styles/LoveLetter.css";

function LoveLetter() {
  const [open, setOpen] = useState(false);

  return (
    <div className="love-letter">
      <h2>My Dearest</h2>

      <div
        className={`letter-border ${open ? "open" : ""}`}
        onClick={() => setOpen(!open)}
      >
        <div className="letter-header">
          <span className="left-text">A letter for you</span>
          {!open && (
            <span className="right-text">
              <span className="click-text">Click here</span>
              <span className="heart">❤️</span>
            </span>
          )}
        </div>

        {open && (
          <div className="letter-content">
            <p>
              I want to thank you for being patient with me, even when I lose my temper or get moody. 💌<br />
              I want to thank you for always apologizing first, even when I’m the one at fault. 💖 <br />
              I want to thank you for forgiving me so easily, no matter the mistake. 💕<br />
              I want to thank you for always taking care of me and looking out for me. 🌸<br />
              I want to thank you for putting up with my silly, mischievous moments and still loving me.❤️<br /><br />
              THANK YOU for being you — for your patience, your kindness, and for making me feel safe and loved every single day. 🥰
      
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default LoveLetter;
