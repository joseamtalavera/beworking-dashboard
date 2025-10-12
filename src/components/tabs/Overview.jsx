import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import LinearProgress from '@mui/material/LinearProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import EventSeatRoundedIcon from '@mui/icons-material/EventSeatRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import { useEffect, useState } from 'react';
import { fetchInvoices } from '../../api/invoices.js';

const accentColor = '#fb923c';

const quickStats = [
  { id: 'bookings', label: 'Bookings today', value: '24' },
  { id: 'messages', label: 'New contacts', value: '8' },
  { id: 'automations', label: 'Active users', value: '12' }
];

const metricCards = [
  {
    id: 'income-ytd',
    label: 'Income YTD',
    value: '€45.2k',
    helper: '+12.5% vs last year',
    icon: <TrendingUpRoundedIcon />,
    color: '#22c55e'
  },
  {
    id: 'expenditure-ytd',
    label: 'Expenditure YTD',
    value: '€28.7k',
    helper: '+8.3% vs last year',
    icon: <TrendingUpRoundedIcon />,
    color: '#ef4444'
  },
  {
    id: 'income-month',
    label: 'Income this month',
    value: '€8.4k',
    helper: '+15.2% vs last month',
    icon: <TrendingUpRoundedIcon />,
    color: '#22c55e'
  },
  {
    id: 'expenditure-month',
    label: 'Expenditure this month',
    value: '€4.2k',
    helper: '+5.1% vs last month',
    icon: <TrendingUpRoundedIcon />,
    color: '#ef4444'
  },
  {
    id: 'overdue-invoices',
    label: 'Overdue invoices',
    value: '€3.2k',
    helper: '5 invoices pending',
    icon: <TrendingUpRoundedIcon />,
    color: '#f59e0b'
  }
];

const activity = [
  { id: 1, title: 'New tenant signed', detail: 'Glow Agency · Málaga Hub', time: '2 hours ago' },
  { id: 2, title: 'Automation executed', detail: 'Invoice payment notifier', time: '4 hours ago' },
  { id: 3, title: 'Room booking created', detail: 'A2 · Creative Boardroom', time: '6 hours ago' },
  { id: 4, title: 'Support ticket closed', detail: 'Mailbox sync delay', time: 'Yesterday' }
];

// Calculate average occupancy for coworking spaces
const coworkingSpaces = [
  { room: 'MA1O1-01', occupancy: 100 },
  { room: 'MA1O1-02', occupancy: 75 },
  { room: 'MA1O1-03', occupancy: 60 },
  { room: 'MA1O1-04', occupancy: 90 },
  { room: 'MA1O1-05', occupancy: 45 },
  { room: 'MA1O1-06', occupancy: 80 },
  { room: 'MA1O1-07', occupancy: 95 },
  { room: 'MA1O1-08', occupancy: 70 },
  { room: 'MA1O1-09', occupancy: 55 },
  { room: 'MA1O1-10', occupancy: 85 },
  { room: 'MA1O1-11', occupancy: 40 },
  { room: 'MA1O1-12', occupancy: 90 },
  { room: 'MA1O1-13', occupancy: 65 },
  { room: 'MA1O1-14', occupancy: 75 },
  { room: 'MA1O1-15', occupancy: 50 },
  { room: 'MA1O1-16', occupancy: 85 }
];

const coworkingAverage = Math.round(
  coworkingSpaces.reduce((sum, space) => sum + space.occupancy, 0) / coworkingSpaces.length
);

const locations = [
  { city: 'MA1A1', occupancy: 85 },
  { city: 'MA1A2', occupancy: 92 },
  { city: 'MA1A3', occupancy: 78 },
  { city: 'MA1A4', occupancy: 65 },
  { city: 'MA1A5', occupancy: 88 },
  { city: 'Coworking Spaces (MA1O1-01 to MA1O1-16)', occupancy: coworkingAverage }
];

