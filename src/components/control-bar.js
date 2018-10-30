import React, { Component } from 'react'
import "../styles/control-bar.css"
import Tone from 'tone';
import generateScale from '../util/generateScale';

import { getFreq, getGain, freqToIndex, getMousePos, convertToLog, logspace } from "../util/conversions";
const ticks = 7;
const yLabelOffset = 5;
const NUM_VOICES = 6;
const RAMPVALUE = 0.2;
const CHROMATIC = 3;


export default class ControlBar extends Component {
  constructor(props) {
    super();
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseOut = this.onMouseOut.bind(this);
    // this.onTouchStart = this.onTouchStart.bind(this);
    // this.onTouchEnd = this.onTouchEnd.bind(this);
    // this.onTouchMove = this.onTouchMove.bind(this);
    this.state = {
      mouseDown: false,
      touch: false,
      feedback: false,
      amOn: false,
      fmOn: false,
    }
  }

  componentDidMount() {
    this.ctx = this.canvas.getContext('2d');
    this.renderCanvas();
    Tone.context = this.props.context;

    // Array to hold synthesizer objects. Implemented in a circular way
    // so that each new voice (touch input) is allocated, it is appended to the
    // array until the array is full and it then appends the next voice to array[0]
    this.synths = new Array(NUM_VOICES);
    this.amSignals = new Array(NUM_VOICES);
    this.fmSignals = new Array(NUM_VOICES);
    this.lowChordSynths = new Array(NUM_VOICES);
    this.midChordSynths = new Array(NUM_VOICES);
    this.highChordSynths = new Array(NUM_VOICES);
    this.bendStartPercents = new Array(NUM_VOICES);


    // Start master volume at -20 dB
    this.masterVolume = new Tone.Volume(0);
    this.ctx = this.canvas.getContext('2d');
    let options = {
      oscillator: {
        type: 'sine'//this.props.timbre.toLowerCase()
      },
      envelope: {
        attack: 0.1
      }
    };
    let options2 = {
      oscillator: {
        type: 'sine'
      }
    }

    // For each voice, create a synth and connect it to the master volume
    for (let i = 0; i < NUM_VOICES; i++) {
      this.synths[i] = new Tone.Synth(options);
      this.amSignals[i] = new Tone.Synth(options2);
      this.fmSignals[i] = new Tone.Synth(options2);
      this.lowChordSynths[i] = new Tone.Synth(options);
      this.midChordSynths[i] = new Tone.Synth(options);
      this.highChordSynths[i] = new Tone.Synth(options);

      this.synths[i].connect(this.masterVolume);
      this.amSignals[i].connect(this.synths[i].volume);
      this.amSignals[i].connect(this.lowChordSynths[i].volume);
      this.amSignals[i].connect(this.midChordSynths[i].volume);
      this.amSignals[i].connect(this.highChordSynths[i].volume);
      this.fmSignals[i].connect(this.synths[i].frequency);
      this.fmSignals[i].connect(this.lowChordSynths[i].frequency);
      this.fmSignals[i].connect(this.midChordSynths[i].frequency);
      this.fmSignals[i].connect(this.highChordSynths[i].frequency);
      this.lowChordSynths[i].connect(this.masterVolume);
      this.midChordSynths[i].connect(this.masterVolume);
      this.highChordSynths[i].connect(this.masterVolume);

      this.bendStartPercents[i] = 0;

    }

    this.goldIndices = []; // Array to hold indices on the screen of gold note lines (touched/clicked lines)
    this.masterVolume.connect(Tone.Master); // Master volume receives all of the synthesizer inputs and sends them to the speakers

    // this.reverb = new Tone.Reverb(this.props.reverbDecay*10+0.1); // Reverb unit. Runs in parallel to masterVolume
    // this.reverbVolume = new Tone.Volume(0);
    // this.reverbVolume.connect(Tone.Master);
    // this.masterVolume.connect(this.reverb);
    // this.reverb.generate().then(()=>{
    //   this.reverb.connect(this.reverbVolume);
    // });
    // this.delay = new Tone.FeedbackDelay(this.props.delayTime+0.01, this.props.delayFeedback); // delay unit. Runs in parallel to masterVolume
    // this.masterVolume.connect(this.delay);
    //
    // // this.amSignal.volume.value = -Infinity;
    //
    // this.delayVolume = new Tone.Volume(0);
    // this.delay.connect(this.delayVolume);
    //
    // this.delayVolume.connect(Tone.Master);
    // Sound Off by default
    // this.masterVolume.mute = !this.props.soundOn;
    // Object to hold all of the note-line frequencies (for checking the gold lines)
    this.frequencies = {};

    window.addEventListener("resize", this.handleResize);
  }


