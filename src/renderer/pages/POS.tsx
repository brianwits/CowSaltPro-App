import React, { useState } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNotification } from '../context/NotificationContext';
import useApiState from '../hooks/useApiState';
import { ProductAttributes, CustomerAttributes, PaymentMethod, PaymentStatus } from '../../models';
import { DataService } from '../../services/data';

const dataService = DataService.getInstance();

interface CartItemType extends ProductAttributes {
  quantity: number;
}

interface POSProps {}

const POS: React.FC<POSProps> = () => {
  const [cart, setCart] = useState<CartItemType[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerAttributes | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(PaymentStatus.PAID);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const { showNotification } = useNotification();
  const { loading: isProcessing, setIsLoading: setIsProcessing } = useApiState(() => Promise.resolve(null));

  const addToCart = (product: ProductAttributes) => {
    if (product.stockQuantity <= 0) {
      showNotification('warning', 'Product is out of stock');
      return;
    }

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);

      if (existingItem) {
        if (existingItem.quantity >= product.stockQuantity) {
          showNotification('warning', 'Cannot exceed available stock');
          return prevCart;
        }
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.id !== productId) return item;
        const newQuantity = Math.max(1, item.quantity + delta);
        if (newQuantity > item.stockQuantity) {
          showNotification('warning', 'Cannot exceed available stock');
          return item;
        }
        return { ...item, quantity: newQuantity };
      })
    );
  };

  const removeFromCart = (productId: number) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const handlePayment = async () => {
    if (!selectedCustomer) {
      showNotification('error', 'Please select a customer');
      return;
    }

    if (cart.length === 0) {
      showNotification('error', 'Cart is empty');
      return;
    }

    try {
      setIsProcessing(true);

      // Create the sale
      const saleData = {
        CustomerId: selectedCustomer.id,
        items: cart.map(item => ({
          ProductId: item.id,
          quantity: item.quantity,
          price: item.price
        })),
        total: calculateTotal(),
        paymentMethod,
        paymentStatus
      };

      await dataService.createSale(saleData);

      // Clear the cart and reset state
      setCart([]);
      setSelectedCustomer(null);
      setPaymentMethod(PaymentMethod.CASH);
      setPaymentStatus(PaymentStatus.PAID);
      showNotification('success', 'Sale completed successfully');
    } catch (error) {
      console.error('Payment processing error:', error);
      showNotification('error', 'Failed to process payment');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Products
            </Typography>
            {/* Product list will be added here */}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Cart
            </Typography>
            <List sx={{ flexGrow: 1, overflow: 'auto' }}>
              {cart.map((item) => (
                <ListItem key={item.id}>
                  <ListItemText
                    primary={item.name}
                    secondary={`KES ${item.price} x ${item.quantity} = KES ${(item.price * item.quantity).toFixed(2)}`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => updateQuantity(item.id, -1)}
                      disabled={isProcessing}
                    >
                      <RemoveIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      onClick={() => updateQuantity(item.id, 1)}
                      disabled={isProcessing}
                    >
                      <AddIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      onClick={() => removeFromCart(item.id)}
                      disabled={isProcessing}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>

            <Typography variant="h6" sx={{ mt: 2 }}>
              Total: KES {calculateTotal().toFixed(2)}
            </Typography>

            <Button
              variant="contained"
              color="primary"
              onClick={() => setCustomerDialogOpen(true)}
              disabled={isProcessing}
              sx={{ mt: 2 }}
            >
              {selectedCustomer ? `Selected: ${selectedCustomer.name}` : 'Select Customer'}
            </Button>

            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Payment Method</InputLabel>
              <Select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                disabled={isProcessing}
              >
                {Object.values(PaymentMethod).map((method) => (
                  <MenuItem key={method} value={method}>
                    {method}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              variant="contained"
              color="primary"
              onClick={handlePayment}
              disabled={isProcessing || !selectedCustomer || cart.length === 0}
              sx={{ mt: 2 }}
            >
              {isProcessing ? 'Processing...' : 'Complete Sale'}
            </Button>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={customerDialogOpen} onClose={() => setCustomerDialogOpen(false)}>
        <DialogTitle>Select Customer</DialogTitle>
        <DialogContent>
          <List>
            {/* Customer list will be added here */}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCustomerDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default POS; 