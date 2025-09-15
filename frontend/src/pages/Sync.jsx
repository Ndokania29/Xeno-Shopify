import Layout from '../components/layout/Layout.jsx';
import { Box, Paper, Typography, Button, Stack, CircularProgress } from '@mui/material';
import api from '../utils/api.js';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

export default function Sync() {
  const qc = useQueryClient();
  const status = useQuery({ 
    queryKey: ['sync-status'], 
    queryFn: async () => (await api.get('/sync/status')).data.data, 
    refetchInterval: 5000 
  });
  
  const loading = status.isLoading;

  const trigger = async (path) => {
    try {
      // Send forceFullSync: true for full sync, empty body for others
      const body = path === 'full' ? { forceFullSync: true } : {};
      await api.post(`/sync/${path}`, body);
      toast.success('Sync started');
      qc.invalidateQueries({ queryKey: ['sync-status'] });
      // Refresh dashboard insights after sync triggers
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['dashboard','overview'] });
      qc.invalidateQueries({ queryKey: ['dashboard','orders-by-date'] });
      qc.invalidateQueries({ queryKey: ['dashboard','products/performance'] });
      qc.invalidateQueries({ queryKey: ['dashboard','customers/insights'] });
      qc.invalidateQueries({ queryKey: ['dashboard','funnel'] });
      qc.invalidateQueries({ queryKey: ['dashboard','profitability'] });
    } catch (error) {
      // Error toast is handled by axios interceptor
      console.error('Sync error:', error);
    }
  };

  return (
    <Layout>
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>Data Sync</Typography>
        
        {loading ? (
          <Box sx={{ display: 'grid', placeItems: 'center', py: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ 
              p: 2, 
              borderRadius: 1, 
              bgcolor: 'background.default',
              mb: 2
            }}>
              <Typography variant="subtitle2" gutterBottom>Last Sync</Typography>
              <Typography>
                {status.data?.lastSync 
                  ? new Date(status.data.lastSync).toLocaleString() 
                  : '—'}
              </Typography>
            </Box>

            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
              gap: 2,
              mb: 2
            }}>
              <Paper sx={{ p: 2, textAlign: 'center' }} elevation={0}>
                <Typography variant="h4" color="primary">
                  {status.data?.counts?.customers ?? 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Customers
                </Typography>
              </Paper>

              <Paper sx={{ p: 2, textAlign: 'center' }} elevation={0}>
                <Typography variant="h4" color="primary">
                  {status.data?.counts?.products ?? 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Products
                </Typography>
              </Paper>

              <Paper sx={{ p: 2, textAlign: 'center' }} elevation={0}>
                <Typography variant="h4" color="primary">
                  {status.data?.counts?.orders ?? 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Orders
                </Typography>
              </Paper>
            </Box>

            <Box sx={{ 
              p: 2, 
              borderRadius: 1, 
              bgcolor: status.data?.status === 'ready' ? '#E8F5E9' : '#FFF3E0',
              color: status.data?.status === 'ready' ? '#2E7D32' : '#E65100'
            }}>
              <Typography variant="subtitle2">Status</Typography>
              <Typography sx={{ textTransform: 'capitalize' }}>
                {status.data?.status || 'Unknown'}
              </Typography>
            </Box>
          </Box>
        )}

        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={2}
          sx={{ 
            borderTop: '1px solid',
            borderColor: 'divider',
            pt: 3
          }}
        >
          <Button 
            variant="contained" 
            onClick={() => trigger('full')} 
            sx={{ 
              background: 'linear-gradient(45deg, #004C3F 30%, #00A650 90%)',
              color: 'white',
              px: 3
            }}
          >
            Full Sync
          </Button>
          <Button variant="outlined" onClick={() => trigger('customers')}>
            Sync Customers
          </Button>
          <Button variant="outlined" onClick={() => trigger('products')}>
            Sync Products
          </Button>
          <Button variant="outlined" onClick={() => trigger('orders')}>
            Sync Orders
          </Button>
        </Stack>
      </Paper>
    </Layout>
  );
}