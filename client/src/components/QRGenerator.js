import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  AppBar,
  Toolbar,
  IconButton,
  Grid,
  TextField
} from '@mui/material';
import { ArrowBack, Download, Print, Refresh } from '@mui/icons-material';
import axios from 'axios';
import toast from 'react-hot-toast';

const QRGenerator = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [qrUrl, setQrUrl] = useState('');

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/admin');
      return;
    }

    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    generateQRCode();
  }, [navigate]);

  const generateQRCode = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/qr/generate');
      setQrCode(response.data.qrCode);
      setQrUrl(response.data.url);
      toast.success('QR Code generated successfully!');
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      toast.error('Failed to generate QR code');
      
      if (error.response?.status === 401) {
        navigate('/admin');
      }
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCode) return;

    const link = document.createElement('a');
    link.download = 'hair-studio-qr-code.png';
    link.href = qrCode;
    link.click();
  };

  const printQRCode = () => {
    if (!qrCode) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Hair Studio QR Code</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              padding: 40px;
            }
            .qr-container {
              border: 2px solid #2D1B69;
              border-radius: 15px;
              padding: 30px;
              display: inline-block;
              background: white;
            }
            .logo {
              color: #2D1B69;
              font-size: 28px;
              font-weight: bold;
              margin-bottom: 20px;
            }
            .instructions {
              margin-top: 20px;
              color: #666;
              font-size: 14px;
              max-width: 300px;
              margin-left: auto;
              margin-right: auto;
            }
            .qr-code {
              margin: 20px 0;
            }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <div class="logo">Hair Studio</div>
            <div class="qr-code">
              <img src="${qrCode}" alt="QR Code" style="width: 250px; height: 250px;" />
            </div>
            <div class="instructions">
              <strong>Scan to:</strong><br>
              • Leave a Google Review<br>
              • Share Private Feedback<br>
              • Book an Appointment
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* App Bar */}
      <AppBar position="static">
        <Toolbar>
          <IconButton color="inherit" onClick={() => navigate('/admin/dashboard')}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            QR Code Generator
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={4}>
          {/* QR Code Display */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent sx={{ textAlign: 'center', p: 4 }}>
                <Typography variant="h5" gutterBottom color="primary">
                  Salon QR Code
                </Typography>
                
                {loading ? (
                  <Box py={4}>
                    <CircularProgress size={60} />
                    <Typography variant="body2" sx={{ mt: 2 }}>
                      Generating QR Code...
                    </Typography>
                  </Box>
                ) : qrCode ? (
                  <Box>
                    <Box
                      sx={{
                        border: '3px solid',
                        borderColor: 'primary.main',
                        borderRadius: 2,
                        p: 2,
                        display: 'inline-block',
                        background: 'white'
                      }}
                    >
                      <img
                        src={qrCode}
                        alt="Hair Studio QR Code"
                        style={{ width: '250px', height: '250px', display: 'block' }}
                      />
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                      Customers can scan this code to access your services
                    </Typography>
                  </Box>
                ) : (
                  <Alert severity="error">
                    Failed to generate QR code
                  </Alert>
                )}

                {/* Action Buttons */}
                <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
                  <Button
                    variant="contained"
                    startIcon={<Download />}
                    onClick={downloadQRCode}
                    disabled={!qrCode}
                  >
                    Download
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Print />}
                    onClick={printQRCode}
                    disabled={!qrCode}
                  >
                    Print
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={generateQRCode}
                    disabled={loading}
                  >
                    Regenerate
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Instructions and Settings */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  How to Use
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" paragraph>
                    <strong>1. Display the QR Code</strong><br />
                    Print and place the QR code in visible locations around your salon.
                  </Typography>
                  
                  <Typography variant="body2" paragraph>
                    <strong>2. Customer Scans</strong><br />
                    Customers use their phone camera to scan the code.
                  </Typography>
                  
                  <Typography variant="body2" paragraph>
                    <strong>3. Landing Page</strong><br />
                    They'll see options to leave reviews, feedback, or book appointments.
                  </Typography>
                </Box>

                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    <strong>Tip:</strong> Place QR codes at the reception desk, waiting area, 
                    and styling stations for maximum visibility.
                  </Typography>
                </Alert>

                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                  QR Code URL
                </Typography>
                <TextField
                  fullWidth
                  value={qrUrl}
                  InputProps={{
                    readOnly: true,
                  }}
                  size="small"
                  helperText="This is the URL that the QR code points to"
                />
              </CardContent>
            </Card>

            {/* Best Practices */}
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Best Practices
                </Typography>
                
                <Box component="ul" sx={{ pl: 2 }}>
                  <Typography component="li" variant="body2" paragraph>
                    Print on high-quality paper or laminate for durability
                  </Typography>
                  <Typography component="li" variant="body2" paragraph>
                    Ensure good lighting where QR codes are placed
                  </Typography>
                  <Typography component="li" variant="body2" paragraph>
                    Include brief instructions: "Scan to book or review"
                  </Typography>
                  <Typography component="li" variant="body2" paragraph>
                    Test the QR code regularly to ensure it works
                  </Typography>
                  <Typography component="li" variant="body2" paragraph>
                    Consider offering incentives for customers who use the QR code
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default QRGenerator;
