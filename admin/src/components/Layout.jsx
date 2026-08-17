import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Layout() {
  const { user, logout } = useAuth();
  const [siteLogo, setSiteLogo] = useState(null);

  useEffect(() => {
    api
      .getSiteContent()
      .then((c) => setSiteLogo(c.logo_url || null))
      .catch(() => {});
  }, []);

  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar__inner">
          <div className="topbar__brand">
            {siteLogo && <img className="topbar__logo" src={siteLogo} alt="" />}
            <span className="brandmark">
              vx<span>.hub</span>
            </span>
            <span className="topbar__tag">Admin</span>
          </div>
          <div className="topbar__user">
            <span className="topbar__email">{user.email}</span>
            <button className="btn-ghost" onClick={logout}>
              Sair
            </button>
          </div>
        </div>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
