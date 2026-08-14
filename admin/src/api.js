const BASE = '/api';

function getToken() {
  return localStorage.getItem('vxhub_token');
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(BASE + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 401 && !path.startsWith('/auth/')) {
    localStorage.removeItem('vxhub_token');
    window.location.href = '/admin/login';
    throw new Error('Sessão expirada');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(err.error || `Erro ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

async function uploadLogo(brandId, file) {
  const token = getToken();
  const form = new FormData();
  form.append('logo', file);
  const res = await fetch(`${BASE}/brands/${brandId}/logo`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(err.error || `Erro ${res.status}`);
  }
  return res.json();
}

export const api = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  me: () => request('/auth/me'),

  listBrands: () => request('/brands'),
  getBrand: (id) => request(`/brands/${id}`),
  createBrand: (data) => request('/brands', { method: 'POST', body: data }),
  updateBrand: (id, data) => request(`/brands/${id}`, { method: 'PUT', body: data }),
  deleteBrand: (id) => request(`/brands/${id}`, { method: 'DELETE' }),
  uploadLogo,

  addItem: (brandId, kind, data) => request(`/brands/${brandId}/${kind}`, { method: 'POST', body: data }),
  updateItem: (brandId, kind, itemId, data) =>
    request(`/brands/${brandId}/${kind}/${itemId}`, { method: 'PUT', body: data }),
  deleteItem: (brandId, kind, itemId) =>
    request(`/brands/${brandId}/${kind}/${itemId}`, { method: 'DELETE' }),

  listUsers: () => request('/users'),
  createUser: (data) => request('/users', { method: 'POST', body: data }),
  updateUser: (id, data) => request(`/users/${id}`, { method: 'PUT', body: data }),
  deleteUser: (id) => request(`/users/${id}`, { method: 'DELETE' }),
};

export { getToken };
