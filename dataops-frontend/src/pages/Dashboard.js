import React, { useState, useEffect } from 'react';
import { Grid, Paper, Box, Typography, Button, Tooltip, Zoom, List, ListItem, ListItemText, ListItemIcon, Chip } from '@mui/material';

// Forma correcta de importar en MUI v5 para evitar problemas de exportaciones
import { WarningAmber, ErrorOutline, CheckCircleOutline } from '@mui/icons-material';

import axios from 'axios';

const Dashboard = () => {
  const [statusMessage, setStatusMessage] = useState("Sistema listo. Esperando comandos...");
  const [activeAlerts, setActiveAlerts] = useState([]);

  // Función para obtener las alertas desde el backend
  const fetchActiveAlerts = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/alerts/active');
      if (response.data.status === 'success') {
        setActiveAlerts(response.data.alerts);
      }
    } catch (error) {
      console.error("Error obteniendo alertas activas:", error);
    }
  };

  // Usar useEffect para hacer polling (consultar cada 5 segundos)
  useEffect(() => {
    fetchActiveAlerts(); // Llamada inicial
    const intervalId = setInterval(fetchActiveAlerts, 5000); // Llamada cada 5s
    return () => clearInterval(intervalId); // Limpieza al desmontar
  }, []);

  const executeCommand = async (endpoint, method = 'GET', moduleName) => {
    setStatusMessage(`[${moduleName}] Iniciando proceso...`);
    try {
      const response = method === 'POST'
        ? await axios.post(`http://localhost:8000${endpoint}`)
        : await axios.get(`http://localhost:8000${endpoint}`);

      let successMsg = response.data.message || "Operación procesada con éxito.";
      setStatusMessage(`[ÉXITO - ${moduleName}]: ${successMsg}`);
    } catch (error) {
      setStatusMessage(`[ERROR - ${moduleName}]: Falló la ejecución. Verifica la conexión con FastAPI.`);
    }
  };

  // Función auxiliar para renderizar el icono y color de la alerta
  const renderAlertIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <ErrorOutline sx={{ color: '#ff0844' }} />;
      case 'warning':
        return <WarningAmber sx={{ color: '#f83600' }} />;
      default:
        return <WarningAmber sx={{ color: '#f83600' }} />;
    }
  };

  return (
    <Grid container spacing={4}>
      <Grid item xs={12} lg={8}>
        <Paper sx={{ p: 4, height: '100%' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Panel de Orquestación General</Typography>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Tooltip title="Realiza un ping a los motores para medir latencia y estado." arrow TransitionComponent={Zoom}>
                <Button fullWidth variant="contained" color="secondary" size="large" onClick={() => executeCommand('/test-db', 'GET', 'Health Check')} sx={{ height: '60px' }}>
                  Health Check
                </Button>
              </Tooltip>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Tooltip title="Genera hilos concurrentes simulando carga pesada." arrow TransitionComponent={Zoom}>
                <Button fullWidth variant="contained" color="warning" size="large" onClick={() => executeCommand('/api/queries/stress-test/1', 'POST', 'Prueba de Estrés')} sx={{ height: '60px' }}>
                  Stress Test
                </Button>
              </Tooltip>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Tooltip title="Simula y evalúa el 'Lag' en replicación distribuida." arrow TransitionComponent={Zoom}>
                <Button fullWidth variant="contained" color="primary" size="large" onClick={() => executeCommand('/api/replication/sync/1', 'POST', 'Replicación')} sx={{ height: '60px' }}>
                  Sync Réplica
                </Button>
              </Tooltip>
            </Grid>

            <Grid item xs={12} sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ color: 'error.main', mb: 1, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px' }}>
                Zona de Desastres (Pruebas Controladas)
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Tooltip title="Fuerza un choque transaccional." arrow TransitionComponent={Zoom}>
                <Button fullWidth variant="outlined" color="error" onClick={() => executeCommand('/api/queries/deadlock', 'POST', 'Forzar Deadlock')}>
                  Deadlock
                </Button>
              </Tooltip>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Tooltip title="Borra intencionalmente una tabla." arrow TransitionComponent={Zoom}>
                <Button fullWidth variant="contained" color="error" onClick={() => executeCommand('/api/disaster/drop-table', 'POST', 'Simular Desastre')}>
                  DROP TABLE
                </Button>
              </Tooltip>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Tooltip title="Inicia la restauración point-in-time." arrow TransitionComponent={Zoom}>
                <Button fullWidth variant="contained" color="info" onClick={() => executeCommand('/api/disaster/restore', 'POST', 'Protocolo Recovery')}>
                  Recovery RTO/RPO
                </Button>
              </Tooltip>
            </Grid>
          </Grid>

          {/* CONSOLA DE TERMINAL */}
          <Box sx={{ mt: 5, p: 3, bgcolor: 'rgba(0,0,0,0.6)', borderRadius: '16px', borderLeft: '4px solid #00f2fe', minHeight: '120px' }}>
            <Typography variant="body2" sx={{ color: '#43e97b', fontFamily: '"Fira Code", monospace', fontSize: '15px' }}>
              root@dataops-vault:~# {statusMessage}
            </Typography>
          </Box>
        </Paper>
      </Grid>

      {/* NUEVO PANEL DE ALERTAS EN EL FRONTEND */}
      <Grid item xs={12} lg={4}>
        <Paper sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'rgba(17, 25, 40, 0.85)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, borderBottom: '1px solid rgba(255,255,255,0.1)', pb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#00f2fe', flexGrow: 1 }}>
              Monitoreo de Alertas
            </Typography>
            <Chip
              label={activeAlerts.length > 0 ? `${activeAlerts.length} Activas` : "Todo OK"}
              color={activeAlerts.length > 0 ? "error" : "success"}
              size="small"
            />
          </Box>

          {activeAlerts.length === 0 ? (
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', opacity: 0.5 }}>
              <CheckCircleOutline sx={{ fontSize: 60, color: '#43e97b', mb: 2 }} />
              <Typography variant="body1" sx={{ textAlign: 'center' }}>
                El sistema está estable.<br />No hay alertas pendientes.
              </Typography>
            </Box>
          ) : (
            <List sx={{ width: '100%', bgcolor: 'transparent', flexGrow: 1, overflow: 'auto', maxHeight: '400px' }}>
              {activeAlerts.map((alert, index) => (
                <ListItem
                  key={index}
                  alignItems="flex-start"
                  sx={{
                    bgcolor: 'rgba(0,0,0,0.4)',
                    mb: 2,
                    borderRadius: '8px',
                    borderLeft: `4px solid ${alert.severity === 'critical' ? '#ff0844' : '#f83600'}`
                  }}
                >
                  <ListItemIcon sx={{ minWidth: '40px', mt: 1 }}>
                    {renderAlertIcon(alert.severity)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'white' }}>
                        {alert.name}
                        <Chip label={alert.state} size="small" sx={{ ml: 1, height: '20px', fontSize: '0.7rem', bgcolor: 'rgba(255,255,255,0.1)' }} />
                      </Typography>
                    }
                    secondary={
                      <React.Fragment>
                        <Typography component="span" variant="body2" sx={{ color: '#00f2fe', display: 'block', mt: 0.5 }}>
                          Origen: {alert.container}
                        </Typography>
                        <Typography component="span" variant="body2" sx={{ color: '#8ca3ba', display: 'block', mt: 0.5 }}>
                          {alert.description}
                        </Typography>
                      </React.Fragment>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      </Grid>
    </Grid>
  );
};

export default Dashboard;