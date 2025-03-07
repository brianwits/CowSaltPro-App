import React, { useState, useEffect, useRef } from 'react';
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
  TextField,
  Box,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  Tabs,
  Tab,
  InputAdornment,
  Divider,
  Chip,
  CircularProgress,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Snackbar,
  Alert,
  Badge,
  Drawer,
  Avatar,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import ReceiptIcon from '@mui/icons-material/Receipt';
import DiscountIcon from '@mui/icons-material/LocalOffer';
import CategoryIcon from '@mui/icons-material/Category';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PrintIcon from '@mui/icons-material/Print';
import SaveIcon from '@mui/icons-material/Save';
import InventoryIcon from '@mui/icons-material/Inventory';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PersonIcon from '@mui/icons-material/Person';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import { useNotification } from '../context/NotificationContext';
import useApiState from '../hooks/useApiState';
import { ProductAttributes, CustomerAttributes, PaymentMethod, PaymentStatus } from '../../models';
import { DataService } from '../../services/data';

const dataService = DataService.getInstance();

interface CartItemType extends ProductAttributes {
  quantity: number;
  discount?: number;
}

// Extended to hold a list of saved carts
interface SavedCart {
  id: string;
  customer: CustomerAttributes | null;
  items: CartItemType[];
  timestamp: Date;
  notes?: string;
}

// Sample product categories
const PRODUCT_CATEGORIES = ['All', 'Salt Products', 'Accessories', 'Feed Supplements', 'Services'];

