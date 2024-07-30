import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Typography, Grid } from '@mui/material';
import Alert from '@mui/material/Alert';
import Slider from '@mui/material/Slider';
import Select from '@mui/material/Select';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
import { styled } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import Wheel from '@uiw/react-color-wheel';
import { hsvaToHex, rgbaToHsva, hsvaToRgba } from '@uiw/color-convert';

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


const getHSVAFromValues = (values) => {
  if (values) {
    return rgbaToHsva({r: values[1], g: values[2], b: values[3], a: 1})
  } else {
    return {h: 0, s: 100, v: 75, a: 1}
  }
}


const normalizeValue = (value, defaultValue) => {
  if (value == null) {
    return defaultValue;
  } else {
    return parseInt(100 * value / 255.0);
  }
}

const denormalizeValue = (value) => {
  return parseInt(255 * value / 100.0);
}

//colorChannelA and colorChannelB are ints ranging from 0 to 255
function colorChannelMixer(colorChannelA, colorChannelB, amountToMix){
  var channelA = colorChannelA*amountToMix;
  var channelB = colorChannelB*(1-amountToMix);
  return parseInt(channelA+channelB);
}
//rgbA and rgbB are arrays, amountToMix ranges from 0.0 to 1.0
//example (red): rgbA = {r: 255, g: 0, b: 0}
function colorMixer(rgbA, rgbB, master, amountToMix = 0.5){
  var m = master / 100.0;
  var r = colorChannelMixer(rgbA.r, rgbB.r, amountToMix);
  var g = colorChannelMixer(rgbA.g, rgbB.g, amountToMix);
  var b = colorChannelMixer(rgbA.b, rgbB.b, amountToMix);
  return {r: parseInt(m * r), g: parseInt(m * g), b: parseInt(m * b)};
}


