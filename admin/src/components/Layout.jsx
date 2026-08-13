import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Layout() {
  const { user, logout } = useAuth();
  return (
    <div className="shell">
      <aside className="rail">
        <div className="brandmark">
          vx.hub <span>admin</span>
        </div>
        <nav className="nav">
          <NavLink to="/" end>Marcas</NavLink>
          {user.role === 'admin' && <NavLink to="/users">Usuários</NavLink>}
        </nav>
        <div className="who">
          <div className="who__name">{user.name}</div>
          <div className="who__role">{user.role}</div>
          <button onClick={logout}>Sair</button>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
