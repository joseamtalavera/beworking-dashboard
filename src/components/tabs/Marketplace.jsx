import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Stack,
  Paper,
  Rating
} from '@mui/material';

const Marketplace = () => {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', label: t('stubs.marketplace.allServices') },
    { id: 'marketing', label: t('stubs.marketplace.marketing') },
    { id: 'legal', label: t('stubs.marketplace.legal') },
    { id: 'accounting', label: t('stubs.marketplace.accounting') },
    { id: 'tech', label: t('stubs.marketplace.technology') }
  ];

  const services = [
    {
      id: 1,
      name: 'Digital Marketing Pro',
      company: 'Marketing Solutions Inc.',
      category: 'marketing',
      description: 'Complete digital marketing services including SEO, social media management, and PPC campaigns.',
      rating: 4.8,
      reviews: 127,
      price: '$2,500/month',
      location: 'New York, NY',
      services: ['SEO Optimization', 'Social Media Management', 'PPC Campaigns', 'Content Marketing'],
      featured: true
    },
    {
      id: 2,
      name: 'Legal Advisory Services',
      company: 'Smith & Associates Law',
      category: 'legal',
      description: 'Comprehensive legal services for businesses including contract review, compliance, and litigation support.',
      rating: 4.9,
      reviews: 89,
      price: '$350/hour',
      location: 'Los Angeles, CA',
      services: ['Contract Review', 'Business Compliance', 'Litigation Support', 'Legal Consultation'],
      featured: false
    },
    {
      id: 3,
      name: 'Financial Accounting Solutions',
      company: 'Precision Accounting Group',
      category: 'accounting',
      description: 'Professional accounting services including bookkeeping, tax preparation, and financial consulting.',
      rating: 4.7,
      reviews: 156,
      price: '$1,800/month',
      location: 'Chicago, IL',
      services: ['Bookkeeping', 'Tax Preparation', 'Financial Consulting', 'Payroll Management'],
      featured: true
    },
    {
      id: 4,
      name: 'GlobalTech Solutions',
      company: 'GlobalTech Development',
      category: 'tech',
      description: 'Full-stack software development services specializing in web applications, mobile apps, and cloud solutions.',
      rating: 4.9,
      reviews: 203,
      price: '$150/hour',
      location: 'San Francisco, CA',
      services: ['Web Development', 'Mobile Apps', 'Cloud Solutions', 'DevOps'],
      featured: true
    }
  ];

  const filteredServices = selectedCategory === 'all'
    ? services
    : services.filter(service => service.category === selectedCategory);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          {t('stubs.marketplace.title')}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          {t('stubs.marketplace.subtitle')}
        </Typography>

        <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            {t('stubs.marketplace.browseByCategory')}
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {categories.map((category) => (
              <Chip
                key={category.id}
                label={category.label}
                onClick={() => setSelectedCategory(category.id)}
                variant={selectedCategory === category.id ? 'filled' : 'outlined'}
                color={selectedCategory === category.id ? 'primary' : 'default'}
                sx={{
                  fontWeight: selectedCategory === category.id ? 600 : 400
                }}
              />
            ))}
          </Stack>
        </Paper>
      </Box>

      <Grid container spacing={3}>
        {filteredServices.map((svc) => (
          <Grid item xs={12} sm={6} lg={4} key={svc.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative'
              }}
            >
              {svc.featured && (
                <Chip
                  label={t('stubs.marketplace.featured')}
                  color="primary"
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    zIndex: 1,
                    fontWeight: 600
                  }}
                />
              )}

              <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                <Typography variant="h6" component="h3" sx={{ fontWeight: 600, mb: 1 }}>
                  {svc.name}
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                  {svc.company}
                </Typography>

                <Typography variant="body2" sx={{ mb: 2, minHeight: 40 }}>
                  {svc.description}
                </Typography>

                <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                  <Rating value={svc.rating} precision={0.1} size="small" readOnly />
                  <Typography variant="body2" color="text.secondary">
                    {svc.rating} ({svc.reviews} {t('stubs.marketplace.reviews')})
                  </Typography>
                </Stack>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {svc.location}
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                    {t('stubs.marketplace.services')}
                  </Typography>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                    {svc.services.slice(0, 3).map((serviceItem, index) => (
                      <Chip
                        key={index}
                        label={serviceItem}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.75rem', height: 24 }}
                      />
                    ))}
                    {svc.services.length > 3 && (
                      <Chip
                        label={t('stubs.marketplace.more', { count: svc.services.length - 3 })}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.75rem', height: 24 }}
                      />
                    )}
                  </Stack>
                </Box>
              </CardContent>

              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button
                  variant="contained"
                  fullWidth
                  sx={{
                    background: (theme) =>
                      `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                    '&:hover': {
                      background: (theme) =>
                        `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.brand.greenHover} 100%)`,
                    },
                    fontWeight: 600,
                    textTransform: 'none'
                  }}
                >
                  {t('stubs.marketplace.contactNow', { price: svc.price })}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredServices.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            {t('stubs.marketplace.noServices')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('stubs.marketplace.noServicesHint')}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default Marketplace;
