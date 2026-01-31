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
import ScannerOutlinedIcon from '@mui/icons-material/ScannerOutlined';
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import RemoveRedEyeOutlinedIcon from '@mui/icons-material/RemoveRedEyeOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import PersonIcon from '@mui/icons-material/Person';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

import {
  getMailboxDocumentDownloadUrl,
  listMailboxDocuments,
  markMailboxDocumentViewed,
  notifyMailboxDocument,
  uploadMailboxDocument
} from '../../../api/mailbox.js';
import { fetchBookingContacts } from '../../../api/bookings.js';

// Using theme.secondary.main for all green colors

const statusConfig = {
  scanned: { label: 'New upload', color: 'warning', description: 'Ready to notify the user.' },
  notified: { label: 'Email sent', color: 'success', description: 'User has been notified.' },
  viewed: { label: 'Viewed online', color: 'success', description: 'User downloaded or viewed the file.' }
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
    document: null
  });
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
    return { scanned, notified, viewed };
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

      // Mark email action as completed FIRST
      setActionStates(prev => {
        const newStates = {
          ...prev,
          [docId]: {
            ...prev[docId],
            emailed: true
          }
        };
        console.log('DEBUG: Setting action states for docId:', docId, 'newStates:', newStates);
        return newStates;
      });

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

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return;
    }

    try {
      // In a real app, you would call a delete API endpoint here
      // For now, we'll just remove it from the local state
      setDocuments((prev) => prev.filter((doc) => doc.id !== docId));
      
      // Remove action states for this document
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
      
      // Mark preview action as completed
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
    setUploadDialogOpen(false);
    setUploadForm({
      contactName: '',
      contactEmail: '',
      document: null
    });
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

  const handleFileSelect = (event) => {
    const [file] = event.target.files || [];
    if (file) {
      setUploadForm(prev => ({
        ...prev,
        document: file
      }));
    }
  };

  const handleSearchChange = (field, value) => {
    console.log('DEBUG: handleSearchChange called with field:', field, 'value:', value);
    setSearchForm(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Trigger debounced search for both name and email fields
    debouncedSearch(value);
  };

  const searchContacts = useCallback(async (searchTerm) => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      console.log('DEBUG: Searching contacts with term:', searchTerm);
      console.log('DEBUG: Current token:', localStorage.getItem('beworking_token'));
      console.log('DEBUG: API base URL:', import.meta.env.VITE_API_BASE_URL);
      
      const results = await fetchBookingContacts({ search: searchTerm.trim() });
      console.log('DEBUG: Search results received:', results);
      console.log('DEBUG: Search results type:', typeof results);
      console.log('DEBUG: Search results length:', Array.isArray(results) ? results.length : 'not an array');
      
      const normalizedResults = Array.isArray(results) ? results : [];
      
      setSearchResults(normalizedResults.map(contact => ({
        id: contact.id,
        name: contact.name || contact.contactName || 'Unknown',
        email: contact.email || contact.emailPrimary || ''
      })));
    } catch (error) {
      console.error('Search error:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        response: error.response
      });
      setSearchResults([]);
      
      // Check if it's an authentication error
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
    console.log('DEBUG: debouncedSearch called with term:', searchTerm);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      console.log('DEBUG: Executing debounced search for:', searchTerm);
      searchContacts(searchTerm);
    }, 300); // 300ms debounce
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
    if (!uploadForm.contactName || !uploadForm.contactEmail || !uploadForm.document) {
      showSnackbar('Please fill in all fields and select a document', 'error');
      return;
    }

    try {
      const metadata = {
        contactEmail: uploadForm.contactEmail
      };
      const createdDocument = await uploadMailboxDocument(uploadForm.document, metadata);
      const payloadAsList = normalizeDocuments(createdDocument);

      if (payloadAsList.length > 0) {
        // Add contact information to the document
        const documentWithContact = {
          ...payloadAsList[0],
          contactName: uploadForm.contactName,
          contactEmail: uploadForm.contactEmail,
          recipient: uploadForm.contactEmail,
          sender: uploadForm.contactName
        };
        setDocuments([documentWithContact, ...documents]);
      } else if (createdDocument && typeof createdDocument === 'object') {
        const documentWithContact = {
          ...createdDocument,
          contactName: uploadForm.contactName,
          contactEmail: uploadForm.contactEmail,
          recipient: uploadForm.contactEmail,
          sender: uploadForm.contactName
        };
        setDocuments((prev) => [documentWithContact, ...prev]);
      } else {
        await refreshDocuments();
      }
      
      showSnackbar('Document uploaded successfully');
      handleDialogClose();
    } catch (error) {
      console.error('Failed to upload mailbox document', error);
      showSnackbar(error.message || 'Failed to upload document.', 'error');
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
          Mailbox
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage scanned mail for your virtual office tenants. Upload new scans, notify recipients automatically, and track when files are viewed online.
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
                <TableCell sx={{ fontWeight: 'bold' }}>Contact</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Received</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && documents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
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
                    const docActionStates = actionStates[doc.id] || {};
                    if (doc.id === '084511a2-b373-4604-9185-7f2cdf453b76') {
                      console.log('DEBUG: Document action states for', doc.id, ':', docActionStates);
                    }

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
                              variant={doc.status === 'viewed' ? 'filled' : 'outlined'}
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
                                  disabled={!doc.id || doc.status === 'notified' || doc.status === 'viewed'}
                                  sx={{
                                    color: 'secondary.main'
                                  }}
                                  title={`Email state: ${docActionStates.emailed || doc.status === 'notified' ? 'sent' : 'not sent'}`}
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
                                    color: 'secondary.main'
                                  }}
                                >
                                  <CheckCircleOutlineOutlinedIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
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
                                      backgroundColor: (theme) => theme.palette.brand.orangeSoft
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
                      <TableCell colSpan={5}>
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
              Upload Document
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
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

            {/* Document Selection */}
            <Box>
              <Typography variant="body2" fontWeight="medium" color="text.primary" sx={{ mb: 2 }}>
                Select Document
              </Typography>
              <Button
                variant="outlined"
                component="label"
                startIcon={<UploadFileOutlinedIcon />}
                sx={{
                  borderColor: 'secondary.main',
                  color: 'secondary.main',
                  '&:hover': {
                    borderColor: 'secondary.main',
                    color: 'secondary.main',
                    backgroundColor: (theme) => `${theme.palette.secondary.main}14`
                  }
                }}
              >
                {uploadForm.document ? uploadForm.document.name : 'Choose File'}
                <input
                  type="file"
                  hidden
                  accept="application/pdf,image/*"
                  onChange={handleFileSelect}
                />
              </Button>
              {uploadForm.document && (
                <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                  {uploadForm.document.name} ({(uploadForm.document.size / 1024 / 1024).toFixed(2)} MB)
                </Typography>
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleDialogClose} sx={{ color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button
            onClick={handleUploadSubmit}
            variant="contained"
            sx={{
              bgcolor: 'secondary.main',
              '&:hover': { bgcolor: 'secondary.main' },
              borderRadius: 2
            }}
          >
            Upload Document
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
