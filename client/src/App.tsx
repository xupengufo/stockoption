import React, { useState } from 'react';
import OptionsAnalyzer from './components/OptionsAnalyzer';
import Header from './components/Header';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <OptionsAnalyzer />
      </main>
    </div>
  );
}

export default App;