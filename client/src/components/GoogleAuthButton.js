import React from 'react';
import { Box } from '@mui/material';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const GoogleAuthButton = ({ onSuccess, buttonText = "Sign in with Google", variant = "contained" }) => {
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      console.log('Google credential response:', credentialResponse);
      
      // Create API instance with proper base URL
      const api = axios.create({
        baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001'
      });
      
      // Send the ID token to your backend
      const response = await api.post('/api/auth/google-token', {
        token: credentialResponse.credential
      });
      
      // Handle successful authentication
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        if (onSuccess) {
          onSuccess(response.data);
        } else {
          navigate('/admin/dashboard');
        }
        
        toast.success('Successfully signed in with Google');
      }
    } catch (error) {
      console.error('Google authentication error:', error);
      console.error('Error details:', error.response?.data || error.message);
      toast.error('Failed to authenticate with Google: ' + (error.response?.data?.message || error.message));
    }
  };

  // Log the client ID to verify it's loaded correctly
  console.log('Using Google Client ID:', process.env.REACT_APP_GOOGLE_CLIENT_ID);
  
  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      <Box sx={{ my: 2, display: 'flex', justifyContent: 'center' }}>
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={(error) => {
            console.error('Google Sign In error:', error);
            toast.error('Google Sign In was unsuccessful');
          }}
          useOneTap={false}
          theme="filled_blue"
          text="signin_with"
          shape="rectangular"
          locale="en"
          logo_alignment="left"
          context="signin"
        />
      </Box>
    </GoogleOAuthProvider>
  );
};

export default GoogleAuthButton;
