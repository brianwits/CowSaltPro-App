import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { DataService } from '../../services/data';
import { Customer, Sale, PaymentStatus } from '../../models';

export interface CustomerDetailsProps {
  customerId: number;
  open: boolean;
  onClose: () => void;
}

const CustomerDetails: React.FC<CustomerDetailsProps> = ({ customerId, open, onClose }) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dataService = DataService.getInstance();

  useEffect(() => {
    loadCustomerData();
  }, [customerId]);

  const loadCustomerData = async () => {
    try {
      setLoading(true);
      setError(null);
      const customerData = await dataService.getCustomer(customerId);
      const salesData = await dataService.getCustomerSales(customerId);
      setCustomer(customerData);
      setSales(salesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customer data');
    } finally {
      setLoading(false);
    }
  };

  const getPaymentStatusColor = (status: PaymentStatus): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case PaymentStatus.PAID:
        return 'success';
      case PaymentStatus.PENDING:
        return 'warning';
      case PaymentStatus.FAILED:
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!customer) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">Customer not found</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Customer Information
        </Typography>
        <List dense>
          <ListItem>
            <ListItemText primary="Name" secondary={customer.name} />
          </ListItem>
          <ListItem>
            <ListItemText primary="Email" secondary={customer.email} />
          </ListItem>
          <ListItem>
            <ListItemText primary="Phone" secondary={customer.phone} />
          </ListItem>
          <ListItem>
            <ListItemText primary="Address" secondary={customer.address || 'Not provided'} />
          </ListItem>
        </List>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Sales History
        </Typography>
        {sales.length === 0 ? (
          <Alert severity="info">No sales history found</Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Payment Method</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      {new Date(sale.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      KES {sale.total.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {sale.paymentMethod}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={sale.paymentStatus}
                        color={getPaymentStatusColor(sale.paymentStatus)}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
};

export default CustomerDetails; 