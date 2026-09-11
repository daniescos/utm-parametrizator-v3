import { useState } from 'react';
import './App.css';
import { UserGenerator } from './components/UserGenerator';
import { AdminPanel } from './components/AdminPanel';
import { PasswordGuard } from './components/PasswordGuard';
import { adminLogout } from './lib/storage';
import { translations } from './lib/translations';

function App() {
  const [page, setPage] = useState<'user' | 'admin'>('user');
  const [adminToken, setAdminToken] = useState<string | null>(null);

  return (
    <>
      {page === 'user' && (
        <>
          <UserGenerator />
          <footer className="fixed bottom-4 right-4 text-xs text-gray-500">
            <button
              onClick={() => {
                setPage('admin');
                setAdminToken(null);
              }}
              className="text-gray-400 hover:text-red-500 underline transition-colors"
            >
              {translations.app.admin}
            </button>
          </footer>
        </>
      )}

      {page === 'admin' && !adminToken && (
        <PasswordGuard onAuthenticated={(token) => setAdminToken(token)} />
      )}

      {page === 'admin' && adminToken && (
        <AdminPanel
          adminToken={adminToken}
          onLogout={() => {
            adminLogout(adminToken);
            setAdminToken(null);
            setPage('user');
          }}
        />
      )}
    </>
  );
}

export default App;
