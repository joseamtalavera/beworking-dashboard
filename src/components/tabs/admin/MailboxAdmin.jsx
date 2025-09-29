import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Badge from '@mui/material/Badge';
import ScannerOutlinedIcon from '@mui/icons-material/ScannerOutlined';
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import RemoveRedEyeOutlinedIcon from '@mui/icons-material/RemoveRedEyeOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';

import {
  getMailboxDocumentDownloadUrl,
  listMailboxDocuments,
  markMailboxDocumentViewed,
  notifyMailboxDocument,
  uploadMailboxDocument
} from '../../../api/mailbox.js';

const accentColor = '#fb923c';
const accentHover = 'rgba(251, 146, 60, 0.12)';

const statusConfig = {
  scanned: { label: 'New scan', color: 'warning', description: 'Ready to notify the user.' },
  notified: { label: 'Email sent', color: 'primary', description: 'User has been notified.' },
  viewed: { label: 'Viewed online', color: 'success', description: 'User downloaded or viewed the file.' }
};

const SummaryCard = ({ icon, title, value, helper, color }) => (
  <Paper elevation={0} sx={{ borderRadius: 3, p: 3, border: '1px solid', borderColor: 'divider' }}>
    <Stack direction="row" spacing={2} alignItems="center">
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 48,
          height: 48,
          borderRadius: '50%',
          bgcolor: color || accentHover,
          color: color ? 'common.white' : accentColor
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="overline" color="text.secondary">
          {title}
        </Typography>
        <Typography variant="h5" fontWeight="bold">
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {helper}
        </Typography>
      </Box>
    </Stack>
  </Paper>
);

