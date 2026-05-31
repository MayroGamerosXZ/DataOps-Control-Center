import React from 'react';
import { Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider, Typography } from '@mui/material';
import { NavLink } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import StorageIcon from '@mui/icons-material/Storage';
import CloudIcon from '@mui/icons-material/Cloud';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';
import TimelineIcon from '@mui/icons-material/Timeline';

const Sidebar = () => {
  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Bases de Datos', icon: <StorageIcon />, path: '/databases' },
    { text: 'Azure Cloud', icon: <CloudIcon />, path: '/azure-cloud' },
    { text: 'Auditoría', icon: <ManageSearchIcon />, path: '/audit' },
    { text: 'Telemetría', icon: <TimelineIcon />, path: '/telemetry' },
  ];

  return (
    <Box sx={{ width: 260, flexShrink: 0, bgcolor: 'background.paper', height: '100vh', borderRight: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', background: '-webkit-linear-gradient(45deg, #00f2fe 30%, #4facfe 90%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          DataOps Center
        </Typography>
      </Box>
      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
      <List sx={{ mt: 2, flexGrow: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              component={NavLink}
              to={item.path}
              sx={{
                mx: 2, borderRadius: '12px',
                '&.active': {
                  bgcolor: 'rgba(0, 242, 254, 0.15)',
                  boxShadow: 'inset 0 0 10px rgba(0, 242, 254, 0.1)'
                },
                '&.active .MuiListItemIcon-root': { color: 'primary.main' },
                '&.active .MuiListItemText-primary': { color: 'primary.main', fontWeight: 'bold' },
              }}
            >
              <ListItemIcon sx={{ color: 'text.secondary', minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} sx={{ color: 'text.primary' }} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default Sidebar;
