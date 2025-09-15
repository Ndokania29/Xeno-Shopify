import { Box, Container, useTheme } from '@mui/material';
import Header from './Header';
import Background3D from './Background3D';

export default function Layout({ children }) {
  const theme = useTheme();
  
  return (
    <Box sx={{ 
      position: 'relative', 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #071b16 0%, #002E26 100%)',
      overflow: 'hidden'
    }}>
      <Background3D />
      <Box sx={{ 
        position: 'relative', 
        zIndex: 1,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Header />
        <Container 
          maxWidth="xl" 
          sx={{ 
            py: 4,
            px: { xs: 2, sm: 3 },
            flex: 1,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {children}
        </Container>
      </Box>
    </Box>
  );
}