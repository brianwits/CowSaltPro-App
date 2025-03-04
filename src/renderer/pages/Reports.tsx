import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { dataService } from '../../services/data';
import { useNotification } from '../context/NotificationContext';
import useApiState from '../hooks/useApiState';
import type { SalesAnalytics, TopProduct } from '../../services/data';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const Reports: React.FC = () => {
  const { showNotification } = useNotification();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');
  
  const {
    data: salesData,
    loading: salesLoading,
    error: salesError,
    startLoading: startSalesLoading,
    setData: setSalesData,
    setError: setSalesError,
  } = useApiState<SalesAnalytics | null>(null);

  const {
    data: productData,
    loading: productLoading,
    error: productError,
    startLoading: startProductLoading,
    setData: setProductData,
    setError: setProductError,
  } = useApiState<TopProduct[] | null>(null);

  useEffect(() => {
    loadData();
  }, [timeRange]);

  const loadData = async () => {
    try {
      startSalesLoading();
      startProductLoading();
      
      const sales = await dataService.getSalesAnalytics(timeRange);
      const products = await dataService.getTopProducts();
      
      setSalesData(sales);
      setProductData(products);
    } catch (error) {
      setSalesError('Failed to load analytics data');
      setProductError('Failed to load product data');
      showNotification('Failed to load reports data', 'error');
    }
  };

  if (salesLoading || productLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5">Sales Analytics</Typography>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Time Range</InputLabel>
              <Select
                value={timeRange}
                label="Time Range"
                onChange={(e) => setTimeRange(e.target.value as 'week' | 'month' | 'year')}
              >
                <MenuItem value="week">Last Week</MenuItem>
                <MenuItem value="month">Last Month</MenuItem>
                <MenuItem value="year">Last Year</MenuItem>
              </Select>
            </FormControl>
          </Paper>
        </Grid>

        {/* Sales Trend Chart */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Sales Trend</Typography>
            {salesData?.trend && (
              <LineChart
                width={800}
                height={400}
                data={salesData.trend}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sales" stroke="#8884d8" />
                <Line type="monotone" dataKey="revenue" stroke="#82ca9d" />
              </LineChart>
            )}
          </Paper>
        </Grid>

        {/* Top Products Chart */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Top Products</Typography>
            {productData && (
              <PieChart width={400} height={400}>
                <Pie
                  data={productData}
                  cx={200}
                  cy={200}
                  labelLine={false}
                  outerRadius={150}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {productData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            )}
          </Paper>
        </Grid>

        {/* Summary Cards */}
        <Grid item xs={12}>
          <Grid container spacing={2}>
            {salesData?.summary.map((item, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      {item.label}
                    </Typography>
                    <Typography variant="h5" component="div">
                      {item.value}
                    </Typography>
                    <Typography color="textSecondary">
                      {item.change.toFixed(1)}% from last period
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Reports; 