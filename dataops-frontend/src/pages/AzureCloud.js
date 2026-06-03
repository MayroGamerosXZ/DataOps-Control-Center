import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, IconButton, CircularProgress, Alert, Grid, TextField, Chip, Tooltip } from '@mui/material';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import axios from 'axios';

const AzureCloud = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [backupLoading, setBackupLoading] = useState(false);
  const [dbId, setDbId] = useState('2'); // Default to motor test 1
  const [message, setMessage] = useState('');

  const fetchHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('http://localhost:8000/api/backups/history');
      if (response.data.status === 'success') {
        setHistory(response.data.history || []);
      } else {
        setError('Respuesta no exitosa del servidor al cargar el historial.');
      }
    } catch (err) {
      console.error("Error fetching backup history:", err);
      setError('No se pudo cargar el historial de backups. Verifica el backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const triggerBackup = async (type, forceFail = false) => {
    setBackupLoading(true);
    setMessage(`Iniciando Backup ${type} en el motor con ID ${dbId}...`);
    setError('');
    try {
      let endpoint = `/api/backups/${type.toLowerCase()}/${dbId}`;
      if (forceFail) {
        endpoint = `/api/backups/full/fail/${dbId}`;
      }

      const response = await axios.post(`http://localhost:8000${endpoint}`);
      setMessage(response.data.message || `Backup ${type} completado.`);
      fetchHistory(); // Refresh list after backup
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message;
      setMessage(`Error: ${errorMsg}`);
      setError(errorMsg); // Mostrar el error también como una alerta
      fetchHistory(); // Refrescar para ver el backup fallido en el historial
    }
    setBackupLoading(false);
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>Centro de Control Cloud (Azure)</Typography>
      
      <Grid container spacing={4} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Generador de Backups Manual</Typography>
                <TextField 
                  fullWidth 
                  margin="dense" 
                  label="ID del Motor (Ej: 2 para PostgreSQL Test)"
                  type="number" 
                  value={dbId}
                  onChange={(e) => setDbId(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                        <Button 
                          variant="contained" 
                          color="primary" 
                          fullWidth 
                          onClick={() => triggerBackup('FULL')}
                          disabled={backupLoading}
                        >
                          Generar Backup FULL
                        </Button>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Button 
                          variant="contained" 
                          color="secondary" 
                          fullWidth 
                          onClick={() => triggerBackup('DIFF')}
                          disabled={backupLoading}
                        >
                          Generar Backup DIFF
                        </Button>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Tooltip title="Esto disparará la alerta 'BackupFallido' en el dashboard principal">
                        <Button
                          variant="outlined"
                          color="error"
                          fullWidth
                          onClick={() => triggerBackup('FULL', true)}
                          disabled={backupLoading}
                        >
                          Forzar Fallo de Backup
                        </Button>
                      </Tooltip>
                    </Grid>
                </Grid>
                {backupLoading && <CircularProgress sx={{ mt: 2 }} size={24} />}
                {message && <Typography variant="body2" sx={{ mt: 2, color: error ? 'error.main' : 'success.main' }}>{message}</Typography>}
            </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 4, minHeight: '400px' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">Historial de Backups en Base de Datos</Typography>
          <Button variant="contained" color="success" onClick={fetchHistory} disabled={loading}>
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Refrescar Historial'}
          </Button>
        </Box>

        {error && !backupLoading && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <TableContainer sx={{ bgcolor: 'rgba(0,0,0,0.3)', borderRadius: '12px' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Motor</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Tipo</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Tamaño (MB)</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Duración (seg)</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Fecha</TableCell>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>URL en Azure</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && history.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <CircularProgress color="primary" />
                    <Typography sx={{ mt: 2 }}>Cargando historial...</Typography>
                  </TableCell>
                </TableRow>
              ) : history.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No hay registros de backups. ¡Genera uno para empezar!
                  </TableCell>
                </TableRow>
              ) : (
                history.map((backup) => (
                  <TableRow key={backup.id} hover>
                    <TableCell>{backup.motor_nombre}</TableCell>
                    <TableCell>
                      <Chip label={backup.backup_type} size="small" color={backup.backup_type === 'FULL' ? 'primary' : 'secondary'} />
                    </TableCell>
                    <TableCell>
                      {backup.status === 'SUCCESS' ?
                        <Chip icon={<CheckCircleIcon />} label="Exitoso" size="small" color="success" variant="outlined" /> :
                        <Chip icon={<ErrorIcon />} label="Fallido" size="small" color="error" variant="outlined" />}
                    </TableCell>
                    <TableCell>{backup.file_size_mb?.toFixed(2) || 'N/A'}</TableCell>
                    <TableCell>{backup.duration_seconds?.toFixed(2) || 'N/A'}</TableCell>
                    <TableCell>{new Date(backup.timestamp).toLocaleString()}</TableCell>
                    <TableCell align="center">
                      {backup.cloud_url ? (
                        <Tooltip title="Abrir enlace en Azure">
                          <IconButton color="primary" href={backup.cloud_url} target="_blank">
                            <CloudDownloadIcon />
                          </IconButton>
                        </Tooltip>
                      ) : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default AzureCloud;