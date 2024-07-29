import { createContext } from 'react';

// const apiBase = `http://${window.location.hostname}:8000/api`;
const apiBase = `http://localhost:8000/api`;

const ColorModeContext = createContext();

export {
  apiBase,
  ColorModeContext
}