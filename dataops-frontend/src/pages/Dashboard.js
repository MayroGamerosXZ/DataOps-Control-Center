import React, { useState } from 'react';
import { Grid, Paper, Box, Typography, Button, Tooltip, Zoom } from '@mui/material';
import axios from 'axios';

const Dashboard = () => {
  const [statusMessage, setStatusMessage] = useState("Sistema listo. Esperando comandos...");

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
      <Grid item xs={12} lg={4}>
        <Paper sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <Typography variant="h6" color="text.secondary">Vista Rápida de Métricas</Typography>
          <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
            (Las gráficas detalladas se encuentran en la pestaña de Telemetría)
          </Typography>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default Dashboard;
