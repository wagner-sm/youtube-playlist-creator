import React, { useState } from 'react';
import { signOut } from '../services/googleAuth';
import { createPlaylist, searchAndAddSongs } from '../services/youtubeApi';
import LogDisplay from './LogDisplay';

const PlaylistForm = ({ onLogout }) => {
  const [formData, setFormData] = useState({
    playlistName: '',
    playlistDesc: '',
    artist: '',
    isPublic: false,
    useDelay: true,
    songsText: ''
  });

  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState([]);
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const addLog = (message) => {
    setLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const showAlert = (message, type = 'success') => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: '', type: '' }), 5000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.playlistName || !formData.artist || !formData.songsText) {
      showAlert('Preencha todos os campos obrigatórios!', 'warning');
      return;
    }

    setLoading(true);
    setLog([]);

    try {
      // Criar playlist
      addLog('Criando playlist...');
      const playlistId = await createPlaylist({
        title: formData.playlistName,
        description: formData.playlistDesc,
        isPublic: formData.isPublic
      });

      addLog(`Playlist criada com ID: ${playlistId}`);

      // Processar músicas
      const songs = formData.songsText
        .split('\n')
        .map(song => song.trim())
        .filter(song => song);

      addLog(`Processando ${songs.length} músicas...`);

      const result = await searchAndAddSongs({
        playlistId,
        songs,
        artist: formData.artist,
        useDelay: formData.useDelay,
        onProgress: addLog
      });

      showAlert(
        `Concluído! ${result.added} adicionadas, ${result.failed} falharam`,
        result.failed > 0 ? 'warning' : 'success'
      );

    } catch (error) {
      console.error('Erro ao criar playlist:', error);
      addLog(`Erro: ${error.message}`);
      showAlert(`Erro ao criar playlist: ${error.message}`, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      onLogout();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <div className="bg-light min-vh-100">
      <div className="container py-5">
        <div className="card shadow-sm mx-auto" style={{ maxWidth: '700px' }}>
          <div className="card-body">
            <h1 className="mb-4 text-center">Criar Playlist</h1>

            {alert.show && (
              <div className={`alert alert-${alert.type} alert-dismissible fade show`} role="alert">
                {alert.message}
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setAlert({ show: false, message: '', type: '' })}
                ></button>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Nome da Playlist: *</label>
                <input 
                  type="text" 
                  name="playlistName"
                  value={formData.playlistName}
                  onChange={handleInputChange}
                  className="form-control" 
                  required 
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Descrição:</label>
                <input 
                  type="text" 
                  name="playlistDesc"
                  value={formData.playlistDesc}
                  onChange={handleInputChange}
                  className="form-control" 
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Artista: *</label>
                <input 
                  type="text" 
                  name="artist"
                  value={formData.artist}
                  onChange={handleInputChange}
                  className="form-control" 
                  required 
                />
              </div>

              <div className="form-check mb-2">
                <input 
                  className="form-check-input" 
                  type="checkbox" 
                  name="isPublic"
                  checked={formData.isPublic}
                  onChange={handleInputChange}
                  id="public" 
                />
                <label className="form-check-label" htmlFor="public">
                  Playlist pública
                </label>
              </div>

              <div className="form-check mb-3">
                <input 
                  className="form-check-input" 
                  type="checkbox" 
                  name="useDelay"
                  checked={formData.useDelay}
                  onChange={handleInputChange}
                  id="delay" 
                />
                <label className="form-check-label" htmlFor="delay">
                  Delay entre requisições (evita limite de API)
                </label>
              </div>

              <div className="mb-3">
                <label className="form-label">Músicas (uma por linha): *</label>
                <textarea 
                  name="songsText"
                  value={formData.songsText}
                  onChange={handleInputChange}
                  rows="8" 
                  className="form-control" 
                  required
                  placeholder="Digite o nome das músicas, uma por linha..."
                />
              </div>

              <div className="d-flex gap-2">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="btn btn-primary"
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Criando...
                    </>
                  ) : (
                    'Criar Playlist'
                  )}
                </button>

                <button 
                  type="button"
                  onClick={handleLogout}
                  className="btn btn-secondary"
                  disabled={loading}
                >
                  Sair
                </button>
              </div>
            </form>

            {log.length > 0 && <LogDisplay log={log} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaylistForm;