const POS: React.FC<POSProps> = () => {
  const [cart, setCart] = useState<CartItemType[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerAttributes | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(PaymentStatus.PAID);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [selectedItemForDiscount, setSelectedItemForDiscount] = useState<number | null>(null);
  const [discountAmount, setDiscountAmount] = useState<string>('0');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [products, setProducts] = useState<ProductAttributes[]>([]);
  const [customers, setCustomers] = useState<CustomerAttributes[]>([]);
  const { showNotification } = useNotification();
  const { loading: isProcessing, setIsLoading: setIsProcessing } = useApiState(() => Promise.resolve(null));
  const [isLoading, setIsLoading] = useState(false);
  
  // New state variables for improved features
  const [savedCarts, setSavedCarts] = useState<SavedCart[]>([]);
  const [savedCartDrawerOpen, setSavedCartDrawerOpen] = useState(false);
  const [cartNotes, setCartNotes] = useState('');
  const [barcodeMode, setBarcodeMode] = useState(false);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const [cashAmount, setCashAmount] = useState<string>('');
  const [changeAmount, setChangeAmount] = useState<number>(0);

  // Fetch products and customers on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const productsData = await dataService.getProducts();
        const customersData = await dataService.getCustomers();
        
        // Also load any saved carts from local storage
        const savedCartsData = localStorage.getItem('savedCarts');
        if (savedCartsData) {
          setSavedCarts(JSON.parse(savedCartsData));
        }
        
        setProducts(productsData);
        setCustomers(customersData);
      } catch (error) {
        console.error('Error fetching data:', error);
        showNotification('error', 'Failed to load products or customers');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Focus barcode input when barcode mode is enabled
  useEffect(() => {
    if (barcodeMode && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [barcodeMode]);

  // Calculate change amount when cash amount changes
  useEffect(() => {
    const cashValue = parseFloat(cashAmount) || 0;
    const totalValue = calculateTotal();
    setChangeAmount(Math.max(0, cashValue - totalValue));
  }, [cashAmount, cart]);

  const filteredProducts = products
    .filter(product => 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (product.barcode && product.barcode.includes(searchQuery))
    )
    .filter(product => 
      activeCategory === 'All' || product.category === activeCategory
    );

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
    
    // Clear search query after adding product in barcode mode
    if (barcodeMode) {
      setSearchQuery('');
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
    }
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

  const clearCart = () => {
    if (cart.length > 0) {
      if (window.confirm('Are you sure you want to clear the cart?')) {
        setCart([]);
        setSelectedCustomer(null);
        setCartNotes('');
      }
    }
  };

  const applyDiscount = () => {
    if (selectedItemForDiscount === null) return;
    
    const discountValue = parseFloat(discountAmount);
    if (isNaN(discountValue) || discountValue < 0) {
      showNotification('error', 'Please enter a valid discount amount');
      return;
    }

    setCart(prevCart => 
      prevCart.map(item => 
        item.id === selectedItemForDiscount 
          ? { ...item, discount: discountValue } 
          : item
      )
    );

    setDiscountDialogOpen(false);
    setSelectedItemForDiscount(null);
    setDiscountAmount('0');
  };

  const openDiscountDialog = (productId: number) => {
    setSelectedItemForDiscount(productId);
    const item = cart.find(item => item.id === productId);
    setDiscountAmount(item?.discount?.toString() || '0');
    setDiscountDialogOpen(true);
  };

  const calculateItemTotal = (item: CartItemType) => {
    const basePrice = item.price * item.quantity;
    if (!item.discount) return basePrice;
    return basePrice - item.discount;
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const calculateDiscounts = () => {
    return cart.reduce((sum, item) => sum + (item.discount || 0), 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscounts();
  };

  // New function to hold the current sale
  const holdSale = () => {
    if (cart.length === 0) {
      showNotification('warning', 'Cart is empty');
      return;
    }
    
    const newSavedCart: SavedCart = {
      id: `cart-${Date.now()}`,
      customer: selectedCustomer,
      items: [...cart],
      timestamp: new Date(),
      notes: cartNotes
    };
    
    const updatedSavedCarts = [...savedCarts, newSavedCart];
    setSavedCarts(updatedSavedCarts);
    
    // Save to local storage
    localStorage.setItem('savedCarts', JSON.stringify(updatedSavedCarts));
    
    // Clear the current cart
    setCart([]);
    setSelectedCustomer(null);
    setCartNotes('');
    
    showNotification('success', 'Sale has been put on hold');
  };
  
  // Function to resume a held sale
  const resumeSale = (savedCart: SavedCart) => {
    // Confirm if current cart has items
    if (cart.length > 0) {
      if (!window.confirm('This will replace your current cart. Continue?')) {
        return;
      }
    }
    
    setCart(savedCart.items);
    setSelectedCustomer(savedCart.customer);
    setCartNotes(savedCart.notes || '');
    
    // Remove from saved carts
    const updatedSavedCarts = savedCarts.filter(cart => cart.id !== savedCart.id);
    setSavedCarts(updatedSavedCarts);
    localStorage.setItem('savedCarts', JSON.stringify(updatedSavedCarts));
    
    setSavedCartDrawerOpen(false);
    showNotification('success', 'Sale has been resumed');
  };
  
  // Function to delete a held sale
  const deleteSavedCart = (id: string) => {
    if (window.confirm('Are you sure you want to delete this saved sale?')) {
      const updatedSavedCarts = savedCarts.filter(cart => cart.id !== id);
      setSavedCarts(updatedSavedCarts);
      localStorage.setItem('savedCarts', JSON.stringify(updatedSavedCarts));
    }
  };

  // Barcode handler function
  const handleBarcodeSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const barcode = searchQuery.trim();
      if (!barcode) return;
      
      const product = products.find(p => p.barcode === barcode);
      if (product) {
        addToCart(product);
        setSearchQuery('');
      } else {
        showNotification('warning', `Product with barcode ${barcode} not found`);
      }
    }
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
          price: item.price,
          discount: item.discount || 0
        })),
        subtotal: calculateSubtotal(),
        totalDiscount: calculateDiscounts(),
        total: calculateTotal(),
        paymentMethod,
        paymentStatus,
        notes: cartNotes
      };

      await dataService.createSale(saleData);

      // Show receipt
      setReceiptDialogOpen(true);
    } catch (error) {
      console.error('Payment processing error:', error);
      showNotification('error', 'Failed to process payment');
      setIsProcessing(false);
    }
  };

  const finalizePayment = () => {
    // Clear the cart and reset state
    setCart([]);
    setSelectedCustomer(null);
    setPaymentMethod(PaymentMethod.CASH);
    setPaymentStatus(PaymentStatus.PAID);
    setReceiptDialogOpen(false);
    setIsProcessing(false);
    setCartNotes('');
    setCashAmount('');
    showNotification('success', 'Sale completed successfully');
  };

  return (
    <Container maxWidth={false} sx={{ py: 2 }}>
      <Grid container spacing={2}>
        {/* Left Panel - Product catalog */}
        <Grid item xs={12} md={7} lg={8}>
          <Paper sx={{ p: 2, height: '85vh', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>
              Products
            </Typography>
            
            <Box mb={2} display="flex" alignItems="center" flexWrap="wrap" gap={1}>
              <TextField
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={barcodeMode ? handleBarcodeSearch : undefined}
                inputRef={barcodeInputRef}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ flexGrow: 1 }}
                size="small"
                autoFocus={barcodeMode}
              />
              
              <Tooltip title={barcodeMode ? "Exit Barcode Mode" : "Barcode Mode"}>
                <Button 
                  variant={barcodeMode ? "contained" : "outlined"}
                  onClick={() => setBarcodeMode(!barcodeMode)}
                  startIcon={<QrCodeScannerIcon />}
                  size="small"
                  color={barcodeMode ? "primary" : "inherit"}
                >
                  {barcodeMode ? "Barcode Mode" : "Barcode"}
                </Button>
              </Tooltip>
            </Box>
            
            <Tabs
              value={activeCategory}
              onChange={(_, newValue) => setActiveCategory(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ mb: 2 }}
            >
              {PRODUCT_CATEGORIES.map((category) => (
                <Tab 
                  key={category} 
                  label={category} 
                  value={category} 
                  icon={<CategoryIcon />} 
                  iconPosition="start"
                />
              ))}
            </Tabs>
            
            <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
              {isLoading ? (
                <Box display="flex" justifyContent="center" my={4}>
                  <CircularProgress />
                </Box>
              ) : filteredProducts.length > 0 ? (
                <Grid container spacing={2}>
                  {filteredProducts.map((product) => (
                    <Grid item xs={12} sm={6} md={4} key={product.id}>
                      <Card 
                        onClick={() => addToCart(product)}
                        sx={{ 
                          cursor: 'pointer',
                          transition: '0.3s',
                          '&:hover': { transform: 'scale(1.02)' }
                        }}
                      >
                        <CardActionArea>
                          <CardContent>
                            <Typography variant="h6" component="div" noWrap>
                              {product.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              {product.category}
                            </Typography>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Typography variant="body1" fontWeight="bold">
                                KES {product.price.toFixed(2)}
                              </Typography>
                              <Chip
                                size="small"
                                icon={<InventoryIcon />}
                                label={`${product.stockQuantity} in stock`}
                                color={product.stockQuantity > 0 ? "success" : "error"}
                              />
                            </Box>
                          </CardContent>
                        </CardActionArea>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box display="flex" justifyContent="center" my={4}>
                  <Typography variant="body1" color="text.secondary">
                    No products found. Try a different search or category.
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
        
        {/* Right Panel - Cart */}
        <Grid item xs={12} md={5} lg={4}>
          <Paper sx={{ p: 2, height: '85vh', display: 'flex', flexDirection: 'column' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="h6">
                Shopping Cart
              </Typography>
              <Box>
                <Tooltip title="Hold Sale">
                  <IconButton 
                    color="warning" 
                    onClick={holdSale}
                    disabled={cart.length === 0}
                  >
                    <PauseIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Saved Sales">
                  <Badge badgeContent={savedCarts.length} color="secondary">
                    <IconButton 
                      color="info" 
                      onClick={() => setSavedCartDrawerOpen(true)}
                      disabled={savedCarts.length === 0}
                    >
                      <PlayArrowIcon />
                    </IconButton>
                  </Badge>
                </Tooltip>
              </Box>
            </Box>
            
            <Button
              fullWidth
              variant="outlined"
              color="primary"
              onClick={() => setCustomerDialogOpen(true)}
              sx={{ mb: 2 }}
              startIcon={<PersonIcon />}
            >
              {selectedCustomer ? selectedCustomer.name : 'Select Customer'}
            </Button>
            
            {cart.length === 0 ? (
              <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1}>
                <ReceiptIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  Cart is empty. Add products to begin.
                </Typography>
              </Box>
            ) : (
              <>
                <List sx={{ flexGrow: 1, overflow: 'auto', maxHeight: '400px' }}>
                  {cart.map((item) => (
                    <ListItem key={item.id} divider>
                      <ListItemText
                        primary={
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body1" noWrap sx={{ maxWidth: '150px' }}>
                              {item.name}
                            </Typography>
                            <Typography variant="body1" fontWeight="bold">
                              KES {calculateItemTotal(item).toFixed(2)}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <>
                            <Box display="flex" justifyContent="space-between">
                              <Typography variant="body2">
                                KES {item.price} x {item.quantity}
                              </Typography>
                              {item.discount && (
                                <Typography variant="body2" color="error">
                                  -KES {item.discount.toFixed(2)}
                                </Typography>
                              )}
                            </Box>
                          </>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Box display="flex" flexDirection="column">
                          <Box display="flex" alignItems="center">
                            <IconButton 
                              edge="end" 
                              size="small"
                              onClick={() => updateQuantity(item.id, -1)}
                            >
                              <RemoveIcon fontSize="small" />
                            </IconButton>
                            <Typography variant="body2" sx={{ mx: 1 }}>
                              {item.quantity}
                            </Typography>
                            <IconButton 
                              edge="end" 
                              size="small"
                              onClick={() => updateQuantity(item.id, 1)}
                              disabled={item.quantity >= item.stockQuantity}
                            >
                              <AddIcon fontSize="small" />
                            </IconButton>
                          </Box>
                          <Box display="flex" mt={1}>
                            <IconButton 
                              edge="end" 
                              size="small"
                              onClick={() => openDiscountDialog(item.id)}
                              color={item.discount ? 'secondary' : 'default'}
                            >
                              <DiscountIcon fontSize="small" />
                            </IconButton>
                            <IconButton 
                              edge="end" 
                              size="small"
                              onClick={() => removeFromCart(item.id)}
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
                
                <TextField
                  label="Sale Notes"
                  multiline
                  rows={2}
                  value={cartNotes}
                  onChange={(e) => setCartNotes(e.target.value)}
                  fullWidth
                  margin="normal"
                  size="small"
                  placeholder="Add notes about this sale..."
                />
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ mb: 1 }}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Subtotal:</Typography>
                    <Typography variant="body2">KES {calculateSubtotal().toFixed(2)}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Discount:</Typography>
                    <Typography variant="body2" color="error">-KES {calculateDiscounts().toFixed(2)}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mt={1}>
                    <Typography variant="subtitle1" fontWeight="bold">Total:</Typography>
                    <Typography variant="subtitle1" fontWeight="bold">KES {calculateTotal().toFixed(2)}</Typography>
                  </Box>
                </Box>
                
                {paymentMethod === PaymentMethod.CASH && (
                  <Box mb={2}>
                    <TextField
                      label="Cash Amount"
                      type="number"
                      fullWidth
                      value={cashAmount}
                      onChange={(e) => setCashAmount(e.target.value)}
                      size="small"
                      InputProps={{
                        startAdornment: <InputAdornment position="start">KES</InputAdornment>,
                      }}
                    />
                    {parseFloat(cashAmount) > 0 && (
                      <Box display="flex" justifyContent="space-between" mt={1}>
                        <Typography variant="body2">Change:</Typography>
                        <Typography 
                          variant="body2" 
                          fontWeight="bold"
                          color={changeAmount >= 0 ? "success.main" : "error"}
                        >
                          KES {changeAmount.toFixed(2)}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Payment Method</InputLabel>
                      <Select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                        label="Payment Method"
                      >
                        <MenuItem value={PaymentMethod.CASH}>Cash</MenuItem>
                        <MenuItem value={PaymentMethod.MPESA}>M-Pesa</MenuItem>
                        <MenuItem value={PaymentMethod.CARD}>Card</MenuItem>
                        <MenuItem value={PaymentMethod.BANK_TRANSFER}>Bank Transfer</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Payment Status</InputLabel>
                      <Select
                        value={paymentStatus}
                        onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                        label="Payment Status"
                      >
                        <MenuItem value={PaymentStatus.PAID}>Paid</MenuItem>
                        <MenuItem value={PaymentStatus.PENDING}>Pending</MenuItem>
                        <MenuItem value={PaymentStatus.PARTIALLY_PAID}>Partially Paid</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
                
                <Box mt={2} display="flex" gap={1}>
                  <Button 
                    variant="outlined"
                    color="error"
                    onClick={clearCart}
                    fullWidth
                  >
                    Clear
                  </Button>
                  <Button 
                    variant="contained"
                    color="primary"
                    onClick={handlePayment}
                    fullWidth
                    disabled={isProcessing || !selectedCustomer || cart.length === 0}
                  >
                    Pay {calculateTotal() > 0 && `KES ${calculateTotal().toFixed(2)}`}
                  </Button>
                </Box>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      {/* Customer Selection Dialog */}
      <Dialog 
        open={customerDialogOpen} 
        onClose={() => setCustomerDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Select Customer</DialogTitle>
        <DialogContent dividers>
          <TextField
            placeholder="Search customers..."
            fullWidth
            margin="normal"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <List sx={{ maxHeight: '300px', overflow: 'auto' }}>
            {customers.map((customer) => (
              <ListItem 
                button 
                key={customer.id}
                onClick={() => {
                  setSelectedCustomer(customer);
                  setCustomerDialogOpen(false);
                }}
                selected={selectedCustomer?.id === customer.id}
              >
                <ListItemText
                  primary={customer.name}
                  secondary={customer.phoneNumber || customer.email}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCustomerDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
      
      {/* Discount Dialog */}
      <Dialog 
        open={discountDialogOpen} 
        onClose={() => setDiscountDialogOpen(false)}
      >
        <DialogTitle>Apply Discount</DialogTitle>
        <DialogContent>
          <TextField
            label="Discount Amount (KES)"
            type="number"
            fullWidth
            margin="normal"
            value={discountAmount}
            onChange={(e) => setDiscountAmount(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start">KES</InputAdornment>,
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDiscountDialogOpen(false)}>Cancel</Button>
          <Button onClick={applyDiscount} color="primary">Apply</Button>
        </DialogActions>
      </Dialog>
      
      {/* Receipt Dialog */}
      <Dialog 
        open={receiptDialogOpen} 
        onClose={() => !isProcessing && setReceiptDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ textAlign: 'center' }}>
          Receipt
        </DialogTitle>
        <DialogContent>
          <Box textAlign="center" mb={3}>
            <Typography variant="h6">CowSaltPro</Typography>
            <Typography variant="body2">Livestock Salt Solutions</Typography>
            <Typography variant="body2" gutterBottom>Tel: +254 123 456 789</Typography>
            
            <Divider sx={{ my: 1 }} />
            
            <Typography variant="body2" gutterBottom>
              {new Date().toLocaleString()}
            </Typography>
            
            {selectedCustomer && (
              <Typography variant="body2" gutterBottom>
                Customer: {selectedCustomer.name}
              </Typography>
            )}
          </Box>
          
          <Box>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              Items:
            </Typography>
            
            {cart.map((item) => (
              <Box key={item.id} mb={1}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">
                    {item.name} × {item.quantity}
                  </Typography>
                  <Typography variant="body2">
                    KES {(item.price * item.quantity).toFixed(2)}
                  </Typography>
                </Box>
                {item.discount && (
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="error">
                      Discount
                    </Typography>
                    <Typography variant="body2" color="error">
                      -KES {item.discount.toFixed(2)}
                    </Typography>
                  </Box>
                )}
              </Box>
            ))}
            
            <Divider sx={{ my: 2 }} />
            
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2">Subtotal:</Typography>
              <Typography variant="body2">KES {calculateSubtotal().toFixed(2)}</Typography>
            </Box>
            
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2">Total Discounts:</Typography>
              <Typography variant="body2">-KES {calculateDiscounts().toFixed(2)}</Typography>
            </Box>
            
            <Box display="flex" justifyContent="space-between" mt={1}>
              <Typography variant="subtitle2" fontWeight="bold">TOTAL:</Typography>
              <Typography variant="subtitle2" fontWeight="bold">KES {calculateTotal().toFixed(2)}</Typography>
            </Box>
            
            {paymentMethod === PaymentMethod.CASH && parseFloat(cashAmount) > 0 && (
              <>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Cash Amount:</Typography>
                  <Typography variant="body2">KES {parseFloat(cashAmount).toFixed(2)}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Change:</Typography>
                  <Typography variant="body2">KES {changeAmount.toFixed(2)}</Typography>
                </Box>
              </>
            )}
            
            <Box mt={2} textAlign="center">
              <Typography variant="body2">Payment Method: {paymentMethod}</Typography>
              <Typography variant="body2">Payment Status: {paymentStatus}</Typography>
              
              {cartNotes && (
                <Box mt={1}>
                  <Typography variant="body2" fontStyle="italic">Notes: {cartNotes}</Typography>
                </Box>
              )}
              
              <Typography variant="body2" sx={{ mt: 2 }}>
                Thank you for your business!
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          {isProcessing ? (
            <Button onClick={finalizePayment} color="primary" startIcon={<SaveIcon />}>
              Complete Transaction
            </Button>
          ) : (
            <>
              <Button onClick={() => setReceiptDialogOpen(false)}>
                Close
              </Button>
              <Button startIcon={<PrintIcon />} color="primary">
                Print
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
      
      {/* Saved Carts Drawer */}
      <Drawer
        anchor="right"
        open={savedCartDrawerOpen}
        onClose={() => setSavedCartDrawerOpen(false)}
        sx={{ '& .MuiDrawer-paper': { width: { xs: '100%', md: 400 } } }}
      >
        <Box p={2}>
          <Typography variant="h6" gutterBottom>
            Saved Sales ({savedCarts.length})
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          {savedCarts.length === 0 ? (
            <Typography variant="body1" textAlign="center" mt={4}>
              No saved sales found
            </Typography>
          ) : (
            <List>
              {savedCarts.map((savedCart) => (
                <Paper key={savedCart.id} sx={{ mb: 2, p: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {savedCart.customer?.name || 'No Customer'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(savedCart.timestamp).toLocaleString()}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" mb={1}>
                    Items: {savedCart.items.length}
                  </Typography>
                  
                  <Typography variant="body2" mb={1}>
                    Total: KES {savedCart.items.reduce((total, item) => {
                      const itemTotal = (item.price * item.quantity) - (item.discount || 0);
                      return total + itemTotal;
                    }, 0).toFixed(2)}
                  </Typography>
                  
                  {savedCart.notes && (
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      Notes: {savedCart.notes}
                    </Typography>
                  )}
                  
                  <Box display="flex" justifyContent="flex-end" mt={1}>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => deleteSavedCart(savedCart.id)}
                      sx={{ mr: 1 }}
                    >
                      Delete
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => resumeSale(savedCart)}
                    >
                      Resume
                    </Button>
                  </Box>
                </Paper>
              ))}
            </List>
          )}
        </Box>
      </Drawer>
    </Container>
  );
};

export default POS; 