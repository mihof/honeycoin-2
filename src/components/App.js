import React, { Component } from 'react';
import { Route, Switch } from 'react-router-dom';
import Blocks from './Blocks';
import ConductTransaction from './ConductTransaction';
import TransactionPool from './TransactionPool';
import Login from './Login';
import Signup from './Signup';
import userService from '../utils/userService';
import Home from './Home';

class App extends Component {
  state = {
    user: userService.getUser()
  };

  handleLogout = () => {
    userService.logout();
    this.setState({ user: null });
  }

  handleSignupOrLogin = () => {
    this.setState({user: userService.getUser()});
  }

  render() {
    return (
      <div>
        <header className='header-footer'>Honeycoin</header>
        <Switch>
          <Route exact path='/' render={() => 
            <Home
              handleLogout={this.handleLogout}
              user={this.state.user}
            />
          }/>
          <Route exact path='/signup' render={({ history }) => 
            <Signup
              history={history}
              handleSignupOrLogin={this.handleSignupOrLogin}
            />
          }/>
          <Route exact path='/login' render={({ history }) => 
            <Login
              history={history}
              handleSignupOrLogin={this.handleSignupOrLogin}
            />
          }/>
          <Route exact path='/blocks' render={({ history }) => 
            <Blocks
              history={history}
              user={this.state.user}
            />
          }/>
          <Route exact path='/conduct-transaction' render={({ history }) => 
            <ConductTransaction
              history={history}
              user={this.state.user}
            />
          }/>
          <Route exact path='/transaction-pool' render={({ history }) => 
            <TransactionPool
              history={history}
              user={this.state.user}
            />
          }/>
        </Switch>
      </div>
    )
  }
}

export default App;
