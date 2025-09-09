import React from 'react';
import { Button } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';

const TraditionalGoogleButton = () => {
  const handleGoogleLogin = () => {
    // Redirect to the server's Google OAuth endpoint
    window.location.href = `${process.env.REACT_APP_API_URL}/api/auth/google`;
  };

  return (
    <Button
      variant="contained"
      color="primary"
      startIcon={<GoogleIcon />}
      onClick={handleGoogleLogin}
      fullWidth
      sx={{
        mt: 2,
        mb: 2,
        backgroundColor: '#4285F4',
        '&:hover': {
          backgroundColor: '#357ae8',
        },
      }}
    >
      Sign in with Google
    </Button>
  );
};

export default TraditionalGoogleButton;
