import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import PlaylistForm from './components/PlaylistForm';
import { initializeGoogleAuth, isAuthenticated, getAuthStatus } from './services/googleAuth';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('Verificando status da autenticação...');

        // Verificar se as credenciais estão configuradas
        const status = getAuthStatus();
        console.log('Status inicial:', status);

        if (!status.hasCredentials) {
          throw new Error('Credenciais do Google não configuradas. Verifique o arquivo .env');
        }

        // Inicializar autenticação
        await initializeGoogleAuth();

        // Verificar se está autenticado
        const authStatus = isAuthenticated();
        console.log('Status de autenticação:', authStatus);
        setIsAuth(authStatus);

      } catch (error) {
        console.error('Erro ao inicializar autenticação:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
          <p className="text-muted">Inicializando Google API...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="card shadow-sm mx-auto" style={{ maxWidth: '600px' }}>
          <div className="card-body text-center">
            <div className="text-danger mb-3">
              <i className="fas fa-exclamation-triangle fa-3x"></i>
            </div>
            <h3 className="text-danger mb-3">Erro de Configuração</h3>
            <div className="alert alert-danger text-start">
              <strong>Erro:</strong> {error}
            </div>

            <div className="text-start mt-4">
              <h5>Como corrigir:</h5>
              <ol>
                <li>Verifique se o arquivo <code>.env</code> existe na raiz do projeto</li>
                <li>Confirme se as variáveis estão definidas:
                  <ul>
                    <li><code>REACT_APP_GOOGLE_CLIENT_ID</code></li>
                    <li><code>REACT_APP_GOOGLE_API_KEY</code></li>
                  </ul>
                </li>
                <li>Reinicie o servidor de desenvolvimento (<code>npm start</code>)</li>
              </ol>
            </div>

            <button 
              onClick={() => window.location.reload()} 
              className="btn btn-primary mt-3"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      {!isAuth ? (
        <Auth onAuthSuccess={() => setIsAuth(true)} />
      ) : (
        <PlaylistForm onLogout={() => setIsAuth(false)} />
      )}
    </div>
  );
}

export default App;
