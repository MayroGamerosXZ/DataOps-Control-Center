import React from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Grid } from '@mui/material';

const Audit = () => {
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>Auditoría Centralizada</Typography>
      
      <Paper sx={{ p: 4 }}>
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth label="Buscar por usuario o motor..." variant="outlined" size="small" />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth label="Filtrar por fecha" type="date" variant="outlined" size="small" InputLabelProps={{ shrink: true }} />
          </Grid>
        </Grid>

        <TableContainer sx={{ bgcolor: 'rgba(0,0,0,0.3)', borderRadius: '12px' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Fecha</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Usuario</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Motor Afectado</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Acción Realizada</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Filas Afectadas</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {/* Ejemplo simulado */}
              <TableRow hover>
                <TableCell>2026-05-30 14:00:05</TableCell>
                <TableCell>Mayro</TableCell>
                <TableCell>SQL Server</TableCell>
                <TableCell>Inyección Real (clientes)</TableCell>
                <TableCell>5000</TableCell>
                <TableCell sx={{ color: 'success.main' }}>Completado</TableCell>
              </TableRow>
              <TableRow hover>
                <TableCell>2026-05-30 13:45:10</TableCell>
                <TableCell>Sistema</TableCell>
                <TableCell>PostgreSQL</TableCell>
                <TableCell>Backup Full a Azure</TableCell>
                <TableCell>-</TableCell>
                <TableCell sx={{ color: 'success.main' }}>Completado</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default Audit;
