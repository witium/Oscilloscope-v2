import React, { Component } from 'react'
import { Input, Menu, Dropdown } from 'semantic-ui-react'

import "../styles/menu.css"

let options = [
  {key: 'Spectrogram', text: 'Spectrogram', value: 'Spectrogram'},
  {key: 'Oscilloscope', text: 'Oscilloscope', value: 'Oscilloscope'},  
]

class MainMenu extends Component {

  switchApplication = (e, data) => {
    if (data.value === "Spectrogram") {
      // this.props.history.push('/Spectrogram');
      window.location.href = '/Spectrogram';
    }
  }

  render() {
    return (
      <div className="menu-container">
        <Menu style={{border: "0", height: "100%"}}>
          <Menu.Header className="menu-title" active="false">Signal Generator</Menu.Header>
          {/* <Menu.Item className="function-switch-button-container"> */}
            {/* <button className="function-switch-button" onClick={this.switchToSpectrogram}>Spectrogram</button> */}
          <Menu.Item className="app-bar-dropdown-container"> 
            <Dropdown text="Signal Generator" className="app-bar-dropdown" selection options={options} onChange={this.switchApplication}>              
            </Dropdown>
          </Menu.Item>
          {/* </Menu.Item> */}

          {/*<Menu.Item position='right'>
            <Input action={{ type: 'submit', content: 'Go' }} placeholder='Navigate to...' />
          </Menu.Item>*/}
        </Menu >
      </div>
    );
  }
}

export default MainMenu
