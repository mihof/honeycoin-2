import React from 'react';
import { Link } from 'react-router-dom';

const Nav = (props) => {
  console.log(props.user)
  const { address, balance } = props.walletInfo;
  let nav = props.user ?
    <div>
      <div>
        <Link to='' onClick={props.handleLogout}>Log Out</Link>
      </div>
      <div>
        <Link to='/conduct-transaction'>Conduct a Transaction</Link>
      </div>
      <div>
        <Link to='/transaction-pool'>Transaction Pool</Link>
      </div>
      <br />
      <div className='WalletInfo'>
        <div>Address: {address}</div>
        <div>Balance: {balance}</div>
      </div>
    </div> 
    :
    <div>
      <div>
        <Link to='/login'>Log In</Link>
      </div>
      <div>
        <Link to='/signup'>Sign Up</Link>
      </div>
    </div>;

  return (
    <div className='NavBar'>
      {nav}
    </div>
  );
};

export default Nav;