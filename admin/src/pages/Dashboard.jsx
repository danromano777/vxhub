import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { SiteContentPanel } from './SiteContent.jsx';
import { UsersPanel } from './Users.jsx';

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

  return (
    <div>
      <div className="tabs">
        <button className={`tab ${tab === 'clientes' ? 'active' : ''}`} onClick={() => setTab('clientes')}>
          👥 Clientes
        </button>
        <button className={`tab ${tab === 'conteudo' ? 'active' : ''}`} onClick={() => setTab('conteudo')}>
          📝 Conteúdo do Site
        </button>
        {user.role === 'admin' && (
          <button className={`tab ${tab === 'usuarios' ? 'active' : ''}`} onClick={() => setTab('usuarios')}>
            👤 Usuários
          </button>
        )}
      </div>

      {tab === 'clientes' && <ClientesTab brands={brands} canWrite={canWrite} onChange={load} />}
      {tab === 'conteudo' && <SiteContentPanel />}
      {tab === 'usuarios' && user.role === 'admin' && <UsersPanel />}
    </div>
  );
}

function ClientesTab({ brands, canWrite, onChange }) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('ordem');
  const [groupFilter, setGroupFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');

  async function handleDelete(id, name) {
    if (!confirm(`Excluir a marca "${name}"? Essa ação não pode ser desfeita.`)) return;
    await api.deleteBrand(id);
    onChange();
  }

  const groupOptions = useMemo(
    () => [...new Set(brands.map((b) => b.brand_group).filter(Boolean))].sort(),
    [brands]
  );
  const tagOptions = useMemo(
    () => [...new Set(brands.map((b) => b.filter_key).filter(Boolean))].sort(),
    [brands]
  );

  const visibleBrands = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = brands.filter((b) => {
      if (groupFilter && b.brand_group !== groupFilter) return false;
      if (tagFilter && b.filter_key !== tagFilter) return false;
      if (!q) return true;
      return (
        b.name.toLowerCase().includes(q) ||
        b.slug.toLowerCase().includes(q) ||
        (b.brand_group || '').toLowerCase().includes(q) ||
        (b.filter_key || '').toLowerCase().includes(q)
      );
    });
    const sorted = [...filtered];
    if (sortBy === 'nome-asc') sorted.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    else if (sortBy === 'nome-desc') sorted.sort((a, b) => b.name.localeCompare(a.name, 'pt-BR'));
    else sorted.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || a.id - b.id);
    return sorted;
  }, [brands, search, sortBy, groupFilter, tagFilter]);

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
      <div className="client-search">
        <input
          type="search"
          placeholder="Buscar por nome, slug, grupo ou filtro…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)}>
          <option value="">Todos os grupos</option>
          {groupOptions.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}>
          <option value="">Todos os filtros</option>
          {tagOptions.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="ordem">Ordem definida</option>
          <option value="nome-asc">Nome (A–Z)</option>
          <option value="nome-desc">Nome (Z–A)</option>
        </select>
      </div>
      {!visibleBrands.length ? (
        <p className="empty-block">Nenhum cliente encontrado.</p>
      ) : (
        <div className="client-grid">
          {visibleBrands.map((b) => (
            <ClientCard key={b.id} brand={b} canWrite={canWrite} onChange={onChange} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

const CORNER_LABELS = [
  { key: 'grad_a', label: 'Topo esquerdo' },
  { key: 'grad_b', label: 'Topo direito' },
  { key: 'grad_c', label: 'Baixo esquerdo' },
  { key: 'grad_d', label: 'Baixo direito' },
];

function hexToRgba(hex, alpha) {
  const clean = String(hex).replace('#', '').trim();
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return `rgba(196,255,77,${alpha})`;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

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
      grad_base: brand.grad_base || '#07261f',
      grad_pale: !!brand.grad_pale,
    });
    setEditingColors(true);
  }

  async function handleSaveColors() {
    setSavingColors(true);
    try {
      const grad_glow = hexToRgba(colorDraft.grad_a, 0.45);
      await api.updateBrand(brand.id, { ...brand, ...colorDraft, grad_glow });
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
            <label className="color-editor__field">
              <input
                type="color"
                value={colorDraft.grad_base}
                onChange={(e) => setColorDraft((d) => ({ ...d, grad_base: e.target.value }))}
              />
              <span>Fundo do card</span>
            </label>
          </div>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={!!colorDraft.grad_pale}
              onChange={(e) => setColorDraft((d) => ({ ...d, grad_pale: e.target.checked }))}
            />
            Fundo claro (pale)
          </label>
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
