import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Button,
  Switch,
  FormControlLabel,
  Typography,
  Box,
  Divider,
  List,
  ListItem,
  ListItemText,
  Collapse,
  Paper,
} from '@mui/material';
import BugReportIcon from '@mui/icons-material/BugReport';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useNotification } from '../context/NotificationContext';

interface DebugAction {
  name: string;
  handler: () => void;
}

interface DebugPanelProps {
  componentName?: string;
  state?: Record<string, unknown>;
  actions?: DebugAction[];
}

const DebugPanel: React.FC<DebugPanelProps> = ({ 
  componentName = 'App',
  state = {},
  actions = []
}) => {
  const [open, setOpen] = useState(false);
  const [slowNetwork, setSlowNetwork] = useState(false);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [clearLogsDialogOpen, setClearLogsDialogOpen] = useState(false);
  const [systemInfo, setSystemInfo] = useState<Record<string, any>>({});
  const { showNotification } = useNotification();
  const [isExpanded, setIsExpanded] = useState<Record<string, boolean>>({});

  const loadSystemInfo = async () => {
    try {
      const info = {
        platform: window.navigator.platform,
        userAgent: window.navigator.userAgent,
        language: window.navigator.language,
        memory: (window.performance as any).memory?.usedJSHeapSize,
        networkType: (navigator as any).connection?.type,
        networkSpeed: (navigator as any).connection?.downlink,
      };
      setSystemInfo(info);
    } catch (error) {
      console.error('Failed to load system info:', error);
    }
  };

  useEffect(() => {
    if (open) {
      loadSystemInfo();
      const interval = setInterval(loadSystemInfo, 5000);
      return () => clearInterval(interval);
    }
  }, [open]);

  const handleToggleSlowNetwork = () => {
    setSlowNetwork(!slowNetwork);
    if (!slowNetwork) {
      // @ts-expect-error - ServiceWorker types are not complete
      window.navigator.serviceWorker?.controller?.postMessage({
        type: 'SLOW_NETWORK',
        enabled: true
      });
    } else {
      // @ts-expect-error - ServiceWorker types are not complete
      window.navigator.serviceWorker?.controller?.postMessage({
        type: 'SLOW_NETWORK',
        enabled: false
      });
    }
  };

  const handleClearLogs = () => {
    console.clear();
    setExpandedLogs(new Set());
    setClearLogsDialogOpen(false);
    showNotification('success', 'Logs cleared');
  };

  const handleExportLogs = () => {
    try {
      const logs = {
        componentName,
        state,
        systemInfo,
        timestamp: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `debug-logs-${componentName}-${new Date().toISOString()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showNotification('success', 'Logs exported');
    } catch {
      showNotification('error', 'Failed to export logs');
    }
  };

  const toggleLogExpansion = (key: string) => {
    const newExpandedLogs = new Set(expandedLogs);
    if (expandedLogs.has(key)) {
      newExpandedLogs.delete(key);
    } else {
      newExpandedLogs.add(key);
    }
    setExpandedLogs(newExpandedLogs);
  };

  const toggleExpansion = (section: string) => {
    setIsExpanded(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <>
      <IconButton
        onClick={() => setOpen(true)}
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        color="primary"
      >
        <BugReportIcon />
      </IconButton>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Debug Panel: {componentName}
          <IconButton
            onClick={() => setOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <Paper sx={{ p: 2, m: 2, maxWidth: 400 }}>
            <Typography variant="h6" gutterBottom>
              Debug Panel - {componentName}
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1">Component State:</Typography>
              <List dense>
                {Object.entries(state).map(([key, value]) => (
                  <ListItem key={key}>
                    <ListItemText 
                      primary={key}
                      secondary={JSON.stringify(value)}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1">System Info:</Typography>
              <List dense>
                {Object.entries(systemInfo).map(([key, value]) => (
                  <ListItem key={key}>
                    <ListItemText 
                      primary={key}
                      secondary={JSON.stringify(value)}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>

            <Box>
              <Typography variant="subtitle1">Actions:</Typography>
              <List dense>
                {actions.map((action, index) => (
                  <ListItem 
                    key={index}
                    button
                    onClick={action.handler}
                  >
                    <ListItemText primary={action.name} />
                  </ListItem>
                ))}
              </List>
            </Box>
          </Paper>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ mb: 2 }}>
            <Typography variant="h6">Debug Tools</Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={slowNetwork}
                  onChange={handleToggleSlowNetwork}
                />
              }
              label="Simulate Slow Network"
            />
            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                onClick={() => setClearLogsDialogOpen(true)}
                sx={{ mr: 1 }}
              >
                Clear Logs
              </Button>
              <Button
                variant="outlined"
                onClick={handleExportLogs}
              >
                Export Logs
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog
        open={clearLogsDialogOpen}
        onClose={() => setClearLogsDialogOpen(false)}
      >
        <DialogTitle>Clear Logs</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to clear all logs?</Typography>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              onClick={() => setClearLogsDialogOpen(false)}
              sx={{ mr: 1 }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleClearLogs}
              variant="contained"
              color="error"
            >
              Clear
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DebugPanel; 