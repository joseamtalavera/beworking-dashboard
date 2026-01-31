import Avatar from '@mui/material/Avatar';
import { useTheme } from '@mui/material/styles';
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
import { fetchBloqueos } from '../../api/bookings.js';
import { apiFetch } from '../../api/client.js';

// accentColor removed - using theme.primary.main instead

const quickStats = [
  { id: 'bookings', label: 'Meeting Room bookings', sublabel: 'Today', value: '24' },
  { id: 'desk-bookings', label: 'Desk bookings', sublabel: 'Today', value: '0' },
  { id: 'messages', label: 'New contacts', sublabel: 'Today', value: '8' },
  { id: 'automations', label: 'Active users', sublabel: 'Today', value: '12' }
];

const userQuickStats = [
  { id: 'active-bookings', label: 'Active Bookings', value: '3' },
  { id: 'mail-received', label: 'Mail Received', value: '12' },
  { id: 'monthly-spending', label: 'This Month', value: '€450' }
];

const metricCards = [
  {
    id: 'income-ytd',
    label: 'Income YTD',
    value: '€45.2k',
    helper: '+12.5% vs last year',
    icon: <TrendingUpRoundedIcon />,
    color: 'primary.main'
  },
  {
    id: 'expenditure-ytd',
    label: 'Expenditure YTD',
    value: '€28.7k',
    helper: '+8.3% vs last year',
    icon: <TrendingUpRoundedIcon />,
    color: 'primary.main'
  },
  {
    id: 'income-month',
    label: 'Income this month',
    value: '€8.4k',
    helper: '+15.2% vs last month',
    icon: <TrendingUpRoundedIcon />,
    color: 'primary.main'
  },
  {
    id: 'expenditure-month',
    label: 'Expenditure this month',
    value: '€4.2k',
    helper: '+5.1% vs last month',
    icon: <TrendingUpRoundedIcon />,
    color: 'primary.main'
  },
  {
    id: 'overdue-invoices',
    label: 'Overdue invoices',
    value: '€3.2k',
    helper: '5 invoices pending',
    icon: <TrendingUpRoundedIcon />,
    color: 'warning.main'
  }
];

