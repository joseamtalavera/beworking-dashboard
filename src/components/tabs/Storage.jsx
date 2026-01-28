import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import FolderIcon from '@mui/icons-material/FolderOutlined';
import ImageIcon from '@mui/icons-material/ImageOutlined';
import MovieIcon from '@mui/icons-material/MovieOutlined';
import ArchiveIcon from '@mui/icons-material/ArchiveOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVertOutlined';

// accentColor is defined inside component using theme.palette.brand.orange


const StatCard = ({ title, value, icon }) => (
  <Card elevation={2} sx={{ borderRadius: 3 }}>
    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: '50%' }}>{icon}</Box>
      <Box>
        <Typography variant="body2" color="text.secondary">{title}</Typography>
        <Typography variant="h5" fontWeight="bold" color="text.primary">{value}</Typography>
      </Box>
    </CardContent>
  </Card>
);

const FileTypeIcon = ({ type }) => {
  switch (type) {
    case 'doc':
      return <FolderIcon sx={{ color: accentColor }} />;
    case 'img':
      return <ImageIcon sx={{ color: accentColor }} />;
    case 'vid':
      return <MovieIcon sx={{ color: accentColor }} />;
    case 'zip':
      return <ArchiveIcon sx={{ color: accentColor }} />;
    default:
      return null;
  }
};

const FileRow = ({ name, size, date, typeIcon }) => (
  <TableRow hover>
    <TableCell>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {typeIcon}
        <Typography fontWeight="medium" color="text.primary">{name}</Typography>
      </Box>
    </TableCell>
    <TableCell>{size}</TableCell>
    <TableCell>{date}</TableCell>
    <TableCell align="right">
      <IconButton>
        <MoreVertIcon sx={{ color: 'grey.400' }} />
      </IconButton>
    </TableCell>
  </TableRow>
);

const Storage = () => {
  const theme = useTheme();
  const accentColor = theme.palette.brand.orange;
  return (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 3 }}>
      <StatCard title="Total Space" value="500 GB" icon={<FolderIcon sx={{ color: accentColor, fontSize: 32 }} />} />
      <StatCard title="Used Space" value="128.5 GB" icon={<ArchiveIcon sx={{ color: accentColor, fontSize: 32 }} />} />
      <StatCard
        title="Files"
        value="2,480"
        icon={(
          <Box
            component="svg"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            sx={{ width: 24, height: 24, color: accentColor }}
          >
            <path
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Box>
        )}
      />
      <StatCard
        title="Folders"
        value="125"
        icon={(
          <Box
            component="svg"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            sx={{ width: 24, height: 24, color: accentColor }}
          >
            <path
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Box>
        )}
      />
    </Box>
    <Card elevation={2} sx={{ borderRadius: 3, overflow: 'hidden' }}>
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb' }}>
        <Typography variant="h6" fontWeight="bold" color="text.primary">Recent Files</Typography>
        <Button
          variant="contained"
          sx={{
            borderRadius: 2,
            fontWeight: 600,
            bgcolor: accentColor,
            '&:hover': { bgcolor: '#f97316' }
          }}
        >
          Upload File
        </Button>
      </Box>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Size</TableCell>
              <TableCell>Last Modified</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <FileRow name="Report.docx" size="1.2 MB" date="2025-09-18" typeIcon={<FileTypeIcon type="doc" />} />
            <FileRow name="Photo.png" size="2.4 MB" date="2025-09-17" typeIcon={<FileTypeIcon type="img" />} />
            <FileRow name="Video.mp4" size="15 MB" date="2025-09-16" typeIcon={<FileTypeIcon type="vid" />} />
            <FileRow name="Archive.zip" size="8 MB" date="2025-09-15" typeIcon={<FileTypeIcon type="zip" />} />
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  </Box>
);
};

export default Storage;
