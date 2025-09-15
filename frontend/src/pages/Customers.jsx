import Layout from '../components/layout/Layout';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';
import { Paper, Typography, Box, Chip } from '@mui/material';

export default function CustomersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['customers','insights'],
    queryFn: async () => (await api.get('/dashboard/customers/insights')).data.data
  });

  return (
    <Layout>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>Customers</Typography>
        {isLoading ? 'Loading...' : (
          <Box>
            <Typography variant="h4" sx={{ mb: 1 }}>{data?.paretoPct ?? 0}%</Typography>
            <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>Revenue from top 20% customers</Typography>
            <Box sx={{ display:'flex', gap: 2 }}>
              <Chip label={`New: ${data?.newCustomers ?? 0}`} color="primary" />
              <Chip label={`Returning: ${data?.returningCustomers ?? 0}`} color="secondary" />
              <Chip label={`This Month: ${data?.thisMonthCount ?? 0}`} />
              <Chip label={`Last Month: ${data?.prevMonthCount ?? 0}`} />
            </Box>
          </Box>
        )}
      </Paper>
    </Layout>
  );
}


