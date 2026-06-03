import React, { useState, useEffect } from 'react';
import {
  Grid, Paper, Box, Typography, TextField, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, MenuItem, Select,
  FormControl, InputLabel, CircularProgress, Alert, List, ListItem,
  ListItemText, Chip
} from '@mui/material';
import axios from 'axios';

const Databases = () => {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estado para la ejecución de consultas
  const [selectedDb, setSelectedDb] = useState('');
  const [queryText, setQueryText] = useState('SELECT * FROM pg_catalog.pg_tables LIMIT 5;');
  const [queryResult, setQueryResult] = useState(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryError, setQueryError] = useState('');

  // Nuevo Motor State
  const [formData, setFormData] = useState({
    nombre: '', motor: 'PostgreSQL', host: '', port: '5432', database_name: '', user_name: '', password: ''
  });
  const [registerStatus, setRegisterStatus] = useState({ type: '', message: '' });

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/connections/');
      if (response.data.status === 'success') {
        setConnections(response.data.connections);
        if (response.data.connections.length > 0 && !selectedDb) {
          setSelectedDb(response.data.connections[0].id);
        }
      }
    } catch (err) {
      setError('No se pudieron cargar las conexiones. Verifica el backend.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegisterStatus({ type: 'info', message: 'Registrando...' });
    try {
      const response = await axios.post('http://localhost:8000/api/connections/', formData);
      setRegisterStatus({ type: 'success', message: response.data.message });
      fetchConnections(); // Recargar la lista
      // Limpiar formulario básico
      setFormData({ ...formData, nombre: '', database_name: '', password: '' });
    } catch (error) {
      setRegisterStatus({ type: 'error', message: error.response?.data?.detail || 'Error al registrar el motor.' });
    }
  };

  const handleExecuteQuery = async () => {
    if (!selectedDb || !queryText.trim()) return;

    setQueryLoading(true);
    setQueryError('');
    setQueryResult(null);

    try {
      const response = await axios.post('http://localhost:8000/api/queries/execute', {
        db_id: selectedDb,
        query_text: queryText
      });
      setQueryResult(response.data);
    } catch (err) {
      setQueryError(err.response?.data?.detail || 'Error ejecutando la consulta');
    } finally {
      setQueryLoading(false);
    }
  };

  return (
    <Grid container spacing={4}>

      {/* SECCIÓN IZQUIERDA: LISTA Y REGISTRO */}
      <Grid item xs={12} lg={4}>
        <Paper sx={{ p: 4, mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>Motores Conectados</Typography>
          {loading ? (
            <CircularProgress />
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : connections.length === 0 ? (
            <Typography>No hay motores registrados aún.</Typography>
          ) : (
            <List sx={{ width: '100%', bgcolor: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
              {connections.map((conn) => (
                <ListItem key={conn.id} sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <ListItemText
                    primary={`${conn.nombre} (${conn.motor})`}
                    secondary={`${conn.host}:${conn.port} - DB: ${conn.database_name}`}
                  />
                  <Chip size="small" label={conn.status} color={conn.status === 'ACTIVE' ? 'success' : 'default'} />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>

        <Paper sx={{ p: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3, color: 'primary.main' }}>Añadir Nuevo Motor</Typography>
          {registerStatus.message && (
            <Alert severity={registerStatus.type} sx={{ mb: 2 }}>{registerStatus.message}</Alert>
          )}
          <form onSubmit={handleRegisterSubmit}>
            <TextField fullWidth required margin="dense" label="Nombre (Alias)" value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} size="small" />
            <FormControl fullWidth margin="dense" size="small">
              <InputLabel>Motor</InputLabel>
              <Select value={formData.motor} label="Motor" onChange={(e) => setFormData({...formData, motor: e.target.value})}>
                <MenuItem value="PostgreSQL">PostgreSQL</MenuItem>
                <MenuItem value="SQL Server">SQL Server</MenuItem>
              </Select>
            </FormControl>
            <Grid container spacing={2}>
              <Grid item xs={8}>
                <TextField fullWidth required margin="dense" label="Host / IP" value={formData.host} onChange={(e) => setFormData({...formData, host: e.target.value})} size="small" />
              </Grid>
              <Grid item xs={4}>
                <TextField fullWidth required margin="dense" label="Puerto" value={formData.port} onChange={(e) => setFormData({...formData, port: e.target.value})} size="small" />
              </Grid>
            </Grid>
            <TextField fullWidth required margin="dense" label="Base de Datos" value={formData.database_name} onChange={(e) => setFormData({...formData, database_name: e.target.value})} size="small" />
            <TextField fullWidth required margin="dense" label="Usuario" value={formData.user_name} onChange={(e) => setFormData({...formData, user_name: e.target.value})} size="small" />
            <TextField fullWidth required margin="dense" label="Contraseña" type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} size="small" />
            <Button type="submit" variant="contained" fullWidth sx={{ mt: 3 }}>Guardar y Encriptar</Button>
          </form>
        </Paper>
      </Grid>

      {/* SECCIÓN DERECHA: EJECUCIÓN DE CONSULTAS */}
      <Grid item xs={12} lg={8}>
        <Paper sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>Consola de Ejecución SQL</Typography>

          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <FormControl sx={{ minWidth: 200 }} size="small">
              <InputLabel>Target Database</InputLabel>
              <Select value={selectedDb} label="Target Database" onChange={(e) => setSelectedDb(e.target.value)}>
                {connections.map((conn) => (
                  <MenuItem key={conn.id} value={conn.id}>{conn.nombre}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button variant="contained" color="secondary" onClick={handleExecuteQuery} disabled={!selectedDb || queryLoading}>
              {queryLoading ? 'Ejecutando...' : 'Ejecutar Consulta'}
            </Button>
          </Box>

          <TextField
            multiline
            rows={5}
            fullWidth
            variant="outlined"
            placeholder="Escribe tu consulta SQL aquí (ej. SELECT * FROM tabla)"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            sx={{ mb: 3, fontFamily: 'monospace', bgcolor: 'rgba(0,0,0,0.4)' }}
          />

          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Resultados:</Typography>

          <Box sx={{ flexGrow: 1, bgcolor: 'rgba(17, 25, 40, 0.95)', borderRadius: '8px', p: 2, overflow: 'auto', minHeight: '300px', border: '1px solid rgba(255,255,255,0.1)' }}>
            {queryError && <Alert severity="error" sx={{ mb: 2 }}>{queryError}</Alert>}

            {queryResult && queryResult.message && (
              <Typography variant="body2" sx={{ color: 'success.main', mb: 2 }}>{queryResult.message}</Typography>
            )}

            {queryResult && queryResult.data && queryResult.data.length > 0 && (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {Object.keys(queryResult.data[0]).map((key) => (
                        <TableCell key={key} sx={{ color: 'primary.main', fontWeight: 'bold' }}>{key}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {queryResult.data.map((row, index) => (
                      <TableRow key={index} hover>
                        {Object.values(row).map((val, i) => (
                          <TableCell key={i} sx={{ color: '#cbd5e1' }}>{String(val)}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {queryResult && queryResult.data && queryResult.data.length === 0 && (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>La consulta se ejecutó correctamente pero no devolvió filas.</Typography>
            )}
          </Box>
        </Paper>
      </Grid>

    </Grid>
  );
};

export default Databases;