import { useEffect, useMemo, useState } from 'react';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import Checkbox from '@mui/material/Checkbox';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Tab from '@mui/material/Tab';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { listSpaces, upsertSpace, deleteSpace } from '../../../api/spaceCatalog.js';

const BRAND_PRIMARY = '#fb923c';
const BRAND_PRIMARY_HOVER = '#ea580c';
const BRAND_MUTED_BG = '#fff7ed';
const BRAND_BORDER = '#fed7aa';

const EMPTY_FORM = {
  id: '',
  centroCode: '',
  displayName: '',
  productCode: '',
  type: '',
  status: '',
  creationDate: '',
  size: '',
  order: '',
  wifi: '',
  capacity: '',
  priceFrom: '',
  priceUnit: '/h',
  rating: '',
  reviewCount: '',
  heroImage: '',
  instantBooking: true,
  tags: '',
  amenities: [],
  title: '',
  description: '',
  images: []
};

const MOCK_ROWS = [
  {
    id: 'MA1A1',
    centroCode: 'MA1',
    displayName: 'Aula MA1A1',
    productCode: 'MA1A1',
    type: 'Aula',
    status: 'Activo',
    capacity: '1-10',
    size: '35 m²',
    priceFrom: '€ 35',
    priceUnit: '/h',
    rating: '4.8',
    reviewCount: '24',
    heroImage: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800',
    instantBooking: true,
    tags: ['Screen', 'Whiteboard'],
    amenities: ['Acceso 24h', 'Internet 600Mb', 'Pizarra y papelógrafo'],
    title: 'Calle Alejandro Dumas 17, 29004',
    description:
      'Nuestra Aula/Sala 1 de Alejandro Dumas es perfecta para reuniones o formaciones. Conexión de 600Mb simétricos, pizarra, proyector y mobiliario.',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1200',
        caption: 'Vista general'
      },
      {
        url: 'https://images.unsplash.com/photo-1523475472560-d2df97ec485c?w=1200',
        caption: 'Zona de proyección'
      }
    ]
  },
  {
    id: 'MA1-DESKS',
    centroCode: 'MA1',
    displayName: 'MA1 Desk Area',
    productCode: 'MA1O1',
    type: 'Mesa',
    status: 'Activo',
    capacity: '1',
    size: '15 m²',
    priceFrom: '€ 15',
    priceUnit: '/day',
    rating: '4.6',
    reviewCount: '58',
    heroImage: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800',
    instantBooking: true,
    tags: ['Coworking', 'Flexible'],
    amenities: ['Acceso 24h', 'Internet 600Mb', 'Mesa Coworking'],
    title: 'Zona coworking MA1',
    description: 'Espacio flexible con puestos individuales, preparado para freelancers y nómadas digitales.',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1200',
        caption: 'Área de mesas'
      }
    ]
  }
];

const CENTRO_OPTIONS = [
  { code: 'MA1', label: 'MA1 · Málaga Dumas' },
  { code: 'MAOV', label: 'MAOV · Oficina Virtual' },
  { code: 'MA3', label: 'MA3 · Málaga Centro' }
];

const TYPE_OPTIONS = ['Aula', 'Mesa', 'Oficina', 'Evento'];
const STATUS_OPTIONS = ['Activo', 'Inactivo', 'Borrador'];
const PRICE_UNIT_OPTIONS = ['/h', '/day', '/month'];

const AMENITY_OPTIONS = [
  'Acceso 24h',
  'Alarma',
  'Llave digital',
  'Oficina virtual',
  'Sin permanencia',
  'Visa coworking',
  'Agua gratis',
  'Escaner e impresora',
  'Marketing',
  'Pizarra y papelógrafo',
  'Soporte 24h',
  'Zona de descanso',
  'Aire acondicionado',
  'Internet 600Mb',
  'Mesa Coworking',
  'Proyector',
  'Taquilla'
];

const normaliseTags = (value) =>
  value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

const toTagString = (tags = []) => tags.join(', ');

const normaliseImages = (images) => {
  if (!Array.isArray(images)) {
    return [];
  }
  return images.map((image) => ({
    url: image?.url ?? image?.src ?? '',
    caption: image?.caption ?? image?.description ?? ''
  }));
};

const createEmptyForm = () => ({
  ...EMPTY_FORM,
  amenities: [],
  images: []
});

