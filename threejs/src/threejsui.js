import React, { useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Leva, useControls } from "leva";
import { Icosahedron } from "@react-three/drei";
import "./AudioViualizer.css";


const VisualizerSphere = ({ audioData, uniforms }) => {
    const meshRef = useRef();
    const lineRef = useRef();
  
    useFrame(() => {
      if (meshRef.current && audioData) {
        const { analyser, dataArray } = audioData;
        analyser.getByteFrequencyData(dataArray);
  
        const averageAmplitude =
          dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        const distortionFactor = 1 + (averageAmplitude / 255) * 0.3;
  
        const positions = meshRef.current.geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
          const x = positions[i];
          const y = positions[i + 1];
          const z = positions[i + 2];
  
          const distance = Math.sqrt(x * x + y * y + z * z);
          const scale = distortionFactor * 1.2;
  
          positions[i] = (x / distance) * 4.5 * scale;
          positions[i + 1] = (y / distance) * 4.5 * scale;
          positions[i + 2] = (z / distance) * 4.5 * scale;
        }
  
        meshRef.current.geometry.attributes.position.needsUpdate = true;
  
        if (lineRef.current) {
          const linePositions = lineRef.current.geometry.attributes.position.array;
          const numPoints = dataArray.length;
  
          for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            const radius = 7 + (dataArray[i] / 255) * 2; // Base radius + amplitude
  
            linePositions[i * 3] = Math.cos(angle) * radius;
            linePositions[i * 3 + 1] = Math.sin(angle) * radius;
            linePositions[i * 3 + 2] = 0;
          }
  
          lineRef.current.geometry.attributes.position.needsUpdate = true;
        }
      }
    });
  
    // 🌀 
    const numPoints = 128;
    const waveGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(numPoints * 3);
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      positions[i * 3] = Math.cos(angle) * 7;
      positions[i * 3 + 1] = Math.sin(angle) * 7;
      positions[i * 3 + 2] = 0;
    }
    waveGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  
    return (
      <>
        <Icosahedron ref={meshRef} args={[5, 64]}>
          <shaderMaterial
            attach="material"
            uniforms={uniforms}
            vertexShader={`
              varying vec3 vPosition;
              void main() {
                  vPosition = position;
                  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              }
            `}
            fragmentShader={`
              uniform float u_red;
              uniform float u_green;
              uniform float u_blue;
              void main() {
                  gl_FragColor = vec4(vec3(u_red, u_green, u_blue), 1.0);
              }
            `}
          />
        </Icosahedron>
  
        {/*  Waveform */}
        <line ref={lineRef}>
          <bufferGeometry attach="geometry" {...waveGeometry} />
          <lineBasicMaterial attach="material" color="white" linewidth={2} />
        </line>
      </>
    );
  };
  

const AudioVisualizer = () => {
  const [audio, setAudio] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioData, setAudioData] = useState(null);
  const audioRef = useRef(new Audio());

  const { red, green, blue } = useControls("Colors", {
    red: { value: 1.0, min: 0, max: 1, step: 0.01 },
    green: { value: 1.0, min: 0, max: 1, step: 0.01 },
    blue: { value: 1.0, min: 0, max: 1, step: 0.01 },
  });

  useControls("Bloom", {
    threshold: { value: 0.5, min: 0, max: 1, step: 0.01 },
    strength: { value: 0.4, min: 0, max: 3, step: 0.01 },
    radius: { value: 0.8, min: 0, max: 1, step: 0.01 },
  });

  useEffect(() => {
    if (audio) {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  
      if (!audioData?.source) {
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        
        const source = audioContext.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioContext.destination);
  
        setAudioData({ analyser, dataArray, source }); 
      }
    }
  }, [audio]);
  

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

  const uniforms = useRef({
    u_red: { value: red },
    u_green: { value: green },
    u_blue: { value: blue },
  }).current;

  useEffect(() => {
    uniforms.u_red.value = red;
    uniforms.u_green.value = green;
    uniforms.u_blue.value = blue;
  }, [red, green, blue]);

  return (
    <div style={{ textAlign: "center", color: "white", position: "relative" }}>
      <Leva collapsed />
      <input type="file" accept="audio/*" onChange={handleFileUpload} />
      <button onClick={togglePlayPause} disabled={!audio}>
        {isPlaying ? "Pause" : "Play"}
      </button>

      <Canvas camera={{ position: [0, 0, 12] }} style={{ height: "80vh", width: "80vw" }}>
        <ambientLight intensity={1.5} />
        <pointLight position={[10, 10, 10]} intensity={2} />
        {audioData && <VisualizerSphere audioData={audioData} uniforms={uniforms} />}
    </Canvas>

    </div>
  );
};

export default AudioVisualizer;
