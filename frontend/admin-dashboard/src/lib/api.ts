import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://verbex-ai-chatbot-platform-fullstack.onrender.com/api';

const client = axios.create({ baseURL: API });

client.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (r) => r,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refresh = localStorage.getItem('refreshToken');
        if (!refresh) throw new Error('no refresh token');
        const { data } = await axios.post(`${API}/auth/refresh`, { refreshToken: refresh });
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return client(original);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  },
);

export default client;

// ── Auth ─────────────────────────────────────────────────────
export const authApi = {
  signup: (email: string, password: string) =>
    client.post('/auth/signup', { email, password }),
  login: (email: string, password: string) =>
    client.post('/auth/login', { email, password }),
  googleAuth: (credential: string) =>
    client.post('/auth/google', { credential }),
  githubAuth: (code: string) =>
    client.post('/auth/github', { code }),
  demoOAuth: (provider: 'google' | 'github') =>
    client.post('/auth/oauth/demo', { provider }),
  profile: () => client.get('/auth/profile'),
  generateApiKey: () => client.post('/auth/api-key'),
};

// ── Agents ───────────────────────────────────────────────────
export const agentApi = {
  list: () => client.get('/agents/'),
  get: (id: string) => client.get(`/agents/${id}`),
  create: (data: any) => client.post('/agents/', data),
  update: (id: string, data: any) => client.put(`/agents/${id}`, data),
  delete: (id: string) => client.delete(`/agents/${id}`),
  conversations: (id: string) => client.get(`/agents/${id}/conversations`),
  analytics: () => client.get('/agents/analytics'),
};