  componentWillUnmount() {
    this.masterVolume.mute = true;
    window.removeEventListener("resize", this.handleResize);
  }

  handleResize = () =>{
    this.props.handleResize();
    this.renderCanvas();
  }


  /**
  This Section controls how the Oscillator(s) react to user input
  */
  onMouseDown(e) {
    e.preventDefault(); // Always need to prevent default browser choices
    let pos = getMousePos(this.canvas, e);
    // Calculates x and y value in respect to width and height of screen
    // The value goes from 0 to 1. (0, 0) = Bottom Left corner
    let yPercent = 1 - pos.y / this.props.height;
    let xPercent = 1 - pos.x / this.props.width;
    let freqs = this.getFreq(yPercent);
    let gain = getGain(xPercent);
    this.synths[0].volume.value = gain; // Starts the synth at volume = gain
    this.synths[0].triggerAttack(freqs[0]); // Starts the synth at frequency = freq

    this.ctx.clearRect(0, 0, this.props.width, this.props.height); // Clears canvas for redraw of label
    this.renderCanvas();
    this.label(freqs[0], pos.x, pos.y); // Labels the point
    this.setState({mouseDown: true});
    if(this.props.noteLinesOn){
      // this.renderNoteLines();
    }

  }

  onMouseMove(e) {
    e.preventDefault(); // Always need to prevent default browser choices
    if (this.state.mouseDown) { // Only want to change when mouse is pressed
      // The next few lines are similar to onMouseDown
      let {height, width} = this.props;
      let pos = getMousePos(this.canvas, e);
      let yPercent = 1 - pos.y / height;
      let xPercent = 1 - pos.x / width;
      let gain = getGain(xPercent);
      // let freq = this.getFreq(yPercent)[0];
      let freqs = this.getFreq(yPercent);

      // Remove previous gold indices and update them to new positions
      // this.goldIndices.splice(this.state.currentVoice - 1, 1);
      if(this.props.scaleOn){
        // Jumps to new Frequency and Volume
        this.synths[0].frequency.value = freqs[0];
        this.synths[0].volume.value = gain;
      } else {
        // Ramps to new Frequency and Volume
        this.synths[0].frequency.exponentialRampToValueAtTime(freqs[0], this.props.context.currentTime+RAMPVALUE);
        // Ramp to new Volume
        this.synths[0].volume.exponentialRampToValueAtTime(gain,
          this.props.context.currentTime+RAMPVALUE);
      }

      // Clears the label
      this.ctx.clearRect(0, 0, this.props.width, this.props.height);
      this.renderCanvas();
      this.label(freqs[0], pos.x, pos.y);
      if(this.props.noteLinesOn){
        // this.renderNoteLines();
      }
    }

  }

  onMouseUp(e) {
    e.preventDefault(); // Always need to prevent default browser choices
    // Only need to trigger release if synth exists (a.k.a mouse is down)
    if (this.state.mouseDown) {
      this.synths[0].triggerRelease(); // Relase frequency, volume goes to -Infinity
      this.amSignals[0].triggerRelease();
      this.fmSignals[0].triggerRelease();
      this.setState({mouseDown: false });
      this.goldIndices = [];

      // Clears the label
      this.ctx.clearRect(0, 0, this.props.width, this.props.height);
      this.renderCanvas();
      if(this.props.noteLinesOn){
        // this.renderNoteLines();
      }
    }

  }

