import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import './index.css';

import { ColorModeContext } from './Context';
import Presets from './pages/Presets.jsx';
import EditPreset from './pages/EditPreset.jsx';
import Settings from './pages/Settings.jsx';
import { grey } from '@mui/material/colors';


const router = createBrowserRouter([
  {
    path: "/",
    element: <Presets />,
  },
  {
    path: "/presets",
    element: <Presets />,
  },
  {
    path: "/editPreset",
    element: <EditPreset />,
  },
  {
    path: "/settings",
    element: <Settings />,
  },
]);


const getDesignTokens = (mode) => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          // palette values for light mode
          primary: {
            main: '#70ccd6'
          },
          secondary: {
            main: '#E770AB'
          },
          warning: {
            main: '#e8b320',
          },
          success: {
            main: '#6fd09d',
          },
          error: {
            main: '#f45d36',
          },
          divider: '#70ccd6',
          text: {
            primary: grey[900],
            secondary: grey[800],
          },
        }
      : {
          // palette values for dark mode
          primary: {
            main: '#70ccd6'
          },
          secondary: {
            main: '#E770AB'
          },
          warning: {
            main: '#e8b320',
          },
          success: {
            main: '#6fd09d',
          },
          error: {
            main: '#f45d36',
          },
          divider: '#70ccd6',
          background: {
            default: '#121212',
            paper: '#121212'
          },
          text: {
            primary: '#fff',
            secondary: grey[500],
          },
        }),
  },
});


export default function App() {
  const [mode, setMode] = React.useState('dark');
  const colorMode = React.useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
      },
    }),
    [],
  );

  const theme = React.useMemo(() => createTheme(getDesignTokens(mode)), [mode]);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <RouterProvider router={router} />
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
