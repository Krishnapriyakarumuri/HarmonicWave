import React, { useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { PitchDetector } from "pitchy";
import "./AudioVisualizerTwo.css";

// Piano component to render the keyboard
const Piano = ({ activeNote }) => {
    const keys = [
        { note: "C", type: "white", position: 0 },
        { note: "C#", type: "black", position: 0.7 },
        { note: "D", type: "white", position: 1 },
        { note: "D#", type: "black", position: 1.7 },
        { note: "E", type: "white", position: 2 },
        { note: "F", type: "white", position: 3 },
        { note: "F#", type: "black", position: 3.7 },
        { note: "G", type: "white", position: 4 },
        { note: "G#", type: "black", position: 4.7 },
        { note: "A", type: "white", position: 5 },
        { note: "A#", type: "black", position: 5.7 },
        { note: "B", type: "white", position: 6 }
    ];
    
    // Parse the active note to highlight the correct key
    const parseActiveNote = (noteStr) => {
        if (!noteStr) return null;
        return {
            note: noteStr.replace(/[0-9]/g, ''),
            octave: parseInt(noteStr.match(/[0-9]+/)?.[0] || '4')
        };
    };
    
    const parsedActiveNote = parseActiveNote(activeNote);

    return (
        <div className="piano-container">
            <div className="piano">
                {[2, 3, 4, 5, 6].map(octave => (
                    <div key={octave} className="octave">
                        {keys.map((key) => {
                            const isActive = 
                                parsedActiveNote && 
                                parsedActiveNote.note === key.note && 
                                parsedActiveNote.octave === octave;
                            
                            return (
                                <div 
                                    key={`${key.note}${octave}`}
                                    className={`piano-key ${key.type} ${isActive ? 'active' : ''}`}
                                    data-note={`${key.note}${octave}`}
                                >
                                    <span className="note-label">{`${key.note}${octave}`}</span>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
};

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
    const [currentNote, setCurrentNote] = useState(null);
    const audioRef = useRef(null);
    const sourceRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    
    // Clean up all audio resources
    const cleanupAudioResources = () => {
        if (sourceRef.current) {
            sourceRef.current.disconnect();
            sourceRef.current = null;
        }
        if (analyserRef.current) {
            analyserRef.current.disconnect();
            analyserRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
    };

    useEffect(() => {
        // Cleanup function for when component unmounts
        return cleanupAudioResources;
    }, []);

    useEffect(() => {
        if (!audio) return;

        // Cleanup previous audio connections before creating new ones
        cleanupAudioResources();

        // Create new audio context
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioContextRef.current = audioContext;

        // Create analyzer
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        analyserRef.current = analyser;

        // Create media element source
        sourceRef.current = audioContext.createMediaElementSource(audio);
        sourceRef.current.connect(analyser);
        analyser.connect(audioContext.destination);

        const frequencyData = new Uint8Array(analyser.frequencyBinCount);
        const timeDomainData = new Float32Array(analyser.fftSize);
        setAudioData({ analyser, dataArray: frequencyData });

        const detector = PitchDetector.forFloat32Array(analyser.fftSize);

        const detectPitch = () => {
            if (!isPlaying) return;
            analyser.getFloatTimeDomainData(timeDomainData);
            const [pitch, clarity] = detector.findPitch(timeDomainData, audioContext.sampleRate);
            if (clarity > 0.9 && pitch > 0) {
                const noteName = getNoteFromPitch(pitch);
                setCurrentNote(noteName);
                setNotes((prevNotes) => [...prevNotes.slice(-9), noteName]);
            }
            requestAnimationFrame(detectPitch);
        };

        if (isPlaying) {
            audioContext.resume().then(() => {
                detectPitch();
            });
        }

        return () => {
            // This cleanup function will run when audio changes
        };
    }, [audio]);

    // Handle play/pause state changes
    useEffect(() => {
        if (!audio || !audioContextRef.current) return;
        
        if (isPlaying) {
            audioContextRef.current.resume().then(() => {
                // Set up pitch detection
                const timeDomainData = new Float32Array(analyserRef.current.fftSize);
                const detector = PitchDetector.forFloat32Array(analyserRef.current.fftSize);
                
                const detectPitch = () => {
                    if (!isPlaying) return;
                    analyserRef.current.getFloatTimeDomainData(timeDomainData);
                    const [pitch, clarity] = detector.findPitch(timeDomainData, audioContextRef.current.sampleRate);
                    if (clarity > 0.9 && pitch > 0) {
                        const noteName = getNoteFromPitch(pitch);
                        setCurrentNote(noteName);
                        setNotes((prevNotes) => [...prevNotes.slice(-9), noteName]);
                    }
                    if (isPlaying) {
                        requestAnimationFrame(detectPitch);
                    }
                };
                
                detectPitch();
            });
        } else {
            setCurrentNote(null);
        }
    }, [isPlaying]);

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
            if (audio) {
                audio.pause();
                audio.src = '';
                setIsPlaying(false);
            }
            
            // Reset notes
            setNotes([]);
            setCurrentNote(null);
            
            // Create a new audio element
            const audioUrl = URL.createObjectURL(file);
            const newAudio = new Audio(audioUrl);
            newAudio.crossOrigin = "anonymous";
            
            // Set the new audio element
            setAudio(newAudio);
            audioRef.current = newAudio;
        }
    };

    const togglePlayPause = () => {
        if (audio) {
            if (isPlaying) {
                audio.pause();
            } else {
                audio.play().catch(error => {
                    console.error("Error playing audio:", error);
                });
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

            <div className="canvas-container">
                <Canvas camera={{ position: [0, 0, 12] }} style={{ height: "60vh", width: "80vw" }}>
                    <ambientLight intensity={1.5} />
                    <pointLight position={[10, 10, 10]} intensity={2} />
                    {audioData && <VisualizerBars audioData={audioData} />}
                </Canvas>
            </div>

            <Piano activeNote={currentNote} />
        </div>
    );
};

export default AudioVisualizerTwo;