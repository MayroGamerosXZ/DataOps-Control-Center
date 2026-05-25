import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Button, Paper, Grid,
  ThemeProvider, createTheme, CssBaseline,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Badge, IconButton
} from '@mui/material';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import axios from 'axios';

// Tema Oscuro Profesional Integrado
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#22c55e' },     // Verde esmeralda estilo consola
    secondary: { main: '#3b82f6' },   // Azul para consultas de lectura
    background: { default: '#0f172a', paper: '#1e293b' },
    text: { primary: '#f8fafc', secondary: '#94a3b8' }
  },
  typography: {
    fontFamily: '"Urbanist", "Roboto", "Helvetica", "Arial", sans-serif',
  }
});

function App() {
  const [statusMessage, setStatusMessage] = useState("Sistema listo. Esperando comandos...");
  const [alertsCount, setAlertsCount] = useState(0);
  const [tableData, setTableData] = useState([]);
  const [tableTitle, setTableTitle] = useState("");

  useEffect(() => {
    // Espacio reservado para el Polling de alertas futuras
  }, []);

  // Función genérica para Botones de Acción
  const executeCommand = async (endpoint, method = 'GET', moduleName) => {
    setStatusMessage(`[${moduleName}] Iniciando proceso...`);
    try {
      const response = method === 'POST'
        ? await axios.post(`http://localhost:8000${endpoint}`)
        : await axios.get(`http://localhost:8000${endpoint}`);

      const successMsg = response.data.message || "Operación procesada con éxito.";
      setStatusMessage(`[ÉXITO - ${moduleName}]: ${successMsg}`);
    } catch (error) {
      setStatusMessage(`[ERROR - ${moduleName}]: Falló la ejecución. Verifica que la ruta exista en Swagger.`);
      console.error(error);
    }
  };

  // FUNCIÓN BLINDADA: Extraer datos y forzar Array para evitar crasheos (tableData.slice)
  const loadLogsToTable = async (endpoint, title) => {
    setStatusMessage(`[Consulta] Extrayendo registros: ${title}...`);
    try {
      const response = await axios.get(`http://localhost:8000${endpoint}`);

      // Extraemos la información sin importar cómo la envíe Python
      let rawData = response.data.records || response.data.data || response.data;
      let finalRecords = [];

      // RED DE SEGURIDAD: Garantizamos que siempre sea una lista (Array)
      if (Array.isArray(rawData)) {
        finalRecords = rawData;
      } else if (typeof rawData === 'object' && rawData !== null) {
        finalRecords = [rawData]; // Envolvemos el objeto único en una lista
      } else {
        finalRecords = [{ valor: rawData }]; // Por si Python manda solo un texto plano
      }

      setTableData(finalRecords);
      setTableTitle(title);
      setStatusMessage(`[ÉXITO]: Datos cargados correctamente (${finalRecords.length} registros).`);
    } catch (error) {
      setStatusMessage(`[ERROR]: Ruta no encontrada. Asegúrate de haber programado este GET en FastAPI.`);
      setTableData([]);
    }
  };

  // Acción interactiva para la campana de notificaciones
  const handleBellClick = () => {
    executeCommand('/api/alerts/scan/1', 'POST', 'Escaneo de Alertas');
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ pb: 6 }}>

        {/* ENCABEZADO PRINCIPAL CON INDICADOR DE ALERTAS INTERACTIVO */}
        <Box sx={{ my: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              DataOps Control Center
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Módulos de Alta Disponibilidad y Auditoría de Datos
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', bgcolor: '#0f172a', p: 1, borderRadius: 2, border: '1px solid #334155' }}>
            <IconButton onClick={handleBellClick} title="Forzar escaneo de alertas">
              <Badge badgeContent={alertsCount} color="error" max={99}>
                <NotificationsActiveIcon sx={{ color: alertsCount > 0 ? '#ef4444' : '#22c55e', fontSize: 38 }} />
              </Badge>
            </IconButton>
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#94a3b8' }}>
              Alertas Activas
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={4}>
          {/* SECCIÓN IZQUIERDA */}
          <Grid item xs={12} md={6}>
            <Paper elevation={6} sx={{ p: 4, borderRadius: 3, height: '100%' }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
                Orquestación de Infraestructura
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Button fullWidth variant="contained" color="info" size="large" sx={{ fontWeight: 'bold' }} onClick={() => executeCommand('/test-db', 'GET', 'Health Check')}>
                    1. Probar Conexión
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button fullWidth variant="contained" color="warning" size="large" sx={{ fontWeight: 'bold' }} onClick={() => executeCommand('/api/queries/stress-test/1', 'POST', 'Prueba de Estrés')}>
                    2. Simular Estrés
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button fullWidth variant="contained" color="secondary" size="large" sx={{ fontWeight: 'bold' }} onClick={() => executeCommand('/api/replication/sync/1', 'POST', 'Replicación')}>
                    3. Sincronizar Esclavo
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button fullWidth variant="contained" color="success" size="large" sx={{ fontWeight: 'bold' }} onClick={() => executeCommand('/api/backups/full/1', 'POST', 'Backups Azure')}>
                    4. Forzar Backup
                  </Button>
                </Grid>
              </Grid>

              {/* CONSOLA DE REGISTROS */}
              <Box sx={{ mt: 5, p: 3, bgcolor: '#000000', borderRadius: 2, border: '1px solid #334155', minHeight: '120px' }}>
                <Typography variant="body2" sx={{ color: '#22c55e', fontFamily: 'monospace', fontSize: '15px' }}>
                  C:\DataOps\Logs&gt; {statusMessage}
                </Typography>
              </Box>
            </Paper>
          </Grid>

          {/* SECCIÓN DERECHA */}
          <Grid item xs={12} md={6}>
            <Paper elevation={6} sx={{ p: 4, borderRadius: 3, height: '100%', bgcolor: '#1e293b' }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
                Auditoría y Telemetría Analítica
              </Typography>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Button fullWidth variant="outlined" color="primary" onClick={() => loadLogsToTable('/api/cache/transactions/1', 'Transacciones en Caché')}>
                    Ver Logs de Caché
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button fullWidth variant="outlined" color="error" onClick={() => loadLogsToTable('/api/queries/slow-logs', 'Consultas Lentas')}>
                    Ver Queries Lentas
                  </Button>
                </Grid>
              </Grid>

              {/* VISUALIZADOR DE TABLAS INTELIGENTE */}
              <TableContainer sx={{ maxHeight: 280, bgcolor: '#0f172a', borderRadius: 2, border: '1px solid #334155' }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ bgcolor: '#1e293b', color: '#f8fafc', fontWeight: 'bold' }}>
                        {tableTitle ? `Logs Actuales: ${tableTitle}` : "Selecciona un log de auditoría arriba"}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tableData.length === 0 ? (
                      <TableRow>
                        <TableCell sx={{ color: '#64748b', textAlign: 'center', py: 4 }}>
                          No hay registros cargados en esta vista.
                        </TableCell>
                      </TableRow>
                    ) : (
                      tableData.slice(0, 30).map((row, index) => (
                        <TableRow key={index} hover>
                          <TableCell sx={{ color: '#cbd5e1', fontFamily: 'monospace', fontSize: '11px', borderBottom: '1px solid #1e293b' }}>
                            {JSON.stringify(row)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

            </Paper>
          </Grid>
        </Grid>

      </Container>
    </ThemeProvider>
  );
}

export default App;