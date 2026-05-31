import { createTheme } from '@mui/material/styles';

export const futuristicTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#00f2fe' },
    secondary: { main: '#4facfe' },
    success: { main: '#43e97b' },
    error: { main: '#ff0844' },
    warning: { main: '#f83600' },
    info: { main: '#b12a5b' },
    background: { default: '#0a0f1c', paper: 'rgba(17, 25, 40, 0.75)' },
    text: { primary: '#ffffff', secondary: '#8ca3ba' }
  },
  typography: { fontFamily: '"Urbanist", "Roboto", sans-serif' },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(16px) saturate(180%)',
          WebkitBackdropFilter: 'blur(16px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '14px',
          textTransform: 'none',
          fontWeight: 'bold',
          letterSpacing: '0.5px',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 10px 20px -5px rgba(0, 242, 254, 0.4)'
          }
        }
      }
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: 'rgba(10, 15, 28, 0.95)',
          border: '1px solid #00f2fe',
          boxShadow: '0px 0px 20px rgba(0, 242, 254, 0.4)',
          fontSize: '14px',
          borderRadius: '10px',
          padding: '12px 16px',
          fontWeight: 'bold',
          color: '#e2e8f0'
        },
        arrow: { color: '#00f2fe' }
      }
    }
  }
});
