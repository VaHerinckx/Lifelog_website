// components/Reusable_components/Layout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import NavigationBar from './NavigationBar';
import './Layout.css';

const Layout = () => {
  return (
    <div className="layout">
      <NavigationBar />
      <main className="layout-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
