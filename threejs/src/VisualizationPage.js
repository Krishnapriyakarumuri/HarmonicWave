import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; 
import "./VisualizationPage.css";

const VisualizationPage = () => {
  const navigate = useNavigate();
  const [selectedStyle, setSelectedStyle] = useState(null);

  const visualizationStyles = [
    { id: "waveform", name: "Waveform", img: "/waveform.jpg" },
    { id: "spectrum", name: "Frequency Spectrum", img: "/img1.png" },
    { id: "particles", name: "Particle Effects", img: "/particle.jpg" },
    { id: "geometric", name: "Geometric Shapes", img: "/img2.png" }
  ];

  const handleSelect = (id) => {
    setSelectedStyle(id);
  };

  const handleVisualize = () => {
    if (selectedStyle) {
      navigate(`/visualizer/${selectedStyle}`); 
    } else {
      alert("Please select a visualization style.");
    }
  };

  return (
    <div className="visualization-container">
      <nav className="navbar">
        <h1 className="logo">HarmonicWave</h1>
        <div className="nav-links">
          <a href="#">User Profile</a>
          <a href="#">History</a>
        </div>
      </nav>

      <h2 className="title">Choose Your Visualization Style</h2>
      <div className="visualization-grid">
        {visualizationStyles.map((style) => (
          <div 
            key={style.id} 
            className={`visualization-card ${selectedStyle === style.id ? "selected" : ""}`} 
            onClick={() => handleSelect(style.id)}
          >
            <img src={style.img} alt={style.name} className="visualization-img" />
            <h3>{style.name}</h3>
            <button className="preview-btn">Preview</button>
          </div>
        ))}
      </div>

      <button className="visualize-btn" onClick={handleVisualize}>
        Visualize
      </button>
    </div>
  );
};

export default VisualizationPage;
