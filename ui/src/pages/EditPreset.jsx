import { Typography } from '@mui/material';
import Paper from '@mui/material/Paper';

import MainAppBar from '../components/AppBar.jsx';


export default function EditPreset() {
  return (
    <>
      <MainAppBar isSettings={false} />
      <div className="main-container">
        <Paper className="main-paper">
          <Typography variant='h6'>Edit Preset</Typography>
        </Paper>
      </div>
    </>
  )
}