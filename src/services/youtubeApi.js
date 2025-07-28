import { getAccessToken } from './googleAuth';

const API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

const debugLog = (message, data = null) => {
  console.log(`[YouTubeAPI] ${message}`, data || '');
};

// Função para fazer requisições autenticadas
const makeAuthenticatedRequest = async (url, options = {}) => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Token de acesso não encontrado. Faça login novamente.');
  }

  debugLog('Fazendo requisição para:', url);

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  debugLog('Resposta da API:', { status: response.status, ok: response.ok });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    debugLog('Erro na API:', errorData);

    if (response.status === 403 && errorData.error?.errors?.[0]?.reason === 'quotaExceeded') {
      throw new Error('Quota da API do YouTube excedida. Tente novamente amanhã.');
    }

    if (response.status === 401) {
      throw new Error('Token de acesso expirado. Faça login novamente.');
    }

    throw new Error(`Erro HTTP ${response.status}: ${errorData.error?.message || response.statusText}`);
  }

  return response.json();
};

// Criar uma nova playlist
export const createPlaylist = async ({ title, description = '', isPublic = false }) => {
  debugLog('Criando playlist:', { title, isPublic });

  const url = `${API_BASE_URL}/playlists?part=snippet,status`;

  const body = {
    snippet: {
      title,
      description
    },
    status: {
      privacyStatus: isPublic ? 'public' : 'private'
    }
  };

  const data = await makeAuthenticatedRequest(url, {
    method: 'POST',
    body: JSON.stringify(body)
  });

  debugLog('Playlist criada:', data.id);
  return data.id;
};

// Buscar vídeo por query
export const searchVideo = async (query) => {
  debugLog('Buscando vídeo:', query);

  const url = `${API_BASE_URL}/search?part=snippet&maxResults=1&q=${encodeURIComponent(query)}&type=video&key=${process.env.REACT_APP_GOOGLE_API_KEY}`;

  const response = await fetch(url);

  if (!response.ok) {
    debugLog('Erro na busca:', response.status);
    throw new Error(`Erro na busca: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.items && data.items.length > 0) {
    const videoId = data.items[0].id.videoId;
    debugLog('Vídeo encontrado:', videoId);
    return videoId;
  }

  debugLog('Nenhum vídeo encontrado para:', query);
  return null;
};

// Adicionar vídeo à playlist
export const addVideoToPlaylist = async (playlistId, videoId) => {
  debugLog('Adicionando vídeo à playlist:', { playlistId, videoId });

  const url = `${API_BASE_URL}/playlistItems?part=snippet`;

  const body = {
    snippet: {
      playlistId,
      resourceId: {
        kind: 'youtube#video',
        videoId
      }
    }
  };

  await makeAuthenticatedRequest(url, {
    method: 'POST',
    body: JSON.stringify(body)
  });

  debugLog('Vídeo adicionado com sucesso');
};

// Função principal para buscar e adicionar músicas
export const searchAndAddSongs = async ({ 
  playlistId, 
  songs, 
  artist, 
  useDelay = true, 
  onProgress 
}) => {
  debugLog('Iniciando processamento de músicas:', { 
    playlistId, 
    totalSongs: songs.length, 
    artist, 
    useDelay 
  });

  let addedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < songs.length; i++) {
    const song = songs[i];
    const query = `${artist} ${song}`;

    onProgress(`Processando música ${i + 1}/${songs.length}: ${song}`);

    try {
      // Buscar vídeo
      const videoId = await searchVideo(query);

      if (videoId) {
        // Adicionar à playlist
        await addVideoToPlaylist(playlistId, videoId);
        onProgress(`✓ Adicionado: ${song}`);
        addedCount++;
      } else {
        onProgress(`✗ Não encontrado: ${song}`);
        failedCount++;
      }

      // Delay entre requisições se habilitado
      if (useDelay && i < songs.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

    } catch (error) {
      debugLog(`Erro ao processar ${song}:`, error);

      if (error.message.includes('quotaExceeded')) {
        onProgress('⚠ Quota da API do YouTube excedida. Parando o processamento.');
        throw error; // Para o processamento
      } else if (error.message.includes('401')) {
        onProgress('⚠ Token expirado. Faça login novamente.');
        throw error;
      } else if (error.message.includes('409')) {
        onProgress(`⚠ Erro 409 (conflito) para: ${song} - Continuando...`);
        failedCount++;
      } else {
        onProgress(`⚠ Erro para ${song}: ${error.message}`);
        failedCount++;
      }
    }
  }

  debugLog('Processamento concluído:', { addedCount, failedCount });
  return { added: addedCount, failed: failedCount };
};

// Obter informações do usuário atual (usando token)
export const getCurrentUserInfo = async () => {
  debugLog('Obtendo informações do usuário...');

  const url = `${API_BASE_URL}/channels?part=snippet&mine=true`;

  const data = await makeAuthenticatedRequest(url);

  if (data.items && data.items.length > 0) {
    const userInfo = {
      id: data.items[0].id,
      title: data.items[0].snippet.title,
      thumbnail: data.items[0].snippet.thumbnails.default.url
    };

    debugLog('Informações do usuário obtidas:', userInfo);
    return userInfo;
  }

  return null;
};
