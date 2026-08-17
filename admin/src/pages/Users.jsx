import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

const ROLES = ['admin', 'editor', 'viewer'];

export default function Users() {
  return (
    <div>
      <Link to="/" className="backlink">
        ← Voltar para Clientes
      </Link>
      <h1>Usuários</h1>
      <UsersPanel />
    </div>
  );
}

export function UsersPanel() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'viewer' });
  const [error, setError] = useState('');

  function load() {
    setLoading(true);
    api.listUsers().then(setUsers).finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    try {
      await api.createUser(form);
      setForm({ name: '', email: '', password: '', role: 'viewer' });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRoleChange(u, role) {
    await api.updateUser(u.id, { name: u.name, role });
    load();
  }

  async function handleDelete(u) {
    if (!confirm(`Excluir o usuário ${u.email}?`)) return;
    await api.deleteUser(u.id);
    load();
  }

  if (loading) return <p>Carregando…</p>;

  return (
    <div>
      <table className="table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>E-mail</th>
            <th>Perfil</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>
                <select value={u.role} onChange={(e) => handleRoleChange(u, e.target.value)} disabled={u.id === me.id}>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </td>
              <td className="table__actions">
                {u.id !== me.id && <button onClick={() => handleDelete(u)}>Excluir</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Novo usuário</h2>
      <form onSubmit={handleCreate} className="subform">
        <input
          placeholder="Nome"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          required
        />
        <input
          placeholder="E-mail"
          type="email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          required
        />
        <input
          placeholder="Senha"
          type="password"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          required
        />
        <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <button type="submit">Criar</button>
      </form>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
