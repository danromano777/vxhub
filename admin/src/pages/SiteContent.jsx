import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function SiteContent() {
  const { user } = useAuth();
  const canWrite = user.role === 'admin' || user.role === 'editor';
  const [content, setContent] = useState({ title: '', subtitle: '', description: '', logo_url: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api
      .getSiteContent()
      .then(setContent)
      .catch((err) => setError(`Não foi possível carregar o conteúdo do site: ${err.message}`))
      .finally(() => setLoading(false));
  }, []);

  function set(field, value) {
    setContent((c) => ({ ...c, [field]: value }));
    setSaved(false);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.updateSiteContent(content);
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { logo_url } = await api.uploadSiteLogo(file);
      setContent((c) => ({ ...c, logo_url }));
      setSaved(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  if (loading) return <p className="loading">Carregando…</p>;

  return (
    <div>
      <Link to="/" className="backlink">
        ← Voltar para Clientes
      </Link>
      <h1>Conteúdo do Site</h1>
      <form onSubmit={handleSave} className="form">
        <fieldset disabled={!canWrite}>
          <label>
            Título Principal
            <input value={content.title || ''} onChange={(e) => set('title', e.target.value)} />
          </label>
          <label>
            Subtítulo
            <input value={content.subtitle || ''} onChange={(e) => set('subtitle', e.target.value)} />
          </label>
          <label>
            Descrição
            <textarea value={content.description || ''} onChange={(e) => set('description', e.target.value)} />
          </label>

          <h3>Logo</h3>
          <div className="grid2">
            <label>
              URL do logo
              <input value={content.logo_url || ''} onChange={(e) => set('logo_url', e.target.value)} placeholder="deixe vazio para usar o logo padrão" />
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {content.logo_url && (
                <div className="client-logo" style={{ width: 56, height: 56 }}>
                  <img src={content.logo_url} alt="Logo do site" />
                </div>
              )}
              {canWrite && (
                <label className="icon-btn" style={{ cursor: 'pointer' }}>
                  {uploading ? 'Enviando…' : '⬆ Upload'}
                  <input type="file" accept="image/*" hidden onChange={handleUpload} disabled={uploading} />
                </label>
              )}
            </div>
          </div>

          {canWrite && (
            <button type="submit" disabled={saving}>
              {saving ? 'Salvando…' : 'Salvar Alterações'}
            </button>
          )}
          {saved && <p style={{ color: 'var(--mint)', fontSize: 13 }}>Salvo com sucesso.</p>}
          {error && <p className="error">{error}</p>}
        </fieldset>
      </form>
    </div>
  );
}
