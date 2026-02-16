import { useEffect, useMemo, useState } from 'react';
import { useTheme } from '@mui/material/styles';
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
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import InventoryOutlinedIcon from '@mui/icons-material/InventoryOutlined';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';

import { QRCodeSVG } from 'qrcode.react';

import { useTranslation } from 'react-i18next';
import i18n from '../../../i18n/i18n.js';
import esMailbox from '../../../i18n/locales/es/mailbox.json';
import enMailbox from '../../../i18n/locales/en/mailbox.json';

if (!i18n.hasResourceBundle('es', 'mailbox')) {
  i18n.addResourceBundle('es', 'mailbox', esMailbox);
  i18n.addResourceBundle('en', 'mailbox', enMailbox);
}

import { getMailboxDocumentDownloadUrl, listMailboxDocuments } from '../../../api/mailbox.js';

// accentColor and accentHover are defined inside component using theme.palette.brand

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
          bgcolor: color || 'brand.accentSoft',
          color: color ? 'common.white' : 'brand.green'
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
      contactEmail: doc.contactEmail || recipient
    };
  });
};

const MailboxUser = ({ userProfile }) => {
  const { t } = useTranslation('mailbox');
  const theme = useTheme();
  const accentColor = theme.palette.brand.green;

  const statusConfig = {
    scanned: { label: t('statusUser.scanned'), color: 'primary', description: t('statusUser.scannedDesc') },
    notified: { label: t('statusUser.notified'), color: 'primary', description: t('statusUser.notifiedDesc') },
    viewed: { label: t('statusUser.viewed'), color: 'success', description: t('statusUser.viewedDesc') },
    picked_up: { label: t('statusUser.picked_up'), color: 'info', description: t('statusUser.pickedUpDesc') }
  };
  const accentHover = theme.palette.brand.accentSoft;
  const [documents, setDocuments] = useState([]);
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // QR dialog state
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrDialogDoc, setQrDialogDoc] = useState(null);

  const profileEmail = userProfile?.email;

  useEffect(() => {
    let active = true;

    const fetchDocuments = async () => {
      setIsLoading(true);
      try {
        const response = await listMailboxDocuments({ contactEmail: profileEmail });
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
  }, [profileEmail]);

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

  const handleShowQr = (doc) => {
    setQrDialogDoc(doc);
    setQrDialogOpen(true);
  };

  const handleCloseQrDialog = () => {
    setQrDialogOpen(false);
    setQrDialogDoc(null);
  };

  const isPackage = (doc) => doc.type === 'package';

  return (
    <Stack spacing={4}>
      <Stack spacing={2}>
        <Typography variant="h5" fontWeight="bold" color="text.primary">
          {t('user.title')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('user.subtitle')}
        </Typography>
        {error && <Alert severity="error">{error}</Alert>}
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
        <SummaryCard
          icon={<RemoveRedEyeOutlinedIcon />}
          title={t('user.summary.new')}
          value={summary.scanned}
          helper={t('user.summary.waitingReview')}
        />
        <SummaryCard
          icon={<RemoveRedEyeOutlinedIcon />}
          title={t('user.summary.notified')}
          value={summary.notified}
          helper={t('user.summary.emailsSent')}
        />
        <SummaryCard
          icon={<RemoveRedEyeOutlinedIcon />}
          title={t('user.summary.viewed')}
          value={summary.viewed}
          helper={t('user.summary.alreadyOpened')}
          color={accentColor}
        />
        <SummaryCard
          icon={<LocalShippingOutlinedIcon />}
          title={t('user.summary.pendingPackages')}
          value={summary.pendingPackages}
          helper={t('user.summary.awaitingPickup')}
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
              {t('user.incomingDocuments')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('user.incomingSubtitle')}
            </Typography>
          </Box>
          <ToggleButtonGroup value={filter} exclusive onChange={handleFilterChange} size="small" color="primary">
            <ToggleButton value="all">{t('filter.all')}</ToggleButton>
            <ToggleButton value="scanned">{t('filter.new')}</ToggleButton>
            <ToggleButton value="notified">{t('filter.notified')}</ToggleButton>
            <ToggleButton value="viewed">{t('filter.viewed')}</ToggleButton>
            <ToggleButton value="picked_up">{t('filter.pickedUp')}</ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        <Divider sx={{ my: 3 }} />

        <TableContainer>
          <Table size="medium">
            <TableHead>
              <TableRow>
                <TableCell>{t('user.table.document')}</TableCell>
                <TableCell>{t('user.table.type')}</TableCell>
                <TableCell>{t('user.table.recipient')}</TableCell>
                <TableCell>{t('user.table.received')}</TableCell>
                <TableCell>{t('user.table.status')}</TableCell>
                <TableCell>{t('user.table.lastNotified')}</TableCell>
                <TableCell align="right">{t('user.table.action')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Stack spacing={1} alignItems="center" sx={{ py: 6 }}>
                      <CircularProgress size={28} thickness={4} />
                      <Typography variant="body2" color="text.secondary">
                        {t('user.loadingDocuments')}
                      </Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              )}
              {!isLoading &&
                filteredDocuments.map((doc, index) => {
                  const status = statusConfig[doc.status] || null;
                  const recipient = doc.recipient || doc.contactEmail || doc.sender || 'Front desk';
                  const avatarSeed = (recipient || doc.title || doc.id || '?').slice(0, 2).toUpperCase();
                  const pageCountLabel = doc.pages ?? '—';
                  const docIsPackage = isPackage(doc);
                  const showQrButton = docIsPackage && doc.pickupCode && doc.status !== 'picked_up';

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
                              {doc.title || recipient}
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
                          label={docIsPackage ? t('docType.package') : t('docType.mail')}
                          size="small"
                          variant="outlined"
                          sx={{
                            borderColor: docIsPackage ? '#f97316' : accentColor,
                            color: docIsPackage ? '#f97316' : accentColor,
                            '& .MuiChip-icon': { color: docIsPackage ? '#f97316' : accentColor }
                          }}
                        />
                      </TableCell>
                      <TableCell>{recipient}</TableCell>
                      <TableCell>{doc.receivedAt ? formatDateTime(doc.receivedAt) : '—'}</TableCell>
                      <TableCell>
                        <Tooltip title={status?.description} arrow>
                          <Chip
                            label={status?.label ?? doc.status ?? 'Unknown'}
                            color={status?.color ?? 'default'}
                            variant={doc.status === 'viewed' || doc.status === 'picked_up' ? 'filled' : 'outlined'}
                          />
                        </Tooltip>
                      </TableCell>
                      <TableCell>{doc.lastNotifiedAt ? formatDateTime(doc.lastNotifiedAt) : '—'}</TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          {showQrButton && (
                            <Tooltip title={t('user.tooltips.showQr')} arrow>
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => handleShowQr(doc)}
                                  sx={{ color: '#f97316' }}
                                >
                                  <QrCode2Icon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          )}
                          <Tooltip title={t('user.tooltips.openDocument')} arrow>
                            <span>
                              <IconButton size="small" onClick={() => doc.id && handlePreviewDocument(doc.id)} disabled={!doc.id}>
                                <RemoveRedEyeOutlinedIcon fontSize="small" />
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
                  <TableCell colSpan={7}>
                    <Stack spacing={1} alignItems="center" sx={{ py: 6 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {t('user.noDocuments')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t('user.noDocumentsHint')}
                      </Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* QR Code Dialog */}
      <Dialog
        open={qrDialogOpen}
        onClose={handleCloseQrDialog}
        maxWidth="xs"
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
              <QrCode2Icon />
            </Box>
            <Typography variant="h6" fontWeight="bold">
              {t('user.qrDialog.title')}
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} alignItems="center" sx={{ py: 2 }}>
            {qrDialogDoc?.pickupCode && (
              <>
                <QRCodeSVG
                  value={qrDialogDoc.pickupCode}
                  size={200}
                  level="M"
                  includeMargin
                />
                <Typography
                  variant="h4"
                  fontWeight="bold"
                  sx={{ color: '#f97316', letterSpacing: 4 }}
                >
                  {qrDialogDoc.pickupCode}
                </Typography>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  {t('user.qrDialog.instructions')}
                </Typography>
                {qrDialogDoc.title && (
                  <Chip
                    label={qrDialogDoc.title}
                    variant="outlined"
                    sx={{ borderColor: '#f97316', color: '#f97316' }}
                  />
                )}
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleCloseQrDialog} sx={{ color: 'text.secondary' }}>
            {t('user.qrDialog.close')}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};

export default MailboxUser;
