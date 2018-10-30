import React, { Component } from 'react'
import "../styles/oscilloscope.css"

const WAVECOLOR1 = 'rgb(246, 109, 244)'; // Light blue
const WAVECOLOR2 = 'rgb(66, 229, 244)'; // Violet
const WAVECOLOR3 = 'rgb(101, 255, 0)'; // Light green
const WAVECOLOR4 = 'rgb(255, 140, 0)'; // Orange
const WAVECOLOR5 = 'rgb(2, 10, 185)'; // Dark blue
const WAVECOLORTOTAL = 'rgb(255, 255, 0)'; // Yellow
const frequency = [0];
const amplitude = [0];
const nFingers = 0;

export default class Oscilloscope extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isStarted: false,
    }
  }

  componentDidMount() {
    this.ctx = this.canvas.getContext('2d');
    window.addEventListener("resize", this.handleResize);
    this.drawPureWavesCanvas();

  }
  componentWillUnmount() {
    window.removeEventListener("resize", this.handleResize);
  }

  handleResize = () =>{
    this.props.handleResize();
    this.drawPureWavesCanvas();
  }
  // Time variable
  // var t = 0;
  // var referenceComplexAmplitude;
  // var drawTimeStamp;
  // var prevNFingers = 0;
  // var randomInitialVolumes = [];

  // This function creates the grid for the waves canvas
  createGrid(ctx, canvas) {
    // let canvasRect = canvas.getBoundingClientRect();
    let canvasHeight = this.props.height;
    let canvasWidth = this.props.width;

    // We clear whatever is in scope and we create the grid again
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Mid point of the scope canvas (used to create the grid)
    let midPoint = {
      x: canvasWidth / 2,
      y: canvasHeight / 2
    };

    // Draw the two gray axes
    ctx.beginPath();
    this.setStyleWidthOpacity(ctx, "rgb(124, 124, 124)", '5', 1);
    ctx.moveTo(0, midPoint.y);
    ctx.lineTo(canvasWidth, midPoint.y);
    ctx.moveTo(midPoint.x, 0);
    ctx.lineTo(midPoint.x, canvasHeight);
    ctx.globalCompositeOperation = 'source-over';
    ctx.stroke();
    ctx.closePath();

    // Draw the white lines
    ctx.beginPath();
    this.setStyleWidthOpacity(ctx, "rgb(255, 255, 255)", '5', 1);
    // Dash Space determines the distance between white lines
    let dashSpace = 50;
    // Dash size determines the size of the white lines
    let dashSize = 15;
    let greatDashSize = 26;
    let linesDrawn = 1;
    // Draw the dashes of the left half of x axis
    let dashesX = midPoint.x - dashSpace;
    while (dashesX >= 0) {
      if (linesDrawn % 4 === 0) {
        ctx.moveTo(dashesX, midPoint.y - greatDashSize);
        ctx.lineTo(dashesX, midPoint.y + greatDashSize);
      } else {
        ctx.moveTo(dashesX, midPoint.y - dashSize);
        ctx.lineTo(dashesX, midPoint.y + dashSize);
      }
      dashesX -= dashSpace;
      linesDrawn++;
    }
    linesDrawn = 0;
    // Draw the dashes of the right half of x axis
    dashesX = midPoint.x;
    while (dashesX <= canvasWidth) {
      if (linesDrawn % 4 === 0) {
        ctx.moveTo(dashesX, midPoint.y - greatDashSize);
        ctx.lineTo(dashesX, midPoint.y + greatDashSize);
      } else {
        ctx.moveTo(dashesX, midPoint.y - dashSize);
        ctx.lineTo(dashesX, midPoint.y + dashSize);
      }
      dashesX += dashSpace;
      linesDrawn++;
    }

    linesDrawn = 1;
    // Draw the dashes of the top half of y axis
    let dashesY = midPoint.y - dashSpace;
    while (dashesY >= 0) {
      if (linesDrawn % 4 === 0) {
        ctx.moveTo(midPoint.x - greatDashSize, dashesY);
        ctx.lineTo(midPoint.x + greatDashSize, dashesY);
      } else {
        ctx.moveTo(midPoint.x - dashSize, dashesY);
        ctx.lineTo(midPoint.x + dashSize, dashesY);
      }
      dashesY -= dashSpace;
      linesDrawn++;
    }

    linesDrawn = 0;
    // Draw the dashes of the bottom half of y axis
    dashesY = midPoint.y;
    while (dashesY <= canvasHeight) {
      if (linesDrawn % 4 === 0) {
        ctx.moveTo(midPoint.x - greatDashSize, dashesY);
        ctx.lineTo(midPoint.x + greatDashSize, dashesY);
      } else {
        ctx.moveTo(midPoint.x - dashSize, dashesY);
        ctx.lineTo(midPoint.x + dashSize, dashesY);
      }
      dashesY += dashSpace;
      linesDrawn++;
    }

    ctx.stroke();
    ctx.closePath();

    // Draw the scale for the canvas
    this.drawScaleInfo(ctx, midPoint, canvasHeight, dashSpace);
  }

  // Draws the scale information for the waves canvas
  drawScaleInfo(ctx, midPoint, canvasHeight, dashSpace) {
    let lengthScale = dashSpace * 4;
    let offsetY = 15;
    let offsetX = 3;
    let lengthLittleLines = 10;

    // Draw yellow scale
    ctx.beginPath();
    this.setStyleWidthOpacity(ctx, "rgb(255, 233, 0)", '3', 1);
    ctx.moveTo(midPoint.x + offsetX, canvasHeight - offsetY);
    ctx.lineTo(midPoint.x + lengthScale - offsetX, canvasHeight - offsetY);

    ctx.moveTo(midPoint.x + offsetX, canvasHeight - offsetY - lengthLittleLines / 2);
    ctx.lineTo(midPoint.x + offsetX, canvasHeight - offsetY + lengthLittleLines / 2);

    ctx.moveTo(midPoint.x + lengthScale - offsetX, canvasHeight - offsetY - lengthLittleLines / 2);
    ctx.lineTo(midPoint.x + lengthScale - offsetX, canvasHeight - offsetY + lengthLittleLines / 2);

    ctx.stroke();
    ctx.closePath();

    ctx.beginPath();

    ctx.globalAlpha = 1;
    ctx.font = '16px Verdana';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'white';

    ctx.fillText('25 ms', midPoint.x + lengthScale / 2 - offsetX / 2, canvasHeight - offsetY - lengthLittleLines / 2);

    ctx.stroke();
    ctx.closePath();
  }

  setStyleWidthOpacity(ctx, style, width, opacity) {
    ctx.strokeStyle = style;
    ctx.lineWidth = width;
    ctx.globalAlpha = opacity;
  }

  // Waves canvas drawing (pure waves)
  // TO DO: insert the canvas and the context as arguments so that if one changes, we do not have to be changing everything in the function.
  drawPureWavesCanvas() {
    let t = 0;
    let wavesCanvasRect = this.canvas.getBoundingClientRect();
    let wavesCanvasHeight = this.props.height;
    let wavesCanvasWidth = this.props.width;
    let numberPoints;
    let sliceWidth;
    let freqInfoMessage;
    let opacityLevel = 0.65;

    this.createGrid(this.ctx, this.canvas);

    // Make the effect of the graph moving in time (currently deactivated)
    // if (AFFECTTIME) {
    //   t++;
    // }

    // In case we are in mouse mode (or nothing is being clicked/touched)
    if (true) {
      numberPoints = 2048 * 16;
      // We get the x-distance between each point by dividing the total width by the number of points
      sliceWidth = wavesCanvasWidth / numberPoints;

      /*
      let maxHeight = calculateMaximumPureSingleWave(numberPoints, sliceWidth);
      let scaleProportion = calculateProportionWave(maxHeight*2);
      */

      // We draw the blue wave line
      this.ctx.beginPath();
      this.setStyleWidthOpacity(this.ctx, WAVECOLORTOTAL, '5', 1);

      // x starts at 0 (first point is at 0)
      let x = 0;
      // For each of the points that we have
      for (let i = 0; i < numberPoints; i++) {
        let y = 0;
        // Calculate the location of the point using the equation of the wave.
        let wavelength = 100 * wavesCanvasHeight / frequency[0];
        let v = wavelength / frequency[0];
        let k = 2 * Math.PI / wavelength;
        if (amplitude[0] < 0) {
          y += (0 * 350 * Math.cos(k * (x + v * t)));
        } else {
          y += (amplitude[0] * 350 * Math.cos(k * (x + v * t)));
        }

        // y *= scaleProportion;

        y += wavesCanvasHeight / 2;

        // We draw the point in the canvas
        if (i === 0) {
          this.ctx.moveTo(x, y);
        } else {
          this.ctx.lineTo(x, y);

          // this.ctx.fillStyle = WAVECOLORTOTAL;
          // this.ctx.fillRect(x,y,1,1);
        }
        // x moves the x-distance to the right
        x += sliceWidth;
      }
      this.ctx.stroke();
    } else {
      // In case we are in touch mode
      /* If there is more than 1 finger pressed, we will draw a thick yellow line
      which will be the result of adding all the other waves */
      numberPoints = 2048 * 16 / (nFingers + 1);
      sliceWidth = wavesCanvasWidth / numberPoints;

      /*
      let maxHeight = calculateMaximumPureMultipleWaves(numberPoints, sliceWidth);
      let scaleProportion = calculateProportionWave(maxHeight*2);
      */

      this.ctx.beginPath();
      this.setStyleWidthOpacity(this.ctx, WAVECOLORTOTAL, '5', 1);
      let x = 0;
      for (let i = 0; i < numberPoints; i++) {
        let y = 0;
        // Add the result of each of the waves in position x
        for (let j = 0; j < nFingers; j++) {
          let wavelength = 100 * wavesCanvasHeight / frequency[j];
          let v = wavelength / frequency[j];
          let k = 2 * Math.PI / wavelength;
          if (amplitude[j] < 0) {
            y += (0 * 350 * Math.cos(k * (x + v * t)));
          } else {
            y += (amplitude[j] * 350 * Math.cos(k * (x + v * t)));
          }
        }

        // y *= scaleProportion;

        y += wavesCanvasHeight / 2;
        if (i === 0) {
          this.ctx.moveTo(x, y);
        } else {
          this.ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }
      this.ctx.stroke();

      // Now, we will draw each of the thinner lines for each finger.
      for (let j = 0; j < nFingers; j++) {
        let x = 0;
        this.ctx.beginPath();
        // If we have only 1 finger, the line will still be thick
        if (nFingers === 1) {
          this.ctx.globalAlpha = 1;
          this.ctx.lineWidth = '1.3';
        } else {
          this.ctx.globalAlpha = opacityLevel;
          this.ctx.lineWidth = '2';
        }

        // In case of the finger number, we will choose one color and write its frequency
        if (j === 0) {
          this.ctx.strokeStyle = WAVECOLOR1;
          freqInfoMessage = "<span style='color: " + WAVECOLOR1 + "'>" + Math.round(frequency[j]) + "</span>";
        } else if (j === 1) {
          this.ctx.strokeStyle = WAVECOLOR2;
          freqInfoMessage += " <span style='color: " + WAVECOLOR2 + "'>" + Math.round(frequency[j]) + "</span>";
        } else if (j === 2) {
          this.ctx.strokeStyle = WAVECOLOR3;
          freqInfoMessage += " <span style='color: " + WAVECOLOR3 + "'>" + Math.round(frequency[j]) + "</span>";
        } else if (j === 3) {
          this.ctx.strokeStyle = WAVECOLOR4;
          freqInfoMessage += " <span style='color: " + WAVECOLOR4 + "'>" + Math.round(frequency[j]) + "</span>";
        } else {
          this.ctx.strokeStyle = WAVECOLOR5;
          freqInfoMessage += " <span style='color: " + WAVECOLOR5 + "'>" + Math.round(frequency[j]) + "</span>";
        }
        for (let i = 0; i < numberPoints; i++) {
          let y = 0;
          let wavelength = 100 * wavesCanvasHeight / frequency[j];
          let v = wavelength / frequency[j];
          let k = 2 * Math.PI / wavelength;
          if (amplitude[j] < 0) {
            y += (0 * 350 * Math.cos(k * (x + v * t)));
          } else {
            y += (amplitude[j] * 350 * Math.cos(k * (x + v * t)));
          }

          // y *= scaleProportion;

          y += wavesCanvasHeight / 2;
          if (i === 0) {
            this.ctx.moveTo(x, y);
          } else {
            this.ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }
        this.ctx.stroke();
      }
    }
    // Write the message in case of the number of fingers we have
    // if (nFingers < 1) {
    //   if (frequency[0] === 1) {
    //     freqInfoMessage = "";
    //     this.setLeyendVisibility('hidden');
    //   } else {
    //     freqInfoMessage = Math.round(frequency[0]) + " Hz (cycles/second)";
    //     setLeyendVisibility('visible');
    //   }
    // } else {
    //   freqInfoMessage += " <span style='color: rgb(255, 255, 255)'>Hz</span>";
    //   setLeyendVisibility('visible');
    // }
    // document.getElementById("freq-info").innerHTML = freqInfoMessage;
    // drawTimeStamp = Date.now();
  };


  startOscilloscope = () => {
    this.setState({
      isStarted: true,
    })
  }

  render() {
    return (
      <div onClick={this.startOscilloscope}>
        <canvas className="oscilloscope-canvas" width={this.props.width} height={this.props.height} ref={(c) => {this.canvas = c;}}/>
        {/*<div className="instructions">
          {!this.state.isStarted
            ? <p className="flashing">Click or tap anywhere on the canvas to start the spectrogram</p>
            : <p>Great! Be sure to allow use of your microphone.
            You can draw on the canvas to make sound!</p>
          }

        </div>*/}
      </div>
    );
  }
}
