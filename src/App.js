import React, { Component } from 'react';
import './App.css';

import MainMenu from './components/menu';
import ControlBar from './components/control-bar'
import Oscilloscope from './components/oscilloscope'

let audioContext = null;

class App extends Component {
  constructor(){
    super();
    this.oscilloscope = React.createRef();
    this.state = {
      width: window.innerWidth,
      height: window.innerHeight,
      started: false
    }
  }

handleResize= () => this.setState({width: window.innerWidth, height: window.innerHeight});

startOscilloscope = () => {
  if (!this.state.started){
    audioContext = new(window.AudioContext || window.webkitAudioContext)();
    this.setState({started: true});
  }
}

onAudioEvent = (signals) =>{

  this.oscilloscope.current.renderCanvas(signals)
}




  render() {
    return (
      <div className="App" onClick={this.startOscilloscope}>
        <MainMenu />
        {this.state.started ?
          <React.Fragment>
            <ControlBar width={this.state.width/4} height={this.state.height} handleResize={this.handleResize} context={audioContext} onAudioEvent={this.onAudioEvent}/>
            <Oscilloscope
            width={3*this.state.width/4}
            height={this.state.height}
            handleResize={this.handleResize}
            renderSignals={this.state.renderSignals}
            ref={this.oscilloscope}/>
          </React.Fragment>:
          <p className="flashing">Click or tap anywhere on the canvas to start the signal generator</p>
        }
      </div>
    );
  }
}

export default App;
