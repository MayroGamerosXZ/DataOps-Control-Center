import React, { useState, useEffect } from 'react';
import { Paper, Typography, Box, Grid, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, MenuItem, Select, FormControl, InputLabel, CircularProgress } from '@mui/material';
import axios from 'axios';

const Databases = () => {
  const [schema, setSchema] = useState({});
  const [selectedTable, setSelectedTable] = useState('');
  const [injectRecords, setInjectRecords] = useState(500);
  const [sqlQuery, setSqlQuery] = useState('');
  const [queryResults, setQueryResults] = useState([]);
  const [queryColumns, setQueryColumns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSchema();
  }, []);

  const fetchSchema = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/databases/schema');
      setSchema(response.data.schema);
    } catch (error) {
      console.error("Error fetching schema", error);
    }
  };

  const handleInject = async () => {
    if (!selectedTable) {
      setMessage("Selecciona una tabla primero.");
      return;
    }
    setLoading(true);
    setMessage(`Inyectando ${injectRecords} registros en ${selectedTable}...`);
    try {
      const response = await axios.post('http://localhost:8000/api/databases/inject', {
        table_name: selectedTable,
        num_records: Number(injectRecords)
      });
      setMessage(response.data.message);
    } catch (error) {
      setMessage(`Error: ${error.response?.data?.detail || error.message}`);
    }
    setLoading(false);
  };

  const handleQuery = async () => {
    if (!sqlQuery.trim()) return;
    setLoading(true);
    setMessage("Ejecutando consulta...");
    try {
      const response = await axios.post('http://localhost:8000/api/databases/query', {
        query: sqlQuery
      });
      
      setMessage(response.data.message);
      
      if (response.data.records && response.data.records.length > 0) {
        setQueryResults(response.data.records);
        setQueryColumns(Object.keys(response.data.records[0]));
      } else {
        setQueryResults([]);
        setQueryColumns([]);
      }
    } catch (error) {
      setMessage(`Error SQL: ${error.response?.data?.detail || error.message}`);
      setQueryResults([]);
      setQueryColumns([]);
    }
    setLoading(false);
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>Gestión de Bases de Datos</Typography>
      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Inyector de Datos Dinámico</Typography>
            
            <FormControl fullWidth margin="dense">
              <InputLabel>Tabla Destino</InputLabel>
              <Select
                value={selectedTable}
                label="Tabla Destino"
                onChange={(e) => setSelectedTable(e.target.value)}
              >
                {Object.keys(schema).map(t => (
                  <MenuItem key={t} value={t}>{t}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField 
              fullWidth 
              margin="dense" 
              label="Cantidad de Registros" 
              type="number" 
              value={injectRecords}
              onChange={(e) => setInjectRecords(e.target.value)}
              sx={{ mt: 2 }} 
            />
            
            <Button 
              variant="contained" 
              color="secondary" 
              fullWidth 
              sx={{ mt: 3 }}
              onClick={handleInject}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : "Inyectar Datos Reales"}
            </Button>
            
            {message && <Typography variant="body2" sx={{ mt: 2, color: 'success.main' }}>{message}</Typography>}
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Explorador de Esquemas</Typography>
            {Object.keys(schema).length === 0 ? (
              <Typography variant="body2" color="text.secondary">Cargando esquema...</Typography>
            ) : (
              <Box sx={{ maxHeight: '300px', overflowY: 'auto' }}>
                {Object.entries(schema).map(([table, cols]) => (
                  <Box key={table} sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="primary">{table}</Typography>
                    <ul style={{ margin: 0, paddingLeft: '20px', color: '#8ca3ba', fontSize: '14px' }}>
                      {cols.map((col, i) => (
                        <li key={i}>{col.column} ({col.type})</li>
                      ))}
                    </ul>
                  </Box>
                ))}
              </Box>
            )}
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
              placeholder="Escribe tu consulta SQL aquí... Ej: SELECT * FROM connections LIMIT 10;"
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
              sx={{ fontFamily: 'monospace', bgcolor: 'rgba(0,0,0,0.3)', borderRadius: 1 }}
            />
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="contained" color="primary" onClick={handleQuery} disabled={loading}>
                Ejecutar Consulta
              </Button>
            </Box>
            
            <Typography variant="subtitle1" sx={{ mt: 4, mb: 2 }}>Resultados</Typography>
            <TableContainer sx={{ flexGrow: 1, bgcolor: 'rgba(0,0,0,0.3)', borderRadius: '12px', maxHeight: '400px' }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {queryColumns.map((col) => (
                      <TableCell key={col} sx={{ fontWeight: 'bold', bgcolor: 'rgba(17, 25, 40, 0.9)' }}>
                        {col}
                      </TableCell>
                    ))}
                    {queryColumns.length === 0 && <TableCell>#</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {queryResults.length > 0 ? (
                    queryResults.map((row, i) => (
                      <TableRow key={i} hover>
                        {queryColumns.map((col) => (
                          <TableCell key={col}>{String(row[col])}</TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={queryColumns.length || 1} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        Ejecuta una consulta para ver los resultados
                      </TableCell>
                    </TableRow>
                  )}
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
