import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import { alpha, useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { DEPT_TABS } from '../../constants.js';
import {
  ALWAYS_VISIBLE_ADMIN,
  setServiceActivated,
  useActivatedServices,
} from '../../utils/serviceActivations.js';

const Services = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const activated = useActivatedServices();

  const services = DEPT_TABS.filter((d) => !ALWAYS_VISIBLE_ADMIN.has(d.id));

  return (
    <Box>
      <Stack spacing={0.5} sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight={700} color="text.primary">
          {t('services.title', { defaultValue: 'Services' })}
        </Typography>
        <Typography color="text.secondary" sx={{ fontSize: '0.9rem' }}>
          {t('services.subtitle', { defaultValue: 'Activate the services you want to see in the side menu.' })}
        </Typography>
      </Stack>

      <Grid container spacing={2}>
        {services.map((dept) => {
          const Icon = dept.icon;
          const isOn = activated.has(dept.id);
          return (
            <Grid key={dept.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  height: '100%',
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: isOn ? alpha(theme.palette.brand.green, 0.4) : 'divider',
                  backgroundColor: isOn ? alpha(theme.palette.brand.green, 0.04) : theme.palette.background.paper,
                  transition: 'border-color 0.15s ease, background-color 0.15s ease',
                }}
              >
                <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1.5}>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        backgroundColor: alpha(theme.palette.brand.green, isOn ? 0.14 : 0.08),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Icon sx={{ fontSize: 22, color: 'brand.green' }} />
                    </Box>
                    <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                      <Stack direction="row" spacing={0.75} alignItems="center">
                        <Typography fontWeight={600} color="text.primary" noWrap>
                          {t(`departments.${dept.id}.name`, { defaultValue: dept.label })}
                        </Typography>
                        {dept.soon && (
                          <Chip
                            label={t('sidebar.soon', { defaultValue: 'Soon' })}
                            size="small"
                            variant="outlined"
                            sx={{
                              borderColor: alpha(theme.palette.brand.green, 0.4),
                              color: theme.palette.brand.green,
                              fontSize: '0.6rem',
                              height: 16,
                              '& .MuiChip-label': { px: 0.6, py: 0 },
                            }}
                          />
                        )}
                      </Stack>
                      <Typography
                        color="text.secondary"
                        sx={{
                          fontSize: '0.8rem',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {t(`departments.${dept.id}.description`, {
                          defaultValue: t('departments.comingSoonDefault', {
                            defaultValue: 'Activate to add this service to the side menu.',
                          }),
                        })}
                      </Typography>
                    </Stack>
                  </Stack>
                  <Switch
                    checked={isOn}
                    onChange={(e) => setServiceActivated(dept.id, e.target.checked)}
                    color="primary"
                    inputProps={{ 'aria-label': `Activate ${dept.label}` }}
                  />
                </Stack>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default Services;
