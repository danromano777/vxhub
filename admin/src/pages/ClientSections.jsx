import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

const GRID_TYPES = ['image_download', 'video', 'font_card', 'color_palette'];

function hexToRgb(hex) {
  const clean = String(hex).replace('#', '').trim();
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

function rgbToCmyk(r, g, b) {
  if (r === 0 && g === 0 && b === 0) return { c: 0, m: 0, y: 0, k: 100 };
  const rr = r / 255, gg = g / 255, bb = b / 255;
  const k = 1 - Math.max(rr, gg, bb);
  const c = Math.round(((1 - rr - k) / (1 - k)) * 100);
  const m = Math.round(((1 - gg - k) / (1 - k)) * 100);
  const y = Math.round(((1 - bb - k) / (1 - k)) * 100);
  return { c, m, y, k: Math.round(k * 100) };
}

// Aproximação de PMS Solid Coated. As 10 primeiras entradas são pares
// hex/Pantone já confirmados manualmente (Canal Brasil); o resto é uma
// tabela de referência ampla, não-oficial, usada para sugerir a "cor mais
// próxima" — é só um ponto de partida, sempre revisar antes de imprimir.
const PANTONE_TABLE = [
  { code: 'BLACK C', hex: '#000000' },
  { code: '108 C', hex: '#FFDC00' },
  { code: '2427 C', hex: '#003C00' },
  { code: '7554 C', hex: '#3C2D19' },
  { code: 'BRIGHT RED', hex: '#FF3228' },
  { code: '325 C', hex: '#00E1BE' },
  { code: 'White Smoke', hex: '#F8F9F7' },
  { code: '2144 C', hex: '#005096' },
  { code: '163 C', hex: '#FF8C50' },
  { code: 'White', hex: '#FFFFFF' },
  { code: 'Cool Gray 1 C', hex: '#D9D9D6' },
  { code: 'Cool Gray 3 C', hex: '#C8C9C7' },
  { code: 'Cool Gray 5 C', hex: '#B1B3B3' },
  { code: 'Cool Gray 7 C', hex: '#97999B' },
  { code: 'Cool Gray 9 C', hex: '#75787B' },
  { code: 'Cool Gray 11 C', hex: '#53565A' },
  { code: 'Warm Gray 1 C', hex: '#D7D2CB' },
  { code: 'Warm Gray 5 C', hex: '#B6ADA5' },
  { code: 'Warm Gray 9 C', hex: '#97918C' },
  { code: 'Warm Gray 11 C', hex: '#7A7570' },
  { code: '185 C', hex: '#E4002B' },
  { code: '186 C', hex: '#C8102E' },
  { code: '199 C', hex: '#D50032' },
  { code: '201 C', hex: '#9E1B32' },
  { code: 'Warm Red C', hex: '#F9423A' },
  { code: 'Rubine Red C', hex: '#CE0058' },
  { code: 'Rhodamine Red C', hex: '#E10098' },
  { code: '219 C', hex: '#98004D' },
  { code: 'Orange 021 C', hex: '#FE5000' },
  { code: '1655 C', hex: '#FF5C39' },
  { code: '165 C', hex: '#FF5C1D' },
  { code: '1585 C', hex: '#FF8200' },
  { code: '144 C', hex: '#ED8B00' },
  { code: '158 C', hex: '#E9662C' },
  { code: 'Yellow C', hex: '#FEDD00' },
  { code: 'Yellow 012 C', hex: '#FFD100' },
  { code: '109 C', hex: '#FFD400' },
  { code: '116 C', hex: '#FFCD00' },
  { code: '123 C', hex: '#FFC72C' },
  { code: '7548 C', hex: '#FFB81C' },
  { code: '355 C', hex: '#00B140' },
  { code: '348 C', hex: '#00843D' },
  { code: '7742 C', hex: '#6A7F10' },
  { code: '7739 C', hex: '#7AB800' },
  { code: '368 C', hex: '#78BE20' },
  { code: '375 C', hex: '#97D700' },
  { code: '7481 C', hex: '#43B02A' },
  { code: '340 C', hex: '#00594C' },
  { code: '3305 C', hex: '#00534C' },
  { code: 'Reflex Blue C', hex: '#001489' },
  { code: '286 C', hex: '#0032A0' },
  { code: '293 C', hex: '#0033A0' },
  { code: '2925 C', hex: '#0091DA' },
  { code: '2995 C', hex: '#00A9E0' },
  { code: '7461 C', hex: '#0093B2' },
  { code: '647 C', hex: '#205C7D' },
  { code: '7546 C', hex: '#2E3A45' },
  { code: 'Purple C', hex: '#7D3F98' },
  { code: '2685 C', hex: '#330072' },
  { code: '2597 C', hex: '#871EB1' },
  { code: '2725 C', hex: '#6E4CAF' },
  { code: '2587 C', hex: '#9063CD' },
  { code: '7519 C', hex: '#A9895C' },
  { code: '469 C', hex: '#5C4033' },
  { code: '7526 C', hex: '#7F5539' },
];
const PANTONE_RGB = PANTONE_TABLE.map((p) => ({ ...p, rgb: hexToRgb(p.hex) }));

function nearestPantone(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  let best = null;
  let bestDist = Infinity;
  for (const p of PANTONE_RGB) {
    const dr = rgb.r - p.rgb.r, dg = rgb.g - p.rgb.g, db = rgb.b - p.rgb.b;
    const dist = dr * dr + dg * dg + db * db;
    if (dist < bestDist) {
      bestDist = dist;
      best = p;
    }
  }
  return best ? best.code : null;
}

const BLOCK_TYPE_META = {
  imagem: {
    blockType: 'image_download', label: 'Imagem', icon: '🖼️',
    fields: [
      { key: 'title', label: 'Título' },
      { key: 'file_url', label: 'URL da imagem', upload: true },
    ],
  },
  imglink: {
    blockType: 'image_download', label: 'Img+Link', icon: '📎',
    fields: [
      { key: 'title', label: 'Título' },
      { key: 'file_url', label: 'URL da imagem', upload: true },
      { key: 'external_url', label: 'Link' },
    ],
  },
  video: {
    blockType: 'video', label: 'Vídeo', icon: '🎬',
    fields: [
      { key: 'title', label: 'Título' },
      { key: 'file_url', label: 'Arquivo de vídeo', upload: true },
      { key: 'external_url', label: 'ou link (YouTube/Vimeo)' },
    ],
  },
  fonte: {
    blockType: 'font_card', label: 'Fonte', icon: '🔤',
    fields: [
      { key: 'title', label: 'Nome da fonte' },
      { key: 'font_file_url', label: 'Arquivo da fonte', upload: true },
    ],
  },
  cor: {
    blockType: 'color_palette', label: 'Cor', icon: '🎨',
    fields: [
      { key: 'title', label: 'Nome da cor' },
      { key: 'color_hex', label: 'Hex' },
      { key: 'color_rgb', label: 'RGB' },
      { key: 'color_cmyk', label: 'CMYK' },
      { key: 'color_pantone', label: 'Pantone' },
    ],
  },
  pdf: {
    blockType: 'pdf_viewer', label: 'PDF', icon: '📄',
    fields: [
      { key: 'title', label: 'Título' },
      { key: 'external_url', label: 'URL de preview (Drive /preview)' },
    ],
  },
  link: {
    blockType: 'link_item', label: 'Link', icon: '🔗',
    fields: [
      { key: 'title', label: 'Título' },
      { key: 'external_url', label: 'URL' },
    ],
  },
  codigo: {
    blockType: 'code_snippet', label: 'Código', icon: '💻',
    fields: [
      { key: 'title', label: 'Título' },
      { key: 'code_language', label: 'Linguagem' },
      { key: 'code_content', label: 'Código', textarea: true },
    ],
  },
};

const BLOCK_TYPE_TO_PICKER = {
  image_download: 'imglink',
  video: 'video',
  font_card: 'fonte',
  color_palette: 'cor',
  pdf_viewer: 'pdf',
  link_item: 'link',
  code_snippet: 'codigo',
};

export default function ClientSections() {
  const { id } = useParams();
  const { user } = useAuth();
  const canWrite = user.role === 'admin' || user.role === 'editor';
  const [brand, setBrand] = useState(null);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api.getBrand(id).then(setBrand).finally(() => setLoading(false));
  }
  useEffect(load, [id]);

  if (loading || !brand) return <p className="loading">Carregando…</p>;

  async function handleNewSection() {
    const title = prompt('Nome da nova seção (ex: Vídeos, Papel de Parede, Assets Extras...)');
    if (!title) return;
    const type =
      title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || 'custom';
    await api.createSection(brand.id, { title, type, sort_order: brand.sections.length });
    load();
  }

  async function handleDeleteSection(section) {
    if (!confirm(`Excluir a seção "${section.title}" e todos os seus blocos? Essa ação não pode ser desfeita.`)) return;
    await api.deleteSection(brand.id, section.id);
    load();
  }

  async function handleRenameSection(section) {
    const title = prompt('Novo nome da seção:', section.title);
    if (!title || title === section.title) return;
    await api.updateSection(brand.id, section.id, { title, type: section.type, sort_order: section.sort_order });
    load();
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
          <a className="icon-btn" href={`/#/marca/${brand.slug}`} target="_blank" rel="noopener noreferrer">
            🔗 Ver Página
          </a>
          {canWrite && (
            <>
              <Link className="icon-btn" to={`/brands/${brand.id}`}>
                ✎ Editar Cliente
              </Link>
              <button className="btn" type="button" onClick={handleNewSection}>
                + Nova Seção
              </button>
            </>
          )}
        </div>
      </div>

      {brand.sections.map((section) => (
        <SectionCard
          key={section.id}
          brand={brand}
          section={section}
          canWrite={canWrite}
          onChange={load}
          onDeleteSection={handleDeleteSection}
          onRenameSection={handleRenameSection}
        />
      ))}
    </div>
  );
}

