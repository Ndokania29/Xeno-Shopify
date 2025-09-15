import Layout from '../components/layout/Layout.jsx';
import { Box, Paper, Typography, Grid, TextField, Button } from '@mui/material';
import api from '../utils/api.js';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

export default function Settings() {
  const [store, setStore] = useState({ name:'', shopifyDomain:'', shopifyAccessToken:'' });
  const [acct, setAcct] = useState({ password:'', emailPrefs:'' });

  useEffect(() => {
    // If you implement GET /api/settings/store later, hydrate here
  }, []);

  const saveStore = async () => {
    try {
      await api.put('/settings/store', store);
      toast.success('Store updated');
    } catch(_){}
  };

  const saveAccount = async () => {
    try {
      await api.put('/settings/account', acct);
      toast.success('Account updated');
    } catch(_){}
  };

  return (
    <Layout>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p:2 }}>
            <Typography variant="h6" sx={{ mb:1 }}>Store Info</Typography>
            <TextField label="Store Name" fullWidth sx={{ mb:1 }} value={store.name} onChange={e=>setStore({ ...store, name:e.target.value })} />
            <TextField label="Shopify Domain" fullWidth sx={{ mb:1 }} value={store.shopifyDomain} onChange={e=>setStore({ ...store, shopifyDomain:e.target.value })} />
            <TextField label="Shopify Access Token" fullWidth sx={{ mb:1 }} value={store.shopifyAccessToken} onChange={e=>setStore({ ...store, shopifyAccessToken:e.target.value })} />
            <Button variant="contained" onClick={saveStore} sx={{ background:'#00A650' }}>Save</Button>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p:2 }}>
            <Typography variant="h6" sx={{ mb:1 }}>Account</Typography>
            <TextField label="New Password" type="password" fullWidth sx={{ mb:1 }} value={acct.password} onChange={e=>setAcct({ ...acct, password:e.target.value })} />
            <TextField label="Email Preferences" fullWidth sx={{ mb:1 }} value={acct.emailPrefs} onChange={e=>setAcct({ ...acct, emailPrefs:e.target.value })} />
            <Button variant="contained" onClick={saveAccount} sx={{ background:'#00A650' }}>Save</Button>
          </Paper>
        </Grid>
      </Grid>
    </Layout>
  );
}


