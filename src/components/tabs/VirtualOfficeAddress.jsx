import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BusinessIcon from '@mui/icons-material/Business';
import DirectionsIcon from '@mui/icons-material/Directions';
import EmailIcon from '@mui/icons-material/Email';
import LanguageIcon from '@mui/icons-material/Language';
import LocalParkingIcon from '@mui/icons-material/LocalParking';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import PublicIcon from '@mui/icons-material/Public';
import WifiIcon from '@mui/icons-material/Wifi';

// Mock office data - in a real app, this would come from an API
const initialOfficeData = {
  name: 'BeWorking Virtual Office',
  address: {
    street: 'Calle Gran Vía, 123',
    city: 'Madrid',
    postalCode: '28013',
    country: 'Spain'
  },
  coordinates: {
    lat: 40.4168,
    lng: -3.7038
  },
  contact: {
    phone: '+34 91 123 45 67',
    email: 'madrid@be-working.com',
    website: 'https://be-working.com'
  },
  hours: {
    weekdays: '9:00 AM - 6:00 PM',
    saturday: '10:00 AM - 2:00 PM',
    sunday: 'Closed'
  },
  amenities: [
    'High-speed WiFi',
    'Parking available',
    'Public transport access',
    'Meeting rooms',
    'Reception services',
    'Mail handling',
    'Business address'
  ],
  nearbyTransport: [
    { type: 'Metro', name: 'Gran Vía', distance: '2 min walk' },
    { type: 'Bus', name: 'Stop 123', distance: '1 min walk' },
    { type: 'Train', name: 'Sol Station', distance: '5 min walk' }
  ]
};

const InfoCard = ({ icon, title, content, action }) => {
  const theme = useTheme();
  return (
    <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={2}>
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
              {icon}
            </Box>
          <Typography variant="h6" fontWeight="bold" color="text.primary">
            {title}
          </Typography>
        </Stack>
        <Box sx={{ pl: 6 }}>
          {content}
        </Box>
        {action && (
          <Box sx={{ pl: 6 }}>
            {action}
          </Box>
        )}
      </Stack>
    </CardContent>
  </Card>
  );
};

const AmenityChip = ({ amenity }) => (
  <Chip
    label={amenity}
    variant="outlined"
    size="small"
    sx={{
      borderColor: 'secondary.main',
      color: 'secondary.main',
      '&:hover': {
        backgroundColor: (theme) => `${theme.palette.secondary.main}1F`
      }
    }}
  />
);

const TransportItem = ({ transport }) => (
  <Stack direction="row" spacing={2} alignItems="center" sx={{ py: 1 }}>
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 32,
        height: 32,
        borderRadius: '50%',
        bgcolor: 'secondary.main',
        color: 'secondary.contrastText',
        fontSize: '0.75rem',
        fontWeight: 'bold'
      }}
    >
      {transport.type === 'Metro' ? 'M' : transport.type === 'Bus' ? 'B' : 'T'}
    </Box>
    <Box>
      <Typography variant="body2" fontWeight="medium">
        {transport.name}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {transport.distance}
      </Typography>
    </Box>
  </Stack>
);

