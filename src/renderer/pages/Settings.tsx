import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Grid,
  Alert,
  CircularProgress,
  TextField,
  Box,
  Tabs,
  Tab,
  Divider,
  Card,
  CardContent,
  IconButton,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Slider,
  Collapse,
  alpha,
} from '@mui/material';
import {
  Backup as BackupIcon,
  Upload as UploadIcon,
  Refresh as RefreshIcon,
  ColorLens as ColorLensIcon,
  Print as PrintIcon,
  Palette as PaletteIcon,
  PhotoCamera as PhotoCameraIcon,
  Save as SaveIcon,
  Preview as PreviewIcon,
} from '@mui/icons-material';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { settingsService } from '../../services/settings';
import QuickActions, { QuickAction } from '../components/QuickActions';

interface BackupInfo {
  lastBackup: string | null;
  status: 'none' | 'success' | 'failed' | null;
  error?: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `settings-tab-${index}`,
    'aria-controls': `settings-tabpanel-${index}`,
  };
}

const DEFAULT_LOGO = '../assets/images/default-logo.png';
const DEFAULT_BANNER = '../assets/images/default-banner.jpg';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [backupInfo, setBackupInfo] = useState<BackupInfo>({
    lastBackup: null,
    status: 'none',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showNotification } = useNotification();
  const [tabValue, setTabValue] = useState(0);
  
  // Logo & Branding state
  const [logoImage, setLogoImage] = useState<string | null>(localStorage.getItem('logoImage') || DEFAULT_LOGO);
  const [companyName, setCompanyName] = useState(localStorage.getItem('companyName') || 'CowSalt Pro');
  const [bannerImage, setBannerImage] = useState<string | null>(localStorage.getItem('bannerImage') || DEFAULT_BANNER);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Receipt settings state
  const [receiptSettings, setReceiptSettings] = useState({
    showLogo: localStorage.getItem('receipt.showLogo') === 'true',
    companyNameSize: parseInt(localStorage.getItem('receipt.companyNameSize') || '16'),
    showFooter: localStorage.getItem('receipt.showFooter') === 'true',
    footerText: localStorage.getItem('receipt.footerText') || 'Thank you for your business!',
    paperSize: localStorage.getItem('receipt.paperSize') || 'thermal',
    fontSize: parseInt(localStorage.getItem('receipt.fontSize') || '12'),
    showDate: localStorage.getItem('receipt.showDate') === 'true',
    showOrderNumber: localStorage.getItem('receipt.showOrderNumber') === 'true',
  });

  // Interface settings state
  const [interfaceSettings, setInterfaceSettings] = useState({
    animationsEnabled: localStorage.getItem('interface.animationsEnabled') !== 'false',
    darkMode: localStorage.getItem('interface.darkMode') === 'true',
    fontSize: parseInt(localStorage.getItem('interface.fontSize') || '14'),
    compactMode: localStorage.getItem('interface.compactMode') === 'true',
    accentColor: localStorage.getItem('interface.accentColor') || 'primary',
  });

  useEffect(() => {
    loadBackupInfo();
  }, []);

  const loadBackupInfo = async () => {
    try {
      setError(null);
      const info = await settingsService.getBackupInfo();
      setBackupInfo(info);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load backup information');
      showNotification('error', 'Failed to load backup information');
    }
  };

  const handleBackup = async () => {
    if (isLoading) return; // Prevent multiple clicks
    
    try {
      setIsLoading(true);
      setError(null);
      await settingsService.performBackup();
      await loadBackupInfo();
      showNotification('success', 'Backup completed successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to perform backup');
      showNotification('error', 'Failed to perform backup');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Logo & Branding Handlers
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setIsUploading(true);
      const file = event.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setLogoImage(result);
        localStorage.setItem('logoImage', result);
        setIsUploading(false);
        showNotification('success', 'Logo uploaded successfully');
      };
      
      reader.onerror = () => {
        setIsUploading(false);
        showNotification('error', 'Failed to upload logo');
      };
      
      reader.readAsDataURL(file);
    }
  };

  const handleBannerUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setIsUploading(true);
      const file = event.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setBannerImage(result);
        localStorage.setItem('bannerImage', result);
        setIsUploading(false);
        showNotification('success', 'Banner uploaded successfully');
      };
      
      reader.onerror = () => {
        setIsUploading(false);
        showNotification('error', 'Failed to upload banner');
      };
      
      reader.readAsDataURL(file);
    }
  };

  const handleCompanyNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setCompanyName(name);
    localStorage.setItem('companyName', name);
  };

  const handleResetLogo = () => {
    setLogoImage(DEFAULT_LOGO);
    localStorage.setItem('logoImage', DEFAULT_LOGO);
    showNotification('info', 'Logo reset to default');
  };

  const handleResetBanner = () => {
    setBannerImage(DEFAULT_BANNER);
    localStorage.setItem('bannerImage', DEFAULT_BANNER);
    showNotification('info', 'Banner reset to default');
  };
  
  // Receipt Settings Handlers
  const handleReceiptSettingChange = (
    setting: keyof typeof receiptSettings,
    value: string | number | boolean
  ) => {
    setReceiptSettings((prev) => ({
      ...prev,
      [setting]: value,
    }));
    
    localStorage.setItem(`receipt.${setting}`, value.toString());
  };
  
  // Interface Settings Handlers
  const handleInterfaceSettingChange = (
    setting: keyof typeof interfaceSettings,
    value: string | number | boolean
  ) => {
    setInterfaceSettings((prev) => ({
      ...prev,
      [setting]: value,
    }));
    
    localStorage.setItem(`interface.${setting}`, value.toString());
  };

  const isAdmin = user?.role === 'admin';

  // Define settings-specific quick actions
  const settingsQuickActions: QuickAction[] = [
    {
      key: 'backup-now',
      icon: <BackupIcon />,
      title: 'Backup Now',
      handler: () => {
        if (!isLoading) {
          handleBackup();
        }
      },
      color: 'primary'
    },
    {
      key: 'save-settings',
      icon: <SaveIcon />,
      title: 'Save All Settings',
      handler: () => {
        // Save all the current settings to localStorage again to ensure they're stored
        Object.entries(receiptSettings).forEach(([key, value]) => {
          localStorage.setItem(`receipt.${key}`, value.toString());
        });
        
        Object.entries(interfaceSettings).forEach(([key, value]) => {
          localStorage.setItem(`interface.${key}`, value.toString());
        });
        
        showNotification('success', 'All settings saved successfully');
      },
      color: 'success'
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
      <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          System Settings
        </Typography>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="settings tabs"
            indicatorColor="primary"
            textColor="primary"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Branding" icon={<PaletteIcon />} iconPosition="start" {...a11yProps(0)} />
            <Tab label="Receipt" icon={<PrintIcon />} iconPosition="start" {...a11yProps(1)} />
            <Tab label="Interface" icon={<ColorLensIcon />} iconPosition="start" {...a11yProps(2)} />
            <Tab label="Backup" icon={<BackupIcon />} iconPosition="start" {...a11yProps(3)} />
          </Tabs>
        </Box>
        
        {/* Branding Settings */}
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            Logo & Company Branding
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Customize your company branding, which will be displayed on the login screen and receipts.
          </Typography>
          
          <Grid container spacing={4}>
            {/* Company Name */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Company Name"
                variant="outlined"
                value={companyName}
                onChange={handleCompanyNameChange}
                disabled={!isAdmin}
                helperText={!isAdmin ? "Only administrators can change company settings" : ""}
              />
            </Grid>
            
            {/* Company Logo */}
            <Grid item xs={12} md={6}>
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Company Logo
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                    <Box 
                      sx={{ 
                        width: 200, 
                        height: 100, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        border: '1px dashed grey', 
                        borderRadius: 1, 
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      {isUploading ? (
                        <CircularProgress size={24} />
                      ) : (
                        logoImage && <img src={logoImage} alt="Company logo" style={{ maxWidth: '100%', maxHeight: '100%' }} />
                      )}
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                    <Button
                      variant="outlined"
                      startIcon={<UploadIcon />}
                      onClick={() => logoInputRef.current?.click()}
                      disabled={!isAdmin || isUploading}
                    >
                      Upload Logo
                    </Button>
                    <IconButton 
                      onClick={handleResetLogo} 
                      color="warning"
                      disabled={!isAdmin || isUploading}
                    >
                      <RefreshIcon />
                    </IconButton>
                    <input
                      ref={logoInputRef}
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleLogoUpload}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Login Banner */}
            <Grid item xs={12} md={6}>
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Login Banner
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                    <Box 
                      sx={{ 
                        width: 200, 
                        height: 100, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        border: '1px dashed grey', 
                        borderRadius: 1, 
                        position: 'relative', 
                        overflow: 'hidden', 
                      }}
                    >
                      {isUploading ? (
                        <CircularProgress size={24} />
                      ) : (
                        bannerImage && <img src={bannerImage} alt="Login banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )}
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                    <Button
                      variant="outlined"
                      startIcon={<PhotoCameraIcon />}
                      onClick={() => bannerInputRef.current?.click()}
                      disabled={!isAdmin || isUploading}
                    >
                      Upload Banner
                    </Button>
                    <IconButton 
                      onClick={handleResetBanner} 
                      color="warning"
                      disabled={!isAdmin || isUploading}
                    >
                      <RefreshIcon />
                    </IconButton>
                    <input
                      ref={bannerInputRef}
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleBannerUpload}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Receipt Settings */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Receipt Configuration
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Customize your receipts and configure printing preferences.
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  height: '100%',
                }}
              >
                <Typography variant="subtitle1" gutterBottom>
                  Receipt Content
                </Typography>
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={receiptSettings.showLogo}
                      onChange={(e) => handleReceiptSettingChange('showLogo', e.target.checked)}
                    />
                  }
                  label="Show Company Logo"
                />
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    Company Name Font Size
                  </Typography>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs>
                      <Slider
                        value={receiptSettings.companyNameSize}
                        min={12}
                        max={24}
                        step={1}
                        marks
                        valueLabelDisplay="auto"
                        onChange={(_, value) => handleReceiptSettingChange('companyNameSize', value as number)}
                      />
                    </Grid>
                    <Grid item>
                      <Typography variant="body2">{receiptSettings.companyNameSize}pt</Typography>
                    </Grid>
                  </Grid>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={receiptSettings.showFooter}
                      onChange={(e) => handleReceiptSettingChange('showFooter', e.target.checked)}
                    />
                  }
                  label="Show Receipt Footer"
                />
                
                <Collapse in={receiptSettings.showFooter}>
                  <TextField
                    fullWidth
                    label="Footer Text"
                    margin="normal"
                    value={receiptSettings.footerText}
                    onChange={(e) => handleReceiptSettingChange('footerText', e.target.value)}
                  />
                </Collapse>
                
                <Divider sx={{ my: 2 }} />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={receiptSettings.showDate}
                      onChange={(e) => handleReceiptSettingChange('showDate', e.target.checked)}
                    />
                  }
                  label="Show Date and Time"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={receiptSettings.showOrderNumber}
                      onChange={(e) => handleReceiptSettingChange('showOrderNumber', e.target.checked)}
                    />
                  }
                  label="Show Order Number"
                />
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  height: '100%',
                }}
              >
                <Typography variant="subtitle1" gutterBottom>
                  Printer Settings
                </Typography>
                
                <FormControl fullWidth margin="normal">
                  <InputLabel>Paper Size</InputLabel>
                  <Select
                    value={receiptSettings.paperSize}
                    label="Paper Size"
                    onChange={(e) => handleReceiptSettingChange('paperSize', e.target.value)}
                  >
                    <MenuItem value="thermal">Thermal (58mm)</MenuItem>
                    <MenuItem value="thermal80">Thermal (80mm)</MenuItem>
                    <MenuItem value="a4">A4 Paper</MenuItem>
                    <MenuItem value="a5">A5 Paper</MenuItem>
                  </Select>
                </FormControl>
                
                <Box sx={{ mt: 3 }}>
                  <Typography variant="body2" gutterBottom>
                    Font Size
                  </Typography>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs>
                      <Slider
                        value={receiptSettings.fontSize}
                        min={8}
                        max={16}
                        step={1}
                        marks
                        valueLabelDisplay="auto"
                        onChange={(_, value) => handleReceiptSettingChange('fontSize', value as number)}
                      />
                    </Grid>
                    <Grid item>
                      <Typography variant="body2">{receiptSettings.fontSize}pt</Typography>
                    </Grid>
                  </Grid>
                </Box>
                
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<PreviewIcon />}
                    sx={{ mr: 1 }}
                    onClick={() => showNotification('info', 'Receipt preview feature coming soon!')}
                  >
                    Preview Receipt
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<PrintIcon />}
                    onClick={() => showNotification('info', 'Test print feature coming soon!')}
                  >
                    Test Print
                  </Button>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Interface Settings */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Interface Customization
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Personalize your application interface and user experience.
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                }}
              >
                <Typography variant="subtitle1" gutterBottom>
                  Visual Preferences
                </Typography>
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={interfaceSettings.darkMode}
                      onChange={(e) => handleInterfaceSettingChange('darkMode', e.target.checked)}
                    />
                  }
                  label="Dark Mode"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={interfaceSettings.compactMode}
                      onChange={(e) => handleInterfaceSettingChange('compactMode', e.target.checked)}
                    />
                  }
                  label="Compact Mode"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={interfaceSettings.animationsEnabled}
                      onChange={(e) => handleInterfaceSettingChange('animationsEnabled', e.target.checked)}
                    />
                  }
                  label="Enable Animations"
                />
                
                <Box sx={{ mt: 3 }}>
                  <Typography variant="body2" gutterBottom>
                    Font Size
                  </Typography>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs>
                      <Slider
                        value={interfaceSettings.fontSize}
                        min={12}
                        max={18}
                        step={1}
                        marks
                        valueLabelDisplay="auto"
                        onChange={(_, value) => handleInterfaceSettingChange('fontSize', value as number)}
                      />
                    </Grid>
                    <Grid item>
                      <Typography variant="body2">{interfaceSettings.fontSize}px</Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                }}
              >
                <Typography variant="subtitle1" gutterBottom>
                  Color Scheme
                </Typography>
                
                <FormControl fullWidth margin="normal">
                  <InputLabel>Accent Color</InputLabel>
                  <Select
                    value={interfaceSettings.accentColor}
                    label="Accent Color"
                    onChange={(e) => handleInterfaceSettingChange('accentColor', e.target.value)}
                  >
                    <MenuItem value="primary">Default Blue</MenuItem>
                    <MenuItem value="purple">Purple</MenuItem>
                    <MenuItem value="green">Green</MenuItem>
                    <MenuItem value="orange">Orange</MenuItem>
                    <MenuItem value="red">Red</MenuItem>
                  </Select>
                </FormControl>
                
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-around' }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                        mx: 'auto',
                        mb: 1,
                        boxShadow: 1,
                      }}
                    />
                    <Typography variant="caption">Primary</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        bgcolor: 'secondary.main',
                        mx: 'auto',
                        mb: 1,
                        boxShadow: 1,
                      }}
                    />
                    <Typography variant="caption">Secondary</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        bgcolor: 'success.main',
                        mx: 'auto',
                        mb: 1,
                        boxShadow: 1,
                      }}
                    />
                    <Typography variant="caption">Success</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        bgcolor: 'error.main',
                        mx: 'auto',
                        mb: 1,
                        boxShadow: 1,
                      }}
                    />
                    <Typography variant="caption">Error</Typography>
                  </Box>
                </Box>
                
                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={() => {
                      showNotification('success', 'Changes will take effect after reload');
                      setTimeout(() => window.location.reload(), 1500);
                    }}
                  >
                    Apply Changes
                  </Button>
                </Box>
                
                <Typography variant="caption" display="block" sx={{ mt: 2, textAlign: 'center', color: 'text.secondary' }}>
                  Some settings will be applied after application reload
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Backup Settings */}
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            Backup & Restore
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                System Backup
              </Typography>
              <Typography variant="body2" paragraph>
                Create a full backup of your application data, including users, inventory, and sales records.
              </Typography>
              
              <Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 1, mb: 2 }}>
                <Typography variant="body2">
                  Last backup:{' '}
                  {backupInfo.lastBackup
                    ? new Date(backupInfo.lastBackup).toLocaleString()
                    : 'Never'}
                </Typography>
                {backupInfo.status && (
                  <Typography
                    variant="body2"
                    color={backupInfo.status === 'success' ? 'success.main' : 'error.main'}
                  >
                    Last backup status: {backupInfo.status}
                  </Typography>
                )}
              </Box>
              
              <Button
                variant="contained"
                color="primary"
                onClick={handleBackup}
                disabled={isLoading}
                startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <BackupIcon />}
              >
                {isLoading ? 'Backing up...' : 'Perform Backup'}
              </Button>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Restore Data
              </Typography>
              <Typography variant="body2" paragraph>
                Restore your system from a previous backup. This will replace all current data.
              </Typography>
              
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  mb: 2,
                  bgcolor: alpha('#ff9800', 0.05),
                }}
              >
                <Typography variant="body2" color="warning.main" sx={{ fontWeight: 'medium' }}>
                  Warning: Restoring from backup will overwrite all current data. This action cannot be undone.
                </Typography>
              </Paper>
              
              <Button
                variant="outlined"
                color="warning"
                disabled={!isAdmin || isLoading}
                onClick={() => showNotification('info', 'Restore feature coming soon')}
                startIcon={<UploadIcon />}
              >
                Select Backup File
              </Button>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>

      {/* Replace the built-in quick actions with our new component */}
      <QuickActions 
        additionalActions={settingsQuickActions}
        showHelp={true}
        position="bottom-right"
      />
    </Container>
  );
};

export default Settings;