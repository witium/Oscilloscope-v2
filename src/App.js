import React, { Component } from 'react';
import './App.css';
import { Button, Icon, Label, Form, Radio } from 'semantic-ui-react'


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
      timbreType: 'pure',
      sustain: false,
      lockFreq: false,
      lockAmp: false,
      showCombinedWaveInfo: false,
      combinedFrequency: 0,
      timbreSelection: ""
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
    this.setState({timbre: false, timbreType: 'pure', timbreSelection: ""});
    if(this.state.sustain){
      this.controlbar.current.sustainChangeTimbre(false, "sine");
    } else {
      this.controlbar.current.generateComplexWeights("sine");
    }
  }
  handleTimbreComplex = () =>{
      this.setState({timbre: true, timbreType: 'complex', timbreSelection: ""});
      if(this.state.sustain){
        this.controlbar.current.sustainChangeTimbre(true, "complex");
    } else {
      this.controlbar.current.generateComplexWeights("complex");
    }

  }

  handleSustainToggle = () => {
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

  drawCombinedInfo = frequency =>{
    if(!isNaN(frequency) && isFinite(frequency) && frequency > 0){
      this.setState({showCombinedWaveInfo: true, combinedFrequency: frequency})
    } else {
      this.setState({showCombinedWaveInfo: false})
    }
  }

  handleTimbreChange = (e, timbre) => {
    if(this.state.sustain){
      this.controlbar.current.sustainChangeTimbre(true, timbre.value);
  } else {
    this.controlbar.current.generateComplexWeights(timbre.value);
  }
    this.setState({timbreSelection: timbre.value});
  }

  restart = () =>{
    this.setState({started: false});
    this.handleResize();
  }


  render() {
      // let backgroundColor = "yellow";
      let pureColor, complexColor, freqIcon, ampIcon;
      if(this.state.timbre){
        pureColor = "";
        complexColor = "red";
      } else {
        pureColor = "teal";
        complexColor = "";
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
            timbreSelection={this.state.timbreSelection}
            lockFreq={this.state.lockFreq}
            lockAmp={this.state.lockAmp}
            ref={this.controlbar}/>
            <Oscilloscope
            width={3*this.state.width/4}
            height={this.state.height}
            handleResize={this.handleResize}
            renderSignals={this.state.renderSignals}
            drawCombinedInfo={this.drawCombinedInfo}
            restart={this.restart}
            ref={this.oscilloscope}/>
            {this.state.showCombinedWaveInfo &&
              <Label className="combined-wave-info">
                <div className="combined-wave-title">Frequency</div>
                <div>{this.state.combinedFrequency} Hz (cycles/second) </div>
                <div className="waveform-container">
                  <div className="waveform-title">Waveform:</div>
                  <hr className="waveform-legend"/>
                </div>
              </Label>
            }
            {/*<Button.Group className="button-group-container">*/}
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
              onClick={this.handleSustainToggle}>
              Sustain
              </Button>
            {/*</Button.Group>*/}
            <div className="waveform-button-container">
              <Button className="waveform-button-title">Waveform</Button>
              <Button
              className="timbre-button timbre-pure"
              color={pureColor}
              onClick={this.handleTimbrePure}>
              Pure
              </Button>
              <div className="complex-button-container">
                <Button
                className="timbre-button timbre-complex"
                color={complexColor}
                onClick={this.handleTimbreComplex}>
                Complex
                </Button>
                {this.state.timbre &&
                  <React.Fragment>
                    <Form.Field className="timbre-choice-dropdown square-button">
                     <Radio
                       label='Square'
                       name='radioGroup'
                       value='square'
                       checked={this.state.timbreSelection === 'square'}
                       onChange={this.handleTimbreChange}
                     />
                   </Form.Field>
                   <Form.Field className="timbre-choice-dropdown saw-button">
                     <Radio
                       label='Saw'
                       name='radioGroup'
                       value='sawtooth'
                       checked={this.state.timbreSelection === 'sawtooth'}
                       onChange={this.handleTimbreChange}
                     />
                   </Form.Field>
                   <Form.Field className="timbre-choice-dropdown triangle-button">
                     <Radio
                       label='Triangle'
                       name='radioGroup'
                       value='triangle'
                       checked={this.state.timbreSelection === 'triangle'}
                       onChange={this.handleTimbreChange}
                     />
                   </Form.Field>
                 </React.Fragment>
               }
               </div>
              </div>
          </React.Fragment>:
          <p className="flashing">Click or tap anywhere on the canvas to start the signal generator</p>
        }
      </div>
    );
  }
}

export default App;
