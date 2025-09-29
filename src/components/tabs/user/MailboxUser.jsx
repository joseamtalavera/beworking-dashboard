import { useEffect, useMemo, useState } from 'react';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
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
import CircularProgress from '@mui/material/CircularProgress';
import RemoveRedEyeOutlinedIcon from '@mui/icons-material/RemoveRedEyeOutlined';

import { getMailboxDocumentDownloadUrl, listMailboxDocuments } from '../../../api/mailbox.js';

const accentColor = '#fb923c';
const accentHover = 'rgba(251, 146, 60, 0.12)';

const statusConfig = {
  scanned: { label: 'Awaiting review', color: 'warning', description: 'New document available.' },
  notified: { label: 'Notified', color: 'primary', description: 'Notification email sent.' },
  viewed: { label: 'Viewed', color: 'success', description: 'You already opened this document.' }
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

const normalizeDocuments = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.data)) return payload.data;
  return payload ? [payload] : [];
};

const MailboxUser = () => {
  const [documents, setDocuments] = useState([]);
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const fetchDocuments = async () => {
      setIsLoading(true);
      try {
        const response = await listMailboxDocuments();
        if (!active) return;
        setDocuments(normalizeDocuments(response));
        setError('');
      } catch (err) {
        if (!active) return;
        console.error('Failed to load mailbox documents', err);
        setError(err.message || 'Unable to load your documents right now.');
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    fetchDocuments();
    return () => {
      active = false;
    };
  }, []);

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

  const handleFilterChange = (_, value) => {
    if (value !== null) {
      setFilter(value);
    }
  };

  const handlePreviewDocument = (docId) => {
    const downloadUrl = getMailboxDocumentDownloadUrl(docId);
    if (!downloadUrl) return;
    window.open(downloadUrl, '_blank', 'noopener');
  };

  return (
    <Stack spacing={4}>
      <Stack spacing={2}>
        <Typography variant="h5" fontWeight="bold" color="text.primary">
          Your Mailbox
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View the mail that has been processed for you. Open any document directly from the table below.
        </Typography>
        {error && <Alert severity="error">{error}</Alert>}
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
        <SummaryCard
          icon={<RemoveRedEyeOutlinedIcon />}
          title="New"
          value={summary.scanned}
          helper="Waiting for your review"
        />
        <SummaryCard
          icon={<RemoveRedEyeOutlinedIcon />}
          title="Notified"
          value={summary.notified}
          helper="Emails we sent to you"
        />
        <SummaryCard
          icon={<RemoveRedEyeOutlinedIcon />}
          title="Viewed"
          value={summary.viewed}
          helper="Documents you already opened"
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
              Filter by status and open any file to review it online.
            </Typography>
          </Box>
          <ToggleButtonGroup value={filter} exclusive onChange={handleFilterChange} size="small" color="primary">
            <ToggleButton value="all">All</ToggleButton>
            <ToggleButton value="scanned">New</ToggleButton>
            <ToggleButton value="notified">Notified</ToggleButton>
            <ToggleButton value="viewed">Viewed</ToggleButton>
          </ToggleButtonGroup>
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
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Stack spacing={1} alignItems="center" sx={{ py: 6 }}>
                      <CircularProgress size={28} thickness={4} />
                      <Typography variant="body2" color="text.secondary">
                        Loading your documents...
                      </Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              )}
              {!isLoading &&
                filteredDocuments.map((doc, index) => {
                  const status = statusConfig[doc.status] || null;
                  const senderName = doc.sender || 'Front desk';
                  const avatarSeed = (doc.sender || doc.title || doc.id || '?').slice(0, 2).toUpperCase();
                  const pageCountLabel = doc.pages ?? '—';

                  return (
                    <TableRow hover key={doc.id ?? doc.title ?? index}>
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
                        <Tooltip title="Open document" arrow>
                          <span>
                            <IconButton size="small" onClick={() => doc.id && handlePreviewDocument(doc.id)} disabled={!doc.id}>
                              <RemoveRedEyeOutlinedIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              {!isLoading && filteredDocuments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Stack spacing={1} alignItems="center" sx={{ py: 6 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        No documents yet
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        You will receive a notification when new mail is processed for you.
                      </Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Stack>
  );
};

export default MailboxUser;
