import { useState, useMemo, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { Box, Grid, Paper, Typography, CircularProgress, IconButton, Tooltip, Card, 
  Tab, Tabs, Button, Chip, LinearProgress, TextField, Stack, Table, TableHead, TableBody, TableRow, TableCell, TableContainer } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCards } from 'swiper/modules';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import RefreshIcon from '@mui/icons-material/Refresh';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PeopleIcon from '@mui/icons-material/People';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import api from '../utils/api';

const COLORS = ['#004C3F', '#00A650', '#E65100', '#C62828'];

const StatCard = ({ title, value, icon: Icon, trend, subtitle }) => (
  <Card className="stat-card" sx={{ p: 2 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
      <Icon sx={{ fontSize: 32, mr: 1 }} />
      <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>{title}</Typography>
      {trend && (
        <Chip 
          label={`${trend > 0 ? '+' : ''}${trend}%`}
          color={trend > 0 ? 'success' : 'error'}
          size="small"
          sx={{ fontWeight: 'bold' }}
        />
      )}
    </Box>
    <Typography variant="h4">{value}</Typography>
    {subtitle && (
      <Typography variant="body2" sx={{ mt: 1, opacity: 0.7 }}>{subtitle}</Typography>
    )}
  </Card>
);

const InsightCard = ({ title, children, loading }) => (
  <Card className="insight-card" sx={{ p: 3 }}>
    <Typography variant="h6" gutterBottom>{title}</Typography>
    {loading ? (
      <Box sx={{ p: 4, display: 'grid', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    ) : children}
  </Card>
);

// Helper to format date as YYYY-MM-DD
const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

export default function Dashboard() {
  // Initialize dates to last 30 days
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return formatDate(date);
  });
  
  const [endDate, setEndDate] = useState(() => {
    return formatDate(new Date());
  });
  
  const [tab, setTab] = useState(0);
  
  // Fetch all insights
  const { data: overview, isLoading: overviewLoading, refetch: refetchOverview } = 
    useQuery({ 
      queryKey: ['dashboard', 'overview'], 
      queryFn: async () => {
        const res = await api.get('/dashboard/overview');
        return res.data.data;
      }
    });

  const { data: ordersByDate, isLoading: ordersLoading, refetch: refetchOrdersByDate } = 
    useQuery({ 
      queryKey: ['dashboard', 'orders-by-date', startDate, endDate], 
      queryFn: async () => {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', new Date(startDate).toISOString());
        if (endDate) params.append('endDate', new Date(endDate).toISOString());
        const res = await api.get(`/dashboard/orders-by-date?${params}`);
        const series = (res.data.data || []).map(day => ({
          ...day,
          revenue: Number(day.revenue || 0)
        }));
        return { data: series, forecast: res.data.forecast };
      }
    });

  const { data: products, isLoading: productsLoading, refetch: refetchProducts } = 
    useQuery({ 
      queryKey: ['dashboard', 'products/performance'], 
      queryFn: async () => {
        const res = await api.get('/dashboard/products/performance');
        return res.data.data;
      }
    });

  const { data: customers, isLoading: customersLoading, refetch: refetchCustomers } = 
    useQuery({ 
      queryKey: ['dashboard', 'customers/insights'], 
      queryFn: async () => {
        const res = await api.get('/dashboard/customers/insights');
        return res.data.data;
      }
    });

  const { data: funnel, isLoading: funnelLoading, refetch: refetchFunnel } = 
    useQuery({ 
      queryKey: ['dashboard', 'funnel'], 
      queryFn: async () => {
        const res = await api.get('/dashboard/funnel');
        return res.data.data;
      }
    });

  const { data: profitability, isLoading: profitLoading, refetch: refetchProfitability } = 
    useQuery({ 
      queryKey: ['dashboard', 'profitability'], 
      queryFn: async () => {
        const res = await api.get('/dashboard/profitability');
        return res.data.data;
      }
    });

  // Updated API: fetch products list to use in Top Products card
  const { data: productsList, isLoading: productsListLoading, refetch: refetchProductsList } =
    useQuery({
      queryKey: ['products', 'list', 'dashboard'],
      queryFn: async () => {
        const res = await api.get('/products?limit=10');
        return res.data; // { success, data, pagination }
      }
    });

  const loading = overviewLoading || ordersLoading || productsLoading || 
    customersLoading || funnelLoading || profitLoading;

  // Transform funnel data for visualization
  const funnelData = useMemo(() => {
    if (!funnel) return [];
    return [
      { name: 'Carts', value: funnel.carts },
      { name: 'Checkouts', value: funnel.checkouts },
      { name: 'Orders', value: funnel.orders }
    ];
  }, [funnel]);

  // Transform price buckets for visualization
  const priceBuckets = useMemo(() => {
    if (!customers?.priceBuckets) return [];
    return [
      { name: '₹0-500', value: customers.priceBuckets.low },
      { name: '₹501-1000', value: customers.priceBuckets.mid },
      { name: '₹1000+', value: customers.priceBuckets.high }
    ];
  }, [customers]);

  // Build unified product rows from backend performance data (no backend changes)
  const productRows = useMemo(() => {
    if (!products) return [];
    const byId = new Map();
    // Start with margin suggestions (has price and cost)
    (products.marginSuggestions || []).forEach(s => {
      byId.set(s.productId, {
        productId: s.productId,
        title: s.title,
        price: s.currentPrice != null ? Number(s.currentPrice) : null,
        cost: s.cost != null ? Number(s.cost) : null,
        marginPct: s.marginPct != null ? Number(s.marginPct) : null,
        inventory: null
      });
    });
    // Merge low stock (has inventory)
    (products.lowStock || []).forEach(l => {
      const existing = byId.get(l.productId) || { productId: l.productId, title: l.title };
      byId.set(l.productId, {
        ...existing,
        title: existing.title || l.title,
        inventory: l.inventory != null ? Number(l.inventory) : existing.inventory ?? null
      });
    });
    return Array.from(byId.values());
  }, [products]);

  // (Removed) Top Products by Revenue chart per request

  return (
    <Layout>
      <Box sx={{ position: 'relative' }}>
        <Box sx={{ position: 'sticky', top: 72, zIndex: 2, display: 'flex', gap: 2, justifyContent:'flex-end', mb: 2 }}>
          <Stack direction="row" spacing={2}>
            <TextField
              type="date"
              label="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
            <TextField
              type="date"
              label="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
          </Stack>
          <Tooltip title="Refresh Data">
            <IconButton onClick={() => {
              refetchOverview();
              refetchOrdersByDate();
              refetchProducts();
              refetchCustomers();
              refetchFunnel();
              refetchProfitability();
              refetchProductsList();
            }} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <Grid container spacing={3}>
          {/* Overview Stats */}
          <Grid item xs={12} sm={6} md={3}>
            <StatCard 
              title="Customers" 
              value={overview?.counts?.customers ?? 0}
              icon={PeopleIcon}
              trend={12}
              subtitle={`${customers?.newCustomers ?? 0} new this month`}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard 
              title="Products" 
              value={overview?.counts?.products ?? 0}
              icon={InventoryIcon}
              trend={5}
              subtitle={products?.lowStock?.length ? `${products.lowStock.length} low stock alerts` : null}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard 
              title="Orders" 
              value={overview?.counts?.orders ?? 0}
              icon={ShoppingCartIcon}
              trend={8}
              subtitle={`₹${overview?.revenue?.averageOrderValue ?? 0} AOV`}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard 
              title="Revenue" 
              value={`₹${overview?.revenue?.total ?? 0}`}
              icon={TrendingUpIcon}
              trend={overview?.revenue?.growthPercent}
              subtitle={`${overview?.revenue?.growthPercent ?? 0}% vs last week`}
            />
          </Grid>

          {/* Tabs for different insights */}
          <Grid item xs={12}>
            <Tabs 
              value={tab} 
              onChange={(e, v) => setTab(v)}
              variant="fullWidth"
              sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="Revenue & Orders" style={{ color: 'white' }}/>
              <Tab label="Products & Inventory" style={{ color: 'white' }} />
              <Tab label="Customer Insights" style={{ color: 'white' }}/>
              <Tab label="Funnel & Profitability" style={{ color: 'white' }}/>
            </Tabs>

            {/* Revenue & Orders Tab */}
            {tab === 0 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <InsightCard title="Revenue Trends" loading={ordersLoading}>
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={ordersByDate?.data || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(date) => new Date(date).toLocaleDateString()}
                        />
                        <YAxis 
                          tickFormatter={(value) => `₹${Number(value||0).toLocaleString('en-IN')}`}
                        />
                        <RechartsTooltip 
                          formatter={(value) => [`₹${Number(value||0).toLocaleString('en-IN')}`, 'Revenue']}
                          labelFormatter={(date) => new Date(date).toLocaleDateString()}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="revenue" 
                          stroke="#004C3F" 
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </InsightCard>
                </Grid>
                <Grid item xs={12}>
                  <InsightCard title="Revenue Forecast" loading={ordersLoading}>
                    {!ordersByDate?.forecast ? (
                      <Typography sx={{ color: 'text.secondary' }}>No forecast available.</Typography>
                    ) : (
                      <>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          Next 30 days (relative scale)
                        </Typography>
                        <ResponsiveContainer width="100%" height={240}>
                          <LineChart data={(ordersByDate.forecast.series || []).map((v, i) => ({ day: i + 1, value: Number(v) }))}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="day" />
                            <YAxis tickFormatter={(value) => `₹${Number(value||0).toLocaleString('en-IN')}`} />
                            <RechartsTooltip formatter={(value) => [`₹${Number(value||0).toLocaleString('en-IN')}`, 'Forecast']} />
                            <Line type="monotone" dataKey="value" stroke="#00A650" strokeWidth={2} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                        <Box sx={{ mt: 2 }}>
                          <Typography>
                            Next Week Projection: <b>₹{Number(ordersByDate.forecast.nextWeek || 0).toLocaleString('en-IN')}</b>
                          </Typography>
                        </Box>
                      </>
                    )}
                  </InsightCard>
                </Grid>
              </Grid>
            )}

            {/* Products & Inventory Tab */}
            {tab === 1 && (
              <Grid container spacing={3}>
                {/* Removed Top Products by Revenue section as requested */}
                <Grid item xs={12} md={6}>
                  <InsightCard title="Low Stock Alerts" loading={productsLoading} >
                    {(products?.lowStock?.length ?? 0) === 0 ? (
                      <Box sx={{ p: 2, color: 'text.secondary' }}>
                        No low stock alerts. Ensure inventory is set and there are recent sales.
                      </Box>
                    ) : (
                      products.lowStock.map(item => (
                        <Box key={item.productId} sx={{ mb: 2 }}>
                          <Typography variant="subtitle2">{item.title}</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={Math.min(100, Math.max(0, (item.inventory / Math.max(1, (item.velocity * 30))) * 100))}
                              sx={{ flexGrow: 1 }}
                            />
                            <Typography variant="caption">
                              {item.daysLeft} days left
                            </Typography>
                          </Box>
                        </Box>
                      ))
                    )}
                  </InsightCard>
                </Grid>
                {/* <Grid item xs={12} md={6}>
                  <InsightCard title="Products (Inventory & Cost)" loading={productsLoading}>
                    {!products ? (
                      <Box sx={{ p:2, textAlign:'center' }}>
                        <CircularProgress size={24} />
                      </Box>
                    ) : (
                      <TableContainer component={Paper} elevation={0}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Product</TableCell>
                              <TableCell align="right">Inventory</TableCell>
                              <TableCell align="right">Price</TableCell>
                              <TableCell align="right">Cost</TableCell>
                              <TableCell align="right">Est. Margin</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {productRows.slice(0,10).map((p, i) => (
                              <TableRow key={`${p.productId}-${i}`}>
                                <TableCell sx={{ maxWidth: 220, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                                  {p.title}
                                </TableCell>
                                <TableCell align="right">{p.inventory ?? '-'}</TableCell>
                                <TableCell align="right">{p.price != null ? `₹${Number(p.price).toLocaleString('en-IN')}` : '-'}</TableCell>
                                <TableCell align="right">{p.cost != null ? `₹${Number(p.cost).toLocaleString('en-IN')}` : '-'}</TableCell>
                                <TableCell align="right">
                                  {p.price != null && p.cost != null ? `${Math.round(((Number(p.price)-Number(p.cost))/Math.max(1, Number(p.price))) * 100)}%` : '-'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </InsightCard>
                </Grid> */}
                <Grid item xs={12} md={6}>
                  <InsightCard title="Margin Improvement Suggestions">
                    {(products?.marginSuggestions?.length ?? 0) === 0 ? (
                      <Typography sx={{ color:'text.secondary' }}>
                        No suggestions yet. Set product cost to compute margin improvements.
                      </Typography>
                    ) : (
                      products.marginSuggestions.map((suggestion, i) => (
                        <Typography key={i} sx={{ mb: 1 }}>
                          • {suggestion.suggestion}
                        </Typography>
                      ))
                    )}
                  </InsightCard>
                </Grid>
              </Grid>
            )}

            {/* Customer Insights Tab */}
            {tab === 2 && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <InsightCard title="Customer Segments" loading={customersLoading}>
                    <Box sx={{ textAlign: 'center', mb: 2 }}>
                      <Typography variant="h3">
                        {customers?.paretoPct ?? 0}%
                      </Typography>
                      <Typography variant="body2">
                        Revenue from top 20% customers
                      </Typography>
                    </Box>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={priceBuckets}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          label
                        >
                          {priceBuckets.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </InsightCard>
                </Grid>
                <Grid item xs={12} md={8}>
                  <InsightCard title="Customer Growth" loading={customersLoading}>
                    <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
                      <Box>
                        <Typography variant="h4">{customers?.thisMonthCount ?? 0}</Typography>
                        <Typography variant="body2">This Month</Typography>
                      </Box>
                      <Box>
                        <Typography variant="h4">{customers?.prevMonthCount ?? 0}</Typography>
                        <Typography variant="body2">Last Month</Typography>
                      </Box>
                    </Box>
                    <Typography variant="subtitle2" gutterBottom>Customer Types</Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Chip 
                        label={`${customers?.newCustomers ?? 0} New`}
                        color="primary"
                      />
                      <Chip 
                        label={`${customers?.returningCustomers ?? 0} Returning`}
                        color="secondary"
                      />
                    </Box>
                  </InsightCard>
                </Grid>
              </Grid>
            )}

            {/* Funnel & Profitability Tab */}
            {tab === 3 && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <InsightCard title="Conversion Funnel" loading={funnelLoading}>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={funnelData}
                        layout="vertical"
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" />
                        <RechartsTooltip />
                        <Bar dataKey="value" fill="#004C3F" />
                      </BarChart>
                    </ResponsiveContainer>
                    {funnel?.abandoned > 0 && (
                      <Box sx={{ mt: 2, p: 2, bgcolor: '#FFF3E0', borderRadius: 1 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Recovery Opportunity
                        </Typography>
                        <Typography>
                          {funnel.abandoned} abandoned carts
                        </Typography>
                        <Typography variant="body2">
                          Potential revenue: ₹{funnel.recoveryPotential}
                        </Typography>
                      </Box>
                    )}
                  </InsightCard>
                </Grid>
                <Grid item xs={12} md={6}>
                  <InsightCard title="Top Products by Profit" loading={productsListLoading}>
                    {(productsList?.data?.length ?? 0) === 0 ? (
                      <Typography sx={{ color:'text.secondary' }}>No products yet.</Typography>
                    ) : (
                      productsList.data.slice(0,5).map((p, i) => {
                        const price = p.price != null ? Number(p.price) : null;
                        const cost = p.cost != null ? Number(p.cost) : null;
                        const marginPct = (price != null && cost != null && price > 0)
                          ? Math.round(((price - cost) / price) * 100)
                          : null;
                        return (
                          <Box key={p.id} sx={{ mb: 2 }}>
                            <Typography variant="subtitle2">
                              {i + 1}. {p.title}
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                              <Typography variant="body2">
                                Price: {price != null ? `₹${price.toLocaleString('en-IN')}` : '-'}
                              </Typography>
                              <Typography variant="body2">
                                Cost: {cost != null ? `₹${cost.toLocaleString('en-IN')}` : '-'}
                              </Typography>
                              <Typography variant="body2" color={marginPct != null ? 'success.main' : 'text.secondary'}>
                                {marginPct != null ? `Margin: ${marginPct}%` : 'Set cost to see margin'}
                              </Typography>
                            </Box>
                          </Box>
                        );
                      })
                    )}
                  </InsightCard>
                </Grid>
              </Grid>
            )}
          </Grid>
        </Grid>
      </Box>
    </Layout>
  );
}