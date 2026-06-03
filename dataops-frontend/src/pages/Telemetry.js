import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, CircularProgress, Alert } from '@mui/material';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import axios from 'axios';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const Telemetry = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/telemetry/stats');
        setStats(response.data);
        setError(''); // Limpiar errores previos
      } catch (err) {
        console.error("Error fetching telemetry stats", err);
        setError("Error cargando los datos de telemetría. Verifica la conexión con FastAPI.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
    const interval = setInterval(fetchStats, 15000); // Actualiza cada 15 segundos
    return () => clearInterval(interval);
  }, []);

  const pieData = {
    labels: ['Exitosos', 'Fallidos', 'Otros'],
    datasets: [
      {
        data: stats ? [stats.pie_data.exitosos, stats.pie_data.fallidos, stats.pie_data.otros] : [0, 0, 0],
        backgroundColor: ['#43e97b', '#ff0844', '#f83600'],
        borderWidth: 0,
      },
    ],
  };

  const barData = {
    labels: stats ? stats.bar_data.labels : [],
    datasets: [
      {
        label: 'Operaciones Registradas por Motor',
        data: stats ? stats.bar_data.data : [],
        backgroundColor: '#00f2fe',
      },
    ],
  };

  const chartOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#ffffff' }
      }
    },
    scales: {
      x: { ticks: { color: '#8ca3ba' }, grid: { color: 'rgba(255,255,255,0.1)' } },
      y: { ticks: { color: '#8ca3ba' }, grid: { color: 'rgba(255,255,255,0.1)' } }
    }
  };

  const pieOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#ffffff' } }
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>Analítica y Telemetría</Typography>
      
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 4, height: '350px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Auditoría: Estado de Operaciones</Typography>
            {loading && !stats ? (
              <Box sx={{ display: 'flex', flexGrow: 1, alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress color="primary" />
              </Box>
            ) : (
              <Box sx={{ height: '250px', width: '100%' }}>
                <Pie data={pieData} options={pieOptions} />
              </Box>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 4, height: '350px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Actividad por Motor de Base de Datos</Typography>
            {loading && !stats ? (
              <Box sx={{ display: 'flex', flexGrow: 1, alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress color="primary" />
              </Box>
            ) : (
              <Box sx={{ height: '250px', width: '100%' }}>
                <Bar data={barData} options={chartOptions} />
              </Box>
            )}
          </Paper>
        </Grid>
        
        {/* ==================================================================== */}
        {/* --- INCORPORACIÓN DE GRAFANA NATIVA --- */}
        {/* ==================================================================== */}
        <Grid item xs={12}>
          <Paper sx={{ p: 4, height: '600px', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Monitor de Infraestructura (Grafana)</Typography>
              <Typography variant="body2" color="success.main" sx={{ fontWeight: 'bold' }}>Conectado (Puerto 3000)</Typography>
            </Box>
            <Box sx={{ width: '100%', flexGrow: 1, bgcolor: 'rgba(0,0,0,0.5)', borderRadius: 2, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
              <iframe 
                src="http://localhost:3000/d/dataops001/dataops-control-center-monitoreo?orgId=1&refresh=5s&theme=dark&kiosk=tv"
                width="100%" 
                height="100%" 
                frameBorder="0"
                title="Grafana Dashboard"
                onError={(e) => e.target.style.display = 'none'}
              ></iframe>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Telemetry;