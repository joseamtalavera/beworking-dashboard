import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { alpha, useTheme } from '@mui/material/styles';

// Colors are now defined in theme.js - use theme palette: primary.main/dark for green, secondary.main/dark for orange
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Pagination from '@mui/material/Pagination';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import Badge from '@mui/material/Badge';
import InputAdornment from '@mui/material/InputAdornment';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import LinearProgress from '@mui/material/LinearProgress';
import ScannerOutlinedIcon from '@mui/icons-material/ScannerOutlined';
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import RemoveRedEyeOutlinedIcon from '@mui/icons-material/RemoveRedEyeOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import CloseIcon from '@mui/icons-material/Close';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import PersonIcon from '@mui/icons-material/Person';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import InventoryOutlinedIcon from '@mui/icons-material/InventoryOutlined';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';

import {
  getMailboxDocumentDownloadUrl,
  listMailboxDocuments,
  markMailboxDocumentViewed,
  markPackagePickedUp,
  notifyMailboxDocument,
  uploadMailboxDocument,
  verifyPickupByCode
} from '../../../api/mailbox.js';
import { fetchBookingContacts } from '../../../api/bookings.js';

// Using theme.secondary.main for all green colors

const statusConfig = {
  scanned: { label: 'New upload', color: 'primary', description: 'Ready to notify the user.' },
  notified: { label: 'Email sent', color: 'success', description: 'User has been notified.' },
  viewed: { label: 'Viewed online', color: 'success', description: 'User downloaded or viewed the file.' },
  picked_up: { label: 'Picked up', color: 'info', description: 'Package has been collected.' }
};

