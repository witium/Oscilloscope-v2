import React, { Component } from 'react'
import { Input, Menu } from 'semantic-ui-react'

import "../styles/menu.css"

class MainMenu extends Component {

  switchToSpectrogram = () =>{
    console.log("SWITCH");
    window.location = "https://listeningtowaves.github.io/Spectrogram";
  }

  render() {
    return (
      <div className="menu-container">
        <Menu>
          <Menu.Header className="menu-title" active="false">Signals Generator</Menu.Header>
          <Menu.Item className="function-switch-button-container">
            <button className="function-switch-button" onClick={this.switchToSpectrogram}>Spectrogram</button>
          </Menu.Item>

          {/*<Menu.Item position='right'>
            <Input action={{ type: 'submit', content: 'Go' }} placeholder='Navigate to...' />
          </Menu.Item>*/}
        </Menu >
      </div>
    );
  }
}

export default MainMenu
