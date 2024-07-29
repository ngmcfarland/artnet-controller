import React from 'react';
import { Typography, Grid } from '@mui/material';
import Paper from '@mui/material/Paper';
import Wheel from '@uiw/react-color-wheel';
import ShadeSlider from '@uiw/react-color-shade-slider';
import { hsvaToHex } from '@uiw/color-convert';

import MainAppBar from '../components/AppBar.jsx';


export default function EditPreset() {
  const [hsva, setHsva] = React.useState({ h: 214, s: 43, v: 90, a: 1 });

  return (
    <>
      <MainAppBar isSettings={false} />
      <div className="main-container">
        <Paper className="main-paper">
          <Typography variant='h5'>Edit Preset</Typography>
          <Grid container>
            <Grid item xs={12} md={6} sx={{display: "flex", justifyContent: "space-evenly"}}>
              <Typography variant="body1" sx={{marginTop: "16px"}}>Brightness</Typography>
              <ShadeSlider
                hsva={hsva}
                style={{ width: 210, marginTop: 20 }}
                onChange={(newShade) => {
                  setHsva({ ...hsva, ...newShade });
                }}
              />
            </Grid>
            <Grid item xs={12} md={6} sx={{display: "flex", justifyContent: "center"}}>
              <Wheel color={hsva} onChange={(color) => setHsva({ ...hsva, ...color.hsva })} />
            </Grid>
            <div style={{ width: '100%', height: 34, marginTop: 20, background: hsvaToHex(hsva) }}></div>
          </Grid>
          <Typography variant="body1">h: {hsva.h}, s: {hsva.s}, v: {hsva.v}, a: {hsva.a}</Typography>
        </Paper>
      </div>
    </>
  )
}