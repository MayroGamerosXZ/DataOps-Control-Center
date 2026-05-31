import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Grid, CircularProgress, Alert } from '@mui/material';
import axios from 'axios';

const Audit = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLogs();
    // Opcional: configurar un intervalo para actualizar en vivo
    const interval = setInterval(fetchLogs, 10000); // Actualiza cada 10 segundos
    return () => clearInterval(interval);
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/audit/logs');
      setLogs(response.data.logs || []);
      setError('');
    } catch (err) {
      console.error("Error fetching audit logs:", err);
      setError("No se pudieron cargar los registros de auditoría.");
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (log.usuario && log.usuario.toLowerCase().includes(searchLower)) ||
      (log.motor_afectado && log.motor_afectado.toLowerCase().includes(searchLower)) ||
      (log.accion_realizada && log.accion_realizada.toLowerCase().includes(searchLower))
    );
  });

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>Auditoría Centralizada</Typography>
      
      <Paper sx={{ p: 4, minHeight: '500px' }}>
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField 
              fullWidth 
              label="Buscar por usuario, motor o acción..." 
              variant="outlined" 
              size="small" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Grid>
          {/* Un botón de recarga manual podría ir aquí si se quita el polling automático */}
        </Grid>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <TableContainer sx={{ bgcolor: 'rgba(0,0,0,0.3)', borderRadius: '12px', maxHeight: '60vh' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'rgba(17, 25, 40, 0.95)' }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'rgba(17, 25, 40, 0.95)' }}>Fecha</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'rgba(17, 25, 40, 0.95)' }}>Usuario</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'rgba(17, 25, 40, 0.95)' }}>Motor Afectado</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'rgba(17, 25, 40, 0.95)' }}>Acción Realizada</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'rgba(17, 25, 40, 0.95)' }}>Filas Afectadas</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'rgba(17, 25, 40, 0.95)' }}>Estado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <CircularProgress color="primary" />
                    <Typography sx={{ mt: 2 }}>Cargando registros de auditoría...</Typography>
                  </TableCell>
                </TableRow>
              ) : filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No se encontraron registros de auditoría.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id} hover>
                    <TableCell>{log.id}</TableCell>
                    <TableCell>{log.fecha}</TableCell>
                    <TableCell>{log.usuario}</TableCell>
                    <TableCell>{log.motor_afectado}</TableCell>
                    <TableCell>{log.accion_realizada}</TableCell>
                    <TableCell>{log.filas_afectadas}</TableCell>
                    <TableCell sx={{ color: log.estado === 'Completado' ? 'success.main' : (log.estado === 'Error' ? 'error.main' : 'warning.main') }}>
                      {log.estado}
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

export default Audit;
