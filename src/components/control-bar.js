import React, { Component } from 'react'
import "../styles/control-bar.css"

export default class ControlBar extends Component {
  render() {
    let cssClass = 'controlbar-container'
    return (
      <div>
        <canvas width={window.innerWidth / 4} height={window.innerHeight}/>
      </div>
    );
  }
}