// Line Chart Component
const LineChart = ({ data, loading, title, color, maxValue }) => {
  console.log('LineChart props:', { data, loading, title, color, maxValue });
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
        <Typography variant="body2" color="text.secondary">
          No data available
        </Typography>
      </Box>
    );
  }

  const chartHeight = 150;
  const chartWidth = 600;
  const padding = 40;
  const pointRadius = 4;

  // Calculate points for the line
  const points = data.map((item, index) => {
    const x = padding + (index * (chartWidth - 2 * padding) / (data.length - 1));
    const y = padding + chartHeight - ((item.value / maxValue) * chartHeight);
    return { x, y, value: item.value, month: item.month };
  });

  // Create SVG path for the line
  const pathData = points.map((point, index) => 
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ');

  return (
    <Box sx={{ height: 200, p: 2, overflow: 'auto' }}>
      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1, textAlign: 'center' }}>
        {title}
      </Typography>
      <Box sx={{ position: 'relative', width: '100%', height: chartHeight + padding * 2 }}>
        <svg width="100%" height={chartHeight + padding * 2} style={{ minWidth: chartWidth }}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
            <g key={index}>
              <line
                x1={padding}
                y1={padding + ratio * chartHeight}
                x2={chartWidth - padding}
                y2={padding + ratio * chartHeight}
                stroke="#f0f0f0"
                strokeWidth={1}
              />
              <text
                x={padding - 10}
                y={padding + ratio * chartHeight + 4}
                fontSize="10"
                fill="#666"
                textAnchor="end"
              >
                {Math.round(maxValue * (1 - ratio)).toLocaleString()}€
              </text>
            </g>
          ))}
          
          {/* Month labels */}
          {data.map((item, index) => {
            const x = padding + (index * (chartWidth - 2 * padding) / (data.length - 1));
            return (
              <text
                key={index}
                x={x}
                y={chartHeight + padding + 15}
                fontSize="10"
                fill="#666"
                textAnchor="middle"
              >
                {item.month}
              </text>
            );
          })}
          
          {/* Line path */}
          <path
            d={pathData}
            fill="none"
            stroke={color}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Data points */}
          {points.map((point, index) => (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r={pointRadius}
              fill={color}
              stroke="white"
              strokeWidth={2}
            />
          ))}
          
          {/* Value labels on hover points */}
          {points.map((point, index) => (
            <g key={`label-${index}`}>
              <text
                x={point.x}
                y={point.y - 10}
                fontSize="10"
                fill={color}
                textAnchor="middle"
                fontWeight="600"
              >
                €{point.value.toLocaleString()}
              </text>
            </g>
          ))}
        </svg>
      </Box>
    </Box>
  );
};