export default function EditPreset() {
  const transientTimeout = 500;
  const navigate = useNavigate();
  const {state} = useLocation();
  const { preset } = state;
  const [dataLoaded, setDataLoaded] = React.useState(false);
  const fixtureId = preset?.fixtureId || "ef37f423-6214-46da-99a7-36f659feacb4";  // Hard-coded for now
  const [fixture, setFixture] = React.useState();
  const [effects, setEffects] = React.useState([]);
  const [selectedEffect, setSelectedEffect] = React.useState(preset?.values[5].toString() || "0");
  const [hsva, setHsva] = React.useState(getHSVAFromValues(preset?.values));
  const [master, setMaster] = React.useState(normalizeValue(preset?.values[0], 75));
  const [white, setWhite] = React.useState(normalizeValue(preset?.values[4], 0));
  const [adjustA, setAdjustA] = React.useState(normalizeValue(preset?.values[6], 0));
  const [adjustB, setAdjustB] = React.useState(normalizeValue(preset?.values[7], 0));
  const [presetName, setPresetName] = React.useState(preset?.name || "");
  const [errorMessage, setErrorMessage] = React.useState("");

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
          setDataLoaded(true);
        },
        (error) => {
          console.log(error);
        }
      );
  }, [fixtureId]);

  React.useEffect(() => {
    // Temporarily show error alert
    let interval = undefined;
    if (errorMessage != "") {
      interval = setInterval(() => {
        setErrorMessage("");
      }, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [errorMessage]);

  React.useEffect(() => {
    // Send a transient message but only after a timeout
    if (dataLoaded) {
      const timeoutId = setTimeout(() => {
        let rgba = hsvaToRgba(hsva);
        let transient = {
          fixture_id: fixtureId,
          fade: 0,
          values: [
            denormalizeValue(master),
            rgba.r,
            rgba.g,
            rgba.b,
            denormalizeValue(white),
            parseInt(selectedEffect),
            denormalizeValue(adjustA),
            denormalizeValue(adjustB)
          ]
        };
        console.log(transient);
        fetch(`${apiBase}/sendTransient`, {
          method: "POST",
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(transient)
        })
        .then(res => res.json())
        .then(
          (result) => {
            if (!result.success) {
              setErrorMessage("Failed to send transient update!");
            }
          },
          (error) => {
            console.log(error);
            setErrorMessage(`Unknown Error: ${error}`);
          }
        )
      }, transientTimeout);
      return () => clearTimeout(timeoutId);
    }
  }, [dataLoaded, hsva, fixtureId, master, white, selectedEffect, adjustA, adjustB]);

  const onSave = () => {
    let data = preset || {};
    let rgba = hsvaToRgba(hsva);
    let w = hsvaToRgba({h: 25, s: 15, v: white, a: 1});
    let mixAmount = (white / 100.0 - hsva.v / 100.0) / 2.0 + 0.5;
    let mixed = colorMixer(w, rgba, master, mixAmount);
    data.name = presetName;
    data.effect_name = effects[parseInt(selectedEffect)].name;
    data.button_color = {
      red: mixed.r,
      green: mixed.g,
      blue: mixed.b
    };
    data.fixture_id = fixtureId;
    data.fade = 0;
    data.values = [
      denormalizeValue(master),
      rgba.r,
      rgba.g,
      rgba.b,
      denormalizeValue(white),
      parseInt(selectedEffect),
      denormalizeValue(adjustA),
      denormalizeValue(adjustB)
    ];
    console.log(data);
    fetch(`${apiBase}/presets`, {
      method: preset ? "PUT" : "POST",
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(
      (result) => {
        console.log(result);
        if (result.success) {
          navigate("/presets");
        } else {
          setErrorMessage("Failed to save preset!");
        }
      },
      (error) => {
        console.log(error);
        setErrorMessage(`Unknown Error: ${error}`);
      }
    )
  };

  const onDelete = () => {
    if (preset) {
      fetch(`${apiBase}/presets?id=${preset.id}`, {
        method: "DELETE",
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      })
      .then(res => res.json())
      .then(
        (result) => {
          console.log(result);
          if (result.success) {
            navigate("/presets");
          } else {
            setErrorMessage("Failed to delete preset!");
          }
        },
        (error) => {
          console.log(error);
          setErrorMessage(`Unknown Error: ${error}`);
        }
      )
    }
  };

  return (
    <>
      <MainAppBar isSettings={false} />
      <div className="main-container">
        {errorMessage != "" ? <Alert severity="error" sx={{marginTop: "10px"}}>{errorMessage}</Alert> : null}
        <Paper className="main-paper" sx={{padding: "30px"}}>
          {dataLoaded ? (
            <>
              <Typography variant='h5'>Edit Preset</Typography>
              <Grid container sx={{marginTop: "20px"}}>
                <Box sx={{ width: '100%', height: 50, background: hsvaToHex(hsva), position: "relative", borderRadius: "5px", boxShadow: 2,}}>
                  <Box sx={{position: "absolute", background: `rgba(255, 232, 216, ${(white * 0.7) / 100.0})`, width: '100%', height: 50, borderRadius: "5px"}}></Box>
                  <Box sx={{position: "absolute", background: `rgba(0, 0, 0, ${1 - master / 100.0})`, width: '100%', height: 50, borderRadius: "5px"}}></Box>
                </Box>
              </Grid>
              <Grid container sx={{marginTop: 3}}>
                <Grid item xs={12} md={7} sx={{padding: "20px 10px"}}>
                  <Grid container>
                    <Grid item xs={4} sm={3} md={4} lg={3}>
                      <Typography variant="body1" sx={{marginTop: 1.5}}>Brightness</Typography>
                    </Grid>
                    <Grid item xs={8} sm={9} md={8} lg={9}>
                      <GradientSlider
                        colora={"black"}
                        colorb={"white"}
                        value={master}
                        onChange={(event, newValue) => setMaster(newValue)}
                        color="secondary"
                      />
                    </Grid>
                  </Grid>
                  <Grid container>
                    <Grid item xs={4} sm={3} md={4} lg={3}>
                      <Typography variant="body1" sx={{marginTop: 1.5}}>Saturation</Typography>
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
                      <Typography variant="body1" sx={{marginTop: 1.5}}>Warm White</Typography>
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
                        marginTop: 1.5,
                        opacity: (effects.length > 0 && !effects[parseInt(selectedEffect)].disabled_channels.includes(6)) ? 1 : 0.2
                      }}>Adjust 1</Typography>
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
                        marginTop: 1.5,
                        opacity: (effects.length > 0 && !effects[parseInt(selectedEffect)].disabled_channels.includes(7)) ? 1 : 0.2
                      }}>Adjust 2</Typography>
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
              <Grid container sx={{marginTop: 2}}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <TextField 
                      label="Preset Name"
                      variant="outlined"
                      helperText="Optional"
                      value={presetName}
                      onChange={(event) => setPresetName(event.target.value)}
                    />
                  </FormControl>
                </Grid>
              </Grid>
              <Grid container sx={{marginTop: 2}}>
                <Grid item xs={6}>
                  {preset ? <Button color="error" variant="outlined" onClick={onDelete}>Delete</Button> : null}
                </Grid>
                <Grid item xs={6} sx={{display: "flex", justifyContent: "flex-end"}}>
                  <Button color="secondary" onClick={() => navigate("/presets")} sx={{marginRight: "10px"}}>Cancel</Button>
                  <Button variant="contained" onClick={onSave} sx={{marginRight: "10px"}}>Save</Button>
                </Grid>
              </Grid>
            </>
          ) : (
            <Typography variant="body1" sx={{color: "grey"}}>Loading...</Typography>
          )}
        </Paper>
      </div>
    </>
  )
}