const formatDateTime = (isoString) => {
  if (!isoString) return '—';
  const date = new Date(isoString);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const MailboxAdmin = () => {
  const [documents, setDocuments] = useState([]);
  const [filter, setFilter] = useState('all');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const isMountedRef = useRef(false);

  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const normalizeDocuments = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.content)) return payload.content;
    if (Array.isArray(payload?.data)) return payload.data;
    return payload ? [payload] : [];
  };

  const refreshDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await listMailboxDocuments();
      if (!isMountedRef.current) return;
      setDocuments(normalizeDocuments(response));
    } catch (error) {
      if (!isMountedRef.current) return;
      console.error('Failed to load mailbox documents', error);
      showSnackbar(error.message || 'Failed to load mailbox documents.', 'error');
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [showSnackbar]);

  useEffect(() => {
    isMountedRef.current = true;
    refreshDocuments();
    return () => {
      isMountedRef.current = false;
    };
  }, [refreshDocuments]);

  const summary = useMemo(() => {
    const scanned = documents.filter((doc) => doc.status === 'scanned').length;
    const notified = documents.filter((doc) => doc.status === 'notified').length;
    const viewed = documents.filter((doc) => doc.status === 'viewed').length;
    return { scanned, notified, viewed };
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    if (filter === 'all') return documents;
    return documents.filter((doc) => doc.status === filter);
  }, [documents, filter]);

  const handleUploadScan = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = async (event) => {
    const [file] = event.target.files || [];
    if (!file) return;

    try {
      const createdDocument = await uploadMailboxDocument(file);
      const payloadAsList = normalizeDocuments(createdDocument);

      if (payloadAsList.length > 0) {
        setDocuments(payloadAsList);
      } else if (createdDocument && typeof createdDocument === 'object') {
        setDocuments((prev) => [createdDocument, ...prev]);
      } else {
        await refreshDocuments();
      }
      showSnackbar('Document uploaded and ready to notify the user.');
    } catch (error) {
      console.error('Failed to upload mailbox document', error);
      showSnackbar(error.message || 'Failed to upload document.', 'error');
    } finally {
      event.target.value = '';
    }
  };

  const handleNotifyUser = async (docId) => {
    try {
      const updatedDocument = await notifyMailboxDocument(docId);
      const fallbackUpdate = {
        status: 'notified',
        lastNotifiedAt: new Date().toISOString()
      };

      setDocuments((prev) =>
        prev.map((doc) => (doc.id === docId ? { ...doc, ...(updatedDocument || fallbackUpdate) } : doc))
      );

      if (!updatedDocument) {
        await refreshDocuments();
      }

      showSnackbar('Notification email sent to the tenant.');
    } catch (error) {
      console.error('Failed to notify mailbox document', error);
      showSnackbar(error.message || 'Unable to send notification email.', 'error');
    }
  };

  const handleMarkViewed = async (docId) => {
    try {
      const updatedDocument = await markMailboxDocumentViewed(docId);
      const fallbackUpdate = { status: 'viewed' };

      setDocuments((prev) =>
        prev.map((doc) => (doc.id === docId ? { ...doc, ...(updatedDocument || fallbackUpdate) } : doc))
      );

      if (!updatedDocument) {
        await refreshDocuments();
      }

      showSnackbar('Document marked as viewed by the tenant.');
    } catch (error) {
      console.error('Failed to mark mailbox document as viewed', error);
      showSnackbar(error.message || 'Unable to mark document as viewed.', 'error');
    }
  };

  const handlePreviewDocument = (docId) => {
    try {
      const downloadUrl = getMailboxDocumentDownloadUrl(docId);
      if (!downloadUrl) {
        throw new Error('Missing download URL');
      }
      window.open(downloadUrl, '_blank', 'noopener');
    } catch (error) {
      console.error('Failed to open mailbox document preview', error);
      showSnackbar('Unable to open document preview.', 'error');
    }
  };

  const handleFilterChange = (_, value) => {
    if (value !== null) {
      setFilter(value);
    }
  };

  return (
    <Stack spacing={4}>
      <input
        type="file"
        accept="application/pdf,image/*"
        hidden
        ref={fileInputRef}
        onChange={handleFileInputChange}
      />
      <Stack spacing={2}>
        <Typography variant="h5" fontWeight="bold" color="text.primary">
          Mailbox Intake
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage scanned mail for your virtual office tenants. Upload new scans, notify recipients automatically, and track when files are viewed online.
        </Typography>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
        <SummaryCard
          icon={<ScannerOutlinedIcon />}
          title="New scans"
          value={summary.scanned}
          helper="Waiting to notify tenants"
        />
        <SummaryCard
          icon={<MarkEmailReadOutlinedIcon />}
          title="Notified"
          value={summary.notified}
          helper="Emails delivered in the last 7 days"
        />
        <SummaryCard
          icon={<TaskAltOutlinedIcon />}
          title="Viewed online"
          value={summary.viewed}
          helper="Tenant confirmed access"
          color={accentColor}
        />
      </Stack>

      <Paper elevation={0} sx={{ borderRadius: 3, p: 3, border: '1px solid', borderColor: 'divider' }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', md: 'center' }}
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="h6" fontWeight="bold" color="text.primary">
              Incoming documents
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Scan, notify, and track mail for every virtual office tenant.
            </Typography>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button
              variant="outlined"
              startIcon={<UploadFileOutlinedIcon />}
              onClick={handleUploadScan}
              sx={{ borderRadius: 2 }}
            >
              Scan & upload
            </Button>
            <ToggleButtonGroup value={filter} exclusive onChange={handleFilterChange} size="small" color="primary">
              <ToggleButton value="all">All</ToggleButton>
              <ToggleButton value="scanned">New</ToggleButton>
              <ToggleButton value="notified">Notified</ToggleButton>
              <ToggleButton value="viewed">Viewed</ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </Stack>

        <Divider sx={{ my: 3 }} />

        <TableContainer>
          <Table size="medium">
            <TableHead>
              <TableRow>
                <TableCell>Document</TableCell>
                <TableCell>Sender</TableCell>
                <TableCell>Received</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Last notified</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && documents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Stack spacing={1} alignItems="center" sx={{ py: 6 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Loading documents...
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Fetching the latest mailbox records.
                      </Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {filteredDocuments.map((doc, index) => {
                    const status = statusConfig[doc.status] || null;
                    const senderName = doc.sender || 'Unknown sender';
                    const avatarSeed = (doc.sender || doc.title || doc.id || '?').slice(0, 2).toUpperCase();
                    const pageCountLabel = doc.pages ?? '—';

                    return (
                      <TableRow hover key={doc.id ?? doc.title ?? doc.sender ?? index}>
                        <TableCell>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Badge
                              color="secondary"
                              overlap="circular"
                              badgeContent={<Typography variant="caption">{pageCountLabel}</Typography>}
                              sx={{ '& .MuiBadge-badge': { bgcolor: accentColor, color: 'common.white' } }}
                            >
                              <Avatar sx={{ bgcolor: doc.avatarColor || accentHover, color: 'grey.900', fontWeight: 600 }}>
                                {avatarSeed}
                              </Avatar>
                            </Badge>
                            <Box>
                              <Typography fontWeight="medium" color="text.primary">
                                {doc.title || senderName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                ID {doc.id || '—'}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>{senderName}</TableCell>
                        <TableCell>{doc.receivedAt ? formatDateTime(doc.receivedAt) : '—'}</TableCell>
                        <TableCell>
                          <Tooltip title={status?.description} arrow>
                            <Chip
                              label={status?.label ?? doc.status ?? 'Unknown'}
                              color={status?.color ?? 'default'}
                              variant={doc.status === 'viewed' ? 'filled' : 'outlined'}
                            />
                          </Tooltip>
                        </TableCell>
                        <TableCell>{doc.lastNotifiedAt ? formatDateTime(doc.lastNotifiedAt) : '—'}</TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Tooltip title="Preview document" arrow>
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => doc.id && handlePreviewDocument(doc.id)}
                                  disabled={!doc.id}
                                >
                                  <RemoveRedEyeOutlinedIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="Send notification email" arrow>
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => doc.id && handleNotifyUser(doc.id)}
                                  disabled={!doc.id || doc.status === 'notified' || doc.status === 'viewed'}
                                  sx={{
                                    color:
                                      doc.status === 'notified' || doc.status === 'viewed'
                                        ? 'text.disabled'
                                        : accentColor
                                  }}
                                >
                                  <MailOutlineIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="Mark as viewed" arrow>
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => doc.id && handleMarkViewed(doc.id)}
                                  disabled={!doc.id || doc.status === 'viewed'}
                                  sx={{
                                    color: doc.status === 'viewed' ? 'text.disabled' : 'success.main'
                                  }}
                                >
                                  <CheckCircleOutlineOutlinedIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {!isLoading && filteredDocuments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <Stack spacing={1} alignItems="center" sx={{ py: 6 }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            No documents found
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Switch filters or upload a new scan to populate the queue.
                          </Typography>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled" onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Stack>
  );
};

export default MailboxAdmin;
