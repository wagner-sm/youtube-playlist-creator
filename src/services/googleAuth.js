// Serviço de autenticação com Google - Google Identity Services (GIS)
let gapi = null;
let tokenClient = null;
let accessToken = null;
let isInitialized = false;

const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/youtube.force-ssl';

const debugLog = (message, data = null) => {
  console.log(`[GoogleAuth GIS] ${message}`, data || '');
};

export const initializeGoogleAuth = async () => {
  debugLog('=== INICIANDO COM GOOGLE IDENTITY SERVICES ===');

  if (isInitialized) {
    debugLog('Já inicializado, retornando...');
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    const apiKey = process.env.REACT_APP_GOOGLE_API_KEY;

    debugLog('Verificando credenciais:', {
      clientId: clientId ? `${clientId.substring(0, 20)}...` : 'UNDEFINED',
      apiKey: apiKey ? `${apiKey.substring(0, 10)}...` : 'UNDEFINED'
    });

    if (!clientId || !apiKey) {
      reject(new Error(`Credenciais não encontradas: ClientID=${!!clientId}, ApiKey=${!!apiKey}`));
      return;
    }

    // Carregar Google API Client
    const loadGoogleAPI = () => {
      if (window.gapi) {
        initializeGapi();
        return;
      }

      debugLog('Carregando Google API Client...');
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.async = true;
      script.defer = true;

      script.onload = () => {
        debugLog('✅ Google API Client carregado');
        setTimeout(initializeGapi, 100);
      };

      script.onerror = () => {
        reject(new Error('Falha ao carregar Google API Client'));
      };

      document.head.appendChild(script);
    };

    // Carregar Google Identity Services
    const loadGoogleIdentity = () => {
      if (window.google?.accounts) {
        initializeTokenClient();
        return;
      }

      debugLog('Carregando Google Identity Services...');
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;

      script.onload = () => {
        debugLog('✅ Google Identity Services carregado');
        setTimeout(initializeTokenClient, 100);
      };

      script.onerror = () => {
        reject(new Error('Falha ao carregar Google Identity Services'));
      };

      document.head.appendChild(script);
    };

    // Inicializar GAPI Client
    const initializeGapi = async () => {
      try {
        debugLog('Inicializando GAPI Client...');

        await new Promise((resolve, reject) => {
          window.gapi.load('client', resolve);
        });

        await window.gapi.client.init({
          apiKey: apiKey,
          discoveryDocs: [DISCOVERY_DOC]
        });

        gapi = window.gapi;
        debugLog('✅ GAPI Client inicializado');

        // Carregar Google Identity Services
        loadGoogleIdentity();

      } catch (error) {
        debugLog('❌ Erro ao inicializar GAPI:', error);
        reject(new Error(`Erro na inicialização do GAPI: ${error.message}`));
      }
    };

    // Inicializar Token Client (GIS)
    const initializeTokenClient = () => {
      try {
        debugLog('Inicializando Token Client...');

        if (!window.google?.accounts?.oauth2) {
          throw new Error('Google Identity Services não disponível');
        }

        tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: SCOPES,
          callback: (response) => {
            debugLog('Token recebido:', response);
            if (response.access_token) {
              accessToken = response.access_token;
              debugLog('✅ Token de acesso obtido');
            }
          },
          error_callback: (error) => {
            debugLog('❌ Erro no token:', error);
          }
        });

        isInitialized = true;
        debugLog('✅ Google Identity Services inicializado com sucesso');
        resolve();

      } catch (error) {
        debugLog('❌ Erro ao inicializar Token Client:', error);
        reject(new Error(`Erro na inicialização do Token Client: ${error.message}`));
      }
    };

    // Iniciar processo
    loadGoogleAPI();
  });
};

export const signInWithGoogle = async () => {
  debugLog('=== INICIANDO LOGIN COM GIS ===');

  if (!isInitialized || !tokenClient) {
    throw new Error('Google Identity Services não inicializado');
  }

  return new Promise((resolve, reject) => {
    try {
      debugLog('Solicitando token de acesso...');

      // Configurar callback para este login específico
      tokenClient.callback = (response) => {
        debugLog('Resposta do login:', response);

        if (response.error) {
          debugLog('❌ Erro no login:', response.error);

          if (response.error === 'popup_closed_by_user') {
            reject(new Error('Login cancelado pelo usuário'));
          } else if (response.error === 'access_denied') {
            reject(new Error('Acesso negado. Você precisa autorizar o acesso ao YouTube.'));
          } else {
            reject(new Error(`Erro na autenticação: ${response.error}`));
          }
          return;
        }

        if (response.access_token) {
          accessToken = response.access_token;
          debugLog('✅ Login realizado com sucesso');
          resolve({ access_token: accessToken });
        } else {
          reject(new Error('Token de acesso não recebido'));
        }
      };

      // Solicitar token
      tokenClient.requestAccessToken({
        prompt: 'consent'
      });

    } catch (error) {
      debugLog('❌ Erro ao solicitar login:', error);
      reject(new Error(`Falha no processo de login: ${error.message}`));
    }
  });
};

export const signOut = async () => {
  debugLog('=== FAZENDO LOGOUT ===');

  if (accessToken && window.google?.accounts?.oauth2) {
    try {
      window.google.accounts.oauth2.revoke(accessToken);
      accessToken = null;
      debugLog('✅ Logout realizado com sucesso');
    } catch (error) {
      debugLog('❌ Erro no logout:', error);
    }
  }
};

export const isAuthenticated = () => {
  const result = isInitialized && !!accessToken;
  debugLog('Verificando autenticação:', result);
  return result;
};

export const getCurrentUser = () => {
  // Com GIS, não temos informações do usuário diretamente
  // Seria necessário fazer uma chamada para a API do Google
  return accessToken ? { access_token: accessToken } : null;
};

export const getAccessToken = () => {
  debugLog('Obtendo access token:', accessToken ? 'DISPONÍVEL' : 'NÃO DISPONÍVEL');
  return accessToken;
};

export const getAuthStatus = () => {
  const status = {
    isInitialized,
    hasTokenClient: !!tokenClient,
    hasAccessToken: !!accessToken,
    isSignedIn: isAuthenticated(),
    hasCredentials: !!(process.env.REACT_APP_GOOGLE_CLIENT_ID && process.env.REACT_APP_GOOGLE_API_KEY),
    windowGapi: !!window.gapi,
    windowGoogle: !!window.google,
    envVars: {
      clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID ? 'SET' : 'NOT_SET',
      apiKey: process.env.REACT_APP_GOOGLE_API_KEY ? 'SET' : 'NOT_SET'
    }
  };

  debugLog('Status completo:', status);
  return status;
};
