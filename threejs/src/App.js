import logo from './logo.svg';
import './App.css';
import LandingPage from './landingpage';
import { Routes, Route } from "react-router-dom";
import VisualizationPage from './VisualizationPage';
import AudioVisualizer from './threejsui';
import AudioVisualizerOne from './threejsui1';
import AudioVisualizerTwo from './threejsui2';
import AudioVisualizerThree from './threejsui3';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage/>}/>
      <Route path="/visualization" element={<VisualizationPage/>}/>
      <Route path="/visualizer/waveform" element={<AudioVisualizerOne/>}/>
      <Route path="/visualizer/spectrum" element={<AudioVisualizerTwo/>}/>
      <Route path="/visualizer/particles" element={<AudioVisualizerThree/>}/>
      <Route path="/visualizer/geometric" element={<AudioVisualizer/>}/>

    </Routes>
  );
}

export default App;
