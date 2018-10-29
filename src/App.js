import React, { Component } from 'react';
import './App.css';

import MainMenu from './components/menu';
import ControlBar from './components/control-bar'
import Oscilloscope from './components/oscilloscope'

class App extends Component {
  constructor(){
    super();
    this.state = {
      width: window.innerWidth,
      height: window.innerHeight
    }
  }

handleResize= () => this.setState({width: window.innerWidth, height: window.innerHeight})

  render() {
    return (
      <div className="App">
        <MainMenu />
        <div className="flex-container">
          <ControlBar width={this.state.width/4} height={this.state.height} handleResize={this.handleResize}/>
          <Oscilloscope width={3*this.state.width/4} height={this.state.height} handleResize={this.handleResize} />
        </div>
      </div>
    );
  }
}

export default App;
