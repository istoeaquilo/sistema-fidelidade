// admin/src/firebaseConfig.js

// Esta é a forma correta e segura de carregar as configurações.
// A aplicação irá ler as variáveis de ambiente fornecidas pela Netlify.

let config;
try {
  // Para o ambiente de deploy (Netlify), as variáveis são injetadas via process.env
  // O Netlify exige o prefixo REACT_APP_
  config = JSON.parse(process.env.REACT_APP_FIREBASE_CONFIG || '{}');
} catch (e) {
  console.error("Erro ao analisar a configuração do Firebase a partir das variáveis de ambiente.", e);
  config = {};
}

export const firebaseConfig = config;
export const appId = process.env.REACT_APP_APP_ID || 'default-fidelidade-app';
export const initialAuthToken = null; // Token não é usado nesta fase.
