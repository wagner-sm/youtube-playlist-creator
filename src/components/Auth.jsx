import React, { useState } from 'react';
import { signInWithGoogle } from '../services/googleAuth';

const Auth = ({ onAuthSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    setLoading(true);
    setError('');

    try {
      await signInWithGoogle();
      onAuthSuccess();
    } catch (error) {
      console.error('Erro na autenticação:', error);
      setError('Erro ao autenticar com Google. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-light min-vh-100">
      <div className="container py-5">
        <div className="card shadow-sm mx-auto" style={{ maxWidth: '500px' }}>
          <div className="card-body text-center">
            <h1 className="mb-4">Criador de Playlist YouTube</h1>

            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}

            <button 
              onClick={handleSignIn}
              disabled={loading}
              className="btn btn-danger btn-lg"
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Autenticando...
                </>
              ) : (
                'Autenticar com Google'
              )}
            </button>

            <div className="mt-4 text-muted small">
              <p>Você será redirecionado para fazer login com sua conta Google.</p>
              <p>Precisamos de permissão para gerenciar suas playlists do YouTube.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
