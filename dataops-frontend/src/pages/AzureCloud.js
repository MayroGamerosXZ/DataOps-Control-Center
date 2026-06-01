import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, IconButton, CircularProgress, Alert, Grid, TextField } from '@mui/material';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import axios from 'axios';

const AzureCloud = () => {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [backupLoading, setBackupLoading] = useState(false);
  const [dbId, setDbId] = useState('2'); // Default to motor test 1
  const [message, setMessage] = useState('');

  const fetchBlobs = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('http://localhost:8000/api/azure/blobs');
      setBackups(response.data.blobs || []);
    } catch (err) {
      console.error("Error fetching blobs:", err);
      setError('No se pudieron cargar los backups desde Azure Blob Storage.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlobs();
  }, []);

  const handleDownload = (blobName) => {
    window.open(`http://localhost:8000/api/azure/download/${blobName}`, '_blank');
  };

  const triggerBackup = async (type) => {
    setBackupLoading(true);
    setMessage(`Iniciando Backup ${type} en el motor con ID ${dbId}...`);
    try {
      const endpoint = type === 'FULL' ? `/api/backups/full/${dbId}` : `/api/backups/diff/${dbId}`;
      const response = await axios.post(`http://localhost:8000${endpoint}`);
      setMessage(response.data.message);
      fetchBlobs(); // Refresh list after backup
    } catch (err) {
      setMessage(`Error: ${err.response?.data?.detail || err.message}`);
    }
    setBackupLoading(false);
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>Centro de Control Cloud (Azure)</Typography>
      
      <Grid container spacing={4} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Generador de Backups Local a Cloud</Typography>
                <TextField 
                  fullWidth 
                  margin="dense" 
                  label="ID del Motor (Ej: 2 para Test DB)" 
                  type="number" 
                  value={dbId}
                  onChange={(e) => setDbId(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <Grid container spacing={2}>
                    <Grid item xs={6}>
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
                    <Grid item xs={6}>
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
                </Grid>
                {backupLoading && <CircularProgress sx={{ mt: 2 }} size={24} />}
                {message && <Typography variant="body2" sx={{ mt: 2, color: 'success.main' }}>{message}</Typography>}
            </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 4, minHeight: '400px' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">Explorador de Azure Blob Storage</Typography>
          <Button variant="contained" color="success" onClick={fetchBlobs} disabled={loading}>
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Refrescar Contenedor'}
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <TableContainer sx={{ bgcolor: 'rgba(0,0,0,0.3)', borderRadius: '12px' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'rgba(17, 25, 40, 0.95)' }}>Nombre del Backup</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'rgba(17, 25, 40, 0.95)' }}>Tamaño Real</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'rgba(17, 25, 40, 0.95)' }}>Fecha de Subida</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'rgba(17, 25, 40, 0.95)' }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'rgba(17, 25, 40, 0.95)', textAlign: 'center' }}>Descargar</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && backups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <CircularProgress color="primary" />
                    <Typography sx={{ mt: 2 }}>Conectando con Azure...</Typography>
                  </TableCell>
                </TableRow>
              ) : backups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No se encontraron backups en la nube. Verifica tu contenedor.
                  </TableCell>
                </TableRow>
              ) : (
                backups.map((backup, idx) => (
                  <TableRow key={idx} hover>
                    <TableCell>{backup.name}</TableCell>
                    <TableCell>{backup.size}</TableCell>
                    <TableCell>{backup.date}</TableCell>
                    <TableCell sx={{ color: 'success.main' }}>{backup.status}</TableCell>
                    <TableCell align="center">
                      <IconButton color="primary" onClick={() => handleDownload(backup.name)}>
                        <CloudDownloadIcon />
                      </IconButton>
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