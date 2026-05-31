import React from 'react';
import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ setIsAuthenticated }) => {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: 'radial-gradient(circle at 50% 0%, #1a2a42 0%, #0a0f1c 70%)' }}>
      <Sidebar />
      <Box sx={{ flexGrow: 1, p: 4, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
        <Header setIsAuthenticated={setIsAuthenticated} />
        <Box sx={{ flexGrow: 1 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
