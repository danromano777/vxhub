import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  const canWrite = user.role === 'admin' || user.role === 'editor';
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api.listBrands().then(setBrands).finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleDelete(id, name) {
    if (!confirm(`Excluir a marca "${name}"? Essa ação não pode ser desfeita.`)) return;
    await api.deleteBrand(id);
    load();
  }

  if (loading) return <p>Carregando…</p>;

  return (
    <div>
      <div className="page__head">
        <h1>Marcas</h1>
        {canWrite && (
          <Link className="btn" to="/brands/new">
            + Nova marca
          </Link>
        )}
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Grupo</th>
            <th>Slug</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {brands.map((b) => (
            <tr key={b.id}>
              <td>{b.name}</td>
              <td>{b.brand_group}</td>
              <td>
                <code>{b.slug}</code>
              </td>
              <td className="table__actions">
                <Link to={`/brands/${b.id}`}>{canWrite ? 'Editar' : 'Ver'}</Link>
                {canWrite && <button onClick={() => handleDelete(b.id, b.name)}>Excluir</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
