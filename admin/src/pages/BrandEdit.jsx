import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

const emptyBrand = {
  slug: '', name: '', display_html: '', brand_group: '', filter_key: '', description: '',
  grad_a: '#C4FF4D', grad_b: '#18E0C8', grad_c: '#05463F', grad_d: '#E6FF9A',
  grad_base: '#07261f', grad_glow: 'rgba(196,255,77,.45)', grad_pale: false, logo_url: '',
  drive_logos_url: '', drive_fonts_url: '', drive_colors_url: '', brandguide_url: '', sort_order: 0,
};

export default function BrandEdit() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const { user } = useAuth();
  const canWrite = user.role === 'admin' || user.role === 'editor';

  const [brand, setBrand] = useState(emptyBrand);
  const [logos, setLogos] = useState([]);
  const [fonts, setFonts] = useState([]);
  const [colors, setColors] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function load() {
    if (isNew) return;
    setLoading(true);
    api
      .getBrand(id)
      .then((b) => {
        const { logos, fonts, colors, ...rest } = b;
        setBrand(rest);
        setLogos(logos);
        setFonts(fonts);
        setColors(colors);
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

  if (loading) return <p>Carregando…</p>;

  return (
    <div>
      <Link to="/" className="backlink">
        ← Voltar para Clientes
      </Link>
      <h1>{isNew ? 'Nova marca' : brand.name}</h1>
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

          <h3>Links do Drive</h3>
          <div className="grid2">
            <label>
              Logos <input value={brand.drive_logos_url} onChange={(e) => set('drive_logos_url', e.target.value)} />
            </label>
            <label>
              Fontes <input value={brand.drive_fonts_url} onChange={(e) => set('drive_fonts_url', e.target.value)} />
            </label>
            <label>
              Cores <input value={brand.drive_colors_url} onChange={(e) => set('drive_colors_url', e.target.value)} />
            </label>
            <label>
              Brand guide (preview)
              <input value={brand.brandguide_url} onChange={(e) => set('brandguide_url', e.target.value)} />
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

      {!isNew && (
        <>
          <SubList
            title="Logos"
            brandId={id}
            kind="logos"
            items={logos}
            canWrite={canWrite}
            fields={[
              { key: 'name', label: 'Nome' },
              { key: 'hex', label: 'Cor (hex)' },
              { key: 'image_url', label: 'URL da imagem' },
            ]}
            onChange={load}
          />
          <SubList
            title="Fontes"
            brandId={id}
            kind="fonts"
            items={fonts}
            canWrite={canWrite}
            fields={[{ key: 'name', label: 'Nome da fonte' }]}
            onChange={load}
          />
          <SubList
            title="Cores"
            brandId={id}
            kind="colors"
            items={colors}
            canWrite={canWrite}
            fields={[
              { key: 'hex', label: 'Hex' },
              { key: 'rgb', label: 'RGB' },
              { key: 'cmyk', label: 'CMYK' },
              { key: 'pantone', label: 'Pantone' },
            ]}
            onChange={load}
          />
        </>
      )}
    </div>
  );
}

function SubList({ title, brandId, kind, items, fields, canWrite, onChange }) {
  const empty = Object.fromEntries(fields.map((f) => [f.key, '']));
  const [draft, setDraft] = useState(empty);
  const [editingId, setEditingId] = useState(null);

  async function handleAdd(e) {
    e.preventDefault();
    await api.addItem(brandId, kind, draft);
    setDraft(empty);
    onChange();
  }

  async function handleUpdate(item) {
    await api.updateItem(brandId, kind, item.id, item);
    setEditingId(null);
    onChange();
  }

  async function handleDelete(itemId) {
    if (!confirm('Remover este item?')) return;
    await api.deleteItem(brandId, kind, itemId);
    onChange();
  }

  return (
    <div className="section">
      <h2>
        {title} <span className="count">{items.length}</span>
      </h2>
      <table className="table">
        <thead>
          <tr>
            {fields.map((f) => (
              <th key={f.key}>{f.label}</th>
            ))}
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <SubRow
              key={item.id}
              item={item}
              fields={fields}
              canWrite={canWrite}
              editing={editingId === item.id}
              onEdit={() => setEditingId(item.id)}
              onCancel={() => setEditingId(null)}
              onSave={handleUpdate}
              onDelete={() => handleDelete(item.id)}
            />
          ))}
        </tbody>
      </table>
      {canWrite && (
        <form onSubmit={handleAdd} className="subform">
          {fields.map((f) => (
            <input
              key={f.key}
              placeholder={f.label}
              value={draft[f.key]}
              onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
            />
          ))}
          <button type="submit">Adicionar</button>
        </form>
      )}
    </div>
  );
}

function SubRow({ item, fields, canWrite, editing, onEdit, onCancel, onSave, onDelete }) {
  const [draft, setDraft] = useState(item);
  useEffect(() => setDraft(item), [item, editing]);

  if (!editing) {
    return (
      <tr>
        {fields.map((f) => (
          <td key={f.key}>{item[f.key]}</td>
        ))}
        <td className="table__actions">
          {canWrite && (
            <>
              <button onClick={onEdit}>Editar</button>
              <button onClick={onDelete}>Excluir</button>
            </>
          )}
        </td>
      </tr>
    );
  }

  return (
    <tr>
      {fields.map((f) => (
        <td key={f.key}>
          <input value={draft[f.key] || ''} onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))} />
        </td>
      ))}
      <td className="table__actions">
        <button onClick={() => onSave(draft)}>Salvar</button>
        <button onClick={onCancel}>Cancelar</button>
      </td>
    </tr>
  );
}
