import React, { Component } from 'react';
import './App.css';
import { Button, Icon } from 'semantic-ui-react'


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
      timbre: false,
      timbreType: 'Pure',
      sustain: false,
      lockFreq: false,
      lockAmp: false
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


  handleTimbrePure = () =>{
    this.setState({timbre: false, timbreType: 'Pure'});
    if(this.state.sustain){
      this.controlbar.current.sustainChangeTimbre(false);
    }
  }
  handleTimbreComplex = () =>{
      this.setState({timbre: true, timbreType: 'Complex'});
      if(this.state.sustain){
        this.controlbar.current.sustainChangeTimbre(true);
    } else {
      this.controlbar.current.generateComplexWeights();
    }

  }

  handlesustainToggle = () => {
    if(this.state.sustain){
      this.controlbar.current.releaseAll(false);
    }
    this.setState({sustain: !this.state.sustain});
  }

  handlelockFreqToggle = () => {
    //this.controlbar.current.lockFrequencies();
    this.setState({lockFreq: !this.state.lockFreq});

  }
  handlelockAmpToggle = () => {
    // this.controlbar.current.lockGains();
    this.setState({lockAmp: !this.state.lockAmp});
  }

  restart = () =>{
    this.setState({started: false});
    this.handleResize();
  }


  render() {
      // let backgroundColor = "yellow";
      let pureColor, complexColor, freqIcon, ampIcon;
      if(this.state.timbre){
        pureColor = "red";
        complexColor = "teal";
      } else {
        pureColor = "teal";
        complexColor = "red";
      }
      if(this.state.lockFreq){
        freqIcon = "lock"
      } else {
        freqIcon = "unlock"
      }
      if(this.state.lockAmp){
        ampIcon = "lock"
      } else {
        ampIcon = "unlock"
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
            sustain={this.state.sustain}
            timbreType={this.state.timbreType}
            lockFreq={this.state.lockFreq}
            lockAmp={this.state.lockAmp}
            ref={this.controlbar}/>
            <Oscilloscope
            width={3*this.state.width/4}
            height={this.state.height}
            handleResize={this.handleResize}
            renderSignals={this.state.renderSignals}
            restart={this.restart}
            ref={this.oscilloscope}/>
            <Button.Group className="button-group-container">
              <Button
              className="timbre-button"
              color={pureColor}
              onClick={this.handleTimbrePure}>
              Pure
              </Button>
              <Button
              className="timbre-button"
              color={complexColor}
              onClick={this.handleTimbreComplex}>
              Complex
              </Button>

              <Button
              icon
              className="lock-freq-button"
              toggle
              active={this.state.lockFreq}
              onClick={this.handlelockFreqToggle}>
              <Icon name={freqIcon}/>
              Frequency
              </Button>
              <Button
              icon
              className="lock-amp-button"
              toggle
              active={this.state.lockAmp}
              onClick={this.handlelockAmpToggle}>
              <Icon name={ampIcon}/>
              Amplitude
              </Button>
              <Button
              className="sustain-button"
              toggle
              active={this.state.sustain}
              onClick={this.handlesustainToggle}>
              Sustain
              </Button>
            </Button.Group>
          </React.Fragment>:
          <p className="flashing">Click or tap anywhere on the canvas to start the signal generator</p>
        }
      </div>
    );
  }
}

export default App;
