import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import { dataService } from '../../services/data';
import { useNotification } from '../context/NotificationContext';
import useApiState from '../hooks/useApiState';
import type { ProductAttributes } from '../../database/models/types';

interface CartItem extends ProductAttributes {
  quantity: number;
}

const POS: React.FC = () => {
  const { showNotification } = useNotification();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    data: products,
    loading,
    error,
    startLoading,
    setData: setProducts,
    setError,
  } = useApiState<ProductAttributes[]>([]);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      startLoading();
      const data = await dataService.getProducts();
      setProducts(data);
    } catch (error) {
      setError('Failed to load products');
      showNotification('Error loading products', 'error');
    }
  };

  const addToCart = (product: ProductAttributes) => {
    if (product.stockQuantity <= 0) {
      showNotification('Product out of stock', 'error');
      return;
    }

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        if (existingItem.quantity >= product.stockQuantity) {
          showNotification('Cannot exceed available stock', 'warning');
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

  const removeFromCart = (productId: number) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.id !== productId) return item;
        const newQuantity = Math.max(1, item.quantity + delta);
        if (newQuantity > item.stockQuantity) {
          showNotification('Cannot exceed available stock', 'warning');
          return item;
        }
        return { ...item, quantity: newQuantity };
      })
    );
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const handlePayment = async () => {
    try {
      setIsProcessing(true);
      
      // Create the sale
      await dataService.createSale({
        CustomerId: 1, // TODO: Implement customer selection
        items: cart.map(item => ({
          ProductId: item.id,
          quantity: item.quantity,
          price: item.price
        })),
        total: calculateTotal(),
        paymentMethod: 'cash', // TODO: Implement payment method selection
        paymentStatus: 'paid'
      });

      // Clear cart and show success message
      setCart([]);
      showNotification('Payment processed successfully', 'success');
      
      // Reload products to get updated stock quantities
      await loadProducts();
    } catch (error) {
      showNotification('Failed to process payment', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
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

  return (
    <Box sx={{ flexGrow: 1, height: '100%', p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Grid container spacing={2} sx={{ height: 'calc(100vh - 250px)', overflow: 'auto' }}>
              {(products || [])
                .filter((product) =>
                  product.name.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((product) => (
                  <Grid item xs={6} sm={4} key={product.id}>
                    <Paper
                      sx={{
                        p: 2,
                        cursor: product.stockQuantity > 0 ? 'pointer' : 'not-allowed',
                        opacity: product.stockQuantity > 0 ? 1 : 0.5,
                      }}
                      onClick={() => product.stockQuantity > 0 && addToCart(product)}
                    >
                      <Typography variant="h6">{product.name}</Typography>
                      <Typography>KES {product.price}</Typography>
                      <Typography variant="caption" color={product.stockQuantity > 0 ? 'textSecondary' : 'error'}>
                        {product.stockQuantity > 0 ? `In stock: ${product.stockQuantity}` : 'Out of stock'}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
            </Grid>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{
            p: 2,
            height: 'calc(100vh - 250px)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <Typography variant="h6" gutterBottom>
              Shopping Cart
            </Typography>
            <List sx={{ flexGrow: 1, overflow: 'auto' }}>
              {cart.map((item) => (
                <React.Fragment key={item.id}>
                  <ListItem>
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
                  <Divider />
                </React.Fragment>
              ))}
            </List>
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100' }}>
              <Typography variant="h6">
                Total: KES {calculateTotal().toFixed(2)}
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 2 }}
              startIcon={isProcessing ? <CircularProgress size={24} color="inherit" /> : <PaymentIcon />}
              onClick={handlePayment}
              disabled={cart.length === 0 || isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Process Payment'}
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default POS; 