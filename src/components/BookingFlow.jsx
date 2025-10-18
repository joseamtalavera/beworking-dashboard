import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardMedia,
  CardContent,
  Chip,
  IconButton,
  InputAdornment,
  Tabs,
  Tab,
  Grid,
  Stack,
  Paper,
  Avatar,
  Rating,
  Divider,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  LocationOnRounded as LocationIcon,
  CalendarTodayRounded as CalendarIcon,
  PeopleRounded as PeopleIcon,
  EuroRounded as EuroIcon,
  BusinessRounded as BusinessIcon,
  SortRounded as SortIcon,
  FilterListRounded as FilterIcon,
  FavoriteBorderRounded as FavoriteIcon,
  NavigateBeforeRounded as ArrowLeftIcon,
  NavigateNextRounded as ArrowRightIcon,
  StarRounded as StarIcon,
  HomeRounded as HomeIcon
} from '@mui/icons-material';

// Mock data for demonstration
const mockRooms = [
  {
    id: 1,
    name: "Edge5",
    description: "Sitzungszimmer",
    image: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop",
    capacity: "1-10",
    rating: 4.9,
    reviewCount: 136,
    type: "Meeting room",
    price: "CHF 25",
    priceUnit: "/h",
    location: "Zurich",
    tags: ["Hero Space"],
    instantBooking: true
  },
  {
    id: 2,
    name: "M40 Workspace",
    description: "Meeting & Workshop Room in Loft",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop",
    capacity: "1-15",
    rating: 4.8,
    reviewCount: 89,
    type: "Meeting room",
    price: "€ 8",
    priceUnit: "/h",
    location: "Berlin",
    tags: [],
    instantBooking: true
  },
  {
    id: 3,
    name: "Delinat-Weinshop",
    description: "Meeting room in wine store near HB Zurich",
    image: "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=400&h=300&fit=crop",
    capacity: "1-8",
    rating: 4.7,
    reviewCount: 45,
    type: "Meeting room",
    price: "CHF 30",
    priceUnit: "/h",
    location: "Zurich",
    tags: [],
    instantBooking: false
  },
  {
    id: 4,
    name: "Creative Hub",
    description: "Modern workspace with natural light",
    image: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=400&h=300&fit=crop",
    capacity: "1-12",
    rating: 4.9,
    reviewCount: 203,
    type: "Meeting room",
    price: "€ 15",
    priceUnit: "/h",
    location: "Munich",
    tags: ["Hero Space"],
    instantBooking: true
  }
];

