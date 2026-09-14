import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { buildNomenclature } from '../lib/nomenclature.js';

export const STATUS_LABELS = {
  rascunho: 'Rascunho',
  enviado: 'Enviado',
  em_revisao: 'Em revisão',
  aprovado: 'Aprovado',
  reprovado: 'Reprovado',
};

export const STATUS_ORDER = ['rascunho', 'enviado', 'em_revisao', 'aprovado', 'reprovado'];

export function StatusBadge({ status }) {
  return <span className={`status-badge status-badge--${status}`}>{STATUS_LABELS[status] || status}</span>;
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

export default function Briefings() {
  return (
    <div>
      <Link to="/" className="backlink">
        ← Voltar para Clientes
      </Link>
      <h1>Briefings</h1>
      <BriefingsPanel />
    </div>
  );
}

export function BriefingsPanel() {
  const { user } = useAuth();
  const canWrite = user.role === 'admin' || user.role === 'editor';
  const navigate = useNavigate();
  const [briefings, setBriefings] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');

  function load() {
    setLoading(true);
    api
      .listBriefings({ status: statusFilter, brand_id: brandFilter })
      .then(setBriefings)
      .finally(() => setLoading(false));
  }

  useEffect(load, [statusFilter, brandFilter]);
  useEffect(() => {
    api.listBrands().then(setBrands).catch(() => {});
  }, []);

  async function handleDelete(id, title) {
    if (!confirm(`Excluir o briefing "${title}"? Essa ação não pode ser desfeita.`)) return;
    await api.deleteBriefing(id);
    load();
  }

  return (
    <div>
      <div className="page__head">
        <h2>Briefings de Job</h2>
        {canWrite && (
          <Link className="btn" to="/briefings/new">
            + Novo Briefing
          </Link>
        )}
      </div>
      <div className="client-search">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Todos os status</option>
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <select value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)}>
          <option value="">Todos os clientes</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="loading">Carregando…</p>
      ) : !briefings.length ? (
        <p className="empty-block">Nenhum briefing encontrado.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Título</th>
              <th>Cliente</th>
              <th>Nomenclatura</th>
              <th>Prazo</th>
              <th>Status</th>
              <th>Criado por</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {briefings.map((b) => (
              <tr key={b.id} onClick={() => navigate(`/briefings/${b.id}`)} style={{ cursor: 'pointer' }}>
                <td>{b.title}</td>
                <td>{b.brand_name || '—'}</td>
                <td style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12 }}>
                  {buildNomenclature({
                    brandCode: b.brand_code,
                    date: b.start_date || b.deadline,
                    campaignName: b.campaign_name,
                    title: b.title,
                    pieceFormat: b.piece_format,
                    pieceCount: b.piece_count,
                    videoChannel: b.video_channel,
                  })}
                </td>
                <td>{formatDate(b.deadline)}</td>
                <td>
                  <StatusBadge status={b.status} />
                </td>
                <td>{b.created_by_name || '—'}</td>
                <td className="table__actions" onClick={(e) => e.stopPropagation()}>
                  <Link to={`/briefings/${b.id}`}>Abrir</Link>
                  {canWrite && <button onClick={() => handleDelete(b.id, b.title)}>Excluir</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
