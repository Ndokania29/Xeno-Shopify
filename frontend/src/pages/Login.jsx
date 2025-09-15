import { useState } from 'react';
import { Box, Paper, TextField, Button, Typography, FormControlLabel, Checkbox } from '@mui/material';
import Background3D from '../components/layout/Background3D';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../utils/api.js';
import { useAuth } from '../state/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data.data);
      toast.success('Logged in');
      navigate('/dashboard');
    } catch (err) {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ position:'relative', minHeight: '100vh' }}>
      <Background3D />
      <Box sx={{ position:'relative', zIndex:1, display: 'grid', placeItems: 'center', minHeight: '100vh', p: 2 }}>
      <Paper elevation={6} sx={{ width: '100%', maxWidth: 420, p: 3, backdropFilter:'blur(6px)', backgroundColor:'rgba(255,255,255,0.85)' }}>
        <Typography variant="h5" sx={{ mb: 2, color: '#004C3F', fontWeight: 700 }}>Login</Typography>
        <form onSubmit={handleSubmit}>
          <TextField label="Email" type="email" fullWidth required value={email} onChange={(e)=>setEmail(e.target.value)} sx={{ mb: 2 }} />
          <TextField label="Password" type="password" fullWidth required value={password} onChange={(e)=>setPassword(e.target.value)} sx={{ mb: 1 }} />
          <FormControlLabel control={<Checkbox checked={remember} onChange={(e)=>setRemember(e.target.checked)} />} label="Remember me" />
          <Button type="submit" variant="contained" fullWidth disabled={loading} sx={{ mt: 1, background:'#00A650' }}>{loading?'Signing in...':'Login'}</Button>
        </form>
        <Box sx={{ display:'flex', justifyContent:'space-between', mt:2 }}>
          <Button component={Link} to="/register">Create account</Button>
          <Button component={Link} to="/verify-email">Verify Email</Button>
        </Box>
      </Paper>
      </Box>
    </Box>
  );
}


