import React, { useState, useRef } from "react";
import "./LandingPage.css"; 
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const navigate = useNavigate();
  const [audioFile, setAudioFile] = useState(null); 
  const audioRef = useRef(null); 
  const handleAudioUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith("audio")) {
      setAudioFile(URL.createObjectURL(file)); 
    } else {
      alert("Please upload a valid audio file.");
    }
  };

  const handleVisualize = () => {
    navigate("/visualization");
  };

  return (
    <div className="landing-container">
      <nav className="navbar">
        <h1 className="logo">HarmonicWave</h1>
        <div className="nav-links">
          <a href="#">User Profile</a>
          <a href="#">History</a>
        </div>
      </nav>

      <div className="hero">
        <h2>
          Upload Your <span className="highlight">Music File</span>
        </h2>
        <p>Experience real-time visualizations that sync with your music.</p>

        <div className="upload-section">
          <input
            type="file"
            accept="audio/*"
            id="audioInput"
            onChange={handleAudioUpload}
          />
          <label htmlFor="audioInput" className="upload-btn">
            Upload Audio
          </label>
        </div>
      </div>

      <div className="content">
        <div className="text-section">
          <h3>Experience Your Music Visually</h3>
          <p>
            Watch your music come to life with stunning real-time animations
            that react to every beat and frequency.
          </p>
        </div>

        <div className="visualizer">
          {audioFile ? (
            <>
              <audio ref={audioRef} controls src={audioFile} className="audio-player"></audio>
              <img
                src="/visualizer.gif" 
                alt="Audio Visualizer"
                className="visualizer-img"
              />
              <button className="visualize-btn" onClick={handleVisualize}>
                Visualize
              </button>
            </>
          ) : (
            <p className="placeholder-text">Upload an audio file to visualize!</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
