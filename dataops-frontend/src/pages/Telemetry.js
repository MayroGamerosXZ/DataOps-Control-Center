import React from 'react';
import { Box, Typography, Paper, Grid } from '@mui/material';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const Telemetry = () => {
  const pieData = {
    labels: ['Exitosos', 'Fallidos'],
    datasets: [
      {
        data: [15, 2],
        backgroundColor: ['#43e97b', '#ff0844'],
        borderWidth: 0,
      },
    ],
  };

  const barData = {
    labels: ['PostgreSQL', 'SQL Server'],
    datasets: [
      {
        label: 'Tiempo promedio de consultas (ms)',
        data: [120, 150],
        backgroundColor: '#00f2fe',
      },
    ],
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>Analítica y Telemetría</Typography>
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 4, height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Backups: Exitosos vs Fallidos</Typography>
            <Box sx={{ height: '200px', width: '100%' }}>
              <Pie data={pieData} options={{ maintainAspectRatio: false }} />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 4, height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Rendimiento de Consultas</Typography>
            <Box sx={{ height: '200px', width: '100%' }}>
              <Bar data={barData} options={{ maintainAspectRatio: false }} />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 4, height: '400px' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Monitor de Infraestructura (Grafana)</Typography>
            <Box sx={{ width: '100%', height: '100%', bgcolor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: 2 }}>
              {/* Aquí iría el iframe real de Grafana */}
              <Typography color="text.secondary">Iframe de Grafana Integrado Aquí</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Telemetry;
