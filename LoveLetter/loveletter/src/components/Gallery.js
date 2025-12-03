import React from "react";
import "./styles/Gallery.css";

function Gallery() {
  const flowers = [
    "https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?ixlib=rb-4.1.0&auto=format&fit=crop&q=80&w=2127",
    "https://plus.unsplash.com/premium_photo-1676475964992-6404b8db0b53?ixlib=rb-4.1.0&auto=format&fit=crop&q=80&w=1974",
    "https://plus.unsplash.com/premium_photo-1674986175088-2d7dda41f7f8?ixlib=rb-4.1.0&auto=format&fit=crop&q=80&w=687",
    "https://plus.unsplash.com/premium_photo-1661721991306-03493d55b794?ixlib=rb-4.1.0&auto=format&fit=crop&q=80&w=1171",
    "https://images.unsplash.com/photo-1604323990536-e5452c0507c1?ixlib=rb-4.1.0&auto=format&fit=crop&q=80&w=687",
    "https://images.unsplash.com/photo-1565695951564-007d8f297e48?ixlib=rb-4.1.0&auto=format&fit=crop&q=80&w=735",
  ];

  return (
    <div className="gallery-wrapper">
      <h2 className="gallery-heading">Flowers for You</h2>
      <div className="gallery-container">
        {flowers.map((src, i) => (
          <div key={i} className="image-wrapper">
            <img src={src} alt="flower" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default Gallery;
