import React, { useState } from 'react';
import { Router, Switch, Route } from 'react-router-dom';
import history from './history';
import Login from "./components/login1/login"
import Register from "./components/register/register"
import HomePage from './components/HomePage';
import Blocks from './components/Blocks';
import ConductTransaction from './components/ConductTransaction';
import TransactionPool from './components/TransactionPool';
import './index.css';
import Sidebar from './components/Sidebar';
function App() {

  const [ user, setLoginUser] = useState({})
  return (
      <Router history={history}>
        <div className='App'>
        <Sidebar setLoginUser={setLoginUser}/>
        <Switch>
          <Route exact path="/">
            {
              user && user._id ? <HomePage user = {user}  setLoginUser={setLoginUser} /> :  <Login setLoginUser={setLoginUser}/>
              
            }
          </Route>
          <Route path="/login">
            <Login setLoginUser={setLoginUser}/>
          </Route>
          <Route path="/register">
            <Register />
          </Route>
          <Route path='/blocks' component={Blocks} />
            <Route path='/conduct-transaction' component={ConductTransaction} />
            <Route path='/transaction-pool' component={TransactionPool} />
        </Switch>
            </div>
      </Router>
  );
}

export default App;