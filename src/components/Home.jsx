import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import logo from '../images/logo.png';
import Nav from './Nav';


class Home extends Component {
  state = {
    walletInfo: {}
  };

  componentDidMount() {
    fetch(`${document.location.origin}/api/wallet-info`)
      .then(response => response.json())
        .then(json => this.setState({ walletInfo: json }));
  }

  render() {
    return (
      <div className='App'>
        <img className='logo' src={logo} alt='Honey comb'></img>
        <br />
        <div>
          Welcome to Honey
        </div>
        <br />
        <div>
          <Link to='/blocks'>Blocks</Link>
        </div>
        <div className='Nav'>
          <Nav
            user={this.props.user}
            handleLogout={this.props.handleLogout}
            walletInfo={this.state.walletInfo}
          />
        </div>
      </div>
    );
  }
}

export default Home;