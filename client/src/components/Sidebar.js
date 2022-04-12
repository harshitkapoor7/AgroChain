import React from 'react';
import {
  CDBSidebar,
  CDBSidebarContent,
  CDBSidebarFooter,
  CDBSidebarHeader,
  CDBSidebarMenu,
  CDBSidebarMenuItem,
} from 'cdbreact';
import { NavLink } from 'react-router-dom';

const Sidebar = (setLoginUser) => {

  const logout = () => {
    setLoginUser({});
  }
  return (
    <div style={{ display: 'flex', height: 'auto',
    width: '30%', flexGrow: '1', flexBasis: '0', overflow: 'scroll initial' }}>
      <CDBSidebar textColor="#fff" backgroundColor="#333">
        <CDBSidebarHeader prefix={<i className="fa fa-bars fa-large"></i>}>
          <div className="text-decoration-none" style={{ color: 'inherit' }}>
            AgroChain
          </div>
        </CDBSidebarHeader>

        <CDBSidebarContent className="sidebar-content">
          <CDBSidebarMenu>
            <NavLink exact to="/" activeClassName="activeClicked">
              <CDBSidebarMenuItem icon="columns">Home</CDBSidebarMenuItem>
            </NavLink>
            <NavLink exact to="/blocks" activeClassName="activeClicked">
              <CDBSidebarMenuItem icon="table">Blocks</CDBSidebarMenuItem>
            </NavLink>
            <NavLink exact to="/conduct-transaction" activeClassName="activeClicked">
              <CDBSidebarMenuItem icon="user">Pay</CDBSidebarMenuItem>
            </NavLink>
            <NavLink exact to="/transaction-pool" activeClassName="activeClicked">
              <CDBSidebarMenuItem icon="chart-line">Transaction Pool</CDBSidebarMenuItem>
            </NavLink>

            <NavLink exact to="/login" onClick={logout}>
              <CDBSidebarMenuItem icon="exclamation-circle">Logout</CDBSidebarMenuItem>
            </NavLink>
          </CDBSidebarMenu>
        </CDBSidebarContent>

        <CDBSidebarFooter style={{ textAlign: 'center' }}>
         
        </CDBSidebarFooter>
      </CDBSidebar>
    </div>
  );
};

export default Sidebar;