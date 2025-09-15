import { AppBar, Toolbar, Typography, Box, IconButton, Button, Avatar } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SyncIcon from '@mui/icons-material/Sync';
import SettingsIcon from '@mui/icons-material/Settings';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import ListAltIcon from '@mui/icons-material/ListAlt';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../state/AuthContext';
import Logo from '../common/Logo';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { tenant, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const NavButton = ({ to, icon: Icon, label }) => (
    <Button
      component={Link}
      to={to}
      color="inherit"
      sx={{
        px: 2,
        py: 1,
        borderRadius: 2,
        backgroundColor: isActive(to) ? 'rgba(255,255,255,0.1)' : 'transparent',
        '&:hover': {
          backgroundColor: 'rgba(255,255,255,0.2)'
        }
      }}
      startIcon={<Icon />}
    >
      {label}
    </Button>
  );

  return (
    <AppBar 
      position="sticky" 
      sx={{ 
        background: 'transparent',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}
      elevation={0}
    >
      <Toolbar sx={{ display: 'flex', gap: 2 }}>
        <Box 
          component={Link} 
          to="/dashboard" 
          sx={{ 
            color: '#fff', 
            textDecoration: 'none', 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            flexGrow: 1 
          }}
        >
          <Logo size={36} />
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 700,
              letterSpacing: 1,
              background: 'linear-gradient(90deg, #FFFFFF 0%, rgba(255,255,255,0.8) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 30px rgba(255,255,255,0.1)'
            }}
          >
            Shopify Insights
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <NavButton to="/dashboard" icon={DashboardIcon} label="Dashboard" />
          <NavButton to="/products" icon={Inventory2Icon} label="Products" />
          <NavButton to="/orders" icon={ListAltIcon} label="Orders" />
          <NavButton to="/customers" icon={PeopleAltIcon} label="Customers" />
          <NavButton to="/sync" icon={SyncIcon} label="Sync" />
          <NavButton to="/settings" icon={SettingsIcon} label="Settings" />
        </Box>

        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
          ml: 2,
          pl: 2,
          borderLeft: '1px solid rgba(255,255,255,0.1)'
        }}>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              {tenant?.email}
            </Typography>
            <Typography variant="subtitle2">
              {tenant?.name}
            </Typography>
          </Box>
          <Avatar sx={{ 
            bgcolor: '#00A650',
            boxShadow: '0 0 20px rgba(0,166,80,0.3)'
          }}>
            {tenant?.name?.[0]?.toUpperCase() || 'U'}
          </Avatar>
          <IconButton 
            color="inherit" 
            onClick={handleLogout}
            sx={{ 
              '&:hover': { 
                backgroundColor: 'rgba(255,255,255,0.1)' 
              }
            }}
          >
            <LogoutIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
}