const VirtualOfficeAddress = () => {
  const theme = useTheme();
  const accentColor = theme.palette.primary.main;
  const accentHover = theme.palette.brand.accentSoft;
  const [officeData, setOfficeData] = useState(initialOfficeData);
  const [editOpen, setEditOpen] = useState(false);
  const [addTransportOpen, setAddTransportOpen] = useState(false);
  const [editForm, setEditForm] = useState(initialOfficeData);
  const [transportForm, setTransportForm] = useState({ name: '', distance: '' });
  const mapQuery = encodeURIComponent(
    `${officeData.address.street}, ${officeData.address.postalCode} ${officeData.address.city}, ${officeData.address.country}`
  );
  const mapSrc = `https://www.google.com/maps?q=${mapQuery}&output=embed`;

  const openEditDialog = () => {
    setEditForm(officeData);
    setEditOpen(true);
  };

  const handleEditChange = (field) => (event) => {
    const { value } = event.target;
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddressChange = (field) => (event) => {
    const { value } = event.target;
    setEditForm((prev) => ({
      ...prev,
      address: { ...prev.address, [field]: value }
    }));
  };

  const handleContactChange = (field) => (event) => {
    const { value } = event.target;
    setEditForm((prev) => ({
      ...prev,
      contact: { ...prev.contact, [field]: value }
    }));
  };

  const handleHoursChange = (field) => (event) => {
    const { value } = event.target;
    setEditForm((prev) => ({
      ...prev,
      hours: { ...prev.hours, [field]: value }
    }));
  };

  const handleSaveEdit = () => {
    setOfficeData(editForm);
    setEditOpen(false);
  };

  const handleAddTransport = () => {
    if (!transportForm.name.trim() || !transportForm.distance.trim()) return;
    setOfficeData((prev) => ({
      ...prev,
      nearbyTransport: [
        ...(prev.nearbyTransport ?? []),
        { name: transportForm.name.trim(), distance: transportForm.distance.trim() }
      ]
    }));
    setTransportForm({ name: '', distance: '' });
    setAddTransportOpen(false);
  };
  const handleGetDirections = () => {
    const { lat, lng } = officeData.coordinates;
    const address = `${officeData.address.street}, ${officeData.address.city}`;
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
    window.open(googleMapsUrl, '_blank', 'noopener');
  };

  const handleCallOffice = () => {
    window.open(`tel:${officeData.contact.phone}`, '_self');
  };

  const handleEmailOffice = () => {
    window.open(`mailto:${officeData.contact.email}`, '_self');
  };

  const handleVisitWebsite = () => {
    window.open(officeData.contact.website, '_blank', 'noopener');
  };

  return (
    <Stack spacing={4}>
      {/* Header */}
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between">
          <Typography variant="h5" fontWeight="bold" color="text.primary">
            Office Address & Information
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={() => setAddTransportOpen(true)} sx={{ borderRadius: 2 }}>
              Add transport
            </Button>
            <Button variant="contained" onClick={openEditDialog} sx={{ borderRadius: 2 }}>
              Edit details
            </Button>
          </Stack>
        </Stack>
        <Typography variant="body1" color="text.secondary">
          Your virtual office location with complete address details, amenities, and how to get there.
        </Typography>
      </Stack>

      {/* Main Address Card */}
      <Paper elevation={0} sx={{ borderRadius: 3, p: 4, border: '1px solid', borderColor: 'divider' }}>
        <Stack spacing={3}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 48,
                height: 48,
                borderRadius: '50%',
                bgcolor: accentColor,
                color: 'white'
              }}
            >
              <LocationOnIcon />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight="bold" color="text.primary">
                {officeData.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Your registered business address
              </Typography>
            </Box>
          </Stack>

          <Box sx={{ pl: 6 }}>
            <Typography variant="body1" fontWeight="medium" sx={{ mb: 1 }}>
              {officeData.address.street}
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {officeData.address.postalCode} {officeData.address.city}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {officeData.address.country}
            </Typography>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ pl: 6 }}>
            <Button
              variant="contained"
              startIcon={<DirectionsIcon />}
              onClick={handleGetDirections}
              sx={{
                bgcolor: accentColor,
                '&:hover': { bgcolor: theme.palette.primary.dark },
                borderRadius: 2
              }}
            >
              Get Directions
            </Button>
            <Button
              variant="outlined"
              startIcon={<PhoneIcon />}
              onClick={handleCallOffice}
              sx={{ borderRadius: 2 }}
            >
              Call Office
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Information Grid */}
      <Grid container spacing={3}>
        {/* Contact Information */}
        <Grid item xs={12} md={6}>
          <InfoCard
            icon={<BusinessIcon />}
            title="Contact Information"
            content={
              <Stack spacing={1}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <PhoneIcon fontSize="small" color="action" />
                  <Typography variant="body2">{officeData.contact.phone}</Typography>
                </Stack>
                <Stack direction="row" spacing={2} alignItems="center">
                  <EmailIcon fontSize="small" color="action" />
                  <Typography variant="body2">{officeData.contact.email}</Typography>
                </Stack>
                <Stack direction="row" spacing={2} alignItems="center">
                  <LanguageIcon fontSize="small" color="action" />
                  <Typography variant="body2">{officeData.contact.website}</Typography>
                </Stack>
              </Stack>
            }
            action={
              <Stack direction="row" spacing={1}>
                <IconButton size="small" onClick={handleCallOffice} sx={{ color: accentColor }}>
                  <PhoneIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={handleEmailOffice} sx={{ color: accentColor }}>
                  <EmailIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={handleVisitWebsite} sx={{ color: accentColor }}>
                  <PublicIcon fontSize="small" />
                </IconButton>
              </Stack>
            }
          />
        </Grid>

        {/* Office Hours */}
        <Grid item xs={12} md={6}>
          <InfoCard
            icon={<AccessTimeIcon />}
            title="Office Hours"
            content={
              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2">Monday - Friday</Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {officeData.hours.weekdays}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2">Saturday</Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {officeData.hours.saturday}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2">Sunday</Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {officeData.hours.sunday}
                  </Typography>
                </Stack>
              </Stack>
            }
          />
        </Grid>

        {/* Amenities */}
        <Grid item xs={12} md={6}>
          <InfoCard
            icon={<WifiIcon />}
            title="Office Amenities"
            content={
              <Stack spacing={2}>
                <Typography variant="body2" color="text.secondary">
                  Everything you need for your virtual office experience
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {officeData.amenities.map((amenity, index) => (
                    <AmenityChip key={index} amenity={amenity} />
                  ))}
                </Box>
              </Stack>
            }
          />
        </Grid>

      </Grid>

      {/* Map */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <Box sx={{ position: 'relative', height: 360 }}>
          <iframe
            title="Virtual office location map"
            src={mapSrc}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <Box
            sx={{
              position: 'absolute',
              right: 16,
              bottom: 16,
              display: 'flex',
              gap: 1
            }}
          >
            <Button
              variant="contained"
              startIcon={<DirectionsIcon />}
              onClick={handleGetDirections}
              sx={{ borderRadius: 2 }}
            >
              Get directions
            </Button>
            <Button
              variant="outlined"
              onClick={handleGetDirections}
              sx={{ borderRadius: 2 }}
            >
              Open in Google Maps
            </Button>
          </Box>
        </Box>
      </Paper>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit virtual office details</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <TextField label="Office name" value={editForm.name} onChange={handleEditChange('name')} fullWidth />
            <TextField label="Street" value={editForm.address.street} onChange={handleAddressChange('street')} fullWidth />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="City" value={editForm.address.city} onChange={handleAddressChange('city')} fullWidth />
              <TextField label="Postal code" value={editForm.address.postalCode} onChange={handleAddressChange('postalCode')} fullWidth />
              <TextField label="Country" value={editForm.address.country} onChange={handleAddressChange('country')} fullWidth />
            </Stack>
            <Divider />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="Phone" value={editForm.contact.phone} onChange={handleContactChange('phone')} fullWidth />
              <TextField label="Email" value={editForm.contact.email} onChange={handleContactChange('email')} fullWidth />
              <TextField label="Website" value={editForm.contact.website} onChange={handleContactChange('website')} fullWidth />
            </Stack>
            <Divider />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="Weekdays" value={editForm.hours.weekdays} onChange={handleHoursChange('weekdays')} fullWidth />
              <TextField label="Saturday" value={editForm.hours.saturday} onChange={handleHoursChange('saturday')} fullWidth />
              <TextField label="Sunday" value={editForm.hours.sunday} onChange={handleHoursChange('sunday')} fullWidth />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="outlined" onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveEdit}>Save changes</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={addTransportOpen} onClose={() => setAddTransportOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add transport option</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <TextField label="Transport name" value={transportForm.name} onChange={(e) => setTransportForm((prev) => ({ ...prev, name: e.target.value }))} fullWidth />
            <TextField label="Distance" value={transportForm.distance} onChange={(e) => setTransportForm((prev) => ({ ...prev, distance: e.target.value }))} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="outlined" onClick={() => setAddTransportOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddTransport}>Add transport</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};

export default VirtualOfficeAddress;
