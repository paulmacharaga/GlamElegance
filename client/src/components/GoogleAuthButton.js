import React from 'react';
import { Box } from '@mui/material';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const GoogleAuthButton = ({ onSuccess, buttonText = "Sign in with Google", variant = "contained" }) => {
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      console.log('Google credential response:', credentialResponse);
      
      // Use fetch for the API call
      const baseURL = process.env.REACT_APP_API_URL || window.location.origin;
      
      // Send the ID token to your backend
      const response = await fetch(`${baseURL}/api/auth/google-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: credentialResponse.credential })
      });
      
      const data = await response.json();
      
      // Handle successful authentication
      if (data.token) {
        localStorage.setItem('staffToken', data.token);
        localStorage.setItem('staff', JSON.stringify(data.user));
        
        toast.success('Successfully signed in with Google');
        
        if (onSuccess) {
          onSuccess(data);
        } else {
          navigate('/admin/dashboard');
        }
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
