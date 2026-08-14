import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  const canWrite = user.role === 'admin' || user.role === 'editor';
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('clientes');

  function load() {
    setLoading(true);
    api.listBrands().then(setBrands).finally(() => setLoading(false));
  }

  useEffect(load, []);

  if (loading) return <p className="loading">Carregando…</p>;

  const sectionsCount = brands.reduce((total, b) => total + Number(b.sections_count || 0), 0);
  const blocksCount = brands.reduce((total, b) => total + Number(b.blocks_count || 0), 0);

  return (
    <div>
      <div className="stats">
        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--blue">👥</div>
          <div>
            <div className="stat-card__value">{brands.length}</div>
            <div className="stat-card__label">Clientes</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--purple">📂</div>
          <div>
            <div className="stat-card__value">{sectionsCount}</div>
            <div className="stat-card__label">Seções</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--green">📄</div>
          <div>
            <div className="stat-card__value">{blocksCount}</div>
            <div className="stat-card__label">Blocos</div>
          </div>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'clientes' ? 'active' : ''}`} onClick={() => setTab('clientes')}>
          👥 Clientes
        </button>
        <button className={`tab ${tab === 'secoes' ? 'active' : ''}`} onClick={() => setTab('secoes')}>
          📂 Seções
        </button>
        <Link className="tab" to="/site-content">
          📝 Conteúdo do Site
        </Link>
        {user.role === 'admin' && (
          <Link className="tab" to="/users">
            👤 Usuários
          </Link>
        )}
      </div>

      {tab === 'clientes' ? (
        <ClientesTab brands={brands} canWrite={canWrite} onChange={load} />
      ) : (
        <SecoesTab brands={brands} />
      )}
    </div>
  );
}

function ClientesTab({ brands, canWrite, onChange }) {
  async function handleDelete(id, name) {
    if (!confirm(`Excluir a marca "${name}"? Essa ação não pode ser desfeita.`)) return;
    await api.deleteBrand(id);
    onChange();
  }

  return (
    <div>
      <div className="page__head">
        <h2>Gerenciar Clientes</h2>
        {canWrite && (
          <Link className="btn" to="/brands/new">
            + Novo Cliente
          </Link>
        )}
      </div>
      <div className="client-grid">
        {brands.map((b) => (
          <ClientCard key={b.id} brand={b} canWrite={canWrite} onChange={onChange} onDelete={handleDelete} />
        ))}
      </div>
    </div>
  );
}

const CORNER_LABELS = [
  { key: 'grad_a', label: 'Topo esquerdo' },
  { key: 'grad_b', label: 'Topo direito' },
  { key: 'grad_c', label: 'Baixo esquerdo' },
  { key: 'grad_d', label: 'Baixo direito' },
];

function ClientCard({ brand, canWrite, onChange, onDelete }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [editingColors, setEditingColors] = useState(false);
  const [colorDraft, setColorDraft] = useState(null);
  const [savingColors, setSavingColors] = useState(false);
  const navigate = useNavigate();

  function openColorEditor() {
    setColorDraft({
      grad_a: brand.grad_a || '#2A2A2A',
      grad_b: brand.grad_b || '#1A1A1A',
      grad_c: brand.grad_c || '#0F0F0F',
      grad_d: brand.grad_d || '#242424',
    });
    setEditingColors(true);
  }

  async function handleSaveColors() {
    setSavingColors(true);
    try {
      await api.updateBrand(brand.id, { ...brand, ...colorDraft });
      setEditingColors(false);
      onChange();
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingColors(false);
    }
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await api.uploadLogo(brand.id, file);
      onChange();
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  const swatchColors = [brand.grad_a, brand.grad_b, brand.grad_c, brand.grad_d].filter(Boolean);

  return (
    <div className="client-card">
      <div className="client-card__top">
        <div className="client-card__info">
          <div className="client-logo">
            {brand.logo_url ? (
              <img src={brand.logo_url} alt={brand.name} />
            ) : (
              <span className="client-logo__placeholder">{brand.name.slice(0, 2).toUpperCase()}</span>
            )}
            {canWrite && (
              <label className="client-logo__upload">
                {uploading ? '…' : '⬆'}
                <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} disabled={uploading} />
              </label>
            )}
          </div>
          <div>
            <div className="client-name">{brand.name}</div>
            <div className="client-slug">/{brand.slug}</div>
          </div>
        </div>
        <div className="client-card__actions">
          <button className="icon-btn icon-btn--purple" onClick={() => navigate(`/brands/${brand.id}/sections`)}>
            📂 Seções
          </button>
          {canWrite && (
            <>
              <button className="icon-btn" onClick={() => navigate(`/brands/${brand.id}`)} title="Editar">
                ✎
              </button>
              <button className="icon-btn icon-btn--danger" onClick={() => onDelete(brand.id, brand.name)} title="Excluir">
                🗑
              </button>
            </>
          )}
        </div>
      </div>
      <div className="client-card__footer">
        <div className="swatches">
          <span className="swatches__label">Cor do gradiente:</span>
          {swatchColors.length ? (
            <span className="swatches__dots">
              {swatchColors.map((c, i) => (
                <span key={i} className="swatch" style={{ backgroundColor: c }} />
              ))}
            </span>
          ) : (
            <span className="swatches__empty">Não definida</span>
          )}
        </div>
        {canWrite && (
          <button className="link-btn" onClick={() => (editingColors ? setEditingColors(false) : openColorEditor())}>
            {editingColors ? 'Cancelar' : 'Editar cores'}
          </button>
        )}
      </div>

      {editingColors && colorDraft && (
        <div className="color-editor">
          <p className="color-editor__hint">Selecione 4 cores para o gradiente animado:</p>
          <div className="color-editor__grid">
            {CORNER_LABELS.map((c) => (
              <label key={c.key} className="color-editor__field">
                <input
                  type="color"
                  value={colorDraft[c.key]}
                  onChange={(e) => setColorDraft((d) => ({ ...d, [c.key]: e.target.value }))}
                />
                <span>{c.label}</span>
              </label>
            ))}
          </div>
          <div className="color-editor__footer">
            <div className="color-editor__preview">
              <span>Preview:</span>
              <span
                className="color-editor__blob"
                style={{
                  background: `radial-gradient(circle at 25% 25%, ${colorDraft.grad_a}, transparent 60%),
                    radial-gradient(circle at 75% 25%, ${colorDraft.grad_b}, transparent 60%),
                    radial-gradient(circle at 25% 75%, ${colorDraft.grad_c}, transparent 60%),
                    radial-gradient(circle at 75% 75%, ${colorDraft.grad_d}, transparent 60%)`,
                }}
              />
            </div>
            <button className="btn" type="button" disabled={savingColors} onClick={handleSaveColors}>
              {savingColors ? 'Salvando…' : 'Salvar cores'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SecoesTab({ brands }) {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    Promise.all(brands.map((b) => api.getBrand(b.id))).then((details) => {
      setRows(
        details.flatMap((d) =>
          d.sections.map((s) => ({ brand: d, section: s }))
        )
      );
    });
  }, [brands]);

  if (rows === null) return <p className="loading">Carregando…</p>;
  if (!rows.length) return <p className="loading">Nenhuma seção cadastrada ainda.</p>;

  return (
    <div className="sections-grid">
      {rows.map(({ brand, section }) => (
        <Link key={section.id} to={`/brands/${brand.id}/sections`} className="section-row">
          <div>
            <div className="section-row__name">{section.title}</div>
            <div className="section-row__brand">{brand.name}</div>
          </div>
          <span className="badge">{section.blocks.length} blocos</span>
        </Link>
      ))}
    </div>
  );
}