const userMetricCards = [
  {
    id: 'total-spent-ytd',
    label: 'Total Spent YTD',
    value: '€2.4k',
    helper: '+12.5% vs last year',
    icon: <TrendingUpRoundedIcon />,
    color: 'primary.main'
  },
  {
    id: 'upcoming-payments',
    label: 'Upcoming Payments',
    value: '€180',
    helper: '2 invoices pending',
    icon: <TrendingUpRoundedIcon />,
    color: 'primary.main'
  },
  {
    id: 'last-payment',
    label: 'Last Payment',
    value: '€120',
    helper: 'Paid 3 days ago',
    icon: <TrendingUpRoundedIcon />,
    color: 'primary.main'
  },
  {
    id: 'overdue-invoices',
    label: 'Overdue Invoices',
    value: '€85',
    helper: '1 invoice overdue',
    icon: <TrendingUpRoundedIcon />,
    color: 'primary.main'
  },
  {
    id: 'account-status',
    label: 'Account Status',
    value: 'Active',
    helper: 'All payments current',
    icon: <TrendingUpRoundedIcon />,
    color: 'secondary.main'
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
  const theme = useTheme();

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
                stroke={theme.palette.divider}
                strokeWidth={1}
              />
              <text
                x={padding - 10}
                y={padding + ratio * chartHeight + 4}
                fontSize="10"
                fill={theme.palette.text.secondary}
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
                fill={theme.palette.text.secondary}
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

const Overview = ({ userType = 'admin' }) => {
  const [revenueData, setRevenueData] = useState([]);
  const [expenditureData, setExpenditureData] = useState([]);
  const [overdueData, setOverdueData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [todayBookings, setTodayBookings] = useState(0);
  const [todayDeskBookings, setTodayDeskBookings] = useState(0);
  const [todayNewContacts, setTodayNewContacts] = useState(0);
  const [activeUsersToday, setActiveUsersToday] = useState(0);
  
  // console.log('Overview component state:', { revenueData, expenditureData, overdueData, loading, error, selectedYear, todayBookings });

  const fetchTodayBookings = async () => {
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // Fetch today's bookings for meeting room and desk counts
      const todayBookings = await fetchBloqueos({
        from: todayStr,
        to: todayStr
      });
      
      // Fetch ALL future bookings for active users count
      const allFutureBookings = await fetchBloqueos({
        from: todayStr,
        to: '2030-12-31' // Far future date to get all future bookings
      });
      
      // Filter to only include aula type bookings (Meeting Rooms)
      
      const meetingRoomBookings = Array.isArray(todayBookings) 
        ? todayBookings.filter(booking => {
            // Check if the product name starts with 'MA1A' (Meeting Room codes)
            const productName = booking.producto?.nombre || '';
            return productName.includes('MA1A');
          })
        : [];
      
      const deskBookings = Array.isArray(todayBookings) 
        ? todayBookings.filter(booking => {
            // Check if the product name starts with 'MA1O' (Desk codes) or contains 'desk'
            const productName = booking.producto?.nombre || '';
            const productType = booking.producto?.tipo || '';
            return productName.includes('MA1O') || 
                   productName.toLowerCase().includes('desk') ||
                   productType.toLowerCase().includes('desk');
          })
        : [];
      
      // Fetch today's new contacts
      const contactsResponse = await apiFetch(`/contact-profiles?page=0&size=10000&sort=createdAt,desc`);
      const todayNewContacts = Array.isArray(contactsResponse?.items) 
        ? contactsResponse.items.filter(contact => {
            const contactDate = new Date(contact.createdAt || contact.created_at);
            const contactDateStr = contactDate.toISOString().split('T')[0];
            return contactDateStr === todayStr;
          }).length
        : 0;
      
      // Count active users with future bookings (any type: desks, aulas, oficinas virtuales)
      // Use allFutureBookings which already contains all future bookings
      const futureBookings = Array.isArray(allFutureBookings) ? allFutureBookings : [];
      
      // Get unique user IDs from future bookings (all types)
      const activeUserIds = new Set();
      futureBookings.forEach(booking => {
        if (booking.cliente?.id) {
          activeUserIds.add(booking.cliente.id);
        }
      });
      setTodayBookings(meetingRoomBookings.length);
      setTodayDeskBookings(deskBookings.length);
      setTodayNewContacts(todayNewContacts);
      setActiveUsersToday(activeUserIds.size);
    } catch (error) {
      console.error('Error fetching today\'s bookings:', error);
      setTodayBookings(0);
      setTodayDeskBookings(0);
      setTodayNewContacts(0);
      setActiveUsersToday(0);
    }
  };

  const loadChartData = async (year) => {
    setLoading(true);
    setError('');
    
    try {
      
      // Fetch all invoices for the selected year
      const response = await fetchInvoices({ 
        page: 0, 
        size: 1000, // Get all invoices
        // Don't filter by status - we need all invoices
      });
      
      
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
        
        
        // Check if we have any real data
        const hasRevenueData = revenueArray.some(month => month.value > 0);
        const hasExpenditureData = expenditureArray.some(month => month.value > 0);
        const hasOverdueData = overdueArray.some(month => month.value > 0);
        
        if (hasRevenueData || hasExpenditureData || hasOverdueData) {
          setRevenueData(revenueArray);
          setExpenditureData(expenditureArray);
          setOverdueData(overdueArray);
        } else {
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
    fetchTodayBookings();
  }, [selectedYear]);

  return (
    <Stack spacing={4} sx={{ width: '100%', px: { xs: 1.5, md: 3 }, pb: 4 }}>
      <Box
        sx={{
          display: 'grid',
          gap: { xs: 2, lg: 2 },
          gridTemplateColumns: {
            xs: 'repeat(1, minmax(0, 1fr))',
            sm: 'repeat(2, minmax(0, 1fr))',
            md: 'repeat(4, minmax(0, 1fr))'
          }
        }}
      >
        {(userType === 'user' ? userQuickStats : quickStats).map((stat) => {
          // Use dynamic data for bookings today
          let displayValue = stat.value;
          if (stat.id === 'bookings') {
            displayValue = todayBookings.toString();
          } else if (stat.id === 'desk-bookings') {
            displayValue = todayDeskBookings.toString();
          } else if (stat.id === 'messages') {
            displayValue = todayNewContacts.toString();
          } else if (stat.id === 'automations') {
            displayValue = activeUsersToday.toString();
          }
          return (
            <Paper key={stat.id} elevation={0} sx={{ borderRadius: 4, p: 2, border: '1px solid', borderColor: 'divider', minHeight: 100 }}>
            <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 0.6 }}>
              {stat.label}
            </Typography>
              {stat.sublabel && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  {stat.sublabel}
                </Typography>
              )}
            <Typography variant="h4" fontWeight={700}>
                {displayValue}
            </Typography>
          </Paper>
          );
        })}
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
        {(userType === 'user' ? userMetricCards : metricCards).map((card) => (
          <Paper key={card.id} elevation={0} sx={{ borderRadius: 4, p: 3, border: '1px solid', borderColor: 'divider', minHeight: 150 }}>
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
        <Paper elevation={0} sx={{ borderRadius: 4, p: 3, border: '1px solid', borderColor: 'divider' }}>
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
              <InputLabel sx={{ '&.Mui-focused': { color: 'secondary.main' } }}>Year</InputLabel>
              <Select
                value={selectedYear}
                label="Year"
                onChange={(e) => setSelectedYear(e.target.value)}
                disabled={loading}
                sx={{
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'secondary.main'
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
              sx={{ bgcolor: (theme) => `${theme.palette.success.main}1F`, color: 'success.main' }} 
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
        <Paper elevation={0} sx={{ borderRadius: 4, p: 3, border: '1px solid', borderColor: 'divider' }}>
          <LineChart 
            data={revenueData} 
            loading={loading} 
            title="Revenue" 
            color="secondary.main"
            maxValue={Math.max(...revenueData.map(d => d.value || 0), 1000)}
          />
        </Paper>

        {/* Expenditure Chart */}
        <Paper elevation={0} sx={{ borderRadius: 4, p: 3, border: '1px solid', borderColor: 'divider' }}>
          <LineChart 
            data={expenditureData} 
            loading={loading} 
            title="Expenditure" 
            color="secondary.main"
            maxValue={Math.max(...expenditureData.map(d => d.value || 0), 1000)}
          />
        </Paper>

        {/* Overdue Invoices Chart */}
        <Paper elevation={0} sx={{ borderRadius: 4, p: 3, border: '1px solid', borderColor: 'divider' }}>
          <LineChart 
            data={overdueData} 
            loading={loading} 
            title="Overdue Invoices" 
            color="warning.main"
            maxValue={Math.max(...overdueData.map(d => d.value || 0), 1000)}
          />
        </Paper>
      </Box>

      {/* Workspace Occupancy - Admin Only */}
      {userType === 'admin' && (
        <Paper elevation={0} sx={{ borderRadius: 4, p: 3, border: '1px solid', borderColor: 'divider' }}>
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
                    sx={{ height: 6, borderRadius: 999, bgcolor: 'grey.100', '& .MuiLinearProgress-bar': { bgcolor: 'success.main' } }}
                  />
                </Box>
              ))}
            </Stack>
          </Paper>
      )}

    </Stack>
  );
};

export default Overview;
