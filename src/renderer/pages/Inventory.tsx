import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  InputAdornment,
  CircularProgress,
  Alert,
  Snackbar,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
  AddCircle as IncreaseIcon,
  RemoveCircle as DecreaseIcon,
} from '@mui/icons-material';
import { dataService } from '../../services/data';
import type { Product } from '../../database/models';

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  reorderLevel: number;
}

interface StockAdjustmentData {
  quantity: number;
  reason: string;
  type: 'increase' | 'decrease';
}

const initialFormData: ProductFormData = {
  name: '',
  description: '',
  price: 0,
  stockQuantity: 0,
  reorderLevel: 10,
};

const initialAdjustmentData: StockAdjustmentData = {
  quantity: 0,
  reason: '',
  type: 'increase',
};

const Inventory: React.FC = () => {
  // State management
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [openAdjustDialog, setOpenAdjustDialog] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [adjustmentData, setAdjustmentData] = useState<StockAdjustmentData>(initialAdjustmentData);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await dataService.getProducts(searchTerm);
      setProducts(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch products');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [searchTerm]);

  // Handle product dialog
  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setSelectedProduct(product);
      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price,
        stockQuantity: product.stockQuantity,
        reorderLevel: product.reorderLevel,
      });
    } else {
      setSelectedProduct(null);
      setFormData(initialFormData);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedProduct(null);
    setFormData(initialFormData);
  };

  // Handle stock adjustment dialog
  const handleOpenAdjustDialog = (product: Product, type: 'increase' | 'decrease') => {
    setSelectedProduct(product);
    setAdjustmentData({ ...initialAdjustmentData, type });
    setOpenAdjustDialog(true);
  };

  const handleCloseAdjustDialog = () => {
    setOpenAdjustDialog(false);
    setSelectedProduct(null);
    setAdjustmentData(initialAdjustmentData);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedProduct) {
        await dataService.updateProduct(selectedProduct.id, formData);
        setSnackbar({
          open: true,
          message: 'Product updated successfully',
          severity: 'success',
        });
      } else {
        await dataService.createProduct(formData);
        setSnackbar({
          open: true,
          message: 'Product created successfully',
          severity: 'success',
        });
      }
      handleCloseDialog();
      fetchProducts();
    } catch (err) {
      console.error('Error saving product:', err);
      setSnackbar({
        open: true,
        message: 'Failed to save product',
        severity: 'error',
      });
    }
  };

  // Handle stock adjustment
  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      await dataService.adjustStock({
        productId: selectedProduct.id,
        quantity: adjustmentData.quantity,
        type: adjustmentData.type,
        reason: adjustmentData.reason,
      });
      setSnackbar({
        open: true,
        message: 'Stock adjusted successfully',
        severity: 'success',
      });
      handleCloseAdjustDialog();
      fetchProducts();
    } catch (err) {
      console.error('Error adjusting stock:', err);
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Failed to adjust stock',
        severity: 'error',
      });
    }
  };

  // Handle delete
  const handleDelete = async (product: Product) => {
    try {
      await dataService.deleteProduct(product.id);
      setSnackbar({
        open: true,
        message: 'Product deleted successfully',
        severity: 'success',
      });
      fetchProducts();
    } catch (err) {
      console.error('Error deleting product:', err);
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Failed to delete product',
        severity: 'error',
      });
    }
  };

  // Handle pagination
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Inventory Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Product
        </Button>
      </Box>

      {/* Search and Filter */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Products Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Price (KES)</TableCell>
                <TableCell align="right">Stock</TableCell>
                <TableCell align="right">Reorder Level</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No products found
                  </TableCell>
                </TableRow>
              ) : (
                products
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>{product.description}</TableCell>
                      <TableCell align="right">
                        {product.price.toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                          {product.stockQuantity.toLocaleString()}
                          {product.stockQuantity <= product.reorderLevel && (
                            <Tooltip title="Low Stock">
                              <WarningIcon color="warning" sx={{ ml: 1 }} />
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        {product.reorderLevel.toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Increase Stock">
                          <IconButton onClick={() => handleOpenAdjustDialog(product, 'increase')}>
                            <IncreaseIcon color="success" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Decrease Stock">
                          <IconButton onClick={() => handleOpenAdjustDialog(product, 'decrease')}>
                            <DecreaseIcon color="error" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton onClick={() => handleOpenDialog(product)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton onClick={() => handleDelete(product)}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={products.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Add/Edit Product Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedProduct ? 'Edit Product' : 'Add New Product'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Price"
                  type="number"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">KES</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Initial Stock"
                  type="number"
                  required
                  value={formData.stockQuantity}
                  onChange={(e) => setFormData({ ...formData, stockQuantity: Number(e.target.value) })}
                  disabled={!!selectedProduct}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Reorder Level"
                  type="number"
                  required
                  value={formData.reorderLevel}
                  onChange={(e) => setFormData({ ...formData, reorderLevel: Number(e.target.value) })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              {selectedProduct ? 'Update' : 'Add'} Product
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Stock Adjustment Dialog */}
      <Dialog open={openAdjustDialog} onClose={handleCloseAdjustDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {adjustmentData.type === 'increase' ? 'Increase' : 'Decrease'} Stock
        </DialogTitle>
        <form onSubmit={handleAdjustStock}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Product: {selectedProduct?.name}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Current Stock: {selectedProduct?.stockQuantity.toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Quantity"
                  type="number"
                  required
                  value={adjustmentData.quantity}
                  onChange={(e) => setAdjustmentData({ ...adjustmentData, quantity: Number(e.target.value) })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Reason"
                  required
                  multiline
                  rows={2}
                  value={adjustmentData.reason}
                  onChange={(e) => setAdjustmentData({ ...adjustmentData, reason: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseAdjustDialog}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained"
              color={adjustmentData.type === 'increase' ? 'success' : 'error'}
            >
              {adjustmentData.type === 'increase' ? 'Increase' : 'Decrease'} Stock
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Inventory; 