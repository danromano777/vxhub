import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function ClientSections() {
  const { id } = useParams();
  const { user } = useAuth();
  const canWrite = user.role === 'admin' || user.role === 'editor';
  const [brand, setBrand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState({ logos: true, fontes: false, brandguide: false, cores: false });

  function load() {
    setLoading(true);
    api.getBrand(id).then(setBrand).finally(() => setLoading(false));
  }
  useEffect(load, [id]);

  if (loading || !brand) return <p className="loading">Carregando…</p>;

  function toggle(key) {
    setOpen((o) => ({ ...o, [key]: !o[key] }));
  }

  return (
    <div>
      <Link to="/" className="backlink">
        ← Voltar para Clientes
      </Link>
      <div className="detail-header">
        <div className="detail-header__info">
          <div className="detail-header__logo">
            {brand.logo_url && <img src={brand.logo_url} alt={brand.name} />}
          </div>
          <div>
            <div className="detail-header__name">{brand.name}</div>
            <div className="detail-header__slug">/{brand.slug}</div>
          </div>
        </div>
        <div className="detail-header__actions">
          <a className="icon-btn" href="/" target="_blank" rel="noopener noreferrer">
            🔗 Ver Página
          </a>
          {canWrite && (
            <Link className="icon-btn icon-btn--purple" to={`/brands/${brand.id}`}>
              ✎ Editar Cliente
            </Link>
          )}
        </div>
      </div>

      <AccordionSection
        title="Logos"
        countLabel={`${brand.logos.length} blocos`}
        open={open.logos}
        onToggle={() => toggle('logos')}
      >
        <LogosSection brand={brand} canWrite={canWrite} onChange={load} />
      </AccordionSection>

      <AccordionSection
        title="Fontes"
        countLabel={`${brand.fonts.length} blocos`}
        open={open.fontes}
        onToggle={() => toggle('fontes')}
      >
        <FontesSection brand={brand} canWrite={canWrite} onChange={load} />
      </AccordionSection>

      <AccordionSection
        title="Brandguide"
        countLabel={brand.brandguide_url ? '1 bloco' : '0 blocos'}
        open={open.brandguide}
        onToggle={() => toggle('brandguide')}
      >
        <BrandguideSection brand={brand} canWrite={canWrite} onChange={load} />
      </AccordionSection>

      <AccordionSection
        title="Cores"
        countLabel={`${brand.colors.length} blocos`}
        open={open.cores}
        onToggle={() => toggle('cores')}
      >
        <ColoresSection brand={brand} canWrite={canWrite} onChange={load} />
      </AccordionSection>
    </div>
  );
}

function AccordionSection({ title, countLabel, open, onToggle, children }) {
  return (
    <div className="accordion">
      <div className="accordion__head" onClick={onToggle}>
        <div className="accordion__title-group">
          <span className={`accordion__chevron ${open ? 'open' : ''}`}>⌄</span>
          <div>
            <div className="accordion__title">{title}</div>
            <div className="accordion__count">{countLabel}</div>
          </div>
        </div>
      </div>
      {open && <div className="accordion__body">{children}</div>}
    </div>
  );
}

function LogosSection({ brand, canWrite, onChange }) {
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  async function handleAdd(e) {
    e.preventDefault();
    if (!imageUrl) return;
    await api.addItem(brand.id, 'logos', { name, image_url: imageUrl, hex: '' });
    setName('');
    setImageUrl('');
    onChange();
  }

  async function handleEdit(item) {
    const newName = prompt('Nome do logo', item.name || '');
    if (newName === null) return;
    const newUrl = prompt('URL da imagem', item.image_url || '');
    if (newUrl === null) return;
    await api.updateItem(brand.id, 'logos', item.id, { ...item, name: newName, image_url: newUrl });
    onChange();
  }

  async function handleDelete(itemId) {
    if (!confirm('Remover este logo?')) return;
    await api.deleteItem(brand.id, 'logos', itemId);
    onChange();
  }

  return (
    <div>
      {brand.logos.length ? (
        <div className="block-grid">
          {brand.logos.map((l) => (
            <div key={l.id} className="block-tile">
              <div className="block-tile__preview">
                {l.image_url ? <img src={l.image_url} alt={l.name} /> : <span>🖼</span>}
              </div>
              <div className="block-tile__caption">{l.name || 'sem nome'}</div>
            </div>
          ))}
        </div>
      ) : (
        <p className="empty-block">Nenhum logo cadastrado ainda.</p>
      )}

      {brand.drive_logos_url && (
        <div className="link-row">
          <a href={brand.drive_logos_url} target="_blank" rel="noopener noreferrer">
            Todos os logos de {brand.name} (Drive)
          </a>
        </div>
      )}

      {canWrite && (
        <>
          <form onSubmit={handleAdd} className="subform">
            <input placeholder="Nome do logo" value={name} onChange={(e) => setName(e.target.value)} />
            <input placeholder="URL da imagem" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
            <button type="submit">+ Bloco</button>
          </form>
          {!!brand.logos.length && (
            <div className="manage-list">
              <p className="manage-list__title">Gerenciar blocos:</p>
              {brand.logos.map((l) => (
                <div key={l.id} className="manage-item">
                  <span className="manage-item__name">{l.name || 'sem nome'}</span>
                  <span className="manage-item__actions">
                    <button onClick={() => handleEdit(l)} title="Editar bloco">
                      ✎
                    </button>
                    <button onClick={() => handleDelete(l.id)} title="Excluir bloco" className="danger">
                      🗑
                    </button>
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function FontesSection({ brand, canWrite, onChange }) {
  const [name, setName] = useState('');

  async function handleAdd(e) {
    e.preventDefault();
    if (!name) return;
    await api.addItem(brand.id, 'fonts', { name });
    setName('');
    onChange();
  }

  async function handleEdit(item) {
    const newName = prompt('Nome da fonte', item.name || '');
    if (newName === null) return;
    await api.updateItem(brand.id, 'fonts', item.id, { name: newName });
    onChange();
  }

  async function handleDelete(itemId) {
    if (!confirm('Remover esta fonte?')) return;
    await api.deleteItem(brand.id, 'fonts', itemId);
    onChange();
  }

  return (
    <div>
      {brand.fonts.length ? (
        <div className="block-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
          {brand.fonts.map((f) => (
            <div key={f.id} className="font-tile">
              <div className="font-tile__name">{f.name}</div>
              <div className="font-tile__preview">Aa</div>
            </div>
          ))}
        </div>
      ) : (
        <p className="empty-block">Nenhuma fonte cadastrada ainda.</p>
      )}

      {brand.drive_fonts_url && (
        <div className="link-row">
          <a href={brand.drive_fonts_url} target="_blank" rel="noopener noreferrer">
            Todas as fontes de {brand.name} (Drive)
          </a>
        </div>
      )}

      {canWrite && (
        <>
          <form onSubmit={handleAdd} className="subform">
            <input placeholder="Nome da fonte" value={name} onChange={(e) => setName(e.target.value)} />
            <button type="submit">+ Bloco</button>
          </form>
          {!!brand.fonts.length && (
            <div className="manage-list">
              <p className="manage-list__title">Gerenciar blocos:</p>
              {brand.fonts.map((f) => (
                <div key={f.id} className="manage-item">
                  <span className="manage-item__name">{f.name}</span>
                  <span className="manage-item__actions">
                    <button onClick={() => handleEdit(f)} title="Editar bloco">
                      ✎
                    </button>
                    <button onClick={() => handleDelete(f.id)} title="Excluir bloco" className="danger">
                      🗑
                    </button>
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ColoresSection({ brand, canWrite, onChange }) {
  const [draft, setDraft] = useState({ hex: '', rgb: '', cmyk: '', pantone: '' });

  async function handleAdd(e) {
    e.preventDefault();
    if (!draft.hex) return;
    await api.addItem(brand.id, 'colors', draft);
    setDraft({ hex: '', rgb: '', cmyk: '', pantone: '' });
    onChange();
  }

  async function handleEdit(item) {
    const hex = prompt('Hex', item.hex || '');
    if (hex === null) return;
    const rgb = prompt('RGB', item.rgb || '');
    if (rgb === null) return;
    const cmyk = prompt('CMYK', item.cmyk || '');
    if (cmyk === null) return;
    const pantone = prompt('Pantone', item.pantone || '');
    if (pantone === null) return;
    await api.updateItem(brand.id, 'colors', item.id, { hex, rgb, cmyk, pantone });
    onChange();
  }

  async function handleDelete(itemId) {
    if (!confirm('Remover esta cor?')) return;
    await api.deleteItem(brand.id, 'colors', itemId);
    onChange();
  }

  return (
    <div>
      {brand.colors.length ? (
        <div className="block-grid">
          {brand.colors.map((c) => (
            <div key={c.id} className="color-tile" style={{ borderColor: c.hex || '#444' }}>
              <div className="color-tile__swatch" style={{ backgroundColor: c.hex || '#222' }} />
              <div className="color-tile__meta">
                <div>HEX {c.hex}</div>
                {c.rgb && <div>RGB {c.rgb}</div>}
                {c.cmyk && <div>CMYK {c.cmyk}</div>}
                {c.pantone && <div>Pantone {c.pantone}</div>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="empty-block">Nenhuma cor cadastrada ainda.</p>
      )}

      {brand.drive_colors_url && (
        <div className="link-row">
          <a href={brand.drive_colors_url} target="_blank" rel="noopener noreferrer">
            {brand.name} (Swatch Color)
          </a>
        </div>
      )}

      {canWrite && (
        <>
          <form onSubmit={handleAdd} className="subform">
            <input placeholder="Hex" value={draft.hex} onChange={(e) => setDraft((d) => ({ ...d, hex: e.target.value }))} />
            <input placeholder="RGB" value={draft.rgb} onChange={(e) => setDraft((d) => ({ ...d, rgb: e.target.value }))} />
            <input placeholder="CMYK" value={draft.cmyk} onChange={(e) => setDraft((d) => ({ ...d, cmyk: e.target.value }))} />
            <input
              placeholder="Pantone"
              value={draft.pantone}
              onChange={(e) => setDraft((d) => ({ ...d, pantone: e.target.value }))}
            />
            <button type="submit">+ Bloco</button>
          </form>
          {!!brand.colors.length && (
            <div className="manage-list">
              <p className="manage-list__title">Gerenciar blocos:</p>
              {brand.colors.map((c) => (
                <div key={c.id} className="manage-item">
                  <span className="manage-item__name">{c.pantone || c.hex}</span>
                  <span className="manage-item__actions">
                    <button onClick={() => handleEdit(c)} title="Editar bloco">
                      ✎
                    </button>
                    <button onClick={() => handleDelete(c.id)} title="Excluir bloco" className="danger">
                      🗑
                    </button>
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function BrandguideSection({ brand, canWrite, onChange }) {
  async function handleEdit() {
    const url = prompt('URL de preview do brandguide (ex: link do Drive em modo /preview)', brand.brandguide_url || '');
    if (url === null) return;
    await api.updateBrand(brand.id, { ...brand, brandguide_url: url });
    onChange();
  }

  return (
    <div>
      {brand.brandguide_url ? (
        <iframe src={brand.brandguide_url} className="pdf-frame" title="Brandguide" allow="autoplay" />
      ) : (
        <p className="empty-block">Nenhum brandguide cadastrado ainda.</p>
      )}
      {canWrite && (
        <div style={{ marginTop: 12 }}>
          <button className="icon-btn" onClick={handleEdit}>
            ✎ Editar link do brandguide
          </button>
        </div>
      )}
    </div>
  );
}
