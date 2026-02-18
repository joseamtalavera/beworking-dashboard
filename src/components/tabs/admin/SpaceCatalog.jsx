import { useEffect, useMemo, useState } from 'react';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';

// Colors are now defined in theme.js - use theme palette: primary.main/dark for green, secondary.main/dark for orange
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { useTranslation } from 'react-i18next';
import i18n from '../../../i18n/i18n.js';
import esSpaceCatalog from '../../../i18n/locales/es/spaceCatalog.json';
import enSpaceCatalog from '../../../i18n/locales/en/spaceCatalog.json';
if (!i18n.hasResourceBundle('es', 'spaceCatalog')) {
  i18n.addResourceBundle('es', 'spaceCatalog', esSpaceCatalog);
  i18n.addResourceBundle('en', 'spaceCatalog', enSpaceCatalog);
}
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
import { alpha, useTheme } from '@mui/material/styles';
import { listSpaces, upsertSpace, deleteSpace } from '../../../api/spaceCatalog.js';
import { apiFetch } from '../../../api/client.js';

const BRAND_PRIMARY = '#009624';
const BRAND_PRIMARY_HOVER = '#007a1d';
const BRAND_MUTED_BG = 'rgba(0, 150, 36, 0.08)';

const COLUMN_WIDTHS = {
  displayName: 180,
  centro: 80,
  type: 80,
  capacity: 70,
  price: 90,
  instant: 100,
  photos: 60,
  actions: 90
};

