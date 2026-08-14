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

async function uploadFile(url, fieldName, file) {
  const token = getToken();
  const form = new FormData();
  form.append(fieldName, file);
  const res = await fetch(BASE + url, {
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

const uploadLogo = (brandId, file) => uploadFile(`/brands/${brandId}/logo`, 'logo', file);
const uploadBlockFile = (brandId, file) => uploadFile(`/brands/${brandId}/upload`, 'file', file);
const uploadSiteLogo = (file) => uploadFile('/site-content/upload', 'logo', file);

export const api = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  me: () => request('/auth/me'),

  listBrands: () => request('/brands'),
  getBrand: (id) => request(`/brands/${id}`),
  createBrand: (data) => request('/brands', { method: 'POST', body: data }),
  updateBrand: (id, data) => request(`/brands/${id}`, { method: 'PUT', body: data }),
  deleteBrand: (id) => request(`/brands/${id}`, { method: 'DELETE' }),
  uploadLogo,
  uploadBlockFile,

  createSection: (brandId, data) => request(`/brands/${brandId}/sections`, { method: 'POST', body: data }),
  updateSection: (brandId, sectionId, data) =>
    request(`/brands/${brandId}/sections/${sectionId}`, { method: 'PUT', body: data }),
  deleteSection: (brandId, sectionId) =>
    request(`/brands/${brandId}/sections/${sectionId}`, { method: 'DELETE' }),

  createBlock: (brandId, sectionId, data) =>
    request(`/brands/${brandId}/sections/${sectionId}/blocks`, { method: 'POST', body: data }),
  updateBlock: (brandId, sectionId, blockId, data) =>
    request(`/brands/${brandId}/sections/${sectionId}/blocks/${blockId}`, { method: 'PUT', body: data }),
  deleteBlock: (brandId, sectionId, blockId) =>
    request(`/brands/${brandId}/sections/${sectionId}/blocks/${blockId}`, { method: 'DELETE' }),

  getSiteContent: () => request('/site-content'),
  updateSiteContent: (data) => request('/site-content', { method: 'PUT', body: data }),
  uploadSiteLogo,

  listUsers: () => request('/users'),
  createUser: (data) => request('/users', { method: 'POST', body: data }),
  updateUser: (id, data) => request(`/users/${id}`, { method: 'PUT', body: data }),
  deleteUser: (id) => request(`/users/${id}`, { method: 'DELETE' }),
};

export { getToken };
