import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Button, Paper, Grid,
  ThemeProvider, createTheme, CssBaseline,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Badge, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Fade,
  Tooltip, Zoom, Fab, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import InfoIcon from '@mui/icons-material/Info'; // <-- IMPORTACIÓN CORREGIDA
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import axios from 'axios';

// ==========================================
// TEMA FUTURISTA (Glassmorphism & Colores Vibrantes)
// ==========================================
const futuristicTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#00f2fe' },     // Cian Neón
    secondary: { main: '#4facfe' },   // Azul Neón
    success: { main: '#43e97b' },     // Verde Brillante
    error: { main: '#ff0844' },       // Rojo Neón
    warning: { main: '#f83600' },     // Naranja Neón
    info: { main: '#b12a5b' },        // Magenta
    background: { default: '#0a0f1c', paper: 'rgba(17, 25, 40, 0.75)' },
    text: { primary: '#ffffff', secondary: '#8ca3ba' }
  },
  typography: { fontFamily: '"Urbanist", "Roboto", sans-serif' },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(16px) saturate(180%)',
          WebkitBackdropFilter: 'blur(16px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '14px',
          textTransform: 'none',
          fontWeight: 'bold',
          letterSpacing: '0.5px',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 10px 20px -5px rgba(0, 242, 254, 0.4)'
          }
        }
      }
    },
    // Estilos personalizados para los Globos Flotantes (Tooltips)
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: 'rgba(10, 15, 28, 0.95)',
          border: '1px solid #00f2fe',
          boxShadow: '0px 0px 20px rgba(0, 242, 254, 0.4)',
          fontSize: '14px',
          borderRadius: '10px',
          padding: '12px 16px',
          fontWeight: 'bold',
          color: '#e2e8f0'
        },
        arrow: { color: '#00f2fe' }
      }
    }
  }
});

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });

  const [statusMessage, setStatusMessage] = useState("Sistema listo. Esperando comandos...");
  const [alertsCount, setAlertsCount] = useState(0);
  const [tableData, setTableData] = useState([]);
  const [tableTitle, setTableTitle] = useState("");

  const [openModal, setOpenModal] = useState(false);
  const [openHelp, setOpenHelp] = useState(false); // Estado para el panel de arquitectura flotante

  const [formData, setFormData] = useState({
    engine: 'PostgreSQL', host: '', port: '', username: '', password: ''
  });

  const handleLogin = (e) => {
    e.preventDefault();
    // Validando credenciales para acceso (Login Simulado)
    if (loginForm.username === 'Mayro' && loginForm.password === 'Robin302019') {
      setIsAuthenticated(true);
    } else {
      alert("Credenciales incorrectas. (Pista: Mayro / Robin302019)");
    }
  };

  const executeCommand = async (endpoint, method = 'GET', moduleName) => {
    setStatusMessage(`[${moduleName}] Iniciando proceso...`);
    try {
      const response = method === 'POST'
        ? await axios.post(`http://localhost:8000${endpoint}`)
        : await axios.get(`http://localhost:8000${endpoint}`);

      let successMsg = response.data.message || "Operación procesada con éxito.";
      if (response.data.details) {
         successMsg += ` | Detalles: ${JSON.stringify(response.data.details)}`;
      }
      setStatusMessage(`[ÉXITO - ${moduleName}]: ${successMsg}`);
    } catch (error) {
      setStatusMessage(`[ERROR - ${moduleName}]: Falló la ejecución. Verifica la conexión con FastAPI.`);
    }
  };

  const loadLogsToTable = async (endpoint, title) => {
    setStatusMessage(`[Consulta] Extrayendo registros: ${title}...`);
    try {
      const response = await axios.get(`http://localhost:8000${endpoint}`);
      let rawData = response.data.records || response.data.data || response.data;
      let finalRecords = Array.isArray(rawData) ? rawData : (typeof rawData === 'object' && rawData !== null ? [rawData] : [{ valor: rawData }]);

      setTableData(finalRecords);
      setTableTitle(title);
      setStatusMessage(`[ÉXITO]: Datos cargados correctamente (${finalRecords.length} registros).`);
    } catch (error) {
      setStatusMessage(`[ERROR]: Ruta no encontrada o backend apagado.`);
      setTableData([]);
    }
  };

  const handleRegisterSubmit = async () => {
    setStatusMessage(`[Registro] Guardando nuevo motor ${formData.engine}...`);
    try {
      const response = await axios.post('http://localhost:8000/api/connections/register', formData);
      setStatusMessage(`[ÉXITO]: ${response.data.message}`);
      setOpenModal(false);
    } catch (error) {
      setStatusMessage(`[ERROR]: No se pudo registrar el motor.`);
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
      <Box sx={{ minHeight: '100vh', background: 'radial-gradient(circle at 50% 0%, #1a2a42 0%, #0a0f1c 70%)', pt: 4, pb: 8, position: 'relative' }}>
        <Container maxWidth="xl">

          {/* ENCABEZADO */}
          <Box sx={{ mb: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h3" sx={{ fontWeight: '900', background: '-webkit-linear-gradient(45deg, #00f2fe 30%, #4facfe 90%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                DataOps Control Center
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ letterSpacing: '1px' }}>
                Módulos de Alta Disponibilidad y Auditoría
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              <Button variant="outlined" color="error" onClick={() => setIsAuthenticated(false)}>Cerrar Sesión</Button>
              <Paper sx={{ px: 3, py: 1, display: 'flex', alignItems: 'center', gap: 2, borderRadius: '50px' }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>Alertas Activas</Typography>
                <IconButton onClick={() => executeCommand('/api/alerts/scan/1', 'POST', 'Escaneo Alertas')} sx={{ bgcolor: 'rgba(0,0,0,0.2)' }}>
                  <Badge badgeContent={alertsCount} color="error" max={99}>
                    <NotificationsActiveIcon sx={{ color: alertsCount > 0 ? '#ff0844' : '#43e97b' }} />
                  </Badge>
                </IconButton>
              </Paper>
            </Box>
          </Box>

          <Grid container spacing={4}>
            {/* SECCIÓN IZQUIERDA: MANDOS CON TOOLTIPS */}
            <Grid item xs={12} lg={7}>
              <Paper sx={{ p: 4, height: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Panel de Orquestación</Typography>
                  <Tooltip title="Agrega credenciales seguras de bases de datos para integrarlas al pool de monitoreo." arrow TransitionComponent={Zoom}>
                    <Button variant="contained" onClick={() => setOpenModal(true)} sx={{ borderRadius: '50px', px: 3 }}>
                      + Nuevo Motor
                    </Button>
                  </Tooltip>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Tooltip title="Realiza un ping a los motores para medir latencia y estado (Módulo 2)." arrow TransitionComponent={Zoom} placement="top">
                      <Button fullWidth variant="contained" color="secondary" size="large" onClick={() => executeCommand('/test-db', 'GET', 'Health Check')} sx={{ height: '60px' }}>
                        1. Health Check
                      </Button>
                    </Tooltip>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Tooltip title="Genera 100 hilos concurrentes simulando carga pesada de usuarios (Módulos 3 y 4)." arrow TransitionComponent={Zoom} placement="top">
                      <Button fullWidth variant="contained" color="warning" size="large" onClick={() => executeCommand('/api/queries/stress-test/1', 'POST', 'Prueba de Estrés')} sx={{ height: '60px' }}>
                        2. Stress Test
                      </Button>
                    </Tooltip>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Tooltip title="Simula y evalúa el 'Lag' en replicación distribuida (Normal, Media, Crítica) (Módulo 6)." arrow TransitionComponent={Zoom} placement="top">
                      <Button fullWidth variant="contained" color="primary" size="large" onClick={() => executeCommand('/api/replication/sync/1', 'POST', 'Replicación')} sx={{ height: '60px' }}>
                        3. Sync Réplica
                      </Button>
                    </Tooltip>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Tooltip title="Crea respaldos, genera Hash MD5 y los envía a Azure Blob Storage (Módulo 5)." arrow TransitionComponent={Zoom} placement="bottom">
                      <Button fullWidth variant="contained" color="success" size="large" onClick={() => executeCommand('/api/backups/full/1', 'POST', 'Backups Azure')} sx={{ height: '60px' }}>
                        4. Backup a Nube
                      </Button>
                    </Tooltip>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Tooltip title="Compara velocidad real: Consulta SQL directa vs Consulta servida en memoria por Redis (Módulo 7)." arrow TransitionComponent={Zoom} placement="bottom">
                      <Button fullWidth variant="contained" sx={{ bgcolor: '#8b5cf6', '&:hover': { bgcolor: '#7c3aed' }, height: '60px' }} onClick={() => executeCommand('/api/cache/demo', 'POST', 'Rendimiento Caché')}>
                        8. Demo Redis Caché
                      </Button>
                    </Tooltip>
                  </Grid>

                  <Grid item xs={12} sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" sx={{ color: 'error.main', mb: 1, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px' }}>
                      Zona de Desastres (Pruebas Controladas)
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Tooltip title="Fuerza un choque transaccional de escritura mutua para probar la detección del motor (Módulo 4)." arrow TransitionComponent={Zoom}>
                      <Button fullWidth variant="outlined" color="error" onClick={() => executeCommand('/api/queries/deadlock', 'POST', 'Forzar Deadlock')}>
                        5. Deadlock
                      </Button>
                    </Tooltip>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Tooltip title="Borra intencionalmente una tabla para simular pérdida total de datos operativos." arrow TransitionComponent={Zoom}>
                      <Button fullWidth variant="contained" color="error" onClick={() => executeCommand('/api/disaster/drop-table', 'POST', 'Simular Desastre')}>
                        6. DROP TABLE
                      </Button>
                    </Tooltip>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Tooltip title="Inicia la restauración point-in-time y calcula la pérdida de datos (RPO) y tiempo caído (RTO)." arrow TransitionComponent={Zoom}>
                      <Button fullWidth variant="contained" color="info" onClick={() => executeCommand('/api/disaster/restore', 'POST', 'Protocolo Recovery')}>
                        7. Recovery RTO/RPO
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

            {/* SECCIÓN DERECHA: TABLAS */}
            <Grid item xs={12} lg={5}>
              <Paper sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 4 }}>Auditoría Telemetría</Typography>

                <Grid container spacing={2} sx={{ mb: 4 }}>
                  <Grid item xs={6}>
                    <Button fullWidth variant="outlined" color="secondary" onClick={() => loadLogsToTable('/api/connections/logs', 'Health Check Logs')}>
                      Historial Salud
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button fullWidth variant="outlined" color="warning" onClick={() => loadLogsToTable('/api/queries/slow-logs', 'Slow Queries')}>
                      Queries Lentas
                    </Button>
                  </Grid>
                </Grid>

                <TableContainer sx={{ flexGrow: 1, bgcolor: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ bgcolor: 'rgba(17, 25, 40, 0.9)', color: 'primary.main', fontWeight: 'bold' }}>
                          {tableTitle ? `Logs: ${tableTitle}` : "Selecciona una vista"}
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {tableData.length === 0 ? (
                        <TableRow>
                          <TableCell sx={{ color: '#64748b', textAlign: 'center', py: 8 }}>Esperando datos de la base de control...</TableCell>
                        </TableRow>
                      ) : (
                        tableData.slice(0, 30).map((row, index) => (
                          <TableRow key={index} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                            <TableCell sx={{ color: '#cbd5e1', fontFamily: 'monospace', fontSize: '12px' }}>
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

          {/* BOTÓN FLOTANTE DE INFORMACIÓN (FAB) CON ICONO CORREGIDO */}
          <Tooltip title="Explicación del Flujo de Arquitectura" arrow placement="left" TransitionComponent={Zoom}>
            <Fab color="primary" sx={{ position: 'fixed', bottom: 30, right: 30, boxShadow: '0 0 20px rgba(0, 242, 254, 0.6)' }} onClick={() => setOpenHelp(true)}>
              <InfoIcon />
            </Fab>
          </Tooltip>

          {/* MODAL DE REGISTRO */}
          <Dialog open={openModal} onClose={() => setOpenModal(false)} PaperProps={{ sx: { bgcolor: '#1a2a42', backgroundImage: 'none' } }}>
            <DialogTitle sx={{ color: 'primary.main', fontWeight: 'bold' }}>Conectar Motor DB</DialogTitle>
            <DialogContent>
              <TextField select fullWidth margin="dense" label="Motor" value={formData.engine} onChange={(e) => setFormData({...formData, engine: e.target.value})} sx={{ mt: 2 }}>
                <MenuItem value="PostgreSQL">PostgreSQL</MenuItem>
                <MenuItem value="SQL Server">SQL Server</MenuItem>
                <MenuItem value="Oracle">Oracle DB</MenuItem>
              </TextField>
              <TextField fullWidth margin="dense" label="Host" onChange={(e) => setFormData({...formData, host: e.target.value})} sx={{ mt: 2 }} />
              <TextField fullWidth margin="dense" label="Puerto" onChange={(e) => setFormData({...formData, port: e.target.value})} sx={{ mt: 2 }} />
              <TextField fullWidth margin="dense" label="Usuario" onChange={(e) => setFormData({...formData, username: e.target.value})} sx={{ mt: 2 }} />
              <TextField fullWidth margin="dense" label="Contraseña" type="password" onChange={(e) => setFormData({...formData, password: e.target.value})} sx={{ mt: 2 }} />
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
              <Button onClick={() => setOpenModal(false)} color="inherit">Cancelar</Button>
              <Button onClick={handleRegisterSubmit} variant="contained">Guardar</Button>
            </DialogActions>
          </Dialog>

          {/* MODAL / PANEL DE ARQUITECTURA (CUADRO DESPLEGABLE) */}
          <Dialog open={openHelp} onClose={() => setOpenHelp(false)} fullWidth maxWidth="md" PaperProps={{ sx: { bgcolor: '#0f172a', border: '1px solid #4facfe' } }}>
            <DialogTitle sx={{ color: '#00f2fe', fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              ¿Cómo están relacionados los Módulos del Sistema?
            </DialogTitle>
            <DialogContent sx={{ mt: 2 }}>
              <Typography variant="body1" sx={{ color: '#cbd5e1', mb: 3 }}>
                Esta plataforma es un flujo orquestado. Ningún botón funciona aislado; representan el ciclo de vida de los datos empresariales:
              </Typography>

              <Accordion sx={{ bgcolor: 'rgba(255,255,255,0.05)', color: 'white', mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'primary.main' }} />}>
                  <Typography fontWeight="bold">1. La Base Operativa (Botones 1, 2 y 3)</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" color="text.secondary">
                    Todo empieza asegurando que los motores están vivos (<strong>Health Check</strong>). Una vez activos, se inyectan transacciones masivas (<strong>Stress Test</strong>) para obligar al sistema a encolar procesos. Ese alto volumen de datos viaja hacia nodos de respaldo mediante la <strong>Sincronización de Réplica</strong>.
                  </Typography>
                </AccordionDetails>
              </Accordion>

              <Accordion sx={{ bgcolor: 'rgba(255,255,255,0.05)', color: 'white', mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'primary.main' }} />}>
                  <Typography fontWeight="bold">2. Velocidad y Colisiones (Botones 5 y 8)</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" color="text.secondary">
                    Bajo esa carga extrema, las consultas compiten. Si chocan de frente, causan un <strong>Deadlock</strong>, el cual el backend atrapa y reporta. Para aliviar esa carga en la base de datos principal, entra <strong>Redis Caché</strong>, absorbiendo las lecturas repetitivas y devolviendo los datos en milisegundos.
                  </Typography>
                </AccordionDetails>
              </Accordion>

              <Accordion sx={{ bgcolor: 'rgba(255,255,255,0.05)', color: 'white', mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'primary.main' }} />}>
                  <Typography fontWeight="bold">3. Catástrofe y Rescate (Botones 4, 6 y 7)</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" color="text.secondary">
                    Constantemente enviamos snapshots cifrados a la nube (<strong>Backup Azure</strong>). Esto nos permite sobrevivir a un error fatal como un <strong>DROP TABLE</strong>. Inmediatamente ejecutamos el protocolo de <strong>Restauración</strong> para recuperar los datos perdidos evaluando nuestro margen de RTO y RPO.
                  </Typography>
                </AccordionDetails>
              </Accordion>

            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setOpenHelp(false)} variant="outlined">Entendido</Button>
            </DialogActions>
          </Dialog>

        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;