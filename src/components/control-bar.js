import React, { Component } from 'react'
import "../styles/control-bar.css"
import { getFreq, logspace } from "../util/conversions";

const ticks = 7;
const yLabelOffset = 5;

export default class ControlBar extends Component {
  componentDidMount() {
    this.ctx = this.canvas.getContext('2d');
    window.addEventListener("resize", this.handleResize);
    this.renderAxesLabels();

  }
  componentWillUnmount() {
    window.removeEventListener("resize", this.handleResize);
  }

  handleResize = () =>{
    this.props.handleResize();
    this.renderAxesLabels();
  }

  renderAxesLabels = () => {
    console.log(this.props.width);
    console.log(this.canvas.width)
      let rect = this.props;
      // We clear the canvas to make sure we don't leave anything painted
      this.ctx.clearRect(0, 0, rect.width, rect.height);
      this.ctx.fillStyle = "#C1C5C9";
      this.ctx.fillRect(0, 0, rect.width, rect.height);
      console.log(rect.width);
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

  render() {
    let cssClass = 'controlbar-container'

    return (
        <canvas width={this.props.width} height={this.props.height} ref={(c) => {
          this.canvas = c;}} className="control-canvas"/>
    );
  }
}
