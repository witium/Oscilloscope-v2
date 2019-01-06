import React, { Component } from 'react';
import "../styles/oscilloscope.css";
import {dbToLinear} from "../util/conversions";

import {WAVECOLOR1, WAVECOLOR2, WAVECOLOR3, WAVECOLOR4, WAVECOLOR5, WAVECOLOR6, WAVECOLORTOTAL} from "../util/colors";

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
    window.addEventListener("orientationchange", this.props.restart);

    this.drawPureWavesCanvas();

  }
  componentWillUnmount() {
    window.removeEventListener("resize", this.handleResize);
    window.removeEventListener("orientationchange", this.props.restart);

  }


  handleResize = () =>{
    console.log("HEY")
    this.props.handleResize();
    this.drawPureWavesCanvas();
  }

  renderCanvas = (signals) =>{
    this.drawPureWavesCanvas();
    // let t = 0;
    const numberPoints = 2048 * 16;
    const sliceWidth = this.props.width / numberPoints;
    // console.table(signals)
    // // NEW CHANGE: ONLY SUM COLOR
    // for (let signal of signals){
    //
    //   // We get the x-distance between each point by dividing the total width by the number of points
    //   let color;
    //   switch (signal.color) {
    //     case 0:
    //       color = WAVECOLOR1;
    //       break;
    //     case 1:
    //       color = WAVECOLOR2;
    //       break;
    //     case 2:
    //       color = WAVECOLOR3;
    //       break;
    //     case 3:
    //       color = WAVECOLOR4;
    //       break;
    //     case 4:
    //       color = WAVECOLOR5;
    //       break;
    //     case 5:
    //       color = WAVECOLOR6;
    //       break;
    //     default:
    //       color = WAVECOLOR1;
    //       break;
    //     }
    //
    //   /*
    //   let maxHeight = calculateMaximumPureSingleWave(numberPoints, sliceWidth);
    //   let scaleProportion = calculateProportionWave(maxHeight*2);
    //   */
    //
    //   // We draw the blue wave line
    //   this.ctx.beginPath();
    //   if(signals.length === 1){
    //     this.setStyleWidthOpacity(this.ctx, color, '5', 1);
    //   } else {
    //     this.setStyleWidthOpacity(this.ctx, color, '1', 1);
    //   }
    //
    //   // x starts at 0 (first point is at 0)
    //   let x = 0;
    //   // For each of the points that we have
    //   let volume = dbToLinear(signal.volume);
    //   if(isNaN(volume)){
    //     volume = 0;
    //   }
    //   let wavelength = 100 * this.props.height / signal.freq;
    //   let v = wavelength / signal.freq;
    //   // v = 0;
    //   let k = 2 * Math.PI / wavelength;
    //   for (let i = 0; i < numberPoints; i++) {
    //     let y = 0;
    //     // Calculate the location of the point using the equation of the wave.
    //     y+= volume * 350 * Math.cos(k * (x + v * t))
    //     y += this.props.height / 2;
    //
    //     // We draw the point in the canvas
    //     if (i === 0) {
    //       this.ctx.moveTo(x, y);
    //     } else {
    //       this.ctx.lineTo(x, y);
    //
    //       // wavesCanvasCtx.fillStyle = WAVECOLORTOTAL;
    //       // wavesCanvasCtx.fillRect(x,y,1,1);
    //     }
    //     // x moves the x-distance to the right
    //     x += sliceWidth;
    //   }
    //   this.ctx.stroke();
    // }

    // NEW CHANGE: ONLY SUM COLOR
    // if(signals.length > 1){
      // Draw combined wave
      this.ctx.beginPath();
      this.setStyleWidthOpacity(this.ctx, WAVECOLORTOTAL, '5', 1);

      // x starts at 0 (first point is at 0)
      let x = 0;
      // For each of the points that we have

      // let volume = dbToLinear(signal.volume);
      let volume = 1;
      if(isNaN(volume)){
        volume = 0;
      }
      let t = 0;
      //let wavelength = 100 * this.props.height / signal.freq;
      //let v = wavelength / signal.freq;
      //let k = 2 * Math.PI / wavelength;
      for (let i = 0; i < numberPoints; i++) {
        let y = 0;
          for (let signal of signals){
            let wavelength = 100 * this.props.height / signal.freq;
            let v = wavelength / signal.freq;
            let k = 2 * Math.PI / wavelength;
            let volume = dbToLinear(signal.volume);
            let f;
            switch (signal.wavetype) {
              case "sine":
                f = x => Math.cos(k * (x + v * t));
                break;
              case "square":
                f = x => (Math.cos(k * (x + v * t)) > 0) ? 1 : -1;
                break;
              case "sawtooth":
                f = x => 2 * (x / wavelength - Math.floor(0.5 +  x / wavelength));
                break;
              case "triangle":
                f = x => 4 / wavelength*(Math.abs(x % wavelength - wavelength / 2) - wavelength / 4);
                break;
              default:
                f = val => Infinity;
            }
            if(isNaN(volume)){
              volume = 0;
            }
            y += (volume * 350 * f(x));
        }
        //let y = 0;
        // Calculate the location of the point using the equation of the wave.
        //y+= volume * 350 * Math.cos(k * (x + v * t))
        // if (signal.volume < 0) {
        //   y += (0 * 350 * Math.cos(k * (x + v * t)));
        // } else {
        //   y += (amplitude[0] * 350 * Math.cos(k * (x + v * t)));
        // }

        // y *= scaleProportion;

        y += this.props.height / 2;

        // We draw the point in the canvas
        if (i === 0) {
          this.ctx.moveTo(x, y);
        } else {
          // if(i == 4022) console.log(y)
          this.ctx.lineTo(x, y);

          // wavesCanvasCtx.fillStyle = WAVECOLORTOTAL;
          // wavesCanvasCtx.fillRect(x,y,1,1);
        }
        // x moves the x-distance to the right
        x += sliceWidth;
      }
      this.ctx.stroke();

      // Find min freq and Draw axes
      this.props.drawCombinedInfo(signals.reduce((total, signal)=>{
        return (signal.freq < total) ? signal.freq: total;
      }, Infinity));
    // }
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

    ctx.fillStyle = "white";
    ctx.font = "1.25em Verdana";
    ctx.fillText("Time", canvasWidth*0.94, canvasHeight*0.6);
    ctx.fillText("Air Pressure", canvasWidth*0.52, canvasHeight*0.04);

    // Draw the scale for the canvas
    // this.drawScaleInfo(ctx, midPoint, canvasHeight, dashSpace);
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
    this.createGrid(this.ctx, this.canvas);

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
      </div>
    );
  }
}
