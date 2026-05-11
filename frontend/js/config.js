/* ============================================================
   KRAMANIK — Environment Config
   Controls which API the frontend talks to.

   LOCAL DEV:   API_BASE = http://localhost:8080/api
   PRODUCTION:  API_BASE = https://kramanik-backend.railway.app/api

   To switch to production, change PRODUCTION_API_URL below.
   ============================================================ */

const IS_LOCAL = (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname === ''
);

const LOCAL_API_URL      = 'http://localhost:8080/api';
const PRODUCTION_API_URL = 'https://kramanik-backend.railway.app/api';

// This is the single variable consumed by api.js
const API_BASE = IS_LOCAL ? LOCAL_API_URL : PRODUCTION_API_URL;
