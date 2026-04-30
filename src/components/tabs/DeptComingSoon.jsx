import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { DEPT_TABS } from '../../constants.js';

const DeptComingSoon = ({ deptId }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const dept = DEPT_TABS.find(d => d.id === deptId)
    || DEPT_TABS.flatMap(d => d.subtabs || []).find(s => s.id === deptId);
  const Icon = dept?.icon;

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          p: 5,
          border: '1px solid',
          borderColor: 'divider',
          textAlign: 'center',
          maxWidth: 420,
        }}
      >
        {Icon && (
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              backgroundColor: alpha(theme.palette.primary.main, 0.08),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
            }}
          >
            <Icon sx={{ fontSize: 32, color: 'brand.green' }} />
          </Box>
        )}
        <Typography variant="h5" fontWeight="bold" color="text.primary" sx={{ mb: 1 }}>
          {t(`departments.${deptId}.name`, { defaultValue: deptId })}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          {t(`departments.${deptId}.description`, { defaultValue: t('departments.comingSoonDefault') })}
        </Typography>
        <Typography variant="caption" color="text.disabled">
          {t('departments.beingSetUp')}
        </Typography>
      </Paper>
    </Box>
  );
};

export default DeptComingSoon;
