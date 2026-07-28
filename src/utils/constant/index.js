// F-08: secrets (Google API key) are loaded from src/utils/constant/env.js,
// which is git-ignored. env.example.js in this same directory serves as the
// template for what env.js must export. See android/SECRETS.md for how to
// obtain a properly restricted key and why the client-side Routes API call
// in src/screens/dashboard/tracking/index.js should ultimately move to the
// backend.
import { envSecrets } from './env';

export const environment = {
    //  baseUrl: 'https://rksk.nhmmp.gov.in/rkskapi/api/',
    //  imageUrl: 'https://rksk.nhmmp.gov.in/rkskapi/api/',
    baseUrl: 'http://139.5.6.137/RKSKUATAPI/api/',
    imageUrl : 'http://139.5.6.137/RKSKUATAPI/',
    GOOGLE_API_KEY: envSecrets.GOOGLE_API_KEY,
  };