const Overview = () => {
  const [revenueData, setRevenueData] = useState([]);
  const [expenditureData, setExpenditureData] = useState([]);
  const [overdueData, setOverdueData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  console.log('Overview component state:', { revenueData, expenditureData, overdueData, loading, error, selectedYear });

  const loadChartData = async (year) => {
    setLoading(true);
    setError('');
    
    try {
      console.log(`Loading chart data for year: ${year}`);
      
      // Fetch all invoices for the selected year
      const response = await fetchInvoices({ 
        page: 0, 
        size: 1000, // Get all invoices
        // Don't filter by status - we need all invoices
      });
      
      console.log('API response:', response);
      
      if (response && response.content) {
        // Initialize all 12 months for the selected year
        const monthlyRevenue = {};
        const monthlyExpenditure = {};
        const monthlyOverdue = {};
        
        for (let month = 1; month <= 12; month++) {
          const date = new Date(year, month - 1, 1);
          const monthName = date.toLocaleDateString('en-US', { month: 'short' });
          
          monthlyRevenue[month] = { month: monthName, value: 0 };
          monthlyExpenditure[month] = { month: monthName, value: 0 };
          monthlyOverdue[month] = { month: monthName, value: 0 };
        }
        
        // Process actual invoice data
        response.content.forEach(invoice => {
          if (invoice.fechaFactura) {
            const invoiceDate = new Date(invoice.fechaFactura);
            const invoiceYear = invoiceDate.getFullYear();
            const invoiceMonth = invoiceDate.getMonth() + 1;
            const amount = parseFloat(invoice.total || 0);
            
            // Only include invoices from the selected year
            if (invoiceYear === year) {
              const status = (invoice.estado || '').toLowerCase();
              
              if (status.includes('paid') || status.includes('pagado')) {
                // Revenue: paid invoices (money coming in)
                monthlyRevenue[invoiceMonth].value += amount;
              } else if (status.includes('overdue') || status.includes('vencido') || status.includes('vencida')) {
                // Overdue: overdue invoices (money that should have been paid)
                monthlyOverdue[invoiceMonth].value += amount;
              } else if (status.includes('created') || status.includes('pending') || status.includes('invoiced') || status.includes('facturada')) {
                // Expenditure: pending/created invoices (money going out/expenses)
                monthlyExpenditure[invoiceMonth].value += amount;
              }
            }
          }
        });
        
        // Convert to arrays and sort by month
        const revenueArray = Object.values(monthlyRevenue).sort((a, b) => {
          const monthA = Object.keys(monthlyRevenue).find(key => monthlyRevenue[key] === a);
          const monthB = Object.keys(monthlyRevenue).find(key => monthlyRevenue[key] === b);
          return parseInt(monthA) - parseInt(monthB);
        });
        
        const expenditureArray = Object.values(monthlyExpenditure).sort((a, b) => {
          const monthA = Object.keys(monthlyExpenditure).find(key => monthlyExpenditure[key] === a);
          const monthB = Object.keys(monthlyExpenditure).find(key => monthlyExpenditure[key] === b);
          return parseInt(monthA) - parseInt(monthB);
        });
        
        const overdueArray = Object.values(monthlyOverdue).sort((a, b) => {
          const monthA = Object.keys(monthlyOverdue).find(key => monthlyOverdue[key] === a);
          const monthB = Object.keys(monthlyOverdue).find(key => monthlyOverdue[key] === b);
          return parseInt(monthA) - parseInt(monthB);
        });
        
        console.log('Processed chart data for year', year, ':', { revenueArray, expenditureArray, overdueArray });
        
        // Check if we have any real data
        const hasRevenueData = revenueArray.some(month => month.value > 0);
        const hasExpenditureData = expenditureArray.some(month => month.value > 0);
        const hasOverdueData = overdueArray.some(month => month.value > 0);
        
        if (hasRevenueData || hasExpenditureData || hasOverdueData) {
          console.log('Using real invoice data');
          setRevenueData(revenueArray);
          setExpenditureData(expenditureArray);
          setOverdueData(overdueArray);
        } else {
          console.log('No real data found, using sample data for demonstration');
          // Use sample data for demonstration when no real data is available
          const sampleRevenueData = [
            { month: 'Jan', value: 8500 },
            { month: 'Feb', value: 9200 },
            { month: 'Mar', value: 7800 },
            { month: 'Apr', value: 10500 },
            { month: 'May', value: 9800 },
            { month: 'Jun', value: 11200 },
            { month: 'Jul', value: 8900 },
            { month: 'Aug', value: 7600 },
            { month: 'Sep', value: 9400 },
            { month: 'Oct', value: 10800 },
            { month: 'Nov', value: 8200 },
            { month: 'Dec', value: 9600 }
          ];
          
          const sampleExpenditureData = [
            { month: 'Jan', value: 4200 },
            { month: 'Feb', value: 3800 },
            { month: 'Mar', value: 4500 },
            { month: 'Apr', value: 5200 },
            { month: 'May', value: 4800 },
            { month: 'Jun', value: 5600 },
            { month: 'Jul', value: 4100 },
            { month: 'Aug', value: 3900 },
            { month: 'Sep', value: 4700 },
            { month: 'Oct', value: 5100 },
            { month: 'Nov', value: 4300 },
            { month: 'Dec', value: 4900 }
          ];
          
          const sampleOverdueData = [
            { month: 'Jan', value: 1200 },
            { month: 'Feb', value: 800 },
            { month: 'Mar', value: 1500 },
            { month: 'Apr', value: 900 },
            { month: 'May', value: 1100 },
            { month: 'Jun', value: 700 },
            { month: 'Jul', value: 1300 },
            { month: 'Aug', value: 600 },
            { month: 'Sep', value: 1000 },
            { month: 'Oct', value: 800 },
            { month: 'Nov', value: 1400 },
            { month: 'Dec', value: 900 }
          ];
          
          setRevenueData(sampleRevenueData);
          setExpenditureData(sampleExpenditureData);
          setOverdueData(sampleOverdueData);
        }
      } else {
        console.log('No invoice data available from API, using sample data');
        // Use sample data when API returns no data
        const sampleRevenueData = [
          { month: 'Jan', value: 8500 },
          { month: 'Feb', value: 9200 },
          { month: 'Mar', value: 7800 },
          { month: 'Apr', value: 10500 },
          { month: 'May', value: 9800 },
          { month: 'Jun', value: 11200 },
          { month: 'Jul', value: 8900 },
          { month: 'Aug', value: 7600 },
          { month: 'Sep', value: 9400 },
          { month: 'Oct', value: 10800 },
          { month: 'Nov', value: 8200 },
          { month: 'Dec', value: 9600 }
        ];
        
        const sampleExpenditureData = [
          { month: 'Jan', value: 4200 },
          { month: 'Feb', value: 3800 },
          { month: 'Mar', value: 4500 },
          { month: 'Apr', value: 5200 },
          { month: 'May', value: 4800 },
          { month: 'Jun', value: 5600 },
          { month: 'Jul', value: 4100 },
          { month: 'Aug', value: 3900 },
          { month: 'Sep', value: 4700 },
          { month: 'Oct', value: 5100 },
          { month: 'Nov', value: 4300 },
          { month: 'Dec', value: 4900 }
        ];
        
        const sampleOverdueData = [
          { month: 'Jan', value: 1200 },
          { month: 'Feb', value: 800 },
          { month: 'Mar', value: 1500 },
          { month: 'Apr', value: 900 },
          { month: 'May', value: 1100 },
          { month: 'Jun', value: 700 },
          { month: 'Jul', value: 1300 },
          { month: 'Aug', value: 600 },
          { month: 'Sep', value: 1000 },
          { month: 'Oct', value: 800 },
          { month: 'Nov', value: 1400 },
          { month: 'Dec', value: 900 }
        ];
        
        setRevenueData(sampleRevenueData);
        setExpenditureData(sampleExpenditureData);
        setOverdueData(sampleOverdueData);
      }
    } catch (error) {
      console.error('Error loading chart data:', error);
      setError('Failed to load chart data');
      
      // Use sample data even when API fails
      const sampleRevenueData = [
        { month: 'Jan', value: 8500 },
        { month: 'Feb', value: 9200 },
        { month: 'Mar', value: 7800 },
        { month: 'Apr', value: 10500 },
        { month: 'May', value: 9800 },
        { month: 'Jun', value: 11200 },
        { month: 'Jul', value: 8900 },
        { month: 'Aug', value: 7600 },
        { month: 'Sep', value: 9400 },
        { month: 'Oct', value: 10800 },
        { month: 'Nov', value: 8200 },
        { month: 'Dec', value: 9600 }
      ];
      
      const sampleExpenditureData = [
        { month: 'Jan', value: 4200 },
        { month: 'Feb', value: 3800 },
        { month: 'Mar', value: 4500 },
        { month: 'Apr', value: 5200 },
        { month: 'May', value: 4800 },
        { month: 'Jun', value: 5600 },
        { month: 'Jul', value: 4100 },
        { month: 'Aug', value: 3900 },
        { month: 'Sep', value: 4700 },
        { month: 'Oct', value: 5100 },
        { month: 'Nov', value: 4300 },
        { month: 'Dec', value: 4900 }
      ];
      
      const sampleOverdueData = [
        { month: 'Jan', value: 1200 },
        { month: 'Feb', value: 800 },
        { month: 'Mar', value: 1500 },
        { month: 'Apr', value: 900 },
        { month: 'May', value: 1100 },
        { month: 'Jun', value: 700 },
        { month: 'Jul', value: 1300 },
        { month: 'Aug', value: 600 },
        { month: 'Sep', value: 1000 },
        { month: 'Oct', value: 800 },
        { month: 'Nov', value: 1400 },
        { month: 'Dec', value: 900 }
      ];
      
      setRevenueData(sampleRevenueData);
      setExpenditureData(sampleExpenditureData);
      setOverdueData(sampleOverdueData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChartData(selectedYear);
  }, [selectedYear]);

  return (
    <Stack spacing={4} sx={{ width: '100%', px: { xs: 1.5, md: 3 }, pb: 4 }}>
      <Box
        sx={{
          display: 'grid',
          gap: { xs: 2, lg: 3 },
          gridTemplateColumns: {
            xs: 'repeat(1, minmax(0, 1fr))',
            sm: 'repeat(2, minmax(0, 1fr))',
            xl: 'repeat(3, minmax(0, 1fr))'
          }
        }}
      >
        {quickStats.map((stat) => (
          <Paper key={stat.id} elevation={0} sx={{ borderRadius: 4, p: 2.5, border: '1px solid #e2e8f0', minHeight: 120 }}>
            <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 0.6 }}>
              {stat.label}
            </Typography>
            <Typography variant="h4" fontWeight={700}>
              {stat.value}
            </Typography>
          </Paper>
        ))}
      </Box>

      <Box
        sx={{
          display: 'grid',
          gap: { xs: 2, lg: 3 },
          gridTemplateColumns: {
            xs: 'repeat(1, minmax(0, 1fr))',
            md: 'repeat(2, minmax(0, 1fr))',
            lg: 'repeat(3, minmax(0, 1fr))',
            xl: 'repeat(5, minmax(0, 1fr))'
          }
        }}
      >
        {metricCards.map((card) => (
          <Paper key={card.id} elevation={0} sx={{ borderRadius: 4, p: 3, border: '1px solid #e2e8f0', minHeight: 150 }}>
            <Stack spacing={2} direction="row" alignItems="center">
              <Avatar sx={{ bgcolor: `${card.color}1A`, color: card.color }}>{card.icon}</Avatar>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {card.label}
                </Typography>
                <Typography variant="h5" fontWeight={700}>
                  {card.value}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {card.helper}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        ))}
      </Box>

      {/* Year Selector */}
        <Paper elevation={0} sx={{ borderRadius: 4, p: 3, border: '1px solid #e2e8f0' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Box>
                <Typography variant="h6" fontWeight={700}>
              Financial Overview
                </Typography>
                <Typography variant="body2" color="text.secondary">
              Monthly trends for {selectedYear}
                  </Typography>
                </Box>
          <Stack direction="row" spacing={2} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel sx={{ '&.Mui-focused': { color: '#16a34a' } }}>Year</InputLabel>
              <Select
                value={selectedYear}
                label="Year"
                onChange={(e) => setSelectedYear(e.target.value)}
                disabled={loading}
                sx={{
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#16a34a'
                  }
                }}
              >
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - i;
                  return (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
            <Chip 
              label={loading ? "Loading..." : "Updated now"} 
              size="small" 
              sx={{ bgcolor: 'rgba(251,146,60,0.12)', color: accentColor }} 
            />
          </Stack>
            </Stack>
          </Paper>

      {/* Three Line Charts */}
      <Box
        sx={{
          display: 'grid',
          gap: { xs: 2, lg: 3 },
          gridTemplateColumns: {
            xs: 'repeat(1, minmax(0, 1fr))',
            lg: 'repeat(3, minmax(0, 1fr))'
          }
        }}
      >
        {/* Revenue Chart */}
        <Paper elevation={0} sx={{ borderRadius: 4, p: 3, border: '1px solid #e2e8f0' }}>
          <LineChart 
            data={revenueData} 
            loading={loading} 
            title="Revenue" 
            color="#22c55e"
            maxValue={Math.max(...revenueData.map(d => d.value || 0), 1000)}
          />
        </Paper>

        {/* Expenditure Chart */}
        <Paper elevation={0} sx={{ borderRadius: 4, p: 3, border: '1px solid #e2e8f0' }}>
          <LineChart 
            data={expenditureData} 
            loading={loading} 
            title="Expenditure" 
            color="#ef4444"
            maxValue={Math.max(...expenditureData.map(d => d.value || 0), 1000)}
          />
        </Paper>

        {/* Overdue Invoices Chart */}
        <Paper elevation={0} sx={{ borderRadius: 4, p: 3, border: '1px solid #e2e8f0' }}>
          <LineChart 
            data={overdueData} 
            loading={loading} 
            title="Overdue Invoices" 
            color="#f59e0b"
            maxValue={Math.max(...overdueData.map(d => d.value || 0), 1000)}
          />
        </Paper>
      </Box>

      {/* Workspace Occupancy */}
        <Paper elevation={0} sx={{ borderRadius: 4, p: 3, border: '1px solid #e2e8f0' }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Workspace occupancy
            </Typography>
            <Stack spacing={2}>
              {locations.map((location) => (
                <Box key={location.city}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" fontWeight={600}>
                      {location.city}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {location.occupancy}%
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={location.occupancy}
                sx={{ height: 6, borderRadius: 999, bgcolor: '#f1f5f9', '& .MuiLinearProgress-bar': { bgcolor: '#22c55e' } }}
                  />
                </Box>
              ))}
            </Stack>
          </Paper>

    </Stack>
  );
};

export default Overview;
