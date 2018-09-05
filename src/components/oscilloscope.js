import React, { Component } from 'react'
import "../styles/oscilloscope.css"

export default class Oscilloscope extends Component {
  constructor(props) {
    super(props);
    
    this.state = {
      isStarted: false,
    }
  }
  
  startOscilloscope = () => {
    this.setState({
      isStarted: true,   
    })
  }

  render() {
    return (
      <div onClick={this.startOscilloscope}>
        <canvas width={this.props.width} height={this.props.height} ref={(c) => {this.canvas = c;}}/>  
        <div className="instructions">
          {!this.state.isStarted
            ? <p className="flashing">Click or tap anywhere on the canvas to start the spectrogram</p>
            : <p>Great! Be sure to allow use of your microphone.
            You can draw on the canvas to make sound!</p>
          }

        </div>
      </div>
    );
  }
}