const BookingFlow = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [location, setLocation] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [people, setPeople] = useState('');
  const [price, setPrice] = useState('');
  const [spaceType, setSpaceType] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [peopleAnchor, setPeopleAnchor] = useState(null);
  const [priceAnchor, setPriceAnchor] = useState(null);
  const [spaceTypeAnchor, setSpaceTypeAnchor] = useState(null);
  const [sortAnchor, setSortAnchor] = useState(null);
  const [filterAnchor, setFilterAnchor] = useState(null);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleFilterClick = (event, setAnchor) => {
    setAnchor(event.currentTarget);
  };

  const handleFilterClose = (setAnchor) => {
    setAnchor(null);
  };

  const filteredRooms = useMemo(() => {
    return mockRooms.filter(room => {
      if (location && !room.location.toLowerCase().includes(location.toLowerCase())) {
        return false;
      }
      if (people && parseInt(people) > parseInt(room.capacity.split('-')[1])) {
        return false;
      }
      return true;
    });
  }, [location, people]);

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <Box sx={{ 
        backgroundColor: 'white', 
        borderBottom: '1px solid #e2e8f0',
        px: 3,
        py: 2
      }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" fontWeight={700} color="primary">
            beworking
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button variant="outlined" sx={{ textTransform: 'none' }}>
              Book a space
            </Button>
            <Button variant="outlined" sx={{ textTransform: 'none' }}>
              Business
            </Button>
            <Button variant="outlined" sx={{ textTransform: 'none' }}>
              List your venue
            </Button>
            <Button variant="outlined" sx={{ textTransform: 'none' }}>
              Sign up
            </Button>
            <Button variant="contained" sx={{ textTransform: 'none' }}>
              Login
            </Button>
          </Stack>
        </Stack>
      </Box>

      <Box sx={{ maxWidth: '1400px', mx: 'auto', px: 3, py: 4 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link color="inherit" href="#" sx={{ display: 'flex', alignItems: 'center' }}>
            <HomeIcon sx={{ mr: 0.5, fontSize: 16 }} />
            Home
          </Link>
          <Typography color="text.primary">Meeting room</Typography>
        </Breadcrumbs>

        {/* Page Title */}
        <Typography variant="h3" fontWeight={700} sx={{ mb: 1 }}>
          Meeting room rent online - {filteredRooms.length}+ unique locations
        </Typography>

        {/* Search and Filter Section */}
        <Paper 
          elevation={0}
          sx={{ 
            p: 3, 
            mb: 4, 
            borderRadius: 3,
            border: '1px solid #e2e8f0',
            backgroundColor: 'white'
          }}
        >
          {/* Category Tabs */}
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            sx={{ 
              mb: 3,
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                minHeight: 48
              }
            }}
          >
            <Tab label="All" />
            <Tab label="Meet & Work" />
            <Tab label="Event" />
            <Tab label="Convention" />
          </Tabs>

          {/* Search Fields */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Where:"
                placeholder="Let's meet in Berlin, Paris, NYC, ..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <LocationIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'white'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Check in"
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <CalendarIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'white'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Check out"
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <CalendarIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'white'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="contained"
                sx={{ 
                  height: 56,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  backgroundColor: '#fb923c',
                  '&:hover': {
                    backgroundColor: '#ea580c'
                  }
                }}
              >
                Search
              </Button>
            </Grid>
          </Grid>

          {/* Filter Buttons */}
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <Button
              variant="outlined"
              startIcon={<PeopleIcon />}
              onClick={(e) => handleFilterClick(e, setPeopleAnchor)}
              sx={{ 
                borderRadius: 2,
                textTransform: 'none',
                borderColor: '#e2e8f0',
                color: 'text.secondary',
                '&:hover': {
                  borderColor: '#fb923c',
                  color: '#fb923c'
                }
              }}
            >
              People {people && `(${people})`}
            </Button>
            <Button
              variant="outlined"
              startIcon={<EuroIcon />}
              onClick={(e) => handleFilterClick(e, setPriceAnchor)}
              sx={{ 
                borderRadius: 2,
                textTransform: 'none',
                borderColor: '#e2e8f0',
                color: 'text.secondary',
                '&:hover': {
                  borderColor: '#fb923c',
                  color: '#fb923c'
                }
              }}
            >
              € Price {price && `(${price})`}
            </Button>
            <Button
              variant="outlined"
              startIcon={<BusinessIcon />}
              onClick={(e) => handleFilterClick(e, setSpaceTypeAnchor)}
              sx={{ 
                borderRadius: 2,
                textTransform: 'none',
                borderColor: '#e2e8f0',
                color: 'text.secondary',
                '&:hover': {
                  borderColor: '#fb923c',
                  color: '#fb923c'
                }
              }}
            >
              Space types {spaceType && `(${spaceType})`}
            </Button>
            <Button
              variant="outlined"
              startIcon={<SortIcon />}
              onClick={(e) => handleFilterClick(e, setSortAnchor)}
              sx={{ 
                borderRadius: 2,
                textTransform: 'none',
                borderColor: '#e2e8f0',
                color: 'text.secondary',
                '&:hover': {
                  borderColor: '#fb923c',
                  color: '#fb923c'
                }
              }}
            >
              Sort {sortBy && `(${sortBy})`}
            </Button>
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={(e) => handleFilterClick(e, setFilterAnchor)}
              sx={{ 
                borderRadius: 2,
                textTransform: 'none',
                borderColor: '#e2e8f0',
                color: 'text.secondary',
                '&:hover': {
                  borderColor: '#fb923c',
                  color: '#fb923c'
                }
              }}
            >
              More filters
            </Button>
          </Stack>
        </Paper>

        {/* Room Listings */}
        <Grid container spacing={3}>
          {filteredRooms.map((room) => (
            <Grid item xs={12} sm={6} md={4} key={room.id}>
              <Card 
                sx={{ 
                  borderRadius: 3,
                  overflow: 'hidden',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1)'
                  }
                }}
              >
                {/* Image */}
                <Box sx={{ position: 'relative' }}>
                  <CardMedia
                    component="img"
                    height="200"
                    image={room.image}
                    alt={room.name}
                  />
                  
                  {/* Tags */}
                  <Stack 
                    direction="row" 
                    spacing={1} 
                    sx={{ 
                      position: 'absolute', 
                      top: 12, 
                      left: 12 
                    }}
                  >
                    {room.tags.map((tag, index) => (
                      <Chip
                        key={index}
                        label={tag}
                        size="small"
                        sx={{
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          color: 'text.primary',
                          fontWeight: 500,
                          fontSize: '0.75rem'
                        }}
                      />
                    ))}
                    {room.instantBooking && (
                      <Chip
                        label="Instant booking"
                        size="small"
                        sx={{
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          color: 'text.primary',
                          fontWeight: 500,
                          fontSize: '0.75rem'
                        }}
                      />
                    )}
                  </Stack>

                  {/* Navigation Arrows */}
                  <IconButton
                    sx={{
                      position: 'absolute',
                      left: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.9)'
                      }
                    }}
                  >
                    <ArrowLeftIcon />
                  </IconButton>
                  <IconButton
                    sx={{
                      position: 'absolute',
                      right: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.9)'
                      }
                    }}
                  >
                    <ArrowRightIcon />
                  </IconButton>

                  {/* Favorite Button */}
                  <IconButton
                    sx={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.9)'
                      }
                    }}
                  >
                    <FavoriteIcon />
                  </IconButton>
                </Box>

                {/* Content */}
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                    {room.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {room.description}
                  </Typography>

                  {/* Details */}
                  <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <PeopleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {room.capacity}
                      </Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <StarIcon sx={{ fontSize: 16, color: '#fbbf24' }} />
                      <Typography variant="body2" color="text.secondary">
                        {room.rating} ({room.reviewCount})
                      </Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <BusinessIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {room.type}
                      </Typography>
                    </Stack>
                  </Stack>

                  <Divider sx={{ my: 2 }} />

                  {/* Price */}
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" fontWeight={600} color="primary">
                      From {room.price}{room.priceUnit}
                    </Typography>
                    <Button
                      variant="contained"
                      size="small"
                      sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        backgroundColor: '#fb923c',
                        '&:hover': {
                          backgroundColor: '#ea580c'
                        }
                      }}
                    >
                      Book now
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Filter Menus */}
        <Menu
          anchorEl={peopleAnchor}
          open={Boolean(peopleAnchor)}
          onClose={() => handleFilterClose(setPeopleAnchor)}
        >
          <MenuItem onClick={() => { setPeople('1-5'); handleFilterClose(setPeopleAnchor); }}>
            1-5 people
          </MenuItem>
          <MenuItem onClick={() => { setPeople('6-10'); handleFilterClose(setPeopleAnchor); }}>
            6-10 people
          </MenuItem>
          <MenuItem onClick={() => { setPeople('11-20'); handleFilterClose(setPeopleAnchor); }}>
            11-20 people
          </MenuItem>
          <MenuItem onClick={() => { setPeople('20+'); handleFilterClose(setPeopleAnchor); }}>
            20+ people
          </MenuItem>
        </Menu>

        <Menu
          anchorEl={priceAnchor}
          open={Boolean(priceAnchor)}
          onClose={() => handleFilterClose(setPriceAnchor)}
        >
          <MenuItem onClick={() => { setPrice('€0-25'); handleFilterClose(setPriceAnchor); }}>
            €0 - €25
          </MenuItem>
          <MenuItem onClick={() => { setPrice('€25-50'); handleFilterClose(setPriceAnchor); }}>
            €25 - €50
          </MenuItem>
          <MenuItem onClick={() => { setPrice('€50-100'); handleFilterClose(setPriceAnchor); }}>
            €50 - €100
          </MenuItem>
          <MenuItem onClick={() => { setPrice('€100+'); handleFilterClose(setPriceAnchor); }}>
            €100+
          </MenuItem>
        </Menu>

        <Menu
          anchorEl={spaceTypeAnchor}
          open={Boolean(spaceTypeAnchor)}
          onClose={() => handleFilterClose(setSpaceTypeAnchor)}
        >
          <MenuItem onClick={() => { setSpaceType('Meeting room'); handleFilterClose(setSpaceTypeAnchor); }}>
            Meeting room
          </MenuItem>
          <MenuItem onClick={() => { setSpaceType('Conference room'); handleFilterClose(setSpaceTypeAnchor); }}>
            Conference room
          </MenuItem>
          <MenuItem onClick={() => { setSpaceType('Workshop space'); handleFilterClose(setSpaceTypeAnchor); }}>
            Workshop space
          </MenuItem>
          <MenuItem onClick={() => { setSpaceType('Event space'); handleFilterClose(setSpaceTypeAnchor); }}>
            Event space
          </MenuItem>
        </Menu>

        <Menu
          anchorEl={sortAnchor}
          open={Boolean(sortAnchor)}
          onClose={() => handleFilterClose(setSortAnchor)}
        >
          <MenuItem onClick={() => { setSortBy('Price: Low to High'); handleFilterClose(setSortAnchor); }}>
            Price: Low to High
          </MenuItem>
          <MenuItem onClick={() => { setSortBy('Price: High to Low'); handleFilterClose(setSortAnchor); }}>
            Price: High to Low
          </MenuItem>
          <MenuItem onClick={() => { setSortBy('Rating'); handleFilterClose(setSortAnchor); }}>
            Rating
          </MenuItem>
          <MenuItem onClick={() => { setSortBy('Distance'); handleFilterClose(setSortAnchor); }}>
            Distance
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
};

export default BookingFlow;
