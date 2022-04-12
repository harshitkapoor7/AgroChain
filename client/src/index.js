import React, { useState } from 'react';
import { render } from 'react-dom';
import { Router, Switch, Route } from 'react-router-dom';
import history from './history';
import Login from "./components/login1/login"
import Register from "./components/register/register"
import App from './App';
import Blocks from './components/Blocks';
import ConductTransaction from './components/ConductTransaction';
import TransactionPool from './components/TransactionPool';
import './index.css';
import HomePage from './components/HomePage';

render(
  
    <App/>,
    document.getElementById('root')
);