import Layout from '../components/layout/Layout';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';
import { Box, Paper, Typography, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Chip } from '@mui/material';

export default function ProductsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['products','list'],
    queryFn: async () => (await api.get('/products')).data
  });

  const products = Array.isArray(data?.data) ? data.data : [];

  return (
    <Layout>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>Products</Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell>Vendor</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="right">Inventory</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell align="right">Cost</TableCell>
                <TableCell align="right">Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7}>Loading...</TableCell></TableRow>
              ) : products.length === 0 ? (
                <TableRow><TableCell colSpan={7}>No products yet.</TableCell></TableRow>
              ) : products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.title}</TableCell>
                  <TableCell>{p.vendor || '-'}</TableCell>
                  <TableCell>{p.productType || '-'}</TableCell>
                  <TableCell align="right">{p.inventoryQuantity ?? '-'}</TableCell>
                  <TableCell align="right">{p.price != null ? `₹${Number(p.price).toLocaleString('en-IN')}` : '-'}</TableCell>
                  <TableCell align="right">{p.cost != null ? `₹${Number(p.cost).toLocaleString('en-IN')}` : '-'}</TableCell>
                  <TableCell align="right">{p.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Layout>
  );
}


