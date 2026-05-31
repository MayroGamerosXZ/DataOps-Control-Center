import React from 'react';
import { Paper, Typography, Box, Grid, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

const Databases = () => {
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>Gestión de Bases de Datos</Typography>
      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Inyector de Datos Dinámico</Typography>
            <TextField fullWidth margin="dense" label="Tabla Destino" placeholder="Ej: clientes" />
            <TextField fullWidth margin="dense" label="Cantidad de Registros" type="number" placeholder="Ej: 5000" sx={{ mt: 2 }} />
            <Button variant="contained" color="secondary" fullWidth sx={{ mt: 3 }}>
              Inyectar Datos Reales
            </Button>
          </Paper>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Explorador de Esquemas</Typography>
            <Typography variant="body2" color="text.secondary">
              Selecciona una tabla para ver su estructura...
            </Typography>
            {/* Lista de tablas simulada */}
          </Paper>
        </Grid>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Consola SQL Integrada</Typography>
            <TextField
              multiline
              rows={6}
              fullWidth
              variant="outlined"
              placeholder="Escribe tu consulta SQL aquí... Ej: SELECT * FROM clientes LIMIT 10;"
              sx={{ fontFamily: 'monospace', bgcolor: 'rgba(0,0,0,0.3)', borderRadius: 1 }}
            />
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="contained" color="primary">
                Ejecutar Consulta
              </Button>
            </Box>
            
            <Typography variant="subtitle1" sx={{ mt: 4, mb: 2 }}>Resultados</Typography>
            <TableContainer sx={{ flexGrow: 1, bgcolor: 'rgba(0,0,0,0.3)', borderRadius: '12px' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Columna 1</TableCell>
                    <TableCell>Columna 2</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      Ejecuta una consulta para ver los resultados
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Databases;
