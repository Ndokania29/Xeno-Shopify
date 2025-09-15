import Layout from '../components/layout/Layout';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';
import { Paper, Typography, Table, TableHead, TableRow, TableCell, TableBody, TableContainer } from '@mui/material';

export default function OrdersPage() {
  const end = new Date();
  const start = new Date(); start.setDate(end.getDate()-30);
  const params = new URLSearchParams({ startDate: start.toISOString(), endDate: end.toISOString() });

  const { data, isLoading } = useQuery({
    queryKey: ['orders','by-date'],
    queryFn: async () => (await api.get(`/dashboard/orders-by-date?${params}`)).data.data
  });

  return (
    <Layout>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>Orders (Last 30 days)</Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell align="right">Orders</TableCell>
                <TableCell align="right">Revenue</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={3}>Loading...</TableCell></TableRow>
              ) : (data||[]).map((d,i)=> (
                <TableRow key={i}>
                  <TableCell>{new Date(d.date).toLocaleDateString()}</TableCell>
                  <TableCell align="right">{d.count}</TableCell>
                  <TableCell align="right">₹{Number(d.revenue||0).toLocaleString('en-IN')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Layout>
  );
}


