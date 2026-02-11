import Box from '@mui/material/Box';

const SpiralLoader = ({ size = 48 }) => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      py: 10,
    }}
  >
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: '3px solid transparent',
        borderTopColor: '#22c55e',
        borderRightColor: 'rgba(34,197,94,0.4)',
        borderBottomColor: 'rgba(34,197,94,0.1)',
        animation: 'spiral-spin 0.8s cubic-bezier(0.5,0,0.5,1) infinite',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 5,
          borderRadius: '50%',
          border: '3px solid transparent',
          borderTopColor: '#4ade80',
          borderRightColor: 'rgba(74,222,128,0.3)',
          animation: 'spiral-spin 0.6s cubic-bezier(0.5,0,0.5,1) infinite reverse',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: 13,
          borderRadius: '50%',
          border: '2px solid transparent',
          borderTopColor: '#86efac',
          animation: 'spiral-spin 0.45s linear infinite',
        },
        '@keyframes spiral-spin': {
          to: { transform: 'rotate(360deg)' },
        },
      }}
    />
  </Box>
);

export default SpiralLoader;
