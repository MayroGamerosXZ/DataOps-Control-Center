import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, IconButton, CircularProgress, Alert } from '@mui/material';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import axios from 'axios';

const AzureCloud = () => {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
    // Open download link in a new tab/window
    window.open(`http://localhost:8000/api/azure/download/${blobName}`, '_blank');
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>Centro de Control Cloud (Azure)</Typography>
      
      <Paper sx={{ p: 4, minHeight: '500px' }}>
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
