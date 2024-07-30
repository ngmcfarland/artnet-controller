import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Grid } from '@mui/material';
import Slider from '@mui/material/Slider';
import Select from '@mui/material/Select';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
import { styled } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import Wheel from '@uiw/react-color-wheel';
import { hsvaToHex } from '@uiw/color-convert';

import MainAppBar from '../components/AppBar.jsx';
import { apiBase } from '../Context';


const GradientSlider = styled(Slider)(({ colora, colorb }) => ({
  height: "20px",
  '& .MuiSlider-rail': {
    backgroundImage: `linear-gradient(.25turn, ${colora}, ${colorb})`,
    opacity: 1,
  },
  '& .MuiSlider-track': {
    border: "none",
    backgroundColor: "rgba(0, 0, 0, 0)",
  },
  '& .MuiSlider-thumb': {
    borderColor: "white",
    borderWidth: "1px",
    borderStyle: "solid",
    height: "27px",
    width: "27px",
  },
}));


export default function EditPreset() {
  const navigate = useNavigate();
  const [fixtureId, setFixtureId] = React.useState("ef37f423-6214-46da-99a7-36f659feacb4");  // Hard-coded for now
  const [fixture, setFixture] = React.useState();
  const [effects, setEffects] = React.useState([]);
  const [selectedEffect, setSelectedEffect] = React.useState("0");
  const [hsva, setHsva] = React.useState({ h: 0, s: 100, v: 75, a: 1 });
  const [white, setWhite] = React.useState(0);
  const [adjustA, setAdjustA] = React.useState(0);
  const [adjustB, setAdjustB] = React.useState(0);

  React.useEffect(() => {
    fetch(`${apiBase}/fixtures?id=${fixtureId}`)
      .then(res => res.json())
      .then(
        (result) => {
          console.log(result);
          if (result.channels && result.channels.length >= 6) {
            setEffects(result.channels[5].options);
          }
          setFixture(result);
        },
        (error) => {
          console.log(error);
        }
      );
  }, [fixtureId]);

  return (
    <>
      <MainAppBar isSettings={false} />
      <div className="main-container">
        <Paper className="main-paper" sx={{padding: "30px"}}>
          <Typography variant='h5'>Edit Preset</Typography>
          <Grid container sx={{marginTop: "20px"}}>
            <Box sx={{ width: '100%', height: 50, background: hsvaToHex(hsva), position: "relative", borderRadius: "5px", boxShadow: 2,}}>
              <Box sx={{position: "absolute", background: `rgba(255, 232, 216, ${(white * 0.7) / 100.0})`, width: '100%', height: 50, borderRadius: "5px"}}></Box>
            </Box>
          </Grid>
          <Grid container sx={{marginTop: "40px"}}>
            <Grid item xs={12} md={7} sx={{padding: "20px 10px"}}>
              <Grid container>
                <Grid item xs={4} sm={3} md={4} lg={3}>
                  <Typography variant="body1" sx={{marginTop: "10px"}}>Brightness</Typography>
                </Grid>
                <Grid item xs={8} sm={9} md={8} lg={9}>
                  <GradientSlider
                    colora={"black"}
                    colorb={hsvaToHex({h: hsva.h, s: hsva.s, v: 100, a: 1})}
                    value={hsva.v}
                    onChange={(event, newValue) => setHsva({...hsva, v: newValue})}
                    color="secondary"
                  />
                </Grid>
              </Grid>
              <Grid container>
                <Grid item xs={4} sm={3} md={4} lg={3}>
                  <Typography variant="body1" sx={{marginTop: "10px"}}>Warm White</Typography>
                </Grid>
                <Grid item xs={8} sm={9} md={8} lg={9}>
                  <GradientSlider
                    colora={"black"}
                    colorb={"rgb(255, 232, 216)"}
                    value={white}
                    onChange={(event, newValue) => setWhite(newValue)}
                    color="secondary"
                  />
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12} md={5} sx={{display: "flex", justifyContent: "center"}}>
              <Wheel color={hsva} onChange={(color) => setHsva({ ...hsva, ...color.hsva })} />
            </Grid>
          </Grid>
          <Grid container sx={{marginTop: "40px"}}>
            <Grid item xs={12} md={5} sx={{paddingRight: 4, paddingTop: "15px", paddingBottom: "30px"}}>
              <FormControl fullWidth>
                <InputLabel id="demo-simple-select-standard-label">Effect</InputLabel>
                <Select
                  labelId="effect-select-label"
                  id="effect-select"
                  value={selectedEffect}
                  label="Effect"
                  onChange={(event) => setSelectedEffect(event.target.value)}
                >
                  {effects.map((effect, effectIdx) => {
                    return <MenuItem value={effectIdx.toString()} key={effectIdx}>{effect.name}</MenuItem>
                  })}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={7}>
              <Grid container>
                <Grid item xs={4} sm={3} md={4} lg={3}>
                  <Typography variant="body1" sx={{
                    marginTop: "10px",
                    opacity: (effects.length > 0 && !effects[parseInt(selectedEffect)].disabled_channels.includes(6)) ? 1 : 0.2
                  }}>Effect Adjust 1</Typography>
                </Grid>
                <Grid item xs={8} sm={9} md={8} lg={9}>
                  <Slider
                    value={adjustA}
                    onChange={(event, newValue) => setAdjustA(newValue)}
                    color="primary"
                    sx={{marginTop: "7px"}}
                    disabled={!(effects.length > 0 && !effects[parseInt(selectedEffect)].disabled_channels.includes(6))}
                  />
                </Grid>
              </Grid>
              <Grid container>
                <Grid item xs={4} sm={3} md={4} lg={3}>
                  <Typography variant="body1" sx={{
                    marginTop: "10px",
                    opacity: (effects.length > 0 && !effects[parseInt(selectedEffect)].disabled_channels.includes(7)) ? 1 : 0.2
                  }}>Effect Adjust 2</Typography>
                </Grid>
                <Grid item xs={8} sm={9} md={8} lg={9}>
                  <Slider
                    value={adjustB}
                    onChange={(event, newValue) => setAdjustB(newValue)}
                    color="primary"
                    sx={{marginTop: "7px"}}
                    disabled={!(effects.length > 0 && !effects[parseInt(selectedEffect)].disabled_channels.includes(7))}
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
          <Grid container sx={{justifyContent: "flex-end"}}>
            <Button color="secondary" onClick={() => navigate("/presets")} sx={{marginRight: "10px"}}>Cancel</Button>
            <Button variant="contained" sx={{marginRight: "10px"}}>Save</Button>
          </Grid>
        </Paper>
      </div>
    </>
  )
}