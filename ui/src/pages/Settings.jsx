import { Typography } from '@mui/material';
import Paper from '@mui/material/Paper';

import MainAppBar from '../components/AppBar.jsx';


export default function Settings() {
  return (
    <>
      <MainAppBar isSettings={true} />
      <div className="main-container">
        <Paper className="main-paper">
          <Typography variant='h6'>Settings</Typography>
        </Paper>
      </div>
    </>
  )
}