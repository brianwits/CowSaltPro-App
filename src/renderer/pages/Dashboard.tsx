import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  Refresh,
} from '@mui/icons-material';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip } from 'recharts';
import { DataService } from '../../services/data';
import type { DashboardStats } from '../../services/data';
import { logError, logInfo, logDebug, logWarn } from '../../utils/logger';
import DebugPanel from '../components/DebugPanel';

const dataService = DataService.getInstance();

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

interface DebugAction {
  name: string;
  handler: () => void;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const refreshAttempts = useRef(0);
  const mountTime = useRef(Date.now());

  const fetchDashboardData = useCallback(async () => {
    const startTime = performance.now();
    try {
      setLoading(true);
      logDebug('Fetching dashboard data...');
      
      const data = await dataService.getDashboardStats();
      setStats(data);
      setError(null);
      setLastUpdated(new Date());
      refreshAttempts.current = 0;

      const endTime = performance.now();
      logInfo('Dashboard data fetched successfully', {
        fetchDuration: `${(endTime - startTime).toFixed(2)}ms`,
        dataSnapshot: process.env.NODE_ENV === 'development' ? data : undefined,
      });
    } catch (err) {
      refreshAttempts.current += 1;
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to fetch dashboard data: ${errorMessage}`);
      
      logError('Error fetching dashboard data', {
        error: err,
        attemptNumber: refreshAttempts.current,
        componentUptime: `${((Date.now() - mountTime.current) / 1000).toFixed(1)}s`,
      });

      // If we've failed multiple times, increase the retry interval
      if (refreshAttempts.current >= 3) {
        logWarn('Multiple refresh attempts failed, increasing interval');
        return;
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    logDebug('Dashboard component mounted');
    fetchDashboardData();

    // Set up auto-refresh interval
    const interval = setInterval(fetchDashboardData, 300000); // Refresh every 5 minutes

    return () => {
      clearInterval(interval);
      logDebug('Dashboard component unmounted', {
        totalMountDuration: `${((Date.now() - mountTime.current) / 1000).toFixed(1)}s`,
      });
    };
  }, [fetchDashboardData]);

  const handleManualRefresh = () => {
    logDebug('Manual refresh triggered');
    fetchDashboardData();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <IconButton
              color="inherit"
              size="small"
              onClick={handleManualRefresh}
            >
              <Refresh />
            </IconButton>
          }
        >
          {error}
        </Alert>
        {stats && (
          <Typography variant="body2" color="text.secondary">
            Showing last available data from: {lastUpdated?.toLocaleString()}
          </Typography>
        )}
      </Box>
    );
  }

  if (!stats) {
    return null;
  }

  const debugActions: DebugAction[] = [
    {
      name: 'Force Refresh',
      handler: handleManualRefresh,
    },
    {
      name: 'Simulate Error',
      handler: () => setError('Simulated error for testing'),
    },
    {
      name: 'Clear Error',
      handler: () => setError(null),
    },
    {
      name: 'Reset Stats',
      handler: () => setStats(null),
    },
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Last updated: {lastUpdated?.toLocaleString()}
        </Typography>
        <Tooltip title="Refresh data">
          <IconButton onClick={handleManualRefresh} disabled={loading}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>
      
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

      <DebugPanel
        componentName="Dashboard"
        state={{
          stats,
          error,
          loading,
          lastRefresh: lastUpdated?.toISOString(),
        }}
        actions={debugActions}
      />
    </Box>
  );
};

// Add component display name for better debugging
Dashboard.displayName = 'Dashboard';

export default Dashboard; 