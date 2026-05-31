import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, Fade, Paper, Typography, TextField, Button } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { futuristicTheme } from './theme';

import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Databases from './pages/Databases';
import AzureCloud from './pages/AzureCloud';
import Audit from './pages/Audit';
import Telemetry from './pages/Telemetry';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginForm.username === 'Mayro' && loginForm.password === 'Robin302019') {
      setIsAuthenticated(true);
    } else {
      alert("Credenciales incorrectas. (Pista: Mayro / Robin302019)");
    }
  };

  if (!isAuthenticated) {
    return (
      <ThemeProvider theme={futuristicTheme}>
        <CssBaseline />
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
                   background: 'linear-gradient(135deg, #0a0f1c 0%, #1a2a42 100%)' }}>
          <Fade in={true} timeout={1000}>
            <Paper elevation={24} sx={{ p: 6, maxWidth: 400, width: '90%', textAlign: 'center', borderRadius: '24px' }}>
              <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
                <Box sx={{ bgcolor: 'primary.main', p: 2, borderRadius: '50%', display: 'flex', boxShadow: '0 0 20px rgba(0, 242, 254, 0.5)' }}>
                  <LockOutlinedIcon sx={{ color: '#0a0f1c', fontSize: 40 }} />
                </Box>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 1 }}>
                DataOps Vault
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>
                Acceso autorizado requerido
              </Typography>
              <form onSubmit={handleLogin}>
                <TextField fullWidth margin="normal" label="Usuario" variant="outlined"
                  value={loginForm.username} onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                  sx={{ input: { color: 'white' } }} />
                <TextField fullWidth margin="normal" label="Contraseña" type="password" variant="outlined"
                  value={loginForm.password} onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  sx={{ input: { color: 'white' }, mb: 4 }} />
                <Button fullWidth type="submit" variant="contained" size="large" sx={{ py: 1.5, fontSize: '1.1rem' }}>
                  Autenticar
                </Button>
              </form>
            </Paper>
          </Fade>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={futuristicTheme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<Layout setIsAuthenticated={setIsAuthenticated} />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="databases" element={<Databases />} />
            <Route path="azure-cloud" element={<AzureCloud />} />
            <Route path="audit" element={<Audit />} />
            <Route path="telemetry" element={<Telemetry />} />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
