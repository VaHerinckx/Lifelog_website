// components/Reusable_components/Layout.jsx
import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import NavigationBar from './NavigationBar';
import './Layout.css';

const Layout = () => {
  const location = useLocation();

  console.log('📍 Layout component - Current route:', location.pathname);

  return (
    <div className="layout">
      <NavigationBar />
      <main className="layout-content">
        <Outlet key={location.pathname} />
      </main>
    </div>
  );
};

export default Layout;