function NovoBlocoModal({ onSelect, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__head">
          <h3>Novo Bloco</h3>
          <button className="modal__close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal__grid">
          {Object.entries(BLOCK_TYPE_META).map(([key, meta]) => (
            <button key={key} type="button" className="modal__option" onClick={() => onSelect(key)}>
              <span className="modal__option-icon">{meta.icon}</span>
              <span className="modal__option-label">{meta.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function BlockPreview({ block, canWrite, onEdit, onDelete }) {
  let content;
  switch (block.block_type) {
    case 'image_download':
      content = (
        <div className="block-tile">
          <div className="block-tile__preview">
            {block.file_url ? <img src={block.file_url} alt={block.title} /> : <span>🖼</span>}
          </div>
          <div className="block-tile__caption">
            {block.external_url ? (
              <a href={block.external_url} target="_blank" rel="noopener noreferrer">
                {block.title || 'sem título'}
              </a>
            ) : (
              block.title || 'sem título'
            )}
          </div>
        </div>
      );
      break;
    case 'video':
      content = (
        <div className="block-tile">
          <div className="block-tile__preview">
            {block.file_url ? (
              <video src={block.file_url} controls style={{ maxWidth: '100%', maxHeight: '100%' }} />
            ) : block.external_url ? (
              <a href={block.external_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 24 }}>
                🎬
              </a>
            ) : (
              <span>🎬</span>
            )}
          </div>
          <div className="block-tile__caption">{block.title || 'sem título'}</div>
        </div>
      );
      break;
    case 'font_card':
      content = (
        <div className="font-tile">
          <div className="font-tile__name">{block.title || block.font_name || 'sem nome'}</div>
          <div className="font-tile__preview">Aa</div>
        </div>
      );
      break;
    case 'color_palette':
      content = (
        <div className="color-tile" style={{ borderColor: block.color_hex || '#444' }}>
          <div className="color-tile__swatch" style={{ backgroundColor: block.color_hex || '#222' }} />
          <div className="color-tile__meta">
            {block.title && <div>{block.title}</div>}
            {block.color_hex && <div>HEX {block.color_hex}</div>}
            {block.color_rgb && <div>RGB {block.color_rgb}</div>}
            {block.color_cmyk && <div>CMYK {block.color_cmyk}</div>}
            {block.color_pantone && <div>Pantone {block.color_pantone}</div>}
          </div>
        </div>
      );
      break;
    case 'code_snippet':
      content = (
        <div>
          <pre className="code-block">
            <code>{block.code_content}</code>
          </pre>
          <div className="block-tile__caption">
            {block.title} {block.code_language ? `(${block.code_language})` : ''}
          </div>
        </div>
      );
      break;
    case 'pdf_viewer':
      content = <iframe src={block.external_url} className="pdf-frame" title={block.title || 'PDF'} allow="autoplay" />;
      break;
    case 'link_item':
    default:
      content = (
        <div className="link-row">
          <a href={block.external_url} target="_blank" rel="noopener noreferrer">
            {block.title || block.external_url}
          </a>
        </div>
      );
      break;
  }

  return (
    <div className="block-card">
      {content}
      {canWrite && (
        <div className="block-card__actions">
          <button type="button" onClick={() => onEdit(block)} title="Editar bloco">
            ✎
          </button>
          <button type="button" className="danger" onClick={() => onDelete(block.id)} title="Excluir bloco">
            🗑
          </button>
        </div>
      )}
    </div>
  );
}

function SectionCard({ brand, section, canWrite, onChange, onDeleteSection, onRenameSection }) {
  const [open, setOpen] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formKey, setFormKey] = useState(null);
  const [draft, setDraft] = useState({});
  const [editingBlock, setEditingBlock] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [pantoneAuto, setPantoneAuto] = useState(true);

  const gridBlocks = section.blocks.filter((b) => GRID_TYPES.includes(b.block_type));
  const flowBlocks = section.blocks.filter((b) => !GRID_TYPES.includes(b.block_type));

  function openForm(key) {
    setShowModal(false);
    setFormKey(key);
    setDraft({});
    setEditingBlock(null);
    setPantoneAuto(true);
  }

  function openEdit(block) {
    const key = BLOCK_TYPE_TO_PICKER[block.block_type] || 'link';
    setFormKey(key);
    setDraft({ ...block });
    setEditingBlock(block);
    setPantoneAuto(!block.color_pantone);
  }

  function closeForm() {
    setFormKey(null);
    setDraft({});
    setEditingBlock(null);
  }

  async function handleUpload(field, file) {
    setUploading(true);
    try {
      const { url } = await api.uploadBlockFile(brand.id, file);
      setDraft((d) => ({ ...d, [field]: url }));
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const meta = BLOCK_TYPE_META[formKey];
    const payload = { block_type: meta.blockType, ...draft };
    if (formKey === 'fonte' && draft.title) payload.font_name = draft.title;
    if (editingBlock) {
      await api.updateBlock(brand.id, section.id, editingBlock.id, payload);
    } else {
      payload.sort_order = section.blocks.length;
      await api.createBlock(brand.id, section.id, payload);
    }
    closeForm();
    onChange();
  }

  async function handleDeleteBlock(blockId) {
    if (!confirm('Remover este bloco?')) return;
    await api.deleteBlock(brand.id, section.id, blockId);
    onChange();
  }

  return (
    <div className="accordion">
      <div className="accordion__head" onClick={() => setOpen((o) => !o)}>
        <div className="accordion__title-group">
          <span className={`accordion__chevron ${open ? 'open' : ''}`}>⌄</span>
          <div>
            <div className="accordion__title">{section.title}</div>
            <div className="accordion__count">{section.blocks.length} blocos</div>
          </div>
        </div>
        {canWrite && (
          <div className="accordion__actions" onClick={(e) => e.stopPropagation()}>
            <button className="icon-btn" onClick={() => onRenameSection(section)} title="Renomear seção">
              ✎
            </button>
            <button className="icon-btn" onClick={() => setShowModal(true)}>
              + Bloco
            </button>
            <button className="icon-btn icon-btn--danger" onClick={() => onDeleteSection(section)} title="Excluir seção">
              🗑
            </button>
          </div>
        )}
      </div>
      {open && (
        <div className="accordion__body">
          {!!gridBlocks.length && (
            <div className="block-grid">
              {gridBlocks.map((b) => (
                <BlockPreview key={b.id} block={b} canWrite={canWrite} onEdit={openEdit} onDelete={handleDeleteBlock} />
              ))}
            </div>
          )}
          {flowBlocks.map((b) => (
            <BlockPreview key={b.id} block={b} canWrite={canWrite} onEdit={openEdit} onDelete={handleDeleteBlock} />
          ))}
          {!section.blocks.length && <p className="empty-block">Nenhum bloco cadastrado ainda.</p>}

          {canWrite && formKey && (
            <form onSubmit={handleSubmit} className="block-form">
              {BLOCK_TYPE_META[formKey].fields.map((f) => (
                <div key={f.key} className="block-form__row">
                  {f.textarea ? (
                    <textarea
                      placeholder={f.label}
                      value={draft[f.key] || ''}
                      onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                    />
                  ) : (
                    <input
                      placeholder={f.label}
                      value={draft[f.key] || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (f.key === 'color_hex') {
                          const rgb = hexToRgb(value);
                          if (rgb) {
                            const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);
                            setDraft((d) => ({
                              ...d,
                              color_hex: value,
                              color_rgb: `${rgb.r} ${rgb.g} ${rgb.b}`,
                              color_cmyk: `${cmyk.c} ${cmyk.m} ${cmyk.y} ${cmyk.k}`,
                              color_pantone: pantoneAuto ? nearestPantone(value) || '' : d.color_pantone,
                            }));
                            return;
                          }
                        }
                        if (f.key === 'color_pantone') setPantoneAuto(false);
                        setDraft((d) => ({ ...d, [f.key]: value }));
                      }}
                    />
                  )}
                  {f.upload && (
                    <label className="icon-btn block-form__upload">
                      {uploading ? '…' : '⬆ Upload'}
                      <input
                        type="file"
                        hidden
                        onChange={(e) => e.target.files[0] && handleUpload(f.key, e.target.files[0])}
                      />
                    </label>
                  )}
                </div>
              ))}
              <div className="block-form__actions">
                <button type="submit">Salvar</button>
                <button type="button" onClick={closeForm}>
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {showModal && <NovoBlocoModal onSelect={openForm} onClose={() => setShowModal(false)} />}
        </div>
      )}
    </div>
  );
}
