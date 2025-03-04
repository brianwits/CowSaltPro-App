import React, { useEffect, useState } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  AttachMoney,
  Inventory,
  People,
  Warning,
  TrendingUp,
} from '@mui/icons-material';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip } from 'recharts';
import { dataService } from '../../services/data';
import type { DashboardStats } from '../../services/data';

const DashboardCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}> = ({ title, value, icon, color, subtitle }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box sx={{ 
          p: 1, 
          borderRadius: 1, 
          bgcolor: `${color}15`,
          display: 'flex',
          alignItems: 'center',
          mr: 2
        }}>
          {icon}
        </Box>
        <Typography variant="h6" color="text.secondary">
          {title}
        </Typography>
      </Box>
      <Typography variant="h4" sx={{ mb: 1 }}>
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </CardContent>
  </Card>
);

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await dataService.getDashboardStats();
      setStats(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch dashboard data');
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Set up auto-refresh interval
    const interval = setInterval(fetchDashboardData, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={3}>
        {/* Total Sales Card */}
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard
            title="Total Sales"
            value={stats.totalSales.toLocaleString()}
            icon={<AttachMoney sx={{ color: '#2196f3' }} />}
            color="#2196f3"
          />
        </Grid>

        {/* Total Revenue Card */}
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard
            title="Total Revenue"
            value={`KES ${stats.totalRevenue.toLocaleString()}`}
            icon={<TrendingUp sx={{ color: '#4caf50' }} />}
            color="#4caf50"
          />
        </Grid>

        {/* Total Customers Card */}
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard
            title="Total Customers"
            value={stats.totalCustomers.toLocaleString()}
            icon={<People sx={{ color: '#ff9800' }} />}
            color="#ff9800"
          />
        </Grid>

        {/* Low Stock Products Card */}
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard
            title="Low Stock Items"
            value={stats.lowStockProducts.toLocaleString()}
            icon={<Warning sx={{ color: '#f44336' }} />}
            color="#f44336"
            subtitle="Products below reorder level"
          />
        </Grid>

        {/* Additional dashboard widgets can be added here */}
      </Grid>
    </Box>
  );
};

export default Dashboard; 