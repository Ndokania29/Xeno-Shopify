import { useState } from 'react';
import { Box, Paper, TextField, Button, Typography, Grid, FormControlLabel, Checkbox } from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api.js';
import { toast } from 'react-toastify';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name:'', email:'', password:'', confirm:'', shopifyDomain:'', shopifyAccessToken:'', apiKey:'', apiSecret:'', webhookSecret:'', agree:false });
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.type==='checkbox'? e.target.checked : e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    if (!form.agree) return toast.error('Please accept Terms & Conditions');
    setLoading(true);
    try {
      const payload = { name: form.name, email: form.email, password: form.password, shopifyDomain: form.shopifyDomain, shopifyAccessToken: form.shopifyAccessToken };
      await api.post('/auth/register', payload);
      toast.success('Registered! Please login.');
      navigate('/login');
    } catch (_) { } finally { setLoading(false); }
  };

  return (
    <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '100vh', p: 2 }}>
      <Paper elevation={6} sx={{ width: '100%', maxWidth: 680, p: 3 }}>
        <Typography variant="h5" sx={{ mb: 2, color: '#004C3F', fontWeight: 700 }}>Register</Typography>
        <form onSubmit={onSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}><TextField name="name" label="Store Name" fullWidth required value={form.name} onChange={onChange} /></Grid>
            <Grid item xs={12} md={6}><TextField name="email" label="Email" type="email" fullWidth required value={form.email} onChange={onChange} /></Grid>
            <Grid item xs={12} md={6}><TextField name="password" label="Password" type="password" fullWidth required value={form.password} onChange={onChange} /></Grid>
            <Grid item xs={12} md={6}><TextField name="confirm" label="Confirm Password" type="password" fullWidth required value={form.confirm} onChange={onChange} /></Grid>
            <Grid item xs={12} md={6}><TextField name="shopifyDomain" label="Shopify Domain" placeholder="mystore.myshopify.com" fullWidth required value={form.shopifyDomain} onChange={onChange} /></Grid>
            <Grid item xs={12} md={6}><TextField name="shopifyAccessToken" label="Shopify Access Token" fullWidth value={form.shopifyAccessToken} onChange={onChange} /></Grid>
            <Grid item xs={12}><FormControlLabel control={<Checkbox name="agree" checked={form.agree} onChange={onChange} />} label="I agree to Terms & Conditions" /></Grid>
          </Grid>
          <Button type="submit" variant="contained" disabled={loading} sx={{ mt: 2, background:'#00A650' }}>{loading?'Creating account...':'Create account'}</Button>
          <Button component={Link} to="/login" sx={{ mt: 2, ml: 2 }}>Login</Button>
        </form>
      </Paper>
    </Box>
  );
}


