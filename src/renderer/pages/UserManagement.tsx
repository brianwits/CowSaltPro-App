import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  MenuItem,
  IconButton,
  Chip,
  Grid,
  Box,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Tooltip,
  Divider,
  Alert,
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  PersonAdd as PersonAddIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Refresh as RefreshIcon,
  AdminPanelSettings as AdminIcon,
  Person as UserIcon,
  Inventory as InventoryIcon,
  PointOfSale as CashierIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { UserRole } from '../../database/models/types';

interface UserFormData {
  id?: number;
  username: string;
  password: string;
  confirmPassword: string;
  email: string;
  role: string;
  fullName: string;
  phone: string;
}

const defaultFormData: UserFormData = {
  username: '',
  password: '',
  confirmPassword: '',
  email: '',
  role: UserRole.CASHIER,
  fullName: '',
  phone: '',
};

const RoleIcons: Record<string, JSX.Element> = {
  [UserRole.ADMIN]: <AdminIcon fontSize="small" />,
  [UserRole.MANAGER]: <UserIcon fontSize="small" />,
  [UserRole.INVENTORY]: <InventoryIcon fontSize="small" />,
  [UserRole.CASHIER]: <CashierIcon fontSize="small" />,
};

const UserManagement: React.FC = () => {
  const { users, fetchUsers, addUser, updateUserData, activateDeactivateUser, resetUserPassword } = useAuth();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [formData, setFormData] = useState<UserFormData>(defaultFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit' | 'reset'>('add');
  const [openResetDialog, setOpenResetDialog] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    await fetchUsers();
    setLoading(false);
  };

  const handleOpenAddDialog = () => {
    setDialogMode('add');
    setFormData(defaultFormData);
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (userId: number) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      setDialogMode('edit');
      setSelectedUser(userId);
      setFormData({
        id: user.id,
        username: user.username,
        password: '',
        confirmPassword: '',
        email: user.email || '',
        role: user.role,
        fullName: user.fullName || '',
        phone: user.phone || '',
      });
      setFormErrors({});
      setOpenDialog(true);
    }
  };

  const handleOpenResetDialog = (userId: number) => {
    setSelectedUser(userId);
    setNewPassword('');
    setOpenResetDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleCloseResetDialog = () => {
    setOpenResetDialog(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      setFormData((prev) => ({ ...prev, [name]: value }));
      
      // Clear error when field is changed
      if (formErrors[name]) {
        setFormErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }

    if (dialogMode === 'add') {
      if (!formData.password) {
        errors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        errors.password = 'Password must be at least 8 characters';
      }

      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    } else if (dialogMode === 'edit' && formData.password) {
      if (formData.password.length < 8) {
        errors.password = 'Password must be at least 8 characters';
      }

      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }

    if (!formData.fullName.trim()) {
      errors.fullName = 'Full name is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      if (dialogMode === 'add') {
        const { confirmPassword, ...userData } = formData;
        const response = await addUser(userData);
        
        if (response.success) {
          showNotification('success', 'User created successfully');
          handleCloseDialog();
        } else {
          showNotification('error', response.error || 'Failed to create user');
        }
      } else if (dialogMode === 'edit' && selectedUser) {
        const { confirmPassword, ...userData } = formData;
        
        // Only include password if it was provided
        if (!userData.password) {
          delete userData.password;
        }
        
        const response = await updateUserData(selectedUser, userData);
        
        if (response.success) {
          showNotification('success', 'User updated successfully');
          handleCloseDialog();
        } else {
          showNotification('error', response.error || 'Failed to update user');
        }
      }
    } catch (error) {
      showNotification('error', 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId: number) => {
    setLoading(true);
    try {
      const response = await activateDeactivateUser(userId);
      
      if (response.success) {
        showNotification('success', 'User status updated successfully');
        await fetchUsers();
      } else {
        showNotification('error', response.error || 'Failed to update user status');
      }
    } catch (error) {
      showNotification('error', 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword) {
      setFormErrors({ newPassword: 'Password is required' });
      return;
    }
    
    if (newPassword.length < 8) {
      setFormErrors({ newPassword: 'Password must be at least 8 characters' });
      return;
    }
    
    setLoading(true);
    try {
      if (selectedUser) {
        const response = await resetUserPassword(selectedUser, newPassword);
        
        if (response.success) {
          showNotification('success', 'Password reset successfully');
          handleCloseResetDialog();
        } else {
          showNotification('error', response.error || 'Failed to reset password');
        }
      }
    } catch (error) {
      showNotification('error', 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'error';
      case UserRole.MANAGER:
        return 'primary';
      case UserRole.INVENTORY:
        return 'success';
      case UserRole.CASHIER:
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h1">
            User Management
          </Typography>
          <Box>
            <Button
              variant="contained"
              color="primary"
              startIcon={<RefreshIcon />}
              onClick={loadUsers}
              sx={{ mr: 1 }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<PersonAddIcon />}
              onClick={handleOpenAddDialog}
            >
              Add User
            </Button>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && users.length === 0 && (
          <Alert severity="info" sx={{ mb: 3 }}>
            No users found. Create your first user by clicking the "Add User" button.
          </Alert>
        )}

        {!loading && users.length > 0 && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Username</TableCell>
                  <TableCell>Full Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Login</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.fullName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        icon={RoleIcons[user.role] || <UserIcon fontSize="small" />}
                        label={user.role}
                        color={getRoleColor(user.role) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.isActive ? 'Active' : 'Inactive'}
                        color={user.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {user.lastLogin
                        ? new Date(user.lastLogin).toLocaleDateString()
                        : 'Never'}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Edit User">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpenEditDialog(user.id)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={user.isActive ? 'Deactivate User' : 'Activate User'}>
                        <IconButton
                          size="small"
                          color={user.isActive ? 'warning' : 'success'}
                          onClick={() => handleToggleUserStatus(user.id)}
                        >
                          {user.isActive ? (
                            <LockIcon fontSize="small" />
                          ) : (
                            <LockOpenIcon fontSize="small" />
                          )}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Reset Password">
                        <IconButton
                          size="small"
                          color="secondary"
                          onClick={() => handleOpenResetDialog(user.id)}
                        >
                          <RefreshIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Add/Edit User Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogMode === 'add' ? 'Add New User' : 'Edit User'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                name="username"
                label="Username"
                value={formData.username}
                onChange={handleInputChange}
                fullWidth
                error={!!formErrors.username}
                helperText={formErrors.username}
                disabled={dialogMode === 'edit'}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="email"
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                fullWidth
                error={!!formErrors.email}
                helperText={formErrors.email}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="fullName"
                label="Full Name"
                value={formData.fullName}
                onChange={handleInputChange}
                fullWidth
                error={!!formErrors.fullName}
                helperText={formErrors.fullName}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="password"
                label={dialogMode === 'add' ? 'Password' : 'New Password (leave blank to keep current)'}
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                fullWidth
                error={!!formErrors.password}
                helperText={formErrors.password}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="confirmPassword"
                label="Confirm Password"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                fullWidth
                error={!!formErrors.confirmPassword}
                helperText={formErrors.confirmPassword}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="role-label">Role</InputLabel>
                <Select
                  labelId="role-label"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  label="Role"
                >
                  <MenuItem value={UserRole.ADMIN}>Admin</MenuItem>
                  <MenuItem value={UserRole.MANAGER}>Manager</MenuItem>
                  <MenuItem value={UserRole.INVENTORY}>Inventory</MenuItem>
                  <MenuItem value={UserRole.CASHIER}>Cashier</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="phone"
                label="Phone (optional)"
                value={formData.phone}
                onChange={handleInputChange}
                fullWidth
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : dialogMode === 'add' ? 'Add User' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={openResetDialog} onClose={handleCloseResetDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="New Password"
            type="password"
            fullWidth
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              if (formErrors.newPassword) {
                setFormErrors({});
              }
            }}
            error={!!formErrors.newPassword}
            helperText={formErrors.newPassword}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseResetDialog}>Cancel</Button>
          <Button 
            onClick={handleResetPassword} 
            variant="contained" 
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Reset Password'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UserManagement; 