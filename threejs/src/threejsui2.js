import React, { useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { PitchDetector } from "pitchy";
import "./AudioVisualizerTwo.css";

const VisualizerBars = ({ audioData }) => {
  const barsRef = useRef([]);

  useFrame(({ clock }) => {
    if (barsRef.current.length && audioData) {
      const { analyser, dataArray } = audioData;
      analyser.getByteFrequencyData(dataArray);

      barsRef.current.forEach((bar, i) => {
        const scale = (dataArray[i] / 255) * 5;
        bar.scale.y = Math.max(scale, 0.1);
        bar.rotation.y = clock.getElapsedTime() * 0.5;
        bar.position.z = Math.sin(clock.getElapsedTime() + i * 0.1) * 2;
      });
    }
  });

  const numBars = 64;
  const radius = 6;

  return (
    <>
      {new Array(numBars).fill().map((_, i) => {
        const angle = (i / numBars) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        return (
          <mesh
            key={i}
            ref={(el) => (barsRef.current[i] = el)}
            position={[x, y, 0]}
          >
            <boxGeometry args={[0.3, 1, 0.2]} />
            <meshStandardMaterial
              color={`hsl(${(i / numBars) * 300}, 100%, 50%)`}
              emissive={`hsl(${(i / numBars) * 300}, 100%, 30%)`}
              emissiveIntensity={1.5}
            />
          </mesh>
        );
      })}
    </>
  );
};

const AudioVisualizerTwo = () => {
  const [audio, setAudio] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioData, setAudioData] = useState(null);
  const [notes, setNotes] = useState([]);
  const audioRef = useRef(null);
  const sourceRef = useRef(null);
  const audioContextRef = useRef(null);

  useEffect(() => {
    if (!audio) return;

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    audioContextRef.current = audioContext;

    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    const frequencyData = new Uint8Array(analyser.frequencyBinCount);
    const timeDomainData = new Float32Array(analyser.fftSize);

    const source = audioContext.createMediaElementSource(audio);
    sourceRef.current = source;
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    setAudioData({ analyser, dataArray: frequencyData });

    const detector = PitchDetector.forFloat32Array(analyser.fftSize);

    const detectPitch = () => {
      analyser.getFloatTimeDomainData(timeDomainData);
      const [pitch, clarity] = detector.findPitch(timeDomainData, audioContext.sampleRate);
      if (clarity > 0.9) {
        const noteName = getNoteFromPitch(pitch);
        setNotes((prevNotes) => [...prevNotes.slice(-9), noteName]);
      }
      if (isPlaying) {
        requestAnimationFrame(detectPitch);
      }
    };

    audio.addEventListener("play", detectPitch);
    return () => {
      if (sourceRef.current) sourceRef.current.disconnect();
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [audio, isPlaying]);

  const getNoteFromPitch = (frequency) => {
    const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const A4 = 440;
    const noteNumber = Math.round(12 * Math.log2(frequency / A4)) + 69;
    const octave = Math.floor(noteNumber / 12) - 1;
    const noteIndex = noteNumber % 12;
    return `${noteNames[noteIndex]}${octave}`;
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const audioUrl = URL.createObjectURL(file);
      const newAudio = new Audio(audioUrl);
      setAudio(newAudio);
      audioRef.current = newAudio;
    }
  };

  const togglePlayPause = () => {
    if (audio) {
      if (isPlaying) {
        audio.pause();
      } else {
        audio.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="visualizer-container">
      <div className="controls">
        <label htmlFor="file-input" className="file-input-label">
          Choose File
          <input
            type="file"
            id="file-input"
            accept="audio/*"
            onChange={handleFileUpload}
            className="file-input"
          />
        </label>
        <button onClick={togglePlayPause} disabled={!audio} className="play-button">
          {isPlaying ? "⏸️ Pause" : "▶️ Play"}
        </button>
      </div>

      <div className="notes-display">
        <h3>Detected Notes:</h3>
        <div className="notes-list">
          {notes.map((note, index) => (
            <span key={index} className="note">
              {note}
            </span>
          ))}
        </div>
      </div>

      <Canvas camera={{ position: [0, 0, 12] }} style={{ height: "80vh", width: "80vw" }}>
        <ambientLight intensity={1.5} />
        <pointLight position={[10, 10, 10]} intensity={2} />
        {audioData && <VisualizerBars audioData={audioData} />}
      </Canvas>
    </div>
  );
};

export default AudioVisualizerTwo;
