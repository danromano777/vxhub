import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

const emptyBrand = {
  slug: '', name: '', display_html: '', brand_group: '', filter_key: '', description: '',
  grad_a: '#C4FF4D', grad_b: '#18E0C8', grad_c: '#05463F', grad_d: '#E6FF9A',
  grad_base: '#07261f', grad_glow: 'rgba(196,255,77,.45)', grad_pale: false, logo_url: '',
  logo_offset_x: null,
  sort_order: 0,
};

const NEW_OPTION = '__new__';

function PickOrCreate({ label, value, options, onChange }) {
  const [addingNew, setAddingNew] = useState(false);
  const knownOptions = value && !options.includes(value) ? [value, ...options] : options;

  if (addingNew) {
    return (
      <label>
        {label}
        <input
          value={value}
          autoFocus
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setAddingNew(false)}
        />
      </label>
    );
  }

  return (
    <label>
      {label}
      <select
        value={value || ''}
        onChange={(e) => {
          if (e.target.value === NEW_OPTION) {
            setAddingNew(true);
            onChange('');
          } else {
            onChange(e.target.value);
          }
        }}
      >
        <option value="" disabled>
          Selecione…
        </option>
        {knownOptions.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
        <option value={NEW_OPTION}>+ Novo…</option>
      </select>
    </label>
  );
}

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
  const [groupOptions, setGroupOptions] = useState([]);
  const [filterOptions, setFilterOptions] = useState([]);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoFileRef = useRef(null);

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

  useEffect(() => {
    api.listBrands().then((brands) => {
      setGroupOptions([...new Set(brands.map((b) => b.brand_group).filter(Boolean))].sort());
      setFilterOptions([...new Set(brands.map((b) => b.filter_key).filter(Boolean))].sort());
    });
  }, []);

  function set(field, value) {
    setBrand((b) => ({ ...b, [field]: value }));
  }

  async function handleLogoUpload(e) {
    const file = e.target.files?.[0];
    if (!file || isNew) return;
    setUploadingLogo(true);
    try {
      const { logo_url } = await api.uploadLogo(id, file);
      set('logo_url', logo_url);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingLogo(false);
      if (logoFileRef.current) logoFileRef.current.value = '';
    }
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
              <span className="hint">
                Texto mostrado no card quando a marca não tem logo cadastrado (aceita &lt;br&gt; para quebra de
                linha), ex: "Canal&lt;br&gt;Brasil".
              </span>
            </label>
            <PickOrCreate
              label="Grupo"
              value={brand.brand_group}
              options={groupOptions}
              onChange={(v) => set('brand_group', v)}
            />
            <PickOrCreate
              label="Filtro"
              value={brand.filter_key}
              options={filterOptions}
              onChange={(v) => set('filter_key', v)}
            />
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {brand.logo_url && (
                <div className="client-logo" style={{ width: 56, height: 56 }}>
                  <img src={brand.logo_url} alt={brand.name} />
                </div>
              )}
              {!isNew && (
                <label className="icon-btn" style={{ cursor: 'pointer' }}>
                  {uploadingLogo ? 'Enviando…' : '⬆ Upload da máquina'}
                  <input
                    ref={logoFileRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                  />
                </label>
              )}
            </div>
          </div>
          {isNew && <p className="hint">Salve a marca primeiro para poder enviar um arquivo de logo da máquina.</p>}

          {brand.logo_url && (
            <div className="logo-offset">
              <label>
                Ajuste manual de centralização horizontal
                <div className="logo-offset__row">
                  <input
                    type="range"
                    min={-20}
                    max={20}
                    step={0.5}
                    value={brand.logo_offset_x ?? 0}
                    onChange={(e) => set('logo_offset_x', Number(e.target.value))}
                  />
                  <span className="logo-offset__value">
                    {brand.logo_offset_x === null || brand.logo_offset_x === undefined
                      ? 'Automático'
                      : `${Number(brand.logo_offset_x) > 0 ? '+' : ''}${brand.logo_offset_x}%`}
                  </span>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => set('logo_offset_x', null)}
                    disabled={brand.logo_offset_x === null || brand.logo_offset_x === undefined}
                  >
                    Redefinir p/ automático
                  </button>
                </div>
              </label>
              <p className="hint">
                Use quando a centralização automática não ficar perfeita (logos com elementos gráficos
                decorativos). Negativo move o logo para a esquerda, positivo para a direita.
              </p>
              <div className="logo-offset__preview">
                <div className="logo-offset__guide" />
                <img
                  src={brand.logo_url}
                  alt=""
                  style={{ transform: `translateX(${brand.logo_offset_x || 0}%)` }}
                />
              </div>
            </div>
          )}

          <p className="hint">
            A cor do gradiente do card é editada na lista de Clientes (botão "Editar cores").
          </p>

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
