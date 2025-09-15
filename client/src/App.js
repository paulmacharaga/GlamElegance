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
import ErrorBoundary from './components/ErrorBoundary';

// Create Glam Elegance theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#6B2C7A', // Elegant purple (matching logo)
      light: '#8B4A9C',
      dark: '#4A1A5A'
    },
    secondary: {
      main: '#D4AF37', // Gold accent for elegance
      light: '#E8C547',
      dark: '#B8941F'
    },
    background: {
      default: '#F8F6FA', // Subtle purple tint
      paper: '#FFFFFF'
    },
    text: {
      primary: '#2D1B3D',
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
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}

export default App;
