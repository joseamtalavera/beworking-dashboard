import { useTranslation } from 'react-i18next';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

const GenericCard = ({ title, children }) => (
  <Paper elevation={0} sx={{ borderRadius: 3, p: 3, border: '1px solid', borderColor: 'divider' }}>
    <Typography variant="h6" fontWeight="bold" color="text.primary" sx={{ mb: 2 }}>
      {title}
    </Typography>
    {children}
  </Paper>
);

const Community = () => {
  const { t } = useTranslation();
  return (
    <GenericCard title={t('stubs.community.title')}>
      <Typography color="text.secondary">
        {t('stubs.community.description')}
      </Typography>
    </GenericCard>
  );
};

export default Community;
