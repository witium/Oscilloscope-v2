import React, { Component } from 'react';
import './App.css';
import { Button } from 'semantic-ui-react'


import MainMenu from './components/menu';
import ControlBar from './components/control-bar'
import Oscilloscope from './components/oscilloscope'

let audioContext = null;

class App extends Component {
  constructor(){
    super();
    this.oscilloscope = React.createRef();
    this.controlbar = React.createRef();

    this.state = {
      width: window.innerWidth,
      height: window.innerHeight,
      started: false,
      sustainFreq: false,
      timbre: false,
      timbreType: 'Pure'
    }
  }


handleResize= () => {
  this.setState({width: window.innerWidth, height: window.innerHeight});
}

startOscilloscope = () => {
  if (!this.state.started){
    audioContext = new(window.AudioContext || window.webkitAudioContext)();
    this.setState({started: true});
  }
}

onAudioEvent = (signals) =>{

  this.oscilloscope.current.renderCanvas(signals)
}

handlesustainFreqToggle = () => {
  if(this.state.sustainFreq){
    this.controlbar.current.releaseAll(false);
  }
  this.setState({sustainFreq: !this.state.sustainFreq});
}

handleTimbreToggle = () =>{
  if(this.state.timbre){
    this.setState({timbre: false, timbreType: 'Pure'});
  } else {
    this.setState({timbre: true, timbreType: 'Complex'});
    this.controlbar.current.generateComplexWeights();
  }
}


  render() {
      // let backgroundColor = "yellow";
      let color;
      if(this.state.timbre){
        color = "red";
      } else {
        color = "teal";
      }

    return (
      <div className="App" onClick={this.startOscilloscope}>
        <MainMenu />
        {this.state.started ?
          <React.Fragment>
            <ControlBar
            width={this.state.width/4}
            height={this.state.height}
            handleResize={this.handleResize}
            context={audioContext}
            onAudioEvent={this.onAudioEvent}
            sustainFreq={this.state.sustainFreq}
            timbreType={this.state.timbreType}
            ref={this.controlbar}/>
            <Oscilloscope
            width={3*this.state.width/4}
            height={this.state.height}
            handleResize={this.handleResize}
            renderSignals={this.state.renderSignals}
            ref={this.oscilloscope}/>
            <Button
            className="timbre-button"
            color={color}
            onClick={this.handleTimbreToggle}>
            {this.state.timbreType}
            </Button>
            <Button
            className="sustain-button"
            toggle
            active={this.state.sustainFreq}
            onClick={this.handlesustainFreqToggle}>
            Sustain
            </Button>
            <Button
            className="lock-freq-button"
            toggle
            active={this.state.sustainFreq}
            onClick={this.handlesustainFreqToggle}>
            Lock Frequency
            </Button>
            <Button
            className="lock-amp-button"
            toggle
            active={this.state.sustainFreq}
            onClick={this.handlesustainFreqToggle}>
            Lock Amplitude
            </Button>

          </React.Fragment>:
          <p className="flashing">Click or tap anywhere on the canvas to start the signal generator</p>
        }
      </div>
    );
  }
}

export default App;