const SpaceCatalog = () => {
  const [rows, setRows] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formValues, setFormValues] = useState(createEmptyForm());
  const [editingIndex, setEditingIndex] = useState(null);
  const [activeTab, setActiveTab] = useState('general');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    const loadSpaces = async () => {
      try {
        const data = await listSpaces();
        if (!active) {
          return;
        }
        setRows(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to load spaces', error);
      }
    };

    loadSpaces();
    return () => {
      active = false;
    };
  }, []);

  const orderedRows = useMemo(
    () => [...rows].sort((a, b) => a.displayName.localeCompare(b.displayName)),
    [rows]
  );

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setFormValues(createEmptyForm());
    setEditingIndex(null);
    setActiveTab('general');
  };

  const handleAdd = () => {
    setFormValues(createEmptyForm());
    setEditingIndex(null);
    setActiveTab('general');
    setDialogOpen(true);
  };

  const handleEdit = (index) => {
    const row = rows[index];
    setFormValues({
      id: row.id ?? '',
      centroCode: row.centroCode ?? '',
      displayName: row.displayName ?? '',
      productCode: row.productCode ?? '',
      type: row.type ?? '',
      status: row.status ?? '',
      creationDate: row.creationDate ?? '',
      size: row.size ?? '',
      order: row.order ?? '',
      wifi: row.wifi ?? '',
      capacity: row.capacity ?? '',
      priceFrom: row.priceFrom ?? '',
      priceUnit: row.priceUnit ?? '/h',
      rating: row.rating ?? '',
      reviewCount: row.reviewCount ?? '',
      heroImage: row.heroImage ?? '',
      instantBooking: Boolean(row.instantBooking),
      tags: toTagString(row.tags),
      amenities: Array.isArray(row.amenities) ? row.amenities : [],
      title: row.title ?? '',
      description: row.description ?? '',
      images: normaliseImages(row.images)
    });
    setEditingIndex(index);
    setActiveTab('general');
    setDialogOpen(true);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleToggleInstantBooking = (event) => {
    setFormValues((prev) => ({
      ...prev,
      instantBooking: event.target.checked
    }));
  };

  const handleAmenityToggle = (amenity) => (event) => {
    const checked = event.target.checked;
    setFormValues((prev) => {
      const current = new Set(prev.amenities);
      if (checked) {
        current.add(amenity);
      } else {
        current.delete(amenity);
      }
      return {
        ...prev,
        amenities: Array.from(current)
      };
    });
  };

  const updateImageField = (index, key) => (event) => {
    const value = event.target.value;
    setFormValues((prev) => {
      const images = [...prev.images];
      images[index] = {
        ...images[index],
        [key]: value
      };
      return { ...prev, images };
    });
  };

  const handleAddImage = () => {
    setFormValues((prev) => ({
      ...prev,
      images: [...prev.images, { url: '', caption: '' }]
    }));
  };

  const handleRemoveImage = (index) => () => {
    setFormValues((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== index)
    }));
  };

  const handleSave = async () => {
    const payload = {
      ...formValues,
      tags: normaliseTags(formValues.tags),
      images: normaliseImages(formValues.images)
    };

    if (!payload.heroImage && payload.images.length > 0) {
      payload.heroImage = payload.images[0].url;
    }

    setSubmitting(true);
    try {
      const saved = await upsertSpace(payload);
      setRows((prev) => {
        const next = [...prev];
        const idx = next.findIndex((item) => item.id === saved.id);
        if (idx >= 0) {
          next[idx] = saved;
        } else {
          next.push(saved);
        }
        return next;
      });
      handleCloseDialog();
    } catch (error) {
      console.error('Failed to save space', error);
    } finally {
      setSubmitting(false);
    }
  };


  const handleDelete = async (index) => {
    const target = orderedRows[index];
    if (!target) return;

    try {
      await deleteSpace(target.id);
      setRows((prev) => prev.filter((item) => item.id !== target.id));
    } catch (error) {
      console.error('Failed to delete space', error);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Space Catalog
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Maintain the public booking metadata for each centro product. These values populate the
            booking homepage cards.
          </Typography>
        </Box>
        <Button
          startIcon={<AddCircleOutlineIcon />}
          variant="contained"
          onClick={handleAdd}
          sx={{
            backgroundColor: BRAND_PRIMARY,
            '&:hover': { backgroundColor: BRAND_PRIMARY_HOVER },
            fontWeight: 600
          }}
        >
          Add space
        </Button>
      </Stack>

      <TableContainer
        component={Paper}
        sx={{
          borderRadius: 3,
          border: '1px solid',
          borderColor: BRAND_BORDER
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Display name</TableCell>
              <TableCell>Centro</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Capacity</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Rating</TableCell>
              <TableCell>Tags</TableCell>
              <TableCell>Photos</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orderedRows.map((row, index) => (
              <TableRow key={row.id || index}>
                <TableCell>
                  <Stack spacing={0.5}>
                    <Typography fontWeight={600}>{row.displayName}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {row.heroImage}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>{row.centroCode || '—'}</TableCell>
                <TableCell>{row.type || '—'}</TableCell>
                <TableCell>{row.capacity || '—'}</TableCell>
                <TableCell>
                  {row.priceFrom} {row.priceUnit}
                </TableCell>
                <TableCell>
                  {row.rating} ({row.reviewCount})
                  {row.instantBooking && (
                    <Chip
                      label="Instant"
                      size="small"
                      sx={{
                        ml: 1,
                        backgroundColor: BRAND_PRIMARY,
                        color: '#fff',
                        fontWeight: 600
                      }}
                    />
                  )}
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {row.tags?.map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        sx={{
                          backgroundColor: BRAND_MUTED_BG,
                          color: BRAND_PRIMARY_HOVER,
                          fontWeight: 600
                        }}
                      />
                    ))}
                  </Stack>
                </TableCell>
                <TableCell>{row.images?.length ?? 0}</TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <IconButton
                      onClick={() => handleEdit(index)}
                      sx={{ color: BRAND_PRIMARY_HOVER }}
                    >
                      <EditOutlinedIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(index)}
                      sx={{ color: '#b91c1c' }}
                    >
                      <DeleteOutlineRoundedIcon />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingIndex != null ? 'Edit space' : 'Add space'}</DialogTitle>
        <DialogContent sx={{ pt: 0 }}>
          <Tabs
            value={activeTab}
            onChange={(_, value) => setActiveTab(value)}
            variant="fullWidth"
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              mb: 2,
              '& .MuiTabs-indicator': {
                backgroundColor: BRAND_PRIMARY
              }
            }}
          >
            <Tab
              label="General information"
              value="general"
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                '&.Mui-selected': { color: BRAND_PRIMARY }
              }}
            />
            <Tab
              label="Photos"
              value="photos"
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                '&.Mui-selected': { color: BRAND_PRIMARY }
              }}
            />
          </Tabs>

          {activeTab === 'general' && (
            <Stack spacing={3}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 3,
                  borderColor: BRAND_BORDER,
                  backgroundColor: BRAND_MUTED_BG
                }}
              >
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                  Datos generales
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Centro"
                      name="centroCode"
                      value={formValues.centroCode}
                      onChange={handleChange}
                      select
                      fullWidth
                      size="small"
                    >
                      {CENTRO_OPTIONS.map((option) => (
                        <MenuItem key={option.code} value={option.code}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Nombre"
                      name="displayName"
                      value={formValues.displayName}
                      onChange={handleChange}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Tipo"
                      name="type"
                      value={formValues.type}
                      onChange={handleChange}
                      select
                      fullWidth
                      size="small"
                    >
                      {TYPE_OPTIONS.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Estado"
                      name="status"
                      value={formValues.status}
                      onChange={handleChange}
                      select
                      fullWidth
                      size="small"
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Fecha de creación"
                      name="creationDate"
                      value={formValues.creationDate}
                      onChange={handleChange}
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Código producto"
                      name="productCode"
                      value={formValues.productCode}
                      onChange={handleChange}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Capacidad"
                      name="capacity"
                      value={formValues.capacity}
                      onChange={handleChange}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Tamaño (m²)"
                      name="size"
                      value={formValues.size}
                      onChange={handleChange}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Precio desde"
                      name="priceFrom"
                      value={formValues.priceFrom}
                      onChange={handleChange}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Unidad de precio"
                      name="priceUnit"
                      value={formValues.priceUnit}
                      onChange={handleChange}
                      select
                      fullWidth
                      size="small"
                    >
                      {PRICE_UNIT_OPTIONS.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Puntuación"
                      name="rating"
                      value={formValues.rating}
                      onChange={handleChange}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Número de reseñas"
                      name="reviewCount"
                      value={formValues.reviewCount}
                      onChange={handleChange}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Orden"
                      name="order"
                      value={formValues.order}
                      onChange={handleChange}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Wifi"
                      name="wifi"
                      value={formValues.wifi}
                      onChange={handleChange}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Hero image URL"
                      name="heroImage"
                      value={formValues.heroImage}
                      onChange={handleChange}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                </Grid>
                <FormControlLabel
                  sx={{ mt: 2 }}
                  control={
                    <Switch
                      checked={formValues.instantBooking}
                      onChange={handleToggleInstantBooking}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: BRAND_PRIMARY,
                          '&:hover': { backgroundColor: 'rgba(251,146,60,0.12)' }
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: BRAND_PRIMARY
                        }
                      }}
                    />
                  }
                  label="Permitir reserva instantánea"
                />
              </Paper>

              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 3,
                  borderColor: BRAND_BORDER
                }}
              >
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>
                  Amenities
                </Typography>
                <FormGroup>
                  <Grid container spacing={1}>
                    {AMENITY_OPTIONS.map((amenity) => (
                      <Grid item xs={12} sm={6} md={4} key={amenity}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={formValues.amenities.includes(amenity)}
                              onChange={handleAmenityToggle(amenity)}
                              sx={{
                                '&.Mui-checked': {
                                  color: BRAND_PRIMARY
                                }
                              }}
                            />
                          }
                          label={amenity}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </FormGroup>
              </Paper>

              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 3,
                  borderColor: BRAND_BORDER
                }}
              >
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>
                  Descripción pública
                </Typography>
                <Stack spacing={2}>
                  <TextField
                    label="Título"
                    name="title"
                    value={formValues.title}
                    onChange={handleChange}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="Descripción"
                    name="description"
                    value={formValues.description}
                    onChange={handleChange}
                    fullWidth
                    minRows={4}
                    multiline
                  />
                  <TextField
                    label="Tags (separados por coma)"
                    name="tags"
                    value={formValues.tags}
                    onChange={handleChange}
                    fullWidth
                    size="small"
                  />
                </Stack>
              </Paper>
            </Stack>
          )}

          {activeTab === 'photos' && (
            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1" fontWeight={600}>
                  Galería de fotos
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddPhotoAlternateOutlinedIcon />}
                  onClick={handleAddImage}
                  sx={{
                    borderColor: BRAND_PRIMARY,
                    color: BRAND_PRIMARY_HOVER,
                    fontWeight: 600,
                    '&:hover': {
                      borderColor: BRAND_PRIMARY_HOVER,
                      backgroundColor: BRAND_MUTED_BG
                    }
                  }}
                >
                  Añadir foto
                </Button>
              </Stack>
              <Grid container spacing={2}>
                {formValues.images.map((image, index) => (
                  <Grid item xs={12} sm={6} md={4} key={`${image.url}-${index}`}>
                    <Card
                      variant="outlined"
                      sx={{
                        borderRadius: 3,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        borderColor: BRAND_BORDER
                      }}
                    >
                      {image.url ? (
                        <CardMedia component="img" height="160" image={image.url} alt={image.caption || 'Space'} />
                      ) : (
                        <Box
                          sx={{
                            height: 160,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: BRAND_MUTED_BG,
                            color: 'text.disabled'
                          }}
                        >
                          Vista previa
                        </Box>
                      )}
                      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <TextField
                          label="URL de la imagen"
                          value={image.url}
                          onChange={updateImageField(index, 'url')}
                          size="small"
                          fullWidth
                        />
                        <TextField
                          label="Descripción"
                          value={image.caption ?? ''}
                          onChange={updateImageField(index, 'caption')}
                          size="small"
                          fullWidth
                        />
                        <Button
                          color="error"
                          variant="text"
                          onClick={handleRemoveImage(index)}
                          startIcon={<DeleteOutlineRoundedIcon />}
                          sx={{ alignSelf: 'flex-start', fontWeight: 600 }}
                        >
                          Eliminar
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
                {formValues.images.length === 0 && (
                  <Grid item xs={12}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 4,
                        textAlign: 'center',
                        borderRadius: 3,
                        borderStyle: 'dashed',
                        color: 'text.secondary',
                        borderColor: BRAND_BORDER,
                        backgroundColor: BRAND_MUTED_BG
                      }}
                    >
                      <Typography variant="body2">
                        Aún no hay imágenes. Pulsa «Añadir foto» para comenzar la galería.
                      </Typography>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog} disabled={submitting} sx={{ fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={submitting}
            sx={{
              backgroundColor: BRAND_PRIMARY,
              '&:hover': { backgroundColor: BRAND_PRIMARY_HOVER },
              fontWeight: 700
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SpaceCatalog;
