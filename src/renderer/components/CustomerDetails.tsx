import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  CircularProgress,
  Chip,
} from '@mui/material';
import { dataService } from '../../services/data';
import type { Customer, Sale } from '../../database/models';

interface CustomerDetailsProps {
  customerId: number;
  open: boolean;
  onClose: () => void;
}

interface CustomerSalesData {
  customer: Customer;
  sales: Sale[];
  totalSpent: number;
  averageOrderValue: number;
}

const CustomerDetails: React.FC<CustomerDetailsProps> = ({ customerId, open, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CustomerSalesData | null>(null);

  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        setLoading(true);
        const customer = await dataService.getCustomer(customerId);
        const sales = await dataService.getCustomerSales(customerId);
        
        const totalSpent = sales.reduce((sum: number, sale: Sale) => sum + Number(sale.total), 0);
        const averageOrderValue = sales.length > 0 ? totalSpent / sales.length : 0;

        setData({
          customer,
          sales,
          totalSpent,
          averageOrderValue,
        });
        setError(null);
      } catch (err) {
        console.error('Error fetching customer details:', err);
        setError('Failed to load customer details');
      } finally {
        setLoading(false);
      }
    };

    if (open && customerId) {
      fetchCustomerData();
    }
  }, [customerId, open]);

  if (!open) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '70vh' }
      }}
    >
      <DialogTitle>Customer Details</DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : data ? (
          <Grid container spacing={3}>
            {/* Customer Information */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Customer Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Name
                    </Typography>
                    <Typography>{data.customer.name}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Email
                    </Typography>
                    <Typography>{data.customer.email || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Phone
                    </Typography>
                    <Typography>{data.customer.phone || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Address
                    </Typography>
                    <Typography>{data.customer.address || 'N/A'}</Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Customer Statistics */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Customer Statistics
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Total Orders
                    </Typography>
                    <Typography>{data.sales.length}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Total Spent
                    </Typography>
                    <Typography>KES {data.totalSpent.toLocaleString()}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Average Order Value
                    </Typography>
                    <Typography>
                      KES {data.averageOrderValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Customer Since
                    </Typography>
                    <Typography>
                      {new Date(data.customer.createdAt).toLocaleDateString()}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Sales History */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Sales History
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Payment Method</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.sales.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} align="center">
                            No sales history
                          </TableCell>
                        </TableRow>
                      ) : (
                        data.sales.map((sale) => (
                          <TableRow key={sale.id}>
                            <TableCell>
                              {new Date(sale.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              KES {Number(sale.total).toLocaleString()}
                            </TableCell>
                            <TableCell>{sale.paymentMethod}</TableCell>
                            <TableCell>
                              <Chip
                                label={sale.paymentStatus}
                                color={
                                  sale.paymentStatus === 'paid'
                                    ? 'success'
                                    : sale.paymentStatus === 'pending'
                                    ? 'warning'
                                    : 'error'
                                }
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          </Grid>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomerDetails; 