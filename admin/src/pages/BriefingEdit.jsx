import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { STATUS_LABELS, STATUS_ORDER, StatusBadge } from './Briefings.jsx';

const emptyBriefing = {
  brand_id: '', title: '', job_type: '', requester_name: '', objective: '',
  target_audience: '', key_message: '', deadline: '', budget: '', references_text: '', notes: '',
};

const JOB_TYPE_SUGGESTIONS = ['Post social', 'Vídeo', 'Campanha', 'Evento', 'Key visual', 'Release', 'E-mail marketing'];

function formatDateTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleString('pt-BR');
}

export default function BriefingEdit() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const { user } = useAuth();
  const canWrite = user.role === 'admin' || user.role === 'editor';

  const [briefing, setBriefing] = useState(emptyBriefing);
  const [history, setHistory] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [statusDraft, setStatusDraft] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [changingStatus, setChangingStatus] = useState(false);

  function load() {
    if (isNew) return;
    setLoading(true);
    api
      .getBriefing(id)
      .then((b) => {
        const { history: h, brand_name, created_by_name, status, created_at, updated_at, id: bid, created_by, ...rest } = b;
        setBriefing({ ...rest, deadline: rest.deadline ? String(rest.deadline).slice(0, 10) : '' });
        setHistory(h || []);
        setStatusDraft(status);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }
  useEffect(load, [id]);

  useEffect(() => {
    api.listBrands().then(setBrands).catch(() => {});
  }, []);

  function set(field, value) {
    setBriefing((b) => ({ ...b, [field]: value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (isNew) {
        const r = await api.createBriefing(briefing);
        navigate(`/briefings/${r.id}`, { replace: true });
      } else {
        await api.updateBriefing(id, briefing);
        load();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange() {
    setChangingStatus(true);
    setError('');
    try {
      await api.changeBriefingStatus(id, statusDraft, statusNote);
      setStatusNote('');
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setChangingStatus(false);
    }
  }

  if (loading) return <p className="loading">Carregando…</p>;

  return (
    <div>
      <Link to="/" className="backlink">
        ← Voltar
      </Link>
      <div className="page__head">
        <h1>{isNew ? 'Novo briefing' : briefing.title}</h1>
        {!isNew && <StatusBadge status={statusDraft} />}
      </div>

      <form onSubmit={handleSave} className="form">
        <fieldset disabled={!canWrite}>
          <div className="grid2">
            <label>
              Título <input value={briefing.title} onChange={(e) => set('title', e.target.value)} required />
            </label>
            <label>
              Cliente
              <select value={briefing.brand_id || ''} onChange={(e) => set('brand_id', e.target.value)}>
                <option value="">Sem cliente vinculado</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Tipo de job
              <input
                value={briefing.job_type}
                onChange={(e) => set('job_type', e.target.value)}
                list="job-type-suggestions"
                placeholder="ex: Post social, Vídeo, Campanha…"
              />
              <datalist id="job-type-suggestions">
                {JOB_TYPE_SUGGESTIONS.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </label>
            <label>
              Solicitante
              <input value={briefing.requester_name} onChange={(e) => set('requester_name', e.target.value)} />
            </label>
            <label>
              Prazo
              <input type="date" value={briefing.deadline} onChange={(e) => set('deadline', e.target.value)} />
            </label>
            <label>
              Orçamento
              <input value={briefing.budget} onChange={(e) => set('budget', e.target.value)} placeholder="ex: R$ 5.000" />
            </label>
          </div>

          <label>
            Objetivo
            <textarea value={briefing.objective} onChange={(e) => set('objective', e.target.value)} />
          </label>
          <label>
            Público-alvo
            <textarea value={briefing.target_audience} onChange={(e) => set('target_audience', e.target.value)} />
          </label>
          <label>
            Mensagem-chave
            <textarea value={briefing.key_message} onChange={(e) => set('key_message', e.target.value)} />
          </label>
          <label>
            Referências
            <textarea
              value={briefing.references_text}
              onChange={(e) => set('references_text', e.target.value)}
              placeholder="Links, materiais de inspiração, briefings anteriores…"
            />
          </label>
          <label>
            Observações
            <textarea value={briefing.notes} onChange={(e) => set('notes', e.target.value)} />
          </label>

          {canWrite && (
            <button type="submit" disabled={saving}>
              {saving ? 'Salvando…' : isNew ? 'Criar briefing' : 'Salvar alterações'}
            </button>
          )}
          {error && <p className="error">{error}</p>}
        </fieldset>
      </form>

      {!isNew && (
        <div className="section">
          <h2>Status e aprovação</h2>
          {canWrite && (
            <div className="status-changer">
              <select value={statusDraft} onChange={(e) => setStatusDraft(e.target.value)}>
                {STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
              <input
                placeholder="Nota sobre a mudança de status (opcional)"
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
              />
              <button
                type="button"
                onClick={handleStatusChange}
                disabled={changingStatus}
              >
                {changingStatus ? 'Atualizando…' : 'Atualizar status'}
              </button>
            </div>
          )}

          <ul className="timeline">
            {history.map((h) => (
              <li key={h.id} className="timeline__item">
                <div className="timeline__dot" />
                <div>
                  <div className="timeline__title">
                    {h.from_status ? (
                      <>
                        {STATUS_LABELS[h.from_status] || h.from_status} → <strong>{STATUS_LABELS[h.to_status] || h.to_status}</strong>
                      </>
                    ) : (
                      <>Briefing criado como <strong>{STATUS_LABELS[h.to_status] || h.to_status}</strong></>
                    )}
                  </div>
                  <div className="timeline__meta">
                    {formatDateTime(h.created_at)} · {h.changed_by_name || 'Sistema'}
                  </div>
                  {h.note && <div className="timeline__note">{h.note}</div>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
