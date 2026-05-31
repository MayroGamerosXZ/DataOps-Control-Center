import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, IconButton } from '@mui/material';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import axios from 'axios';

const AzureCloud = () => {
  const [backups, setBackups] = useState([]);

  // Simulando llamada a la API (Fase 4: GET /api/azure/blobs)
  useEffect(() => {
    // Aquí iría el fetch real: axios.get('/api/azure/blobs').then(...)
    setBackups([
      { name: 'backup_FULL_20260530.bak', size: '45 MB', date: '2026-05-30 14:00', status: 'Disponible' },
      { name: 'backup_FULL_20260529.bak', size: '44 MB', date: '2026-05-29 14:00', status: 'Disponible' }
    ]);
  }, []);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>Centro de Control Cloud (Azure)</Typography>
      
      <Paper sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">Explorador de Azure Blob Storage</Typography>
          <Button variant="contained" color="success">
            Refrescar Contenedor
          </Button>
        </Box>

        <TableContainer sx={{ bgcolor: 'rgba(0,0,0,0.3)', borderRadius: '12px' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Nombre del Backup</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Tamaño</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Fecha de Subida</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {backups.map((backup, idx) => (
                <TableRow key={idx} hover>
                  <TableCell>{backup.name}</TableCell>
                  <TableCell>{backup.size}</TableCell>
                  <TableCell>{backup.date}</TableCell>
                  <TableCell sx={{ color: 'success.main' }}>{backup.status}</TableCell>
                  <TableCell align="center">
                    <IconButton color="primary">
                      <CloudDownloadIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {backups.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No se encontraron backups en la nube
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default AzureCloud;
