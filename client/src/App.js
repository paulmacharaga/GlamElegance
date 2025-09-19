import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Toaster } from 'react-hot-toast';

// Components
import LandingPage from './components/LandingPage';
import EnhancedBookingForm from './components/EnhancedBookingForm';
import FeedbackForm from './components/FeedbackForm';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import QRGenerator from './components/QRGenerator';
import ThankYou from './components/ThankYou';
import GoogleAuthSuccess from './components/GoogleAuthSuccess';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import CustomerLogin from './components/CustomerLogin';
import CustomerDashboard from './components/CustomerDashboard';
import CustomerProtectedRoute from './components/CustomerProtectedRoute';

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
              <Route path="/book" element={<EnhancedBookingForm />} />
              <Route path="/feedback" element={<FeedbackForm />} />
              <Route path="/admin" element={<AdminLogin />} />
              
              {/* Protected admin routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/bookings" element={<AdminDashboard />} />
                <Route path="/admin/services" element={<AdminDashboard />} />
                <Route path="/admin/staff" element={<AdminDashboard />} />
                <Route path="/admin/customers" element={<AdminDashboard />} />
                <Route path="/admin/loyalty" element={<AdminDashboard />} />
                <Route path="/admin/qr" element={<QRGenerator />} />
              </Route>
              
              <Route path="/admin/google-auth-success" element={<GoogleAuthSuccess />} />
              
              {/* Customer routes */}
              <Route path="/customer" element={<CustomerLogin />} />
              
              {/* Protected customer routes */}
              <Route element={<CustomerProtectedRoute />}>
                <Route path="/customer/dashboard" element={<CustomerDashboard />} />
                <Route path="/customer/bookings" element={<CustomerDashboard />} />
                <Route path="/customer/loyalty" element={<CustomerDashboard />} />
                <Route path="/customer/profile" element={<CustomerDashboard />} />
              </Route>
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