const EMPTY_FORM = {
  id: '',
  centroCode: '',
  displayName: '',
  code: '',
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
  subtitle: '',
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
    subtitle: 'Calle Alejandro Dumas 17, 29004',
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
    id: 'MA1A3',
    centroCode: 'MA1',
    displayName: 'Aula MA1A3',
    productCode: 'MA1A3',
    type: 'Aula',
    status: 'Activo',
    capacity: '6',
    size: '45 m²',
    priceFrom: '€ 30',
    priceUnit: '/h',
    rating: '4.8',
    reviewCount: '24',
    heroImage: 'https://app.be-working.com/img/MA1A3-0-featured-20220504145833.jpg',
    instantBooking: true,
    tags: ['Reuniones', 'Eventos', 'Formación', 'Entrevistas'],
    amenities: [
      'Acceso 24h',
      'Internet 600Mb',
      'Pizarra y papelógrafo',
      'Proyector',
      'Aire acondicionado',
      'Llave digital',
      'Sin permanencia',
      'Escaner e impresora',
      'Soporte 24h',
      'Zona de descanso',
      'Alarma'
    ],
    subtitle: 'Calle Alejandro Dumas 17, 29004 Málaga',
    description:
      'Nuestra Aula/ Sala 3 de Alejandro Dumas es perfecta para reuniones, formaciones, eventos o entrevistas. Tiene 45 m2 y cuenta con conexión internet 600 Mb simétricos, pizarra, mobiliario y proyector. Zona de descanso, llave digital y alarma. Acceso 24 horas / 365 días.',
    images: [
      { url: 'https://app.be-working.com/img/MA1A3-0-featured-20220504145833.jpg', caption: 'Vista principal del aula' },
      { url: 'https://app.be-working.com/img/MA1A3-1-20220504145833.jpg', caption: 'Interior del aula' },
      { url: 'https://app.be-working.com/img/MA1A3-2-20220504145833.jpg', caption: 'Zona de trabajo' },
      { url: 'https://app.be-working.com/img/MA1A3-3-20220504145833.jpg', caption: 'Detalle mobiliario' },
      { url: 'https://app.be-working.com/img/MA1A3-4-20220504145833.jpg', caption: 'Equipamiento' }
    ]
  },
  {
    id: 'MA1A4',
    centroCode: 'MA1',
    displayName: 'Aula MA1A4',
    productCode: 'MA1A4',
    type: 'Aula',
    status: 'Activo',
    capacity: '40',
    size: '45 m²',
    priceFrom: '€ 48',
    priceUnit: '/h',
    rating: '4.8',
    reviewCount: '24',
    heroImage: 'https://be-working.com/wp-content/uploads/2025/09/MA1A4-0-featured-20220505082555-1.jpg',
    instantBooking: true,
    tags: ['Reuniones', 'Formación', 'Eventos', 'Entrevistas'],
    amenities: [
      'Acceso 24h',
      'Internet 600Mb',
      'Pizarra y papelógrafo',
      'Proyector',
      'Aire acondicionado',
      'Llave digital',
      'Sin permanencia',
      'Escaner e impresora',
      'Soporte 24h',
      'Zona de descanso',
      'Alarma'
    ],
    subtitle: 'Calle Alejandro Dumas 17, 29004 Málaga',
    description:
      'Nuestra Aula/ Sala 4 de Alejandro Dumas es perfecta para reuniones, eventos, formaciones ó entrevistas. Tiene 45 m2 y cuenta con luz natural y zona exterior. Equipada con conexión internet 600 Mb simétricos, pizarra y mobiliario. Acceso 24 horas / 365 días. Proyector, Pizarra y Llave digital.',
    images: [
      { url: 'https://be-working.com/wp-content/uploads/2025/09/MA1A4-0-featured-20220505082555-1.jpg', caption: 'Vista principal del aula' },
      { url: 'https://be-working.com/wp-content/uploads/2025/09/MA1A4-1-20220505082555.jpg', caption: 'Interior del aula' },
      { url: 'https://be-working.com/wp-content/uploads/2025/09/MA1A4-2-20220505082555.jpg', caption: 'Zona de trabajo' },
      { url: 'https://be-working.com/wp-content/uploads/2025/09/MA1A4-3-20220505082555.jpg', caption: 'Detalle mobiliario' },
      { url: 'https://be-working.com/wp-content/uploads/2025/09/MA1A4-4-20220505082555.jpg', caption: 'Equipamiento' }
    ]
  },
  {
    id: 'MA1A5',
    centroCode: 'MA1',
    displayName: 'Aula MA1A5',
    productCode: 'MA1A5',
    type: 'Aula',
    status: 'Activo',
    capacity: '20',
    size: '45 m²',
    priceFrom: '€ 24',
    priceUnit: '/h',
    rating: '4.8',
    reviewCount: '24',
    heroImage: 'https://app.be-working.com/img/MA1A5-0-featured-20240501123909.jpg',
    instantBooking: true,
    tags: ['Reuniones', 'Eventos', 'Formación', 'Entrevistas'],
    amenities: [
      'Acceso 24h',
      'Agua gratis',
      'Aire acondicionado',
      'Internet 600Mb',
      'Llave digital',
      'Soporte 24h',
      'Zona de descanso'
    ],
    subtitle: 'Calle Alejandro Dumas 17, 29004 Málaga',
    description:
      'Nuestra Aula/ Sala 5 de Alejandro Dumas es perfecta para reuniones, eventos, formaciones ó entrevistas. Tiene 45 m2 y cuenta con conexión internet 600 Mb simétricos, pizarra y proyector. Zona de descanso, llave digital y alarma. Acceso 24 horas / 365 días.',
    images: [
      { url: 'https://app.be-working.com/img/MA1A5-0-featured-20240501123909.jpg', caption: 'Vista principal del aula' },
      { url: 'https://app.be-working.com/img/MA1A5-1-20240501123909.jpg', caption: 'Interior del aula' },
      { url: 'https://app.be-working.com/img/MA1A5-2-20240501123909.jpg', caption: 'Zona de trabajo' },
      { url: 'https://app.be-working.com/img/MA1A5-3-20240501123909.jpg', caption: 'Detalle mobiliario' },
      { url: 'https://app.be-working.com/img/MA1A5-4-20240501123909.jpg', caption: 'Equipamiento' }
    ]
  },
  {
    id: 'MA1-DESKS',
    centroCode: 'MA1',
    displayName: 'MA1 Desks',
    productCode: 'MA1O1',
    type: 'Mesa',
    status: 'Activo',
    capacity: '16',
    size: '2 m²',
    priceFrom: '€ 90',
    priceUnit: '/month',
    rating: '4.6',
    reviewCount: '58',
    heroImage: 'https://app.be-working.com/img/MA1O1-1-0-featured-20220512103754.jpg',
    instantBooking: true,
    tags: ['Coworking', 'Flexible', '24h'],
    amenities: [
      'Acceso 24h',
      'Agua gratis',
      'Aire acondicionado',
      'Alarma',
      'Escaner e impresora',
      'Internet 600Mb',
      'Llave digital',
      'Mesa Coworking',
      'Oficina virtual',
      'Pizarra y papelógrafo',
      'Proyector',
      'Sin permanencia',
      'Soporte 24h',
      'Taquilla',
      'Zona de descanso'
    ],
    subtitle: 'Calle Alejandro Dumas 17, 29004 Málaga',
    description:
      'Coworking abierto de lunes a domingo 24 horas. Sin permanencias ni depósitos. Zona de Cafetería y Descanso, Impresora / Fotocopiadora. Llave Digital, Alarma, Sala Exterior y Luminosa.',
    images: [
      { url: 'https://app.be-working.com/img/MA1O1-1-0-featured-20220512103754.jpg', caption: 'Vista general coworking' },
      { url: 'https://app.be-working.com/img/MA1O1-1-1-20220512103754.jpg', caption: 'Zona de trabajo' },
      { url: 'https://app.be-working.com/img/MA1O1-1-2-20220512103754.jpg', caption: 'Área común' },
      { url: 'https://app.be-working.com/img/MA1O1-1-3-20220512103754.jpg', caption: 'Detalle puestos' },
      { url: 'https://app.be-working.com/img/MA1O1-1-4-20220512103754.jpg', caption: 'Zona de descanso' }
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
  const { t } = useTranslation('spaceCatalog');
  const [rows, setRows] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formValues, setFormValues] = useState(createEmptyForm());
  const [editingIndex, setEditingIndex] = useState(null);
  const [activeTab, setActiveTab] = useState('general');
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [draggingImageIndex, setDraggingImageIndex] = useState(null);

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
        console.error('Failed to load spaces, using mock data', error);
        if (active) {
          setRows(MOCK_ROWS);
        }
      }
    };

    loadSpaces();
    return () => {
      active = false;
    };
  }, []);

  const orderedRows = useMemo(
    () => [...rows].sort((a, b) => (a.displayName ?? '').localeCompare(b.displayName ?? '')),
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
    const row = orderedRows[index];
    setFormValues({
      id: row.id ?? '',
      centroCode: row.centroCode ?? '',
      displayName: row.displayName ?? '',
      code: row.code ?? '',
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
      subtitle: row.subtitle ?? '',
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

  const moveImage = (fromIndex, toIndex) => {
    setFormValues((prev) => {
      const images = [...prev.images];
      if (toIndex < 0 || toIndex >= images.length) {
        return prev;
      }
      const [moved] = images.splice(fromIndex, 1);
      images.splice(toIndex, 0, moved);
      return { ...prev, images };
    });
  };

  const handleImageDragStart = (index) => (event) => {
    event.dataTransfer.effectAllowed = 'move';
    setDraggingImageIndex(index);
  };

  const handleImageDragOver = (index) => (event) => {
    event.preventDefault();
    if (draggingImageIndex === null || draggingImageIndex === index) {
      return;
    }
    moveImage(draggingImageIndex, index);
    setDraggingImageIndex(index);
  };

  const handleImageDragEnd = () => {
    setDraggingImageIndex(null);
  };

  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    setUploading(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await apiFetch('/uploads', {
          method: 'POST',
          body: formData
        });

        if (response?.url) {
          // Convert relative URL (/uploads/...) to absolute so the image renders
          let uploadedUrl = response.url;
          if (uploadedUrl.startsWith('/')) {
            uploadedUrl = new URL(uploadedUrl, import.meta.env.DEV ? 'http://localhost:8080' : window.location.origin).href;
          }
          setFormValues((prev) => ({
            ...prev,
            images: [...prev.images, { url: uploadedUrl, caption: file.name }]
          }));
        }
      }
    } catch (error) {
      console.error('Image upload failed', error);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleSave = async () => {
    const payload = {
      ...formValues,
      code: formValues.code || formValues.productCode || formValues.displayName,
      tags: normaliseTags(formValues.tags),
      images: normaliseImages(formValues.images)
    };

    if (payload.images.length > 0) {
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
            {t('title')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('subtitle')}
          </Typography>
        </Box>
        <Button
          startIcon={<AddCircleOutlineIcon />}
          variant="contained"
          onClick={handleAdd}
          sx={{
            backgroundColor: 'primary.main',
            '&:hover': { backgroundColor: 'primary.dark' },
            fontWeight: 600
          }}
        >
          {t('addSpace')}
        </Button>
      </Stack>

      <TableContainer
        component={Paper}
        sx={{
          borderRadius: 3,
          border: '1px solid',
          borderColor: (theme) => theme.palette.primary.light + '80',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <Table
          sx={{
            tableLayout: 'fixed',
            minWidth: 650
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: COLUMN_WIDTHS.displayName }}>{t('table.displayName')}</TableCell>
              <TableCell sx={{ width: COLUMN_WIDTHS.centro }}>{t('table.centro')}</TableCell>
              <TableCell sx={{ width: COLUMN_WIDTHS.type }}>{t('table.type')}</TableCell>
              <TableCell align="right" sx={{ width: COLUMN_WIDTHS.capacity }}>{t('table.capacity')}</TableCell>
              <TableCell align="right" sx={{ width: COLUMN_WIDTHS.price }}>{t('table.price')}</TableCell>
              <TableCell align="center" sx={{ width: COLUMN_WIDTHS.instant }}>
                <Stack alignItems="center">{t('table.instantBooking')}</Stack>
              </TableCell>
              <TableCell align="center" sx={{ width: COLUMN_WIDTHS.photos }}>
                {t('table.photos')}
              </TableCell>
              <TableCell align="right" sx={{ width: COLUMN_WIDTHS.actions }}>
                {t('table.actions')}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orderedRows.map((row, index) => (
              <TableRow key={row.id || index}>
                <TableCell>
                  <Stack spacing={0.5}>
                    <Typography fontWeight={600}>{row.displayName}</Typography>
                    {row.heroImage ? (
                      <Box
                        component="img"
                        src={row.heroImage}
                        alt={row.displayName || 'Hero image'}
                        onError={(e) => { e.target.style.display = 'none'; }}
                        sx={{
                          width: 96,
                          height: 64,
                          objectFit: 'cover',
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: (theme) => theme.palette.primary.light + '80'
                        }}
                      />
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        {t('table.noHeroImage')}
                      </Typography>
                    )}
                  </Stack>
                </TableCell>
                <TableCell>{row.centroCode || '—'}</TableCell>
                <TableCell>{row.type || '—'}</TableCell>
                <TableCell align="right">{row.capacity || '—'}</TableCell>
                <TableCell align="right">
                  {row.priceFrom} {row.priceUnit}
                </TableCell>
                <TableCell align="center">
                  {row.instantBooking && (
                    <Chip
                      label={t('table.instant')}
                      size="small"
                      sx={{
                        backgroundColor: 'primary.main',
                        color: 'primary.contrastText',
                        fontWeight: 600
                      }}
                    />
                  )}
                </TableCell>
                <TableCell align="center">{row.images?.length ?? 0}</TableCell>
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
                      sx={{ color: 'secondary.main', '&:hover': { color: 'secondary.dark', bgcolor: (theme) => theme.palette.brand.greenSoft } }}
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
        <DialogTitle>{t(editingIndex != null ? 'dialog.editSpace' : 'dialog.addSpace')}</DialogTitle>
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
              label={t('dialog.generalTab')}
              value="general"
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                '&.Mui-selected': { color: 'primary.main' }
              }}
            />
            <Tab
              label={t('dialog.photosTab')}
              value="photos"
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                '&.Mui-selected': { color: 'primary.main' }
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
                  borderColor: (theme) => theme.palette.primary.light + '80',
                  backgroundColor: (theme) => theme.palette.primary.light + '15'
                }}
              >
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                  {t('dialog.generalData')}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label={t('dialog.centro')}
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
                      label={t('dialog.name')}
                      name="displayName"
                      value={formValues.displayName}
                      onChange={handleChange}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label={t('dialog.code')}
                      name="code"
                      value={formValues.code}
                      onChange={handleChange}
                      fullWidth
                      size="small"
                      helperText={t('dialog.codeHelper')}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label={t('dialog.type')}
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
                      label={t('dialog.status')}
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
                      label={t('dialog.creationDate')}
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
                      label={t('dialog.productCode')}
                      name="productCode"
                      value={formValues.productCode}
                      onChange={handleChange}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label={t('dialog.capacity')}
                      name="capacity"
                      value={formValues.capacity}
                      onChange={handleChange}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label={t('dialog.size')}
                      name="size"
                      value={formValues.size}
                      onChange={handleChange}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label={t('dialog.priceFrom')}
                      name="priceFrom"
                      value={formValues.priceFrom}
                      onChange={handleChange}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label={t('dialog.priceUnit')}
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
                      label={t('dialog.rating')}
                      name="rating"
                      value={formValues.rating}
                      onChange={handleChange}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label={t('dialog.reviewCount')}
                      name="reviewCount"
                      value={formValues.reviewCount}
                      onChange={handleChange}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label={t('dialog.order')}
                      name="order"
                      value={formValues.order}
                      onChange={handleChange}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label={t('dialog.wifi')}
                      name="wifi"
                      value={formValues.wifi}
                      onChange={handleChange}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label={t('dialog.heroImage')}
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
                          '&:hover': { backgroundColor: (theme) => alpha(theme.palette.brand.green, 0.12) }
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: BRAND_PRIMARY
                        }
                      }}
                    />
                  }
                  label={t('dialog.instantBooking')}
                />
              </Paper>

              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 3,
                  borderColor: (theme) => theme.palette.primary.light + '80'
                }}
              >
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>
                  {t('dialog.amenities')}
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
                                  color: 'primary.main'
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
                  borderColor: (theme) => theme.palette.primary.light + '80'
                }}
              >
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>
                  {t('dialog.publicDescription')}
                </Typography>
                <Stack spacing={2}>
                  <TextField
                    label={t('dialog.titleField')}
                    name="subtitle"
                    value={formValues.subtitle}
                    onChange={handleChange}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label={t('dialog.description')}
                    name="description"
                    value={formValues.description}
                    onChange={handleChange}
                    fullWidth
                    minRows={4}
                    multiline
                  />
                  <TextField
                    label={t('dialog.tags')}
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
                  {t('dialog.photoGallery')}
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddPhotoAlternateOutlinedIcon />}
                  component="label"
                  disabled={uploading}
                  sx={{
                    borderColor: BRAND_PRIMARY,
                    color: BRAND_PRIMARY_HOVER,
                    fontWeight: 600,
                    '&:hover': {
                      borderColor: BRAND_PRIMARY_HOVER,
                      backgroundColor: (theme) => theme.palette.primary.light + '15'
                    }
                  }}
                >
                  {uploading ? t('dialog.uploading') : t('dialog.addPhotos')}
                  <input type="file" hidden accept="image/*" multiple onChange={handleFileSelect} />
                </Button>
              </Stack>
              <Grid container spacing={2}>
                {formValues.images.map((image, index) => (
                  <Grid
                    item
                    xs={12}
                    sm={6}
                    md={4}
                    key={`${image.url}-${index}`}
                    onDragOver={handleImageDragOver(index)}
                  >
                    <Card
                      variant="outlined"
                      sx={{
                        borderRadius: 3,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        borderColor: (theme) => theme.palette.primary.light + '80',
                        overflow: 'hidden',
                        opacity: draggingImageIndex === index ? 0.85 : 1,
                        outline:
                          draggingImageIndex === index
                            ? `2px dashed ${BRAND_PRIMARY}`
                            : 'none',
                        cursor: 'grab'
                      }}
                      draggable
                      onDragStart={handleImageDragStart(index)}
                      onDragEnd={handleImageDragEnd}
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
                          {t('dialog.preview')}
                        </Box>
                      )}
                      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, p: 2 }}>
                        <Stack spacing={0.5}>
                          <Typography variant="caption" color="text.secondary">
                            {t('dialog.imageUrl')}
                          </Typography>
                          <TextField
                            value={image.url}
                            onChange={updateImageField(index, 'url')}
                            size="small"
                            fullWidth
                          />
                        </Stack>
                        <TextField
                          label={t('dialog.imageDescription')}
                          value={image.caption ?? ''}
                          onChange={updateImageField(index, 'caption')}
                          size="small"
                          fullWidth
                        />
                        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                          <Button
                            size="small"
                            variant="text"
                            href={image.url}
                            target="_blank"
                            rel="noreferrer"
                            sx={{ fontWeight: 600, color: BRAND_PRIMARY_HOVER }}
                          >
                            {t('dialog.openImage')}
                          </Button>
                          <Button
                            variant="text"
                            onClick={handleRemoveImage(index)}
                            startIcon={<DeleteOutlineRoundedIcon />}
                            sx={{ fontWeight: 600, color: 'secondary.main', '&:hover': { color: 'secondary.dark', bgcolor: (theme) => theme.palette.brand.greenSoft } }}
                          >
                            {t('dialog.deleteImage')}
                          </Button>
                        </Stack>
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
                        borderColor: (theme) => theme.palette.primary.light + '80',
                        backgroundColor: (theme) => theme.palette.primary.light + '15'
                      }}
                    >
                      <Typography variant="body2">
                        {t('dialog.noImages')}
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
            {t('dialog.cancel')}
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
            {t('dialog.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SpaceCatalog;
