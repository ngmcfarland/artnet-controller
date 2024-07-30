import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ModeNightIcon from '@mui/icons-material/ModeNight';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import SettingsIcon from '@mui/icons-material/Settings';
import HomeIcon from '@mui/icons-material/Home';

import { ColorModeContext } from '../Context';


export default function MainAppBar({ isSettings }) {
  const navigate = useNavigate();
  const theme = useTheme();
  const colorMode = React.useContext(ColorModeContext);

  const handleButtonClick = () => {
    if (isSettings) {
      navigate("/presets");
    } else {
      navigate("/settings");
    }
  }
  
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: "white" }}>
            Artnet Controller
          </Typography>
          <IconButton sx={{ ml: 1 }} onClick={colorMode.toggleColorMode} color="default">
            {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <ModeNightIcon />}
          </IconButton>
          {/* <IconButton aria-label="open settings" color="secondary" onClick={handleButtonClick}>
            { isSettings ? <HomeIcon /> : <SettingsIcon /> }
          </IconButton> */}
        </Toolbar>
      </AppBar>
    </Box>
  );
}
