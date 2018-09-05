import React, { Component } from 'react';
import './App.css';

import MainMenu from './components/menu';
import ControlBar from './components/control-bar'
import Oscilloscope from './components/oscilloscope'

class App extends Component {
  render() {
    return (
      <div className="App">
        <MainMenu />
        <div className="flex-container">
          <ControlBar />
          <Oscilloscope width={window.innerWidth} height={window.innerHeight} />
        </div>
      </div>
    );
  }
}

export default App;
