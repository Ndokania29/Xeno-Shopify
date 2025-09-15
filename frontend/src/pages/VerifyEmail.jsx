  import { useState } from 'react';
import { Box, Paper, TextField, Button, Typography, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Background3D from '../components/layout/Background3D';
import api from '../utils/api.js';
import { toast } from 'react-toastify';

export default function VerifyEmail() {
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleVerify = async () => {
    setLoading(true);
    try {
      await api.get(`/auth/verify-email`, { params: { token } });
      toast.success('Email verified');
      navigate('/login', { replace: true });
    } catch (_) {} finally { setLoading(false); }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      await api.post(`/auth/resend-verification`, { email });
      toast.success('Verification email sent');
    } catch (_) {} finally { setLoading(false); }
  };

  return (
    <Box sx={{ position:'relative', minHeight: '100vh' }}>
      <Background3D />
      <Box sx={{ position:'relative', zIndex:1, display: 'grid', placeItems: 'center', minHeight: '100vh', p: 2 }}>
        <Paper elevation={6} sx={{ width: '100%', maxWidth: 520, p: 3, backdropFilter:'blur(6px)', backgroundColor:'rgba(255,255,255,0.9)' }}>
          <Typography variant="h5" sx={{ mb: 2, color: 'primary.main', fontWeight: 700 }}>Verify Email</Typography>
          <TextField label="Verification Token" fullWidth value={token} onChange={(e)=>setToken(e.target.value)} sx={{ mb: 2 }} />
          <Stack direction={{ xs:'column', sm:'row' }} spacing={2} sx={{ mb: 2 }}>
            <Button variant="contained" onClick={handleVerify} disabled={loading}>Verify</Button>
            <Button variant="outlined" onClick={() => navigate('/login')} disabled={loading}>Go to Login</Button>
          </Stack>
          <Typography sx={{ my: 2 }}>Or resend verification to your email:</Typography>
          <TextField label="Email" type="email" fullWidth value={email} onChange={(e)=>setEmail(e.target.value)} sx={{ mb: 2 }} />
          <Button variant="outlined" onClick={handleResend} disabled={loading}>Resend</Button>
        </Paper>
      </Box>
    </Box>
  );
}