  onMouseOut(e) {
    e.preventDefault(); // Always need to prevent default browser choices
    // Only need to trigger release if synth exists (a.k.a mouse is down)
    if (this.state.mouseDown) {
      this.synths[0].triggerRelease(); // Relase frequency, volume goes to -Infinity
      this.amSignals[0].triggerRelease();
      this.fmSignals[0].triggerRelease();
      this.setState({mouseDown: false });
      this.goldIndices = [];

      // Clears the label
      this.ctx.clearRect(0, 0, this.props.width, this.props.height);
      this.renderCanvas();
      if(this.props.noteLinesOn){
        // this.renderNoteLines();
      }
    }

  }

  // Helper function that determines the frequency to play based on the mouse/finger position
  // Also deals with snapping it to a scale if scale mode is on
  getFreq(index) {
    // let {resolutionMax, resolutionMin, height} = this.props;
    let resolutionMax = 20000;
    let resolutionMin = 20;
    let height = this.props.height;
    let freq = getFreq(index, resolutionMin, resolutionMax);
    if (this.props.scaleOn && !this.state.checkButton) {
      //  Maps to one of the 12 keys of the piano based on note and accidental
      let newIndexedKey = this.props.musicKey.value;
      // Edge cases
      if (newIndexedKey === 0 && this.props.accidental.value === 2) {
        // Cb->B
        newIndexedKey = 11;
      } else if (newIndexedKey === 11 && this.props.accidental.value === 1) {
        // B#->C
        newIndexedKey = 0;
      } else {
        newIndexedKey = (this.props.accidental.value === 1)
          ? newIndexedKey + 1
          : (this.props.accidental.value === 2)
            ? newIndexedKey - 1
            : newIndexedKey;
      }
      // Uses generateScale helper method to generate base frequency values
      let s = generateScale(newIndexedKey, this.props.scale.value);
      let name = s.scale[0];
      let note = 0;
      let dist = 20000;
      let harmonic = 0;
      //Sweeps through scale object and plays correct frequency

       let finalJ, finalK;
      for (let j = 1; j < 1500; j = j * 2) {

        for (let k = 0; k < s.scale.length; k++) {

          var check = j * s.scale[k];
          var checkDist = Math.abs(freq - check);
          if (checkDist < dist) {
            dist = checkDist;
            note = check;
            finalJ = j;
            finalK = k;


            name = s.scaleNames[k];
            harmonic = Math.round(Math.log2(j) - 1);
          } else {
            break;
          }
        }
      }
      freq = note;



      let textLabel = name + '' + harmonic;
      this.scaleLabel = textLabel;
      let index = freqToIndex(freq, resolutionMax, resolutionMin, height);

      this.goldIndices[this.state.currentVoice] = index;
      if(this.props.intervalOn){
        let lowerFreq, midFreq, highFreq;
        if(this.props.chordPolyChromatic){
          let finalNote = s.scale[finalK];
          s = generateScale(newIndexedKey, CHROMATIC); //Reference Chromatic scale
          finalK = s.scale.indexOf(finalNote); // Diatonic to chromatic note
          if(finalK + this.props.lowerIntervalValue - 1 >= s.scale.length){
            let lowerIndex = (finalK + this.props.lowerIntervalValue - 1) % s.scale.length;
            lowerFreq = (finalJ*2)*s.scale[lowerIndex];
          } else{
            lowerFreq = finalJ*s.scale[finalK + this.props.lowerIntervalValue - 1];
          }
          if(finalK + this.props.midIntervalValue - 1 >= s.scale.length){
            let midIndex = (finalK + this.props.midIntervalValue - 1) % s.scale.length;
            midFreq = (finalJ*2)*s.scale[midIndex];
          } else{
            midFreq = finalJ*s.scale[finalK + this.props.midIntervalValue - 1];
          }
          if(finalK + this.props.highIntervalValue - 1 >= s.scale.length){
            let highIndex = (finalK + this.props.highIntervalValue - 1) % s.scale.length;
            highFreq = (finalJ*2)*s.scale[highIndex];
          } else{
            highFreq = finalJ*s.scale[finalK + this.props.highIntervalValue - 1];
          }
        }
        else {
          if(finalK + this.props.lowerIntervalValue - 1 >= s.scale.length){
            let lowerIndex = (finalK + this.props.lowerIntervalValue - 1) % s.scale.length;
            lowerFreq = (finalJ*2)*s.scale[lowerIndex];
          } else{
            lowerFreq = finalJ*s.scale[finalK + this.props.lowerIntervalValue - 1];
          }
          if(finalK + this.props.midIntervalValue - 1 >= s.scale.length){
            let midIndex = (finalK + this.props.midIntervalValue - 1) % s.scale.length;
            midFreq = (finalJ*2)*s.scale[midIndex];
          } else{
            midFreq = finalJ*s.scale[finalK + this.props.midIntervalValue - 1];
          }
          if(finalK + this.props.highIntervalValue - 1 >= s.scale.length){
            let highIndex = (finalK + this.props.highIntervalValue - 1) % s.scale.length;
            highFreq = (finalJ*2)*s.scale[highIndex];
          } else{
            highFreq = finalJ*s.scale[finalK + this.props.highIntervalValue - 1];
          }
        }
        return [Math.round(freq),Math.round(lowerFreq), Math.round(midFreq), Math.round(highFreq)];
      }
    }

    return [Math.round(freq)];
  }


  renderCanvas = () => {
      let rect = this.props;
      // We clear the canvas to make sure we don't leave anything painted
      this.ctx.clearRect(0, 0, rect.width, rect.height);
      this.ctx.fillStyle = "#C1C5C9";
      this.ctx.fillRect(0, 0, rect.width, rect.height);
      const MINFREQ = 20;
      const MAXFREQ = 20000;
      let ticks = 4;
      let freqX = rect.width;
      let volY = rect.height;

      let dashSize = { x: 24, y: 7 };

      for (let i = 0; i <= ticks; i++) {
        let freq = ((i) / (ticks))
        let tickFreq = Math.round(logspace(MINFREQ, MAXFREQ, freq, 2));

        let vol = ((freq / ticks - 1) * -1);
        let tickVol = Math.round(logspace(0.001, 0.5, vol, 2) * 100) / 10 * 2;

        let percent = i / (ticks);

        let freqY = (1 - percent) * rect.height;
        let volX = (1 - percent) * rect.width;

        this.ctx.beginPath();
        this.ctx.font = '16px Verdana ';
        this.ctx.textAlign = 'right';
        this.ctx.fillStyle = 'black';

        // Draw in the frequency y axis
        this.ctx.fillText(tickFreq + ' Hz', parseInt(freqX) - 29, parseInt(freqY + 13));
        this.ctx.fillRect(parseInt(freqX) - 19, parseInt(freqY), dashSize.x, dashSize.y);

        // Draw in the volume x axis
        this.ctx.fillText(tickVol, parseInt(volX) + 45, parseInt(volY) - 11);
        this.ctx.fillRect(parseInt(volX) + 8, parseInt(volY) - 22, dashSize.y, dashSize.x);
    }
  }

  // Helper method that generates a label for the frequency or the scale note
label(freq, x, y) {
  const offset = 10;
  this.ctx.font = '20px Inconsolata';
  this.ctx.fillStyle = 'white';
  if(true){//sthis.props.soundOn){
    if (true){//!this.props.scaleOn || this.state.checkButton) {
      this.ctx.fillText(freq + ' Hz', x + offset, y - offset);
    } else {
      this.ctx.fillText(this.scaleLabel, x + offset, y - offset);
    }
    // Draw Circle for point
  const startingAngle = 0;
  const endingAngle = 2 * Math.PI;
  const radius = 10;
  const color = 'rgb(255, 255, 0)';
  this.ctx.beginPath();
  this.ctx.arc(x, y, radius, startingAngle, endingAngle);
  this.ctx.fillStyle = color;
  this.ctx.fill();
  this.ctx.stroke();
  }
}

  render() {
    let cssClass = 'controlbar-container'

    return (
        <canvas
        width={this.props.width}
        height={this.props.height}
        onContextMenu={(e) => e.preventDefault()}
        onMouseDown={this.onMouseDown}
        onMouseMove={this.onMouseMove}
        onMouseUp={this.onMouseUp}
        onMouseOut={this.onMouseOut}
        ref={(c) => {
          this.canvas = c;}} className="control-canvas"/>
    );
  }
}
