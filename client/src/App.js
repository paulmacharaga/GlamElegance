import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Toaster } from 'react-hot-toast';

// Components
import LandingPage from './components/LandingPage';
import BookingForm from './components/BookingForm';
import FeedbackForm from './components/FeedbackForm';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import QRGenerator from './components/QRGenerator';
import ThankYou from './components/ThankYou';
import GoogleAuthSuccess from './components/GoogleAuthSuccess';

// Create salon theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#2D1B69', // Deep purple
      light: '#5E4BA4',
      dark: '#1A0F3D'
    },
    secondary: {
      main: '#E91E63', // Pink accent
      light: '#F48FB1',
      dark: '#AD1457'
    },
    background: {
      default: '#F8F9FA',
      paper: '#FFFFFF'
    },
    text: {
      primary: '#2D1B69',
      secondary: '#666666'
    }
  },
  typography: {
    fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 600,
      fontSize: '2.5rem'
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem'
    },
    h3: {
      fontWeight: 500,
      fontSize: '1.5rem'
    },
    button: {
      textTransform: 'none',
      fontWeight: 500
    }
  },
  shape: {
    borderRadius: 12
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 25,
          padding: '12px 24px',
          fontSize: '1rem'
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 20px rgba(45, 27, 105, 0.1)',
          borderRadius: 16
        }
      }
    }
  }
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/scan" element={<LandingPage />} />
            <Route path="/book" element={<BookingForm />} />
            <Route path="/feedback" element={<FeedbackForm />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/qr" element={<QRGenerator />} />
            <Route path="/admin/google-auth-success" element={<GoogleAuthSuccess />} />
            <Route path="/thank-you" element={<ThankYou />} />
          </Routes>
          <Toaster 
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#2D1B69',
                color: '#fff',
                borderRadius: '25px'
              }
            }}
          />
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