const SummaryCard = ({ icon, title, value, helper, color, accentHover }) => (
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
          color: color ? 'common.white' : 'secondary.main'
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
  const theme = useTheme();
  const accentColor = theme.palette.secondary.main;
  const accentHover = `${theme.palette.secondary.main}1F`;
  const [documents, setDocuments] = useState([]);
  const [filter, setFilter] = useState('all');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [isLoading, setIsLoading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    contactName: '',
    contactEmail: '',
    documents: [],
    autoNotify: true,
    documentType: 'mail'
  });
  const [uploadProgress, setUploadProgress] = useState({ uploading: false, current: 0, total: 0, results: [] });
  const [actionStates, setActionStates] = useState({});
  const [searchForm, setSearchForm] = useState({
    nameSearch: '',
    emailSearch: ''
  });
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [dateFilters, setDateFilters] = useState({
    startDate: '',
    endDate: ''
  });
  const [mainSearchForm, setMainSearchForm] = useState({
    nameSearch: '',
    emailSearch: ''
  });

  // Pickup verification dialog state
  const [pickupDialogOpen, setPickupDialogOpen] = useState(false);
  const [pickupCode, setPickupCode] = useState('');
  const [pickupVerifying, setPickupVerifying] = useState(false);
  const [pickupResult, setPickupResult] = useState(null);
  const [scannerActive, setScannerActive] = useState(false);
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  const fileInputRef = useRef(null);
  const isMountedRef = useRef(false);
  const searchTimeoutRef = useRef(null);

  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const normalizeDocuments = (payload) => {
    let list;
    if (Array.isArray(payload)) {
      list = payload;
    } else if (Array.isArray(payload?.items)) {
      list = payload.items;
    } else if (Array.isArray(payload?.content)) {
      list = payload.content;
    } else if (Array.isArray(payload?.data)) {
      list = payload.data;
    } else {
      list = payload ? [payload] : [];
    }

    return list.map((doc) => {
      const recipient = doc.recipient || doc.contactEmail || doc.sender || '';
      return {
        ...doc,
        recipient,
        contactEmail: doc.contactEmail || recipient,
        contactName: doc.contactName || recipient
      };
    });
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
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [refreshDocuments]);

  const summary = useMemo(() => {
    const scanned = documents.filter((doc) => doc.status === 'scanned').length;
    const notified = documents.filter((doc) => doc.status === 'notified').length;
    const viewed = documents.filter((doc) => doc.status === 'viewed').length;
    const pendingPackages = documents.filter(
      (doc) => doc.type === 'package' && doc.status !== 'picked_up'
    ).length;
    return { scanned, notified, viewed, pendingPackages };
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    let filtered = documents;

    // Filter by status
    if (filter !== 'all') {
      filtered = filtered.filter((doc) => doc.status === filter);
    }

    // Filter by date range
    if (dateFilters.startDate) {
      const startDate = new Date(dateFilters.startDate);
      filtered = filtered.filter((doc) => {
        const docDate = new Date(doc.receivedAt || doc.createdAt);
        return docDate >= startDate;
      });
    }

    if (dateFilters.endDate) {
      const endDate = new Date(dateFilters.endDate);
      endDate.setHours(23, 59, 59, 999); // End of day
      filtered = filtered.filter((doc) => {
        const docDate = new Date(doc.receivedAt || doc.createdAt);
        return docDate <= endDate;
      });
    }

    // Filter by name search
    if (mainSearchForm.nameSearch.trim()) {
      const searchTerm = mainSearchForm.nameSearch.toLowerCase();
      filtered = filtered.filter((doc) => {
        const contactName = (doc.contactName || doc.recipient || '').toLowerCase();
        const title = (doc.title || '').toLowerCase();
        return contactName.includes(searchTerm) || title.includes(searchTerm);
      });
    }

    // Filter by email search
    if (mainSearchForm.emailSearch.trim()) {
      const searchTerm = mainSearchForm.emailSearch.toLowerCase();
      filtered = filtered.filter((doc) => {
        const contactEmail = (doc.contactEmail || doc.recipient || '').toLowerCase();
        return contactEmail.includes(searchTerm);
      });
    }

    return filtered;
  }, [documents, filter, dateFilters, mainSearchForm]);

  // Pagination logic
  const documentsPerPage = 10;
  const totalPages = Math.ceil(filteredDocuments.length / documentsPerPage);
  const startIndex = (currentPage - 1) * documentsPerPage;
  const endIndex = startIndex + documentsPerPage;
  const paginatedDocuments = filteredDocuments.slice(startIndex, endIndex);

  const handleUploadScan = () => {
    setUploadDialogOpen(true);
  };

  const handlePageChange = (event, page) => {
    setCurrentPage(page);
  };

  const handleDateFilterChange = (field, value) => {
    setDateFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleMainSearchChange = (field, value) => {
    setMainSearchForm(prev => ({
      ...prev,
      [field]: value
    }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setDateFilters({ startDate: '', endDate: '' });
    setMainSearchForm({ nameSearch: '', emailSearch: '' });
    setCurrentPage(1);
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

      // Mark email action as completed FIRST
      setActionStates(prev => ({
        ...prev,
        [docId]: {
          ...prev[docId],
          emailed: true
        }
      }));

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

      // Mark viewed action as completed
      setActionStates(prev => ({
        ...prev,
        [docId]: {
          ...prev[docId],
          viewed: true
        }
      }));

      if (!updatedDocument) {
        await refreshDocuments();
      }

      showSnackbar('Document marked as viewed by the tenant.');
    } catch (error) {
      console.error('Failed to mark mailbox document as viewed', error);
      showSnackbar(error.message || 'Unable to mark document as viewed.', 'error');
    }
  };

  const handleMarkPickedUp = async (docId) => {
    try {
      const updatedDocument = await markPackagePickedUp(docId);
      const fallbackUpdate = { status: 'picked_up', pickedUpAt: new Date().toISOString() };

      setDocuments((prev) =>
        prev.map((doc) => (doc.id === docId ? { ...doc, ...(updatedDocument || fallbackUpdate) } : doc))
      );

      if (!updatedDocument) {
        await refreshDocuments();
      }

      showSnackbar('Package marked as picked up.');
    } catch (error) {
      console.error('Failed to mark package as picked up', error);
      showSnackbar(error.message || 'Unable to mark package as picked up.', 'error');
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return;
    }

    try {
      setDocuments((prev) => prev.filter((doc) => doc.id !== docId));

      setActionStates(prev => {
        const newStates = { ...prev };
        delete newStates[docId];
        return newStates;
      });

      showSnackbar('Document deleted successfully.');
    } catch (error) {
      console.error('Failed to delete document', error);
      showSnackbar(error.message || 'Unable to delete document.', 'error');
    }
  };

  const handlePreviewDocument = (docId) => {
    try {
      const downloadUrl = getMailboxDocumentDownloadUrl(docId);
      if (!downloadUrl) {
        throw new Error('Missing download URL');
      }
      window.open(downloadUrl, '_blank', 'noopener');

      setActionStates(prev => ({
        ...prev,
        [docId]: {
          ...prev[docId],
          previewed: true
        }
      }));
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

  const handleDialogClose = () => {
    if (uploadProgress.uploading) return;
    setUploadDialogOpen(false);
    setUploadForm({
      contactName: '',
      contactEmail: '',
      documents: [],
      autoNotify: true,
      documentType: 'mail'
    });
    setUploadProgress({ uploading: false, current: 0, total: 0, results: [] });
    setSearchForm({
      nameSearch: '',
      emailSearch: ''
    });
    setSearchResults([]);
  };

  const handleFormChange = (field, value) => {
    setUploadForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addFiles = (fileList) => {
    const isPackage = uploadForm.documentType === 'package';
    const newFiles = Array.from(fileList).filter((f) => {
      if (isPackage) {
        return f.type.startsWith('image/');
      }
      return f.type === 'application/pdf' || f.type.startsWith('image/');
    });
    if (newFiles.length === 0) return;
    setUploadForm(prev => ({
      ...prev,
      documents: [...prev.documents, ...newFiles]
    }));
  };

  const handleFileSelect = (event) => {
    addFiles(event.target.files);
    event.target.value = '';
  };

  const handleRemoveFile = (index) => {
    setUploadForm(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    addFiles(event.dataTransfer.files);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleSearchChange = (field, value) => {
    setSearchForm(prev => ({
      ...prev,
      [field]: value
    }));

    debouncedSearch(value);
  };

  const searchContacts = useCallback(async (searchTerm) => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await fetchBookingContacts({ search: searchTerm.trim() });

      const normalizedResults = Array.isArray(results) ? results : [];

      setSearchResults(normalizedResults.map(contact => ({
        id: contact.id,
        name: contact.name || contact.contactName || 'Unknown',
        email: contact.email || contact.emailPrimary || ''
      })));
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);

      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        showSnackbar('Authentication required. Please refresh the page or log in again.', 'error');
      } else {
        showSnackbar(`Search failed: ${error.message}`, 'error');
      }
    } finally {
      setIsSearching(false);
    }
  }, [showSnackbar]);

  const debouncedSearch = useCallback((searchTerm) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchContacts(searchTerm);
    }, 300);
  }, [searchContacts]);

  const handleSelectContact = (contact) => {
    setUploadForm(prev => ({
      ...prev,
      contactName: contact.name,
      contactEmail: contact.email
    }));
    setSearchResults([]);
    setSearchForm({
      nameSearch: '',
      emailSearch: ''
    });
  };

  const handleUploadSubmit = async () => {
    if (!uploadForm.contactName || !uploadForm.contactEmail || uploadForm.documents.length === 0) {
      showSnackbar('Please fill in all fields and select at least one document', 'error');
      return;
    }

    const total = uploadForm.documents.length;
    setUploadProgress({ uploading: true, current: 0, total, results: [] });

    const uploaded = [];
    const failed = [];

    for (let i = 0; i < total; i++) {
      setUploadProgress(prev => ({ ...prev, current: i + 1 }));
      try {
        const metadata = {
          contactEmail: uploadForm.contactEmail,
          autoNotify: uploadForm.autoNotify ? 'true' : 'false',
          documentType: uploadForm.documentType
        };
        const createdDocument = await uploadMailboxDocument(uploadForm.documents[i], metadata);
        const payloadAsList = normalizeDocuments(createdDocument);
        const doc = payloadAsList.length > 0 ? payloadAsList[0] : createdDocument;
        uploaded.push({
          ...doc,
          contactName: uploadForm.contactName,
          contactEmail: uploadForm.contactEmail,
          recipient: uploadForm.contactEmail
        });
      } catch (error) {
        failed.push({ file: uploadForm.documents[i].name, error: error.message });
      }
    }

    if (uploaded.length > 0) {
      setDocuments(prev => [...uploaded, ...prev]);
    }

    const typeLabel = uploadForm.documentType === 'package' ? 'package' : 'document';
    const notifyLabel = uploadForm.autoNotify ? ' and notified' : '';
    if (failed.length === 0) {
      showSnackbar(`${uploaded.length} ${typeLabel}${uploaded.length > 1 ? 's' : ''} uploaded${notifyLabel} successfully`);
    } else {
      showSnackbar(`${uploaded.length} uploaded${notifyLabel}, ${failed.length} failed`, 'warning');
    }

    setUploadProgress({ uploading: false, current: 0, total: 0, results: [] });
    handleDialogClose();
  };

  // Pickup verification handlers
  const handleOpenPickupDialog = () => {
    setPickupDialogOpen(true);
    setPickupCode('');
    setPickupResult(null);
    setScannerActive(false);
  };

  const handleClosePickupDialog = () => {
    stopScanner();
    setPickupDialogOpen(false);
    setPickupCode('');
    setPickupResult(null);
    setScannerActive(false);
  };

  const handleVerifyPickupByCode = async (code) => {
    const codeToVerify = code || pickupCode;
    if (!codeToVerify.trim()) {
      showSnackbar('Please enter a pickup code', 'error');
      return;
    }

    setPickupVerifying(true);
    setPickupResult(null);
    try {
      const updatedDocument = await verifyPickupByCode(codeToVerify.trim());
      setPickupResult({ success: true, document: updatedDocument });

      // Update document in local state
      if (updatedDocument?.id) {
        setDocuments((prev) =>
          prev.map((doc) =>
            doc.id === updatedDocument.id
              ? { ...doc, ...updatedDocument, status: 'picked_up', pickedUpAt: updatedDocument.pickedUpAt || new Date().toISOString() }
              : doc
          )
        );
      }

      showSnackbar('Package verified and marked as picked up!');
    } catch (error) {
      console.error('Pickup verification failed', error);
      setPickupResult({ success: false, error: error.message || 'Verification failed' });
      showSnackbar(error.message || 'Pickup verification failed.', 'error');
    } finally {
      setPickupVerifying(false);
    }
  };

  const startScanner = async () => {
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scannerId = 'pickup-qr-scanner';

      // Wait for DOM element to be available
      await new Promise((resolve) => setTimeout(resolve, 100));

      const el = document.getElementById(scannerId);
      if (!el) return;

      const html5QrCode = new Html5Qrcode(scannerId);
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          // Auto-verify on successful scan
          setPickupCode(decodedText);
          stopScanner();
          handleVerifyPickupByCode(decodedText);
        },
        () => {
          // QR code not detected - ignore
        }
      );
      setScannerActive(true);
    } catch (error) {
      console.error('Failed to start QR scanner', error);
      showSnackbar('Unable to access camera. Please enter the code manually.', 'warning');
      setScannerActive(false);
    }
  };

  const stopScanner = () => {
    if (html5QrCodeRef.current) {
      html5QrCodeRef.current.stop().catch(() => {});
      html5QrCodeRef.current = null;
    }
    setScannerActive(false);
  };

  // Clean up scanner on unmount
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const isPackage = (doc) => doc.type === 'package';

  return (
    <Stack spacing={4}>
      <Stack spacing={2}>
        <Typography variant="h5" fontWeight="bold" color="text.primary">
          Mailbox
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage scanned mail and packages for your virtual office tenants. Upload new scans, notify recipients automatically, and track when files are viewed online.
        </Typography>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
        <SummaryCard
          icon={<ScannerOutlinedIcon />}
          title="New uploads"
          value={summary.scanned}
          helper="Waiting to notify tenants"
          accentHover={accentHover}
        />
        <SummaryCard
          icon={<MarkEmailReadOutlinedIcon />}
          title="Notified"
          value={summary.notified}
          helper="Emails delivered in the last 7 days"
          accentHover={accentHover}
        />
        <SummaryCard
          icon={<TaskAltOutlinedIcon />}
          title="Viewed online"
          value={summary.viewed}
          helper="Tenant confirmed access"
          color="secondary.main"
          accentHover={accentHover}
        />
        <SummaryCard
          icon={<LocalShippingOutlinedIcon />}
          title="Pending packages"
          value={summary.pendingPackages}
          helper="Awaiting pickup"
          accentHover={accentHover}
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
              startIcon={<QrCodeScannerIcon />}
              onClick={handleOpenPickupDialog}
              sx={{
                borderRadius: 2,
                borderColor: '#f97316',
                color: '#f97316',
                '&:hover': {
                  borderColor: '#ea580c',
                  color: '#ea580c',
                  backgroundColor: '#fff7ed'
                }
              }}
            >
              Verify Pickup
            </Button>
            <Button
              variant="outlined"
              startIcon={<UploadFileOutlinedIcon />}
              onClick={handleUploadScan}
              sx={{
                borderRadius: 2,
                borderColor: 'secondary.main',
                color: 'secondary.main',
                '&:hover': {
                  borderColor: 'secondary.main',
                  color: 'secondary.main',
                  backgroundColor: (theme) => `${theme.palette.secondary.main}14`
                }
              }}
            >
              Upload
            </Button>
            <ToggleButtonGroup value={filter} exclusive onChange={handleFilterChange} size="small" color="success">
              <ToggleButton value="all">All</ToggleButton>
              <ToggleButton value="scanned">New Upload</ToggleButton>
              <ToggleButton value="notified">Notified</ToggleButton>
              <ToggleButton value="viewed">Viewed</ToggleButton>
              <ToggleButton value="picked_up">Picked Up</ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </Stack>

        {/* Filters - Always visible like Contacts */}
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'grey.50' }}>
          <Typography variant="h6" gutterBottom>
            Filters
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={dateFilters.startDate}
                onChange={(e) => handleDateFilterChange('startDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={dateFilters.endDate}
                onChange={(e) => handleDateFilterChange('endDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Search by Name"
                value={mainSearchForm.nameSearch}
                onChange={(e) => handleMainSearchChange('nameSearch', e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRoundedIcon sx={{ color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Search by Email"
                value={mainSearchForm.emailSearch}
                onChange={(e) => handleMainSearchChange('emailSearch', e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailOutlinedIcon sx={{ color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={clearFilters}
            >
              Clear Filters
            </Button>
            <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
              Showing {filteredDocuments.length} of {documents.length} documents
            </Typography>
          </Stack>
        </Paper>

        <Divider sx={{ my: 3 }} />

        <TableContainer>
          <Table size="medium">
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.100' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Document</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Contact</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Received</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
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
                  {paginatedDocuments.map((doc, index) => {
                    const status = statusConfig[doc.status] || null;
                    const contactName = doc.contactName || doc.recipient || 'Unknown contact';
                    const avatarSeed = (contactName || doc.title || doc.id || '?').slice(0, 2).toUpperCase();
                    const pageCountLabel = doc.pages ?? '—';
                    const docIsPackage = isPackage(doc);

                    return (
                      <TableRow hover key={doc.id ?? doc.title ?? doc.recipient ?? index}>
                        <TableCell>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Badge
                              color="secondary"
                              overlap="circular"
                              badgeContent={<Typography variant="caption">{pageCountLabel}</Typography>}
                              sx={{ '& .MuiBadge-badge': { bgcolor: 'secondary.main', color: 'secondary.contrastText' } }}
                            >
                              <Avatar sx={{ bgcolor: doc.avatarColor || accentHover, color: 'grey.900', fontWeight: 600 }}>
                                {avatarSeed}
                              </Avatar>
                            </Badge>
                            <Box>
                              <Typography fontWeight="medium" color="text.primary">
                                {doc.title || contactName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                ID {doc.id || '—'}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={docIsPackage ? <InventoryOutlinedIcon sx={{ fontSize: 16 }} /> : <MailOutlineIcon sx={{ fontSize: 16 }} />}
                            label={docIsPackage ? 'Package' : 'Mail'}
                            size="small"
                            variant="outlined"
                            sx={{
                              borderColor: docIsPackage ? '#f97316' : 'secondary.main',
                              color: docIsPackage ? '#f97316' : 'secondary.main',
                              '& .MuiChip-icon': { color: docIsPackage ? '#f97316' : 'secondary.main' }
                            }}
                          />
                          {docIsPackage && doc.pickupCode && (
                            <Chip
                              label={doc.pickupCode}
                              size="small"
                              sx={{ ml: 1, fontWeight: 'bold', bgcolor: '#fff7ed', color: '#f97316', fontSize: '0.7rem' }}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <PersonIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                            <Typography variant="body2">{contactName}</Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>{doc.receivedAt ? formatDateTime(doc.receivedAt) : '—'}</TableCell>
                        <TableCell>
                          <Tooltip title={status?.description} arrow>
                            <Chip
                              label={status?.label ?? doc.status ?? 'Unknown'}
                              color={status?.color ?? 'default'}
                              variant={doc.status === 'viewed' || doc.status === 'picked_up' ? 'filled' : 'outlined'}
                              sx={{
                                minWidth: 120,
                                '& .MuiChip-label': {
                                  width: '100%',
                                  textAlign: 'center'
                                }
                              }}
                            />
                          </Tooltip>
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Tooltip title="Preview document" arrow>
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => doc.id && handlePreviewDocument(doc.id)}
                                  disabled={!doc.id}
                                  sx={{
                                    color: 'secondary.main'
                                  }}
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
                                  disabled={!doc.id || doc.status === 'notified' || doc.status === 'viewed' || doc.status === 'picked_up'}
                                  sx={{
                                    color: 'secondary.main'
                                  }}
                                >
                                  <MailOutlineIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                            {docIsPackage ? (
                              <Tooltip title="Mark as picked up" arrow>
                                <span>
                                  <IconButton
                                    size="small"
                                    onClick={() => doc.id && handleMarkPickedUp(doc.id)}
                                    disabled={!doc.id || doc.status === 'picked_up'}
                                    sx={{
                                      color: '#f97316'
                                    }}
                                  >
                                    <InventoryOutlinedIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            ) : (
                              <Tooltip title="Mark as viewed" arrow>
                                <span>
                                  <IconButton
                                    size="small"
                                    onClick={() => doc.id && handleMarkViewed(doc.id)}
                                    disabled={!doc.id || doc.status === 'viewed'}
                                    sx={{
                                      color: 'secondary.main'
                                    }}
                                  >
                                    <CheckCircleOutlineOutlinedIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            )}
                            <Tooltip title="Delete document" arrow>
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => doc.id && handleDeleteDocument(doc.id)}
                                  disabled={!doc.id}
                                  sx={{
                                    color: 'secondary.main',
                                    '&:hover': {
                                      color: 'secondary.dark',
                                      backgroundColor: (theme) => theme.palette.brand.greenSoft
                                    }
                                  }}
                                >
                                  <DeleteOutlineIcon fontSize="small" />
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

        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={handlePageChange}
              color="success"
              size="large"
              showFirstButton
              showLastButton
            />
          </Box>
        )}

        {/* Pagination Info */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredDocuments.length)} of {filteredDocuments.length} documents
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Page {currentPage} of {totalPages}
          </Typography>
        </Box>
      </Paper>

      {/* Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: '50%',
                bgcolor: (theme) => `${theme.palette.secondary.main}1F`,
                color: 'secondary.main'
              }}
            >
              <UploadFileOutlinedIcon />
            </Box>
            <Typography variant="h6" fontWeight="bold">
              Upload {uploadForm.documentType === 'package' ? 'Package Photo' : 'Document'}
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {/* Document Type Toggle */}
            <Box>
              <Typography variant="body2" fontWeight="medium" color="text.primary" sx={{ mb: 1 }}>
                Type
              </Typography>
              <ToggleButtonGroup
                value={uploadForm.documentType}
                exclusive
                onChange={(_, value) => {
                  if (value !== null) {
                    handleFormChange('documentType', value);
                    // Clear files when switching type
                    handleFormChange('documents', []);
                  }
                }}
                size="small"
                fullWidth
              >
                <ToggleButton value="mail" sx={{ textTransform: 'none' }}>
                  <MailOutlineIcon sx={{ mr: 1, fontSize: 18 }} />
                  Mail
                </ToggleButton>
                <ToggleButton value="package" sx={{ textTransform: 'none' }}>
                  <InventoryOutlinedIcon sx={{ mr: 1, fontSize: 18 }} />
                  Package
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {/* Search Section */}
            <Box>
              <Typography variant="body2" fontWeight="medium" color="text.primary" sx={{ mb: 2 }}>
                Search Existing Contacts
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  placeholder="Search user or contact"
                  value={searchForm.nameSearch}
                  onChange={(e) => handleSearchChange('nameSearch', e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchRoundedIcon sx={{ color: 'text.disabled' }} />
                      </InputAdornment>
                    ),
                    endAdornment: isSearching && (
                      <InputAdornment position="end">
                        <Box
                          sx={{
                            width: 16,
                            height: 16,
                            border: `2px solid ${theme.palette.grey[200]}`,
                            borderTop: `2px solid ${theme.palette.secondary.main}`,
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            '@keyframes spin': {
                              '0%': { transform: 'rotate(0deg)' },
                              '100%': { transform: 'rotate(360deg)' }
                            }
                          }}
                        />
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: 2,
                      backgroundColor: 'background.default',
                      '& fieldset': { borderColor: 'grey.200' },
                      '&:hover fieldset': { borderColor: 'secondary.main' },
                      '&.Mui-focused fieldset': { borderColor: 'secondary.main' }
                    }
                  }}
                  sx={{ flex: 1 }}
                />
                <TextField
                  placeholder="Search by email"
                  value={searchForm.emailSearch}
                  onChange={(e) => handleSearchChange('emailSearch', e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailOutlinedIcon sx={{ color: 'text.disabled' }} />
                      </InputAdornment>
                    ),
                    endAdornment: isSearching && (
                      <InputAdornment position="end">
                        <Box
                          sx={{
                            width: 16,
                            height: 16,
                            border: `2px solid ${theme.palette.grey[200]}`,
                            borderTop: `2px solid ${theme.palette.secondary.main}`,
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            '@keyframes spin': {
                              '0%': { transform: 'rotate(0deg)' },
                              '100%': { transform: 'rotate(360deg)' }
                            }
                          }}
                        />
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: 2,
                      backgroundColor: 'background.default',
                      '& fieldset': { borderColor: 'grey.200' },
                      '&:hover fieldset': { borderColor: 'secondary.main' },
                      '&.Mui-focused fieldset': { borderColor: 'secondary.main' }
                    }
                  }}
                  sx={{ flex: 1 }}
                />
              </Stack>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Search Results:
                  </Typography>
                  <Stack spacing={1}>
                    {searchResults.map((contact) => (
                      <Paper
                        key={contact.id}
                        elevation={0}
                        sx={{
                          p: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 2,
                          cursor: 'pointer',
                          '&:hover': {
                            borderColor: 'secondary.main',
                            backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.04)
                          }
                        }}
                        onClick={() => handleSelectContact(contact)}
                      >
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main', color: 'secondary.contrastText', fontSize: '0.875rem', border: (theme) => `3px solid ${theme.palette.primary.light}80` }}>
                            {contact.name.split(' ').map(n => n[0]).join('')}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {contact.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {contact.email}
                            </Typography>
                          </Box>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                </Box>
              )}
            </Box>

            <Divider />

            {/* Manual Entry Section */}
            <Box>
              <Typography variant="body2" fontWeight="medium" color="text.primary" sx={{ mb: 2 }}>
                Or Enter Contact Details Manually
              </Typography>
              <Stack spacing={2}>
                <TextField
                  label="Contact Name"
                  value={uploadForm.contactName}
                  onChange={(e) => handleFormChange('contactName', e.target.value)}
                  fullWidth
                  required
                  placeholder="Enter contact name"
                />
                <TextField
                  label="Contact Email"
                  type="email"
                  value={uploadForm.contactEmail}
                  onChange={(e) => handleFormChange('contactEmail', e.target.value)}
                  fullWidth
                  required
                  placeholder="Enter contact email"
                />
              </Stack>
            </Box>

            <Divider />

            {/* Drag-and-Drop Document Selection */}
            <Box>
              <Typography variant="body2" fontWeight="medium" color="text.primary" sx={{ mb: 2 }}>
                {uploadForm.documentType === 'package' ? 'Photo of Package' : 'Select Documents'}
              </Typography>
              <Box
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                sx={{
                  border: '2px dashed',
                  borderColor: 'grey.300',
                  borderRadius: 3,
                  p: 4,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s, background-color 0.2s',
                  '&:hover': {
                    borderColor: uploadForm.documentType === 'package' ? '#f97316' : 'secondary.main',
                    bgcolor: uploadForm.documentType === 'package' ? '#fff7ed' : (theme) => `${theme.palette.secondary.main}08`
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  hidden
                  multiple
                  accept={uploadForm.documentType === 'package' ? 'image/*' : 'application/pdf,image/*'}
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                />
                <CloudUploadOutlinedIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
                <Typography variant="body1" fontWeight="medium" color="text.secondary">
                  Drag & drop files here
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  {uploadForm.documentType === 'package'
                    ? 'or click to browse — images only'
                    : 'or click to browse — PDF and images accepted'
                  }
                </Typography>
              </Box>

              {/* File list */}
              {uploadForm.documents.length > 0 && (
                <Stack spacing={1} sx={{ mt: 2 }}>
                  {uploadForm.documents.map((file, index) => (
                    <Paper
                      key={`${file.name}-${index}`}
                      variant="outlined"
                      sx={{ px: 2, py: 1, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                    >
                      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
                        <InsertDriveFileOutlinedIcon sx={{ color: 'secondary.main', fontSize: 20 }} />
                        <Typography variant="body2" noWrap sx={{ flex: 1 }}>
                          {file.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </Typography>
                      </Stack>
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleRemoveFile(index); }}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Paper>
                  ))}
                  <Typography variant="caption" color="text.secondary">
                    {uploadForm.documents.length} file{uploadForm.documents.length > 1 ? 's' : ''} selected
                  </Typography>
                </Stack>
              )}
            </Box>

            {/* Auto-notify toggle */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={uploadForm.autoNotify}
                  onChange={(e) => handleFormChange('autoNotify', e.target.checked)}
                  sx={{ color: 'secondary.main', '&.Mui-checked': { color: 'secondary.main' } }}
                />
              }
              label={
                <Stack>
                  <Typography variant="body2" fontWeight="medium">
                    Auto-notify recipient
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {uploadForm.documentType === 'package'
                      ? 'Send notification email with pickup code immediately after upload'
                      : 'Send notification email immediately after upload'
                    }
                  </Typography>
                </Stack>
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          {uploadProgress.uploading && (
            <Box sx={{ flex: 1, mr: 2 }}>
              <LinearProgress
                variant="determinate"
                value={(uploadProgress.current / uploadProgress.total) * 100}
                sx={{ borderRadius: 2, height: 6, '& .MuiLinearProgress-bar': { bgcolor: 'secondary.main' } }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                Uploading {uploadProgress.current} of {uploadProgress.total}...
              </Typography>
            </Box>
          )}
          <Button onClick={handleDialogClose} disabled={uploadProgress.uploading} sx={{ color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button
            onClick={handleUploadSubmit}
            variant="contained"
            disabled={uploadProgress.uploading || uploadForm.documents.length === 0}
            sx={{
              bgcolor: uploadForm.documentType === 'package' ? '#f97316' : 'secondary.main',
              '&:hover': { bgcolor: uploadForm.documentType === 'package' ? '#ea580c' : 'secondary.dark' },
              borderRadius: 2
            }}
          >
            {uploadProgress.uploading
              ? 'Uploading...'
              : `Upload ${uploadForm.documents.length || ''} ${uploadForm.documentType === 'package' ? 'photo' : 'document'}${uploadForm.documents.length > 1 ? 's' : ''}`
            }
          </Button>
        </DialogActions>
      </Dialog>

      {/* Pickup Verification Dialog */}
      <Dialog
        open={pickupDialogOpen}
        onClose={handleClosePickupDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: '50%',
                bgcolor: '#fff7ed',
                color: '#f97316'
              }}
            >
              <QrCodeScannerIcon />
            </Box>
            <Typography variant="h6" fontWeight="bold">
              Verify Package Pickup
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {/* QR Scanner */}
            <Box>
              <Typography variant="body2" fontWeight="medium" color="text.primary" sx={{ mb: 1 }}>
                Scan QR Code
              </Typography>
              <Box
                sx={{
                  width: '100%',
                  minHeight: scannerActive ? 300 : 120,
                  border: '2px dashed',
                  borderColor: scannerActive ? '#f97316' : 'grey.300',
                  borderRadius: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  position: 'relative'
                }}
              >
                <div id="pickup-qr-scanner" style={{ width: '100%' }} ref={scannerRef} />
                {!scannerActive && (
                  <Button
                    variant="outlined"
                    startIcon={<QrCodeScannerIcon />}
                    onClick={startScanner}
                    sx={{
                      position: 'absolute',
                      borderColor: '#f97316',
                      color: '#f97316',
                      '&:hover': { borderColor: '#ea580c', bgcolor: '#fff7ed' }
                    }}
                  >
                    Start Camera
                  </Button>
                )}
              </Box>
              {scannerActive && (
                <Button
                  size="small"
                  onClick={stopScanner}
                  sx={{ mt: 1, color: 'text.secondary' }}
                >
                  Stop Camera
                </Button>
              )}
            </Box>

            <Divider>
              <Typography variant="caption" color="text.secondary">
                OR
              </Typography>
            </Divider>

            {/* Manual Code Entry */}
            <Box>
              <Typography variant="body2" fontWeight="medium" color="text.primary" sx={{ mb: 1 }}>
                Enter Pickup Code Manually
              </Typography>
              <Stack direction="row" spacing={2}>
                <TextField
                  placeholder="BW-XXXXXX"
                  value={pickupCode}
                  onChange={(e) => setPickupCode(e.target.value.toUpperCase())}
                  fullWidth
                  InputProps={{
                    sx: {
                      fontWeight: 'bold',
                      letterSpacing: 2,
                      fontSize: '1.1rem'
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleVerifyPickupByCode();
                  }}
                />
                <Button
                  variant="contained"
                  onClick={() => handleVerifyPickupByCode()}
                  disabled={pickupVerifying || !pickupCode.trim()}
                  sx={{
                    bgcolor: '#f97316',
                    '&:hover': { bgcolor: '#ea580c' },
                    minWidth: 100,
                    borderRadius: 2
                  }}
                >
                  {pickupVerifying ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Verify'}
                </Button>
              </Stack>
            </Box>

            {/* Result */}
            {pickupResult && (
              <Alert severity={pickupResult.success ? 'success' : 'error'} sx={{ borderRadius: 2 }}>
                {pickupResult.success
                  ? `Package "${pickupResult.document?.title || 'Package'}" verified and marked as picked up!`
                  : pickupResult.error
                }
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleClosePickupDialog} sx={{ color: 'text.secondary' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

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
