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
      <ControlBar />
      <Oscilloscope />
      </div>
    );
  }
}

export default App;
