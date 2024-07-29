import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Grid } from '@mui/material';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import EditIcon from '@mui/icons-material/Edit';

import MainAppBar from '../components/AppBar';
import { apiBase } from '../Context';


export default function Presets() {
  const navigate = useNavigate();
  const [presets, setPresets] = React.useState([]);
  const [editMode, setEditMode] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");

  React.useEffect(() => {
    fetch(apiBase + "/presets")
      .then(res => res.json())
      .then(
        (result) => {
          console.log(result);
          setPresets(result);
        },
        (error) => {
          console.log(error);
        }
      );
  }, []);

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

  const getTextColor = (bgColor) => {
    // Dynamically choose between white or black based on background color
    const brightness = Math.round(((bgColor.red * 299) + (bgColor.green * 587) + (bgColor.blue * 114)) / 1000);
    return (brightness > 125) ? 'black' : 'white';
  }

  const handlePresetClick = (preset) => {
    // If in edit mode, go to editPreset page otherwise send preset
    if (editMode) {
      navigate("/editPreset", { state: { id: preset.id } });
    } else {
      fetch(apiBase + "/sendPreset?id=" + preset.id, {
        method: "POST",
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })
      .then(res => res.json())
      .then(
        (result) => {
          console.log(result);
          if (!result.success) setErrorMessage("Something failed while sending preset!");
        },
        (error) => {
          console.log(error);
          setErrorMessage(`Unknown Error: ${error}`);
        }
      );
    }
  }

  return (
    <>
      <MainAppBar isSettings={false} />
      <div className="main-container">
        {errorMessage != "" ? <Alert severity="error" sx={{marginTop: "10px"}}>{errorMessage}</Alert> : null}
        <Paper className="main-paper">
          <Grid container>
            <Grid item xs={3}>
              <Typography variant='h5'>Presets</Typography>
            </Grid>
            {
              editMode ? (
                <>
                  <Grid item xs={6} sx={{textAlign: "center", paddingTop: "7px"}}>
                    <Typography variant="body1" sx={{color: "gray"}}>Click on preset to edit</Typography>
                  </Grid>
                  <Grid item xs={3} sx={{textAlign: "right"}}>
                    <Button variant="outlined" color="secondary" onClick={() => setEditMode(false)}>Cancel</Button>
                  </Grid>
                </>
              ) : (
                <Grid item xs={9} sx={{textAlign: "right"}}>
                  <Button variant="outlined" startIcon={<EditIcon />} sx={{marginRight: "10px"}} onClick={() => setEditMode(true)}>Edit</Button>
                  <Button variant="contained" color="success" onClick={() => navigate("/editPreset", { state: { id: undefined } })}>+ Add Preset</Button>
                </Grid>
              )
            }
          </Grid>
          <Grid container spacing={2} sx={{marginTop: "20px"}}>
            {
              presets.length === 0 ? (
                <Grid item xs={12} sx={{textAlign: "center"}}>
                  <Typography variant="body1" sx={{marginTop: "40px"}}>No presets created yet.</Typography>
                </Grid>
              ) : (
                presets.map((preset, presetIdx) => {
                  return (
                    <Grid item key={presetIdx} xs={12} sm={4} lg={3}>
                      <Box className="preset-button"
                        sx={{
                          backgroundColor: `rgb(${preset.button_color.red}, ${preset.button_color.green}, ${preset.button_color.blue})`,
                          boxShadow: 2,
                          display: "flex",
                          justifyContent: "center"
                        }}
                        onClick={() => handlePresetClick(preset)}
                      >
                        <Typography className="preset-button-text" sx={{color: getTextColor(preset.button_color)}}>{preset.name}</Typography>
                        { editMode ? <EditIcon sx={{color: getTextColor(preset.button_color), marginLeft: "5px"}} /> : null }
                      </Box>
                    </Grid>
                  )
                })
              )
            }
          </Grid>
        </Paper>
      </div>
    </>
  )
}