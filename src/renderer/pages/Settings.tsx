import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Grid,
  Alert,
  CircularProgress,
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
  Divider,
} from '@mui/material';
import {
  Upload as UploadIcon,
  Restore as RestoreIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Backup as BackupIcon,
  Download as DownloadIcon,
  Upload as ImportIcon,
  Refresh as ResetIcon,
} from '@mui/icons-material';
import { backupService } from '../../services/backup';
import { settingsService } from '../../services/settings';
import { useNotification } from '../context/NotificationContext';
import useApiState from '../hooks/useApiState';

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
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Settings: React.FC = () => {
  const { showNotification } = useNotification();
  const [currentTab, setCurrentTab] = useState(0);
  const [backupsList, setBackupsList] = useState<string[]>([]);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const settingsFileRef = useRef<HTMLInputElement>(null);
  
  const {
    data: backupStatus,
    loading: backupLoading,
    error: backupError,
    startLoading,
    setError,
    setData
  } = useApiState<{ lastBackup: string | null; nextBackup: string | null }>(null);

  // General Settings State
  const [generalSettings, setGeneralSettings] = useState({
    bannerImage: settingsService.getBannerImage(),
    theme: settingsService.getTheme(),
    language: settingsService.getLanguage(),
  });

  // Integration Settings State
  const [integrationSettings, setIntegrationSettings] = useState({
    mpesa: settingsService.getMpesaSettings(),
    quickbooks: settingsService.getQuickbooksSettings(),
  });

  // Backup Settings State
  const [backupSettings, setBackupSettings] = useState(settingsService.getBackupSettings());

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      const backups = backupService.listBackups();
      setBackupsList(backups);
    } catch (error) {
      setError('Failed to load backups');
      showNotification('Failed to load backups', 'error');
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleBannerUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newBannerImage = e.target?.result as string;
        setGeneralSettings(prev => ({ ...prev, bannerImage: newBannerImage }));
        settingsService.setBannerImage(newBannerImage);
        showNotification('Banner image updated successfully', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateBackup = async () => {
    try {
      startLoading();
      const backupPath = await backupService.createBackup();
      await loadBackups();
      settingsService.updateLastBackup(new Date().toISOString());
      setData({ lastBackup: new Date().toISOString(), nextBackup: null });
      showNotification('Backup created successfully', 'success');
    } catch (error) {
      setError('Failed to create backup');
      showNotification('Failed to create backup', 'error');
    }
  };

  const handleRestoreBackup = async () => {
    if (!selectedBackup) return;
    try {
      startLoading();
      await backupService.restoreBackup(selectedBackup);
      setRestoreDialogOpen(false);
      setData({ lastBackup: new Date().toISOString(), nextBackup: null });
      showNotification('Backup restored successfully', 'success');
    } catch (error) {
      setError('Failed to restore backup');
      showNotification('Failed to restore backup', 'error');
    }
  };

  const handleDeleteBackup = async (backup: string) => {
    try {
      await backupService.deleteBackup(backup);
      await loadBackups();
      showNotification('Backup deleted successfully', 'success');
    } catch (error) {
      setError('Failed to delete backup');
      showNotification('Failed to delete backup', 'error');
    }
  };

  const saveGeneralSettings = () => {
    try {
      settingsService.setTheme(generalSettings.theme);
      settingsService.setLanguage(generalSettings.language);
      showNotification('General settings saved successfully', 'success');
    } catch (error) {
      showNotification('Failed to save general settings', 'error');
    }
  };

  const saveIntegrationSettings = () => {
    try {
      settingsService.setMpesaSettings(integrationSettings.mpesa);
      settingsService.setQuickbooksSettings(integrationSettings.quickbooks);
      showNotification('Integration settings saved successfully', 'success');
    } catch (error) {
      showNotification('Failed to save integration settings', 'error');
    }
  };

  const saveBackupSettings = () => {
    try {
      settingsService.setBackupSettings(backupSettings);
      if (backupSettings.enabled) {
        backupService.startAutoBackup(backupSettings.interval);
      } else {
        backupService.stopAutoBackup();
      }
      showNotification('Backup settings saved successfully', 'success');
    } catch (error) {
      showNotification('Failed to save backup settings', 'error');
    }
  };

  const handleExportSettings = () => {
    try {
      const settings = settingsService.exportSettings();
      const blob = new Blob([settings], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cowsalt-pro-settings.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showNotification('Settings exported successfully', 'success');
    } catch (error) {
      showNotification('Failed to export settings', 'error');
    }
  };

  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const settings = e.target?.result as string;
          settingsService.importSettings(settings);
          // Reload settings
          setGeneralSettings({
            bannerImage: settingsService.getBannerImage(),
            theme: settingsService.getTheme(),
            language: settingsService.getLanguage(),
          });
          setIntegrationSettings({
            mpesa: settingsService.getMpesaSettings(),
            quickbooks: settingsService.getQuickbooksSettings(),
          });
          setBackupSettings(settingsService.getBackupSettings());
          showNotification('Settings imported successfully', 'success');
        } catch (error) {
          showNotification('Failed to import settings', 'error');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleResetSettings = () => {
    try {
      settingsService.resetToDefaults();
      // Reload settings
      setGeneralSettings({
        bannerImage: settingsService.getBannerImage(),
        theme: settingsService.getTheme(),
        language: settingsService.getLanguage(),
      });
      setIntegrationSettings({
        mpesa: settingsService.getMpesaSettings(),
        quickbooks: settingsService.getQuickbooksSettings(),
      });
      setBackupSettings(settingsService.getBackupSettings());
      setResetDialogOpen(false);
      showNotification('Settings reset successfully', 'success');
    } catch (error) {
      showNotification('Failed to reset settings', 'error');
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="General" />
          <Tab label="Integrations" />
          <Tab label="Backup" />
        </Tabs>

        {/* General Settings Tab */}
        <TabPanel value={currentTab} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Appearance
              </Typography>
              <Box sx={{ mb: 3 }}>
                <Button
                  variant="outlined"
                  startIcon={<UploadIcon />}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Change Banner Image
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  hidden
                  accept="image/*"
                  onChange={handleBannerUpload}
                />
              </Box>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Theme</InputLabel>
                <Select
                  value={generalSettings.theme}
                  onChange={(e) => setGeneralSettings(prev => ({ ...prev, theme: e.target.value as 'light' | 'dark' }))}
                  label="Theme"
                >
                  <MenuItem value="light">Light</MenuItem>
                  <MenuItem value="dark">Dark</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Language</InputLabel>
                <Select
                  value={generalSettings.language}
                  onChange={(e) => setGeneralSettings(prev => ({ ...prev, language: e.target.value as 'en' | 'sw' }))}
                  label="Language"
                >
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="sw">Swahili</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={saveGeneralSettings}
              >
                Save Changes
              </Button>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Integrations Tab */}
        <TabPanel value={currentTab} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                MPESA Integration
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={integrationSettings.mpesa.enabled}
                    onChange={(e) => setIntegrationSettings(prev => ({
                      ...prev,
                      mpesa: { ...prev.mpesa, enabled: e.target.checked }
                    }))}
                  />
                }
                label="Enable MPESA Integration"
              />
              {integrationSettings.mpesa.enabled && (
                <Box sx={{ mt: 2 }}>
                  <TextField
                    fullWidth
                    label="Consumer Key"
                    value={integrationSettings.mpesa.consumerKey}
                    onChange={(e) => setIntegrationSettings(prev => ({
                      ...prev,
                      mpesa: { ...prev.mpesa, consumerKey: e.target.value }
                    }))}
                    margin="normal"
                  />
                  <TextField
                    fullWidth
                    label="Consumer Secret"
                    type="password"
                    value={integrationSettings.mpesa.consumerSecret}
                    onChange={(e) => setIntegrationSettings(prev => ({
                      ...prev,
                      mpesa: { ...prev.mpesa, consumerSecret: e.target.value }
                    }))}
                    margin="normal"
                  />
                  <TextField
                    fullWidth
                    label="Short Code"
                    value={integrationSettings.mpesa.shortCode}
                    onChange={(e) => setIntegrationSettings(prev => ({
                      ...prev,
                      mpesa: { ...prev.mpesa, shortCode: e.target.value }
                    }))}
                    margin="normal"
                  />
                </Box>
              )}
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                QuickBooks Integration
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={integrationSettings.quickbooks.enabled}
                    onChange={(e) => setIntegrationSettings(prev => ({
                      ...prev,
                      quickbooks: { ...prev.quickbooks, enabled: e.target.checked }
                    }))}
                  />
                }
                label="Enable QuickBooks Integration"
              />
              {integrationSettings.quickbooks.enabled && (
                <Box sx={{ mt: 2 }}>
                  <TextField
                    fullWidth
                    label="Client ID"
                    value={integrationSettings.quickbooks.clientId}
                    onChange={(e) => setIntegrationSettings(prev => ({
                      ...prev,
                      quickbooks: { ...prev.quickbooks, clientId: e.target.value }
                    }))}
                    margin="normal"
                  />
                  <TextField
                    fullWidth
                    label="Client Secret"
                    type="password"
                    value={integrationSettings.quickbooks.clientSecret}
                    onChange={(e) => setIntegrationSettings(prev => ({
                      ...prev,
                      quickbooks: { ...prev.quickbooks, clientSecret: e.target.value }
                    }))}
                    margin="normal"
                  />
                </Box>
              )}
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={saveIntegrationSettings}
              >
                Save Integration Settings
              </Button>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Backup Tab */}
        <TabPanel value={currentTab} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Backup Settings
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={backupSettings.enabled}
                    onChange={(e) => setBackupSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                  />
                }
                label="Enable Automatic Backups"
              />
              {backupSettings.enabled && (
                <TextField
                  fullWidth
                  type="number"
                  label="Backup Interval (seconds)"
                  value={backupSettings.interval}
                  onChange={(e) => setBackupSettings(prev => ({ ...prev, interval: Number(e.target.value) }))}
                  margin="normal"
                />
              )}
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={saveBackupSettings}
                sx={{ mt: 2 }}
              >
                Save Backup Settings
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Manual Backup
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<BackupIcon />}
                onClick={handleCreateBackup}
                disabled={backupLoading}
              >
                Create Backup Now
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Backup History
              </Typography>
              {backupError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {backupError}
                </Alert>
              )}
              {backupLoading ? (
                <CircularProgress />
              ) : (
                <List>
                  {backupsList.map((backup) => (
                    <ListItem key={backup}>
                      <ListItemText
                        primary={backup.split('/').pop()}
                        secondary={new Date(backup).toLocaleString()}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => {
                            setSelectedBackup(backup);
                            setRestoreDialogOpen(true);
                          }}
                        >
                          <RestoreIcon />
                        </IconButton>
                        <IconButton
                          edge="end"
                          onClick={() => handleDeleteBackup(backup)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </Grid>
          </Grid>
        </TabPanel>

        {/* Settings Management */}
        <Box sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="h6" gutterBottom>
            Settings Management
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExportSettings}
            >
              Export Settings
            </Button>
            <Button
              variant="outlined"
              startIcon={<ImportIcon />}
              onClick={() => settingsFileRef.current?.click()}
            >
              Import Settings
            </Button>
            <input
              type="file"
              ref={settingsFileRef}
              hidden
              accept=".json"
              onChange={handleImportSettings}
            />
            <Button
              variant="outlined"
              color="error"
              startIcon={<ResetIcon />}
              onClick={() => setResetDialogOpen(true)}
            >
              Reset to Defaults
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Restore Backup Dialog */}
      <Dialog
        open={restoreDialogOpen}
        onClose={() => setRestoreDialogOpen(false)}
      >
        <DialogTitle>Restore Backup</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to restore this backup? This will replace all current data.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestoreDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleRestoreBackup} color="primary">
            Restore
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reset Settings Dialog */}
      <Dialog
        open={resetDialogOpen}
        onClose={() => setResetDialogOpen(false)}
      >
        <DialogTitle>Reset Settings</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to reset all settings to their default values? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleResetSettings} color="error">
            Reset
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings; 