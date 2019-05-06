import React, {Component} from 'react';
import random from 'lodash.random';

import '../styles/control-bar.css';
import Tone from 'tone';
import generateScale from '../util/generateScale';

import {
  getFreq,
  getGain,
  freqToIndex,
  getMousePos,
  logspace,
  getLinearGain,
} from '../util/conversions';
import {
  WAVECOLOR1,
  WAVECOLOR2,
  WAVECOLOR3,
  WAVECOLOR4,
  WAVECOLOR5,
  WAVECOLOR6,
  WAVECOLORTOTAL,
} from '../util/colors';
import {getHarmonicFreq} from '../util/harmonics';

const NUM_VOICES = 6;
const RAMPVALUE = 0.2;
const NUM_PARTIALS = 5;

const resolutionMax = 20000;
const resolutionMin = 20;

export default class ControlBar extends Component {
  constructor (props) {
    super ();
    this.onMouseDown = this.onMouseDown.bind (this);
    this.onMouseMove = this.onMouseMove.bind (this);
    this.onMouseUp = this.onMouseUp.bind (this);
    this.onMouseOut = this.onMouseOut.bind (this);
    this.onTouchStart = this.onTouchStart.bind (this);
    this.onTouchEnd = this.onTouchEnd.bind (this);
    this.onTouchMove = this.onTouchMove.bind (this);

    this.state = {
      mouseDown: false,
      mouseSustain: false,
      touch: false,
      feedback: false,
      amOn: false,
      fmOn: false,
    };
  }

  componentDidMount () {
    this.ctx = this.canvas.getContext ('2d');
    this.renderCanvas ();
    Tone.context = this.props.context;

    // Array to hold synthesizer objects. Implemented in a circular way
    // so that each new voice (touch input) is allocated, it is appended to the
    // array until the array is full and it then appends the next voice to array[0]
    this.synths = new Array (NUM_VOICES);
    this.complexVols = new Array (NUM_VOICES);
    this.complexHarmonics = new Array (NUM_VOICES);
    this.prevFreq = new Array (NUM_VOICES);
    this.prevGain = new Array (NUM_VOICES);

    this.masterVolume = new Tone.Volume (0);
    this.ctx = this.canvas.getContext ('2d');
    let options = {
      oscillator: {
        type: 'sine', //this.props.timbre.toLowerCase()
      },
      envelope: {
        attack: 0.1,
      },
    };

    // For each voice, create a synth and connect it to the master volume
    for (let i = 0; i < NUM_VOICES; i++) {
      this.synths[i] = new Tone.Synth (options);
      this.synths[i].connect (this.masterVolume);
      this.prevFreq[i] = 0;
      this.prevGain[i] = 0;
    }
    this.masterVolume.connect (Tone.Master);
    this.reverb = new Tone.Reverb (4); // Reverb unit. Runs in parallel to masterVolume
    this.reverbVolume = new Tone.Volume (0);
    this.reverbVolume.connect (Tone.Master);
    this.masterVolume.connect (this.reverb);
    this.reverb.generate ().then (() => {
      this.reverb.connect (this.reverbVolume);
    });

    this.goldIndices = []; // Array to hold indices on the screen of gold note lines (touched/clicked lines)
    //this.masterVolume.connect(Tone.Master); // Master volume receives all of the synthesizer inputs and sends them to the speakers

    // Sound Off by default
    // this.masterVolume.mute = !this.props.soundOn;
    // Object to hold all of the note-line frequencies (for checking the gold lines)
    this.frequencies = {};

    window.addEventListener ('resize', this.handleResize);
  }

  componentWillUnmount () {
    this.masterVolume.mute = true;
    window.removeEventListener ('resize', this.handleResize);
    //  window.removeEventListener("orientationchange", this.handleResize);
  }

  handleResize = () => {
    this.props.handleResize ();
    this.renderCanvas ();
  };

  /**
  This Section controls how the Oscillator(s) react to user input
  */
  onMouseDown (e) {
    e.preventDefault (); // Always need to prevent default browser choices
    let pos = getMousePos (this.canvas, e);
    // Calculates x and y value in respect to width and height of screen
    // The value goes from 0 to 1. (0, 0) = Bottom Left corner
    let yPercent = 1 - pos.y / this.props.height;
    let xPercent = 1 - pos.x / this.props.width;
    let freq = this.getFreq (yPercent);
    let gain = getGain (xPercent);
    this.synths[0].volume.value = gain; // Starts the synth at volume = gain
    this.synths[0].triggerAttack (freq); // Starts the synth at frequency = freq
    if (this.props.lockFreq) {
      this.prevFreq[0] = freq;
    }
    if (this.props.lockAmp) {
      this.prevGain[0] = gain;
    }
    this.ctx.clearRect (0, 0, this.props.width, this.props.height); // Clears canvas for redraw of label
    this.renderCanvas ();
    /* NOTE: Here's where labels for the harmonics will go.
        1. Prop to detect complex or pure is timbre/timbreSelection
        2.  
    */
    this.label (freq, pos.x, pos.y, 0); // Labels the point
    // Labels for harmonics of complex waves
    if (this.props.timbre) {
      
      // Convert all the amplitude (xPercent) back to positions on the screen so that they can be plotted
      const harmonicValues = getHarmonicFreq (
        freq,
        xPercent,
        10,
        this.props.timbreSelection
      );

      console.log('Log the harmonic values: ', harmonicValues);
      

      const harmonicPositions = harmonicValues.map((harmonic) => {
        const { height, width } = this.props;
        let x = (1 - harmonic.amplitude) * width;
        let y = freqToIndex(harmonic.frequency, resolutionMax, resolutionMin, height); 
        return {
         x : x,
         y : y 
        }
      });
      
      for (let h of harmonicPositions) {
        const color = random(1, 6);
        this.label(null, h.x, h.y, color, "harmonic");
      }
    }

    this.setState ({mouseDown: true});
    this.props.onAudioEvent ([
      {
        freq: freq,
        volume: gain,
        color: 0,
        wavetype: this.props.timbreSelection,
        partials: this.partials,
      },
    ]);
  }

  onMouseMove (e) {
    e.preventDefault (); // Always need to prevent default browser choices
    if (this.state.mouseDown) {
      // Only want to change when mouse is pressed
      // The next few lines are similar to onMouseDown
      let {height, width} = this.props;
      let pos = getMousePos (this.canvas, e);
      let yPercent = 1 - pos.y / height;
      let xPercent = 1 - pos.x / width;
      let gain = getGain (xPercent);
      // let freq = this.getFreq(yPercent)[0];
      let freq = this.getFreq (yPercent);
      if (this.props.lockFreq) {
        freq = this.prevFreq[0];
        pos.y = freqToIndex (freq, resolutionMax, resolutionMin, height);
      }

      if (this.props.lockAmp) {
        gain = this.prevGain[0];
        pos.x = (1 - getLinearGain (gain)) * width;
        if (pos.x > this.props.width) {
          pos.x = this.props.width;
        }
      }

      if (this.props.scaleOn) {
        // Jumps to new Frequency and Volume
        this.synths[0].frequency.value = freq;
        this.synths[0].volume.value = gain;
      } else {
        // Ramps to new Frequency and Volume
        if (!this.props.lockFreq) {
          this.synths[0].frequency.exponentialRampToValueAtTime (
            freq,
            this.props.context.currentTime + RAMPVALUE
          );
        }
        // Ramp to new Volume
        if (!this.props.lockAmp) {
          this.synths[0].volume.exponentialRampToValueAtTime (
            gain,
            this.props.context.currentTime + RAMPVALUE
          );
        }
      }

      // Clears the label
      this.ctx.clearRect (0, 0, this.props.width, this.props.height);
      this.renderCanvas ();
      this.label (freq, pos.x, pos.y, 0);
      if (this.props.noteLinesOn) {
        // this.renderNoteLines();
      }
      this.props.onAudioEvent ([
        {
          freq: freq,
          volume: gain,
          color: 0,
          wavetype: this.props.timbreSelection,
          partials: this.partials,
        },
      ]);
    }
  }

  onMouseUp (e) {
    e.preventDefault (); // Always need to prevent default browser choices
    // Only need to trigger release if synth exists (a.k.a mouse is down)
    if (this.state.mouseDown && !this.props.sustain) {
      this.synths[0].triggerRelease (); // Relase frequency, volume goes to -Infinity

      // Clears the label
      this.ctx.clearRect (0, 0, this.props.width, this.props.height);
      this.renderCanvas ();
      this.props.onAudioEvent ([{}]);
      this.setState ({mouseSustain: false});
    }
    this.setState ({mouseDown: false, mouseSustain: true});
  }

  onMouseOut (e) {
    e.preventDefault (); // Always need to prevent default browser choices
    // Only need to trigger release if synth exists (a.k.a mouse is down)
    if (this.state.mouseDown && !this.props.sustain) {
      this.synths[0].triggerRelease (); // Relase frequency, volume goes to -Infinity
      this.goldIndices = [];
      if (this.props.timbre) {
        this.releaseAll (true);
      }
      // Clears the label
      this.ctx.clearRect (0, 0, this.props.width, this.props.height);
      this.renderCanvas ();
      if (this.props.noteLinesOn) {
        // this.renderNoteLines();
      }
      this.props.onAudioEvent ([{}]);
    }
    this.setState ({mouseDown: false});
  }

  onTouchStart (e) {
    e.preventDefault (); // Always need to prevent default browser choices
    e.stopPropagation ();
    if (e.touches.length > NUM_VOICES) {
      return;
    }
    let audioEvent = [];
    let {height, width} = this.props;
    if (this.props.sustain && e.touches.length !== 1) {
      return;
    }
    // For each finger, do the same as above in onMouseDown
    if (!this.props.timbre) {
      this.synths[0].oscillator.type = 'sine';
      for (let i = 0; i < e.changedTouches.length; i++) {
        let pos = getMousePos (this.canvas, e.changedTouches[i]);

        let yPercent = 1 - pos.y / this.props.height;
        let xPercent = 1 - pos.x / this.props.width;
        let gain = getGain (xPercent);
        let freq = this.getFreq (yPercent);
        let newVoice = e.changedTouches[i].identifier % NUM_VOICES;

        if (newVoice < 0) newVoice = NUM_VOICES + newVoice;
        if (this.props.sustain) {
          newVoice = 0;
        }

        if (this.props.lockFreq) {
          this.prevFreq[newVoice] = freq;
        }
        if (this.props.lockAmp) {
          this.prevGain[newVoice] = gain;
        }

        this.setState ({touch: true});
        this.synths[newVoice].volume.value = gain;
        this.synths[newVoice].triggerAttack (freq);
        if (this.props.sustain) {
          break;
        }
      }
      this.ctx.clearRect (0, 0, this.props.width, this.props.height);
      this.renderCanvas ();
      for (let i = 0; i < e.touches.length; i++) {
        let pos = getMousePos (this.canvas, e.touches[i]);
        let xPercent = 1 - pos.x / this.props.width;
        let yPercent = 1 - pos.y / this.props.height;
        let freq = this.getFreq (yPercent);
        let gain = getGain (xPercent);
        let index = e.touches[i].identifier % NUM_VOICES;
        if (index < 0) index = NUM_VOICES + index;
        this.label (freq, pos.x, pos.y, index);
        audioEvent.push ({
          freq: freq,
          volume: gain,
          color: index,
          wavetype: 'sine',
        });
        if (this.props.sustain) {
          break;
        }
      }
    } else {
      // COMPLEX
      if (e.touches.length == 1) {
        this.ctx.clearRect (0, 0, this.props.width, this.props.height);
        this.renderCanvas ();
        let pos = getMousePos (this.canvas, e.changedTouches[0]);
        let yPercent = 1 - pos.y / this.props.height;
        let xPercent = 1 - pos.x / this.props.width;
        let gain = getGain (xPercent);
        let freq = this.getFreq (yPercent);
        let newVoice = e.changedTouches[0].identifier % NUM_VOICES;
        if (newVoice < 0) newVoice = NUM_VOICES + newVoice;

        if (this.props.lockFreq) {
          this.prevFreq[newVoice] = freq;
        }
        if (this.props.lockAmp) {
          this.prevGain[newVoice] = gain;
        }
        this.setState ({touch: true});
        this.synths[0].volume.value = gain;
        this.synths[0].triggerAttack (freq);
        //this.ctx.clearRect(0, 0, this.props.width, this.props.height);
        //this.renderCanvas();
        this.label (freq, pos.x, pos.y, newVoice);
        audioEvent.push ({
          freq: freq,
          volume: gain,
          color: newVoice,
          wavetype: this.props.timbreSelection,
          partials: this.partials,
        });
      } else {
        return;
      }
    }
    this.props.onAudioEvent (audioEvent);
  }

  onTouchMove (e) {
    e.preventDefault (); // Always need to prevent default browser choices
    // e.stopPropagation();

    // Check if more fingers were moved than allowed
    if (e.changedTouches.length > NUM_VOICES) {
      return;
    }
    let {height, width} = this.props;
    if (this.props.sustain && e.touches.length !== 1) {
      return;
    }
    // If touch is pressed (Similar to mouseDown = true, although there should never be a case where this is false)
    if (this.state.touch) {
      let audioEvent = [];

      // For each changed touch, do the same as onMouseMove
      if (!this.props.timbre) {
        for (let i = 0; i < e.changedTouches.length; i++) {
          let pos = getMousePos (this.canvas, e.changedTouches[i]);
          if (pos.x > this.props.width) {
            pos.x = this.props.width;
          }
          let yPercent = 1 - pos.y / this.props.height;
          let xPercent = 1 - pos.x / this.props.width;

          // Determines index of the synth needing to change volume/frequency
          let index = e.changedTouches[i].identifier % NUM_VOICES;
          // : index;
          if (index < 0) index = NUM_VOICES + index;
          if (this.props.sustain) {
            index = 0;
          }

          let gain = getGain (xPercent);
          let freq = this.getFreq (yPercent);
          // Deals with rounding issues with the note lines
          let oldFreq = this.synths[index].frequency.value;
          for (let note in this.frequencies) {
            if (Math.abs (this.frequencies[note] - oldFreq) < 0.1 * oldFreq) {
              oldFreq = this.frequencies[note];
            }
          }
          // These are the same as onMouseMove
          this.goldIndices.splice (index - 1, 1);
          // Ramps to new Frequency and Volume
          if (!this.props.lockFreq) {
            this.synths[index].frequency.exponentialRampToValueAtTime (
              freq,
              this.props.context.currentTime + RAMPVALUE
            );
          }
          // Ramp to new Volume
          if (!this.props.lockAmp) {
            this.synths[index].volume.exponentialRampToValueAtTime (
              gain,
              this.props.context.currentTime + RAMPVALUE
            );
          }
          if (this.props.sustain) {
            break;
          }
        }
        //Redraw Labels
        this.ctx.clearRect (0, 0, width, height);
        this.renderCanvas ();

        for (let i = 0; i < e.touches.length; i++) {
          let pos = getMousePos (this.canvas, e.touches[i]);
          if (pos.x > this.props.width) {
            pos.x = this.props.width;
          }
          let xPercent = 1 - pos.x / this.props.width;
          let yPercent = 1 - pos.y / this.props.height;
          let freq = this.getFreq (yPercent);
          let gain = getGain (xPercent);
          let index = e.touches[i].identifier % NUM_VOICES;
          if (index < 0) index = NUM_VOICES + index;
          if (this.props.sustain) {
            index = 0;
          }
          if (this.props.lockFreq) {
            freq = this.prevFreq[index];
            pos.y = freqToIndex (freq, resolutionMax, resolutionMin, height);
          }
          if (this.props.lockAmp) {
            gain = this.prevGain[index];
            pos.x = (1 - getLinearGain (gain)) * width;
            if (pos.x > this.props.width) {
              pos.x = this.props.width;
            }
          }

          this.label (freq, pos.x, pos.y, index);
          audioEvent.push ({
            freq: freq,
            volume: gain,
            color: index,
            wavetype: 'sine',
          });
        }
        // COMPLEX
      } else {
        let pos = getMousePos (this.canvas, e.changedTouches[0]);
        if (pos.x > this.props.width) {
          pos.x = this.props.width;
        }
        let yPercent = 1 - pos.y / this.props.height;
        let xPercent = 1 - pos.x / this.props.width;
        // Determines index of the synth needing to change volume/frequency

        let index = e.changedTouches[0].identifier % NUM_VOICES;
        if (index < 0) index = NUM_VOICES + index;
        // : index;

        let gain = getGain (xPercent);
        let freq = this.getFreq (yPercent);
        // Deals with rounding issues with the note lines
        let oldFreq = this.synths[0].frequency.value;
        let oldGain = this.synths[0].volume.value;

        for (let note in this.frequencies) {
          if (Math.abs (this.frequencies[note] - oldFreq) < 0.1 * oldFreq) {
            oldFreq = this.frequencies[note];
          }
        }
        // These are the same as onMouseMove
        this.goldIndices.splice (index - 1, 1);
        // Ramps to new Frequency and Volume
        if (!this.props.lockFreq) {
          this.synths[0].frequency.exponentialRampToValueAtTime (
            freq,
            this.props.context.currentTime + RAMPVALUE
          );
        } else {
          freq = oldFreq;
          pos.y = freqToIndex (freq, resolutionMax, resolutionMin, height);
        }
        // Ramp to new Volume
        if (!this.props.lockAmp) {
          this.synths[0].volume.exponentialRampToValueAtTime (
            gain,
            this.props.context.currentTime + RAMPVALUE
          );
        } else {
          gain = oldGain;
          pos.x = (1 - getLinearGain (gain)) * width;
          if (pos.x > this.props.width) {
            pos.x = this.props.width;
          }
          xPercent = 1 - pos.x / this.props.width;
        }
        //Redraw Labels
        this.ctx.clearRect (0, 0, width, height);
        this.renderCanvas ();
        this.label (freq, pos.x, pos.y, 0);
        audioEvent.push ({
          freq: freq,
          volume: gain,
          color: 0,
          wavetype: this.props.timbreSelection,
          partials: this.partials,
        });
      }

      this.props.onAudioEvent (audioEvent);
    }
  }

  onTouchEnd (e) {
    e.preventDefault (); // Always need to prevent default browser choices
    //e.stopPropagation();
    // if(!this.props.sustain){
    let {width, height} = this.props;
    let audioEvent = [];
    if (this.props.sustain && e.touches.length !== 0) {
      return;
    }
    // Does the same as onTouchMove, except instead of changing the voice, it deletes it.
    if (this.props.timbre) {
      if (!this.props.sustain) {
        this.synths[0].triggerRelease ();
        this.releaseAll (true);
      }
    } else {
      this.ctx.clearRect (0, 0, width, height);
      for (let i = 0; i < e.changedTouches.length; i++) {
        let pos = getMousePos (this.canvas, e.changedTouches[i]);
        let index = e.changedTouches[i].identifier % NUM_VOICES;
        if (index < 0) index = NUM_VOICES + index;
        if (this.props.sustain) {
          index = 0;
        }
        let yPercent = 1 - pos.y / this.props.height;
        let xPercent = 1 - pos.x / this.props.width;
        let freq = this.getFreq (yPercent)[0];
        let gain = getGain (xPercent);
        if (this.props.lockFreq) {
          freq = this.prevFreq[index];
          pos.y = freqToIndex (freq, resolutionMax, resolutionMin, height);
        }

        if (this.props.lockAmp) {
          gain = this.prevGain[index];
          pos.x = (1 - getLinearGain (gain)) * width;
          if (pos.x > this.props.width) {
            pos.x = this.props.width;
          }
        }
        if (this.props.sustain) {
          audioEvent.push ({
            freq: freq,
            volume: gain,
            color: index,
            wavetype: 'sine',
          });
          this.renderCanvas ();
          this.label (freq, pos.x, pos.y, index);
          this.props.onAudioEvent (audioEvent);
          break;
        } else {
          this.synths[index].triggerRelease ();
          this.synths[index].volume.linearRampToValueAtTime (
            -100,
            this.props.context.currentTime + 2
          );
          this.renderCanvas ();
        }
      }

      if (!this.props.sustain) {
        for (let i = 0; i < e.touches.length; i++) {
          let pos = getMousePos (this.canvas, e.touches[i]);
          if (pos.x > this.props.width) {
            pos.x = this.props.width;
          }
          let index = e.touches[i].identifier % NUM_VOICES;
          if (index < 0) index = NUM_VOICES + index;
          let xPercent = 1 - pos.x / this.props.width;
          let yPercent = 1 - pos.y / this.props.height;
          let freq = this.getFreq (yPercent)[0];
          let gain = getGain (xPercent);
          if (this.props.lockFreq) {
            freq = this.prevFreq[index];
          }
          if (this.props.lockAmp) {
            gain = this.prevGain[index];
          }
          this.label (freq, pos.x, pos.y, index);
          audioEvent.push ({
            freq: freq,
            volume: gain,
            color: index,
            wavetype: 'sine',
          });
        }
        if (e.touches.length === 0) {
          this.setState ({touch: false});
          audioEvent.push ({});
        }
        this.props.onAudioEvent (audioEvent);
      }
    }
  }

  // Helper function that determines the frequency to play based on the mouse/finger position
  // Also deals with snapping it to a scale if scale mode is on
  getFreq (index) {
    // let {resolutionMax, resolutionMin, height} = this.props;
    let height = this.props.height;
    let freq = getFreq (index, resolutionMin, resolutionMax);
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
        newIndexedKey = this.props.accidental.value === 1
          ? newIndexedKey + 1
          : this.props.accidental.value === 2
              ? newIndexedKey - 1
              : newIndexedKey;
      }
      // Uses generateScale helper method to generate base frequency values
      let s = generateScale (newIndexedKey, this.props.scale.value);
      let name = s.scale[0];
      let note = 0;
      let dist = 20000;
      let harmonic = 0;
      //Sweeps through scale object and plays correct frequency

      let finalJ, finalK;
      for (let j = 1; j < 1500; j = j * 2) {
        for (let k = 0; k < s.scale.length; k++) {
          var check = j * s.scale[k];
          var checkDist = Math.abs (freq - check);
          if (checkDist < dist) {
            dist = checkDist;
            note = check;
            finalJ = j;
            finalK = k;

            name = s.scaleNames[k];
            harmonic = Math.round (Math.log2 (j) - 1);
          } else {
            break;
          }
        }
      }
      freq = note;

      let textLabel = name + '' + harmonic;
      this.scaleLabel = textLabel;
      let index = freqToIndex (freq, resolutionMax, resolutionMin, height);

      this.goldIndices[this.state.currentVoice] = index;
    }

    return Math.round (freq);
  }

  renderCanvas = () => {
    let rect = this.props;
    // We clear the canvas to make sure we don't leave anything painted
    this.ctx.clearRect (0, 0, rect.width, rect.height);
    this.ctx.fillStyle = '#C1C5C9';
    this.ctx.fillRect (0, 0, rect.width, rect.height);
    const MINFREQ = 20;
    const MAXFREQ = 20000;
    let ticks = 4;
    let freqX = rect.width;
    let volY = rect.height;

    let dashSize = {x: 24, y: 7};
  };

  // Helper method that generates a label for the frequency or the scale note
  label (freq, x, y, index, typeOfLabel='fundamental') {
    if (typeOfLabel === 'fundamental') {
      let xOffset = 70;
      let yOffset = 20;
      this.ctx.font = '1.25em Verdana';
      this.ctx.fillStyle = 'white';
      // 80% move to other side
      const switchLabelSide = this.props.width * 0.80;
      if (x + xOffset > switchLabelSide) {
        xOffset = -xOffset;
      }
      this.ctx.fillText (freq + ' Hz', x + xOffset, y - yOffset);

      // REVIEW: Keeping this code for now but seems redundant

      /*  else {
        this.ctx.fillText(this.scaleLabel, x + xOffset, y - yOffset);
        } 
      */
    }
    // Draw Circle for point
    const startingAngle = 0;
    const endingAngle = 2 * Math.PI;
    const radius = 10;
    // const color = 'rgb(255, 255, 0)';
    let color = WAVECOLORTOTAL;
    switch (index) {
      case 0:
        color = WAVECOLOR1;
        break;
      case 1:
        color = WAVECOLOR2;
        break;
      case 2:
        color = WAVECOLOR3;
        break;
      case 3:
        color = WAVECOLOR4;
        break;
      case 4:
        color = WAVECOLOR5;
        break;
      case 5:
        color = WAVECOLOR6;
        break;
    }

    this.ctx.beginPath ();
    this.ctx.arc (x, y, radius, startingAngle, endingAngle);
    this.ctx.fillStyle = color;
    this.ctx.fill ();
    this.ctx.stroke ();
  }

  releaseAll (complex) {
    let i = 0;
    if (complex) {
      i = 1;
    }
    for (; i < NUM_VOICES; i++) {
      this.synths[i].triggerRelease ();
    }
    this.ctx.clearRect (0, 0, this.props.width, this.props.height);
    this.renderCanvas ();
    this.props.onAudioEvent ([{}]);
    if (!this.props.sustain) {
      this.setState ({touch: false, mouseDown: false});
    }
  }

  generateTimbre (timbre) {
    this.synths[0].triggerRelease ();
    this.synths[0] = new Tone.Synth ();
    this.synths[0].connect (this.masterVolume);
    if (timbre === 'complex') {
      let partials = [1];
      for (let i = 0; i < NUM_PARTIALS; i++) {
        partials.push (Math.random ());
      }
      this.synths[0].oscillator.partials = partials;
      // let norm = 0;
      // for(let i = 0; i < partials.length; i++){
      //   norm += partials[i]^2;
      // }
      // norm = Math.sqrt(norm);
      // for(let i = 0; i < partials.length; i++){
      //   partials[i] /= norm;
      // }
      this.partials = partials;
    } else {
      this.synths[0].oscillator.type = timbre;
    }
    switch (timbre) {
      case 'square':
        this.masterVolume.volume.exponentialRampToValueAtTime (
          -10,
          this.props.context.currentTime + RAMPVALUE
        );
        break;
      case 'sawtooth':
        this.masterVolume.volume.exponentialRampToValueAtTime (
          -10,
          this.props.context.currentTime + RAMPVALUE
        );
        break;
      case 'complex':
        this.masterVolume.volume.exponentialRampToValueAtTime (
          -10,
          this.props.context.currentTime + RAMPVALUE
        );
        break;
      case 'sine':
        this.masterVolume.volume.exponentialRampToValueAtTime (
          0,
          this.props.context.currentTime + RAMPVALUE
        );
        break;
    }
    if (timbre === 'sine') {
      this.reverbVolume.mute = false;
    } else {
      this.reverbVolume.mute = true;
    }
  }

  sustainChangeTimbre (timbreSelection) {
    let {height, width} = this.props;
    let audioEvent = [];
    let freq = this.synths[0].frequency.value;
    let gain = this.synths[0].volume.value;
    let yPos = freqToIndex (freq, resolutionMax, resolutionMin, height);
    let xPercent = 1 - getLinearGain (gain);
    let xPos = xPercent * this.props.width;

    if (this.props.lockFreq) {
      this.prevFreq[0] = freq;
    }
    if (this.props.lockAmp) {
      this.prevGain[0] = gain;
    }
    this.ctx.clearRect (0, 0, this.props.width, this.props.height);
    this.renderCanvas ();
    this.synths[0].triggerRelease ();
    this.synths[0] = new Tone.Synth ();
    this.synths[0].connect (this.masterVolume);

    switch (timbreSelection) {
      case 'square':
        this.masterVolume.volume.exponentialRampToValueAtTime (
          -10,
          this.props.context.currentTime + RAMPVALUE
        );
        break;
      case 'sawtooth':
        this.masterVolume.volume.exponentialRampToValueAtTime (
          -10,
          this.props.context.currentTime + RAMPVALUE
        );
        break;
      case 'complex':
        this.masterVolume.volume.exponentialRampToValueAtTime (
          -10,
          this.props.context.currentTime + RAMPVALUE
        );
        break;
      case 'sine':
        this.masterVolume.volume.exponentialRampToValueAtTime (
          0,
          this.props.context.currentTime + RAMPVALUE
        );
        break;
    }
    if (timbreSelection === 'complex') {
      let partials = [1];
      for (let i = 0; i < NUM_PARTIALS; i++) {
        partials.push (Math.random ());
      }
      this.synths[0].oscillator.partials = partials;
      // let norm = 0;
      // for(let i = 0; i < partials.length; i++){
      //   norm += partials[i]^2;
      // }
      // norm = Math.sqrt(norm);
      // for(let i = 0; i < partials.length; i++){
      //   partials[i] /= norm;
      // }
      this.partials = partials;
    } else {
      this.synths[0].oscillator.type = timbreSelection;
    }
    if (timbreSelection === 'sine') {
      this.reverbVolume.mute = false;
    } else {
      this.reverbVolume.mute = true;
    }
    audioEvent.push ({
      freq: freq,
      volume: gain,
      color: 0,
      wavetype: timbreSelection,
      partials: this.partials,
    });
    this.synths[0].volume.value = gain;

    if (this.state.touch || this.state.mouseSustain) {
      this.label (freq, xPos, yPos, 0);
      this.synths[0].triggerAttack (freq);
      this.props.onAudioEvent (audioEvent);
    }
  }

  render () {
    return (
      <canvas
        width={this.props.width}
        height={this.props.height}
        onContextMenu={e => e.preventDefault ()}
        onMouseDown={this.onMouseDown}
        onMouseMove={this.onMouseMove}
        onMouseUp={this.onMouseUp}
        onMouseOut={this.onMouseOut}
        onTouchStart={this.onTouchStart}
        onTouchMove={this.onTouchMove}
        onTouchEnd={this.onTouchEnd}
        ref={c => {
          this.canvas = c;
        }}
        className="control-canvas"
      />
    );
  }
}
