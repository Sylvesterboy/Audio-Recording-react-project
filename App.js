// import logo from './logo.svg';
import './App.css';
import Microphone from './components/Microphone';
import React from 'react';

function App() {
  return (
    <div className="App">
      <header className="p-4 bg-blue-600 text-white">
  <h1 className="text-xl">Deepgram Transcription App</h1>
</header>

      <main className="mt-4">
        <Microphone />
      </main>
    </div>
  );
}

export default App;
