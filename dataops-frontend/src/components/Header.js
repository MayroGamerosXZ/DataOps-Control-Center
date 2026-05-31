import React from 'react';
import { Box, Typography, Button, Paper, IconButton, Badge, Select, MenuItem, FormControl } from '@mui/material';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';

const Header = ({ setIsAuthenticated }) => {
  const [activeEngine, setActiveEngine] = React.useState('PostgreSQL');

  return (
    <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, pb: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        <Typography variant="h6" sx={{ color: 'text.secondary', letterSpacing: '1px' }}>
          Módulos de Alta Disponibilidad y Auditoría
        </Typography>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <Select
            value={activeEngine}
            onChange={(e) => setActiveEngine(e.target.value)}
            sx={{ color: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' } }}
          >
            <MenuItem value="PostgreSQL">PostgreSQL</MenuItem>
            <MenuItem value="SQLServer">SQL Server</MenuItem>
          </Select>
        </FormControl>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'success.main', boxShadow: '0 0 8px #43e97b' }} />
          <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 'bold' }}>Conectado</Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
        <Button variant="outlined" color="error" onClick={() => setIsAuthenticated(false)}>Cerrar Sesión</Button>
        <Paper sx={{ px: 3, py: 1, display: 'flex', alignItems: 'center', gap: 2, borderRadius: '50px', bgcolor: 'rgba(0,0,0,0.3)' }}>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>Alertas Activas</Typography>
          <IconButton sx={{ bgcolor: 'rgba(0,0,0,0.2)' }}>
            <Badge badgeContent={0} color="error" max={99}>
              <NotificationsActiveIcon sx={{ color: '#43e97b' }} />
            </Badge>
          </IconButton>
        </Paper>
      </Box>
    </Box>
  );
};

export default Header;
