import React, { Component } from 'react';
import './App.css';
import { Button, Icon, Label, Form, Radio } from 'semantic-ui-react'


import MainMenu from './components/menu';
import ControlBar from './components/control-bar'
import SignalGenerator from './components/signal-generator'

let audioContext = null;

class App extends Component {
  constructor(){
    super();
    this.signalGenerator = React.createRef();
    this.controlbar = React.createRef();

    this.state = {
      width: window.innerWidth,
      height: window.innerHeight,
      started: false,
      timbre: false,
      sustain: false,
      lockFreq: false,
      lockAmp: false,
      showCombinedWaveInfo: false,
      combinedFrequency: 0,
      timbreSelection: "sine",
      fullscreen: false,
      rotateIcon: false,
      rotateIcon2: false,
    }
  }


  handleResize= () => {
    this.setState({width: window.innerWidth, height: window.innerHeight});
  }

  start = () => {
    if (!this.state.started){
      audioContext = new(window.AudioContext || window.webkitAudioContext)();
      this.setState({started: true});
    }
  }

  onAudioEvent = (signals, harmonicSignals, timbre) =>{

    this.signalGenerator.current.renderCanvas(signals, harmonicSignals, timbre)
  }



  // handleTimbrePure = () =>{
  //   this.setState({timbre: false, timbreType: 'pure', timbreSelection: ""});
  //   if(this.state.sustain){
  //     this.controlbar.current.sustainChangeTimbre(false, "sine");
  //   } else {
  //     this.controlbar.current.generateComplexWeights("sine");
  //   }
  // }
  // handleTimbreComplex = () =>{
  //     this.setState({timbre: true, timbreType: 'complex', timbreSelection: ""});
  //     if(this.state.sustain){
  //       this.controlbar.current.sustainChangeTimbre(true, "complex");
  //   } else {
  //     this.controlbar.current.generateComplexWeights("complex");
  //   }
  //
  // }

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

  handleTimbreChange = timbre => {
    this.setState({timbre: timbre !== "sine", timbreSelection: timbre, rotateIcon: false, rotateIcon2: false});
    if(this.state.sustain){
       this.controlbar.current.sustainChangeTimbre(timbre);
    } else {
      this.controlbar.current.generateTimbre(timbre);
    }
    if(this.state.timbreSelection !== "sine" && timbre === "complex"){
      this.setState({rotateIcon: true, rotateIcon2: false})
      if(this.state.timbreSelection === "complex" && this.state.rotateIcon){
          this.setState({rotateIcon: false, rotateIcon2: true})
      }
    }
  }

  // Maximizes screen
  toggleFullScreen = ()=> {
    if ((document.fullScreenElement && document.fullScreenElement !== null) ||
     (!document.mozFullScreen && !document.webkitIsFullScreen)) {
      if (document.documentElement.requestFullScreen) {
        document.documentElement.requestFullScreen();
      } else if (document.documentElement.mozRequestFullScreen) {
        document.documentElement.mozRequestFullScreen();
      } else if (document.documentElement.webkitRequestFullScreen) {
        document.documentElement.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
      }
      this.setState({fullScreen: true});

    } else {
      if (document.cancelFullScreen) {
        document.cancelFullScreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.webkitCancelFullScreen) {
        document.webkitCancelFullScreen();
      }
      this.setState({fullScreen: false});

    }
  }

  restart = () =>{
    this.setState({started: false});
    this.handleResize();
  }


  render() {
      // let backgroundColor = "yellow";
      let pureColor, complexColor, freqIcon, ampIcon, generateClass;

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
      if(this.state.rotateIcon){
        generateClass = "generate-icon rotate-icon"
      } else if(this.state.rotateIcon2) {
        generateClass = "generate-icon rotate-icon2";
      } else {
        generateClass = "generate-icon";
      }

    return (
      <div className="App" onClick={this.start}>
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
              timbre = {this.state.timbre}
              timbreSelection={this.state.timbreSelection}
              lockFreq={this.state.lockFreq}
              lockAmp={this.state.lockAmp}
              ref={this.controlbar}
            />
            <SignalGenerator
              width={3*this.state.width/4}
              height={this.state.height}
              handleResize={this.handleResize}
              renderSignals={this.state.renderSignals}
              drawCombinedInfo={this.drawCombinedInfo}
              restart={this.restart}
              ref={this.signalGenerator}
            />
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
              <div className="lock-freq-container">
                Frequency
                <Button
                icon
                className="lock-freq-button"
                toggle
                active={this.state.lockFreq}
                onClick={this.handlelockFreqToggle}>
                <Icon name={freqIcon}/>
                </Button>
              </div>
              <div className="lock-amp-container">
                Amplitude
                <Button
                icon
                className="lock-amp-button"
                toggle
                active={this.state.lockAmp}
                onClick={this.handlelockAmpToggle}>
                <Icon name={ampIcon}/>
                </Button>
              </div>
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
              onClick={(e)=>this.handleTimbreChange("sine")}>
              Pure
              </Button>
              <div className="complex-button-container">
                <Button
                className="timbre-button timbre-complex"
                color={complexColor}
                onClick={(e)=>this.handleTimbreChange("complex")}>
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
                       onChange={(e)=>this.handleTimbreChange("square")}
                     />
                   </Form.Field>
                   <Form.Field className="timbre-choice-dropdown saw-button">
                     <Radio
                       label='Saw'
                       name='radioGroup'
                       value='sawtooth'
                       checked={this.state.timbreSelection === 'sawtooth'}
                       onChange={(e)=>this.handleTimbreChange("sawtooth")}
                     />
                   </Form.Field>
                   <Form.Field className="timbre-choice-dropdown triangle-button">
                     <Radio
                       label='Triangle'
                       name='radioGroup'
                       value='triangle'
                       checked={this.state.timbreSelection === 'triangle'}
                       onChange={(e)=>this.handleTimbreChange("triangle")}
                     />
                   </Form.Field>
                   <Form.Field className="timbre-choice-dropdown random-button">
                   <div onClick={(e)=>this.handleTimbreChange("complex")} className="random-button-container">
                     <Radio
                       label='Random'
                       name='radioGroup'
                       value='complex'
                       checked={this.state.timbreSelection === 'complex'}
                     />
                     <Icon name="sync alternate" size="small" className={generateClass}/>
                     </div>
                   </Form.Field>
                 </React.Fragment>
               }
               </div>
              </div>
              {/* Full Screen Button */}
              <Button icon onClick={this.toggleFullScreen} className="fullscreenbutton">
              {!this.state.fullScreen ?  <Icon fitted name="expand" color="orange" size="large"/> :
              <Icon fitted name="compress" color="orange" size="large"/> }
              </Button>
          </React.Fragment>:
          <p className="flashing">Click or tap anywhere on the canvas to start the signal generator</p>
        }
      </div>
    );
  }
}

export default App;
