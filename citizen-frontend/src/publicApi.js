// Public API — no Bearer token, used for registration endpoint
import axios from 'axios';

const publicApi = axios.create({
  baseURL: 'http://localhost:8080', // Route through API gateway for CORS
});

export default publicApi;
