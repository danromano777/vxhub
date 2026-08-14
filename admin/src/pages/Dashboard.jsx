import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

const SECTION_TYPES = [
  { key: 'drive_logos_url', label: 'Logos' },
  { key: 'drive_fonts_url', label: 'Fontes' },
  { key: 'brandguide_url', label: 'Brandguide' },
  { key: 'drive_colors_url', label: 'Cores' },
];

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

  const sectionsCount = brands.reduce(
    (total, b) => total + SECTION_TYPES.filter((s) => b[s.key]).length,
    0
  );

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
            <div className="stat-card__value">0</div>
            <div className="stat-card__label">Arquivos</div>
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

function ClientCard({ brand, canWrite, onChange, onDelete }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

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
          <button className="icon-btn icon-btn--purple" onClick={() => navigate(`/brands/${brand.id}`)}>
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
        <Link className="link-btn" to={`/brands/${brand.id}`}>
          Editar cores
        </Link>
      </div>
    </div>
  );
}

function SecoesTab({ brands }) {
  const rows = brands.flatMap((b) =>
    SECTION_TYPES.filter((s) => b[s.key]).map((s) => ({ brand: b, type: s }))
  );

  if (!rows.length) return <p className="loading">Nenhuma seção cadastrada ainda.</p>;

  return (
    <div className="sections-grid">
      {rows.map(({ brand, type }) => (
        <Link key={`${brand.id}-${type.key}`} to={`/brands/${brand.id}`} className="section-row">
          <div>
            <div className="section-row__name">{type.label}</div>
            <div className="section-row__brand">{brand.name}</div>
          </div>
          <span className="badge">{type.label}</span>
        </Link>
      ))}
    </div>
  );
}
