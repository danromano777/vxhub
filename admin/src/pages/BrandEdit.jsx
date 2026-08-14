import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

const emptyBrand = {
  slug: '', name: '', display_html: '', brand_group: '', filter_key: '', description: '',
  grad_a: '#C4FF4D', grad_b: '#18E0C8', grad_c: '#05463F', grad_d: '#E6FF9A',
  grad_base: '#07261f', grad_glow: 'rgba(196,255,77,.45)', grad_pale: false, logo_url: '',
  sort_order: 0,
};

export default function BrandEdit() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const { user } = useAuth();
  const canWrite = user.role === 'admin' || user.role === 'editor';

  const [brand, setBrand] = useState(emptyBrand);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function load() {
    if (isNew) return;
    setLoading(true);
    api
      .getBrand(id)
      .then((b) => {
        const { sections, ...rest } = b;
        setBrand(rest);
      })
      .finally(() => setLoading(false));
  }
  useEffect(load, [id]);

  function set(field, value) {
    setBrand((b) => ({ ...b, [field]: value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (isNew) {
        const r = await api.createBrand(brand);
        navigate(`/brands/${r.id}`, { replace: true });
      } else {
        await api.updateBrand(id, brand);
        load();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="loading">Carregando…</p>;

  return (
    <div>
      <Link to="/" className="backlink">
        ← Voltar para Clientes
      </Link>
      <div className="page__head">
        <h1>{isNew ? 'Nova marca' : brand.name}</h1>
        {!isNew && (
          <Link className="icon-btn icon-btn--purple" to={`/brands/${id}/sections`}>
            📂 Ver Seções
          </Link>
        )}
      </div>
      <form onSubmit={handleSave} className="form">
        <fieldset disabled={!canWrite}>
          <div className="grid2">
            <label>
              Slug <input value={brand.slug} onChange={(e) => set('slug', e.target.value)} required />
            </label>
            <label>
              Nome <input value={brand.name} onChange={(e) => set('name', e.target.value)} required />
            </label>
            <label>
              Display (HTML)
              <input value={brand.display_html} onChange={(e) => set('display_html', e.target.value)} />
            </label>
            <label>
              Grupo <input value={brand.brand_group} onChange={(e) => set('brand_group', e.target.value)} />
            </label>
            <label>
              Filtro <input value={brand.filter_key} onChange={(e) => set('filter_key', e.target.value)} />
            </label>
            <label>
              Ordem
              <input type="number" value={brand.sort_order} onChange={(e) => set('sort_order', Number(e.target.value))} />
            </label>
          </div>
          <label>
            Descrição
            <textarea value={brand.description} onChange={(e) => set('description', e.target.value)} />
          </label>

          <h3>Logo</h3>
          <div className="grid2">
            <label>
              URL do logo
              <input value={brand.logo_url || ''} onChange={(e) => set('logo_url', e.target.value)} />
            </label>
            {brand.logo_url && (
              <div className="client-logo" style={{ width: 56, height: 56 }}>
                <img src={brand.logo_url} alt={brand.name} />
              </div>
            )}
          </div>

          <h3>Gradiente do card</h3>
          <div className="grid2">
            {['grad_a', 'grad_b', 'grad_c', 'grad_d', 'grad_base'].map((f) => (
              <label key={f}>
                {f} <input type="text" value={brand[f] || ''} onChange={(e) => set(f, e.target.value)} />
              </label>
            ))}
            <label>
              grad_glow <input value={brand.grad_glow || ''} onChange={(e) => set('grad_glow', e.target.value)} />
            </label>
            <label className="checkbox">
              <input type="checkbox" checked={!!brand.grad_pale} onChange={(e) => set('grad_pale', e.target.checked)} />
              Fundo claro (pale)
            </label>
          </div>

          {canWrite && (
            <button type="submit" disabled={saving}>
              {saving ? 'Salvando…' : 'Salvar marca'}
            </button>
          )}
          {error && <p className="error">{error}</p>}
        </fieldset>
      </form>
    </div>
  );
}
