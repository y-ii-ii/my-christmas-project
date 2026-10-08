import React from 'react';
import { Scene } from './components/Scene';
import { UI } from './components/UI';
import { HandTracker } from './components/HandTracker';
import './index.css'; // 确保包含 Tailwind 指令

function App() {
  return (
    <div className="w-full h-screen bg-black overflow-hidden relative">
      <Scene />
      <UI />
      <HandTracker />
    </div>
  );
}

export default App;