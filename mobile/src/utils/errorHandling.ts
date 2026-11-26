/**
 * Utilitário robusto para extração e tradução de mensagens de erro da API ANOT.
 * Garante que nenhuma chave crua (ex: validation.required) ou erro em inglês
 * chegue sem tratamento ao usuário final.
 */

const VALIDATION_KEY_TRANSLATIONS: Record<string, string> = {
  'validation.required': 'Campo obrigatório.',
  'validation.email': 'Informe um endereço de e-mail válido.',
  'validation.unique': 'Este e-mail já está cadastrado no sistema.',
  'validation.min.string': 'A senha deve conter no mínimo 8 caracteres.',
  'validation.min': 'O campo não atinge o tamanho mínimo.',
  'validation.confirmed': 'A confirmação de senha não confere.',
  'validation.password': 'A senha não atende aos requisitos mínimos.',
  'validation.password.mixed': 'A senha deve conter letras maiúsculas e minúsculas.',
  'validation.password.letters': 'A senha deve conter letras.',
  'validation.password.numbers': 'A senha deve conter números.',
  'validation.password.symbols': 'A senha deve conter símbolos.',
};

export function translateValidationKey(key: string): string {
  if (VALIDATION_KEY_TRANSLATIONS[key]) {
    return VALIDATION_KEY_TRANSLATIONS[key];
  }
  // Se contiver chave do tipo validation.*
  for (const [rawKey, translated] of Object.entries(VALIDATION_KEY_TRANSLATIONS)) {
    if (key.includes(rawKey)) {
      return translated;
    }
  }
  return key;
}

export function formatApiError(err: any, fallbackMessage: string = 'Ocorreu um erro. Tente novamente.'): string {
  if (!err) return fallbackMessage;

  // Erro de timeout do Axios
  if (err.code === 'ECONNABORTED' || (typeof err.message === 'string' && err.message.toLowerCase().includes('timeout'))) {
    return 'O servidor demorou para responder. Por favor, tente novamente.';
  }

  // Falha total de rede / conexão sem resposta do servidor
  if (!err.response) {
    if (err.message === 'Network Error' || (typeof err.message === 'string' && err.message.toLowerCase().includes('network'))) {
      return 'Não foi possível conectar ao servidor do ANOT. Verifique sua conexão com a internet.';
    }
    if (typeof err.message === 'string' && err.message.trim().length > 0) {
      return translateValidationKey(err.message);
    }
    return 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet.';
  }

  const { status, data } = err.response;

  // Se resposta não for JSON (ex: HTML de erro do Cloudflare / Nginx 502/504)
  if (typeof data === 'string' && (data.includes('<!DOCTYPE') || data.includes('<html') || data.includes('502 Bad Gateway'))) {
    return 'Servidor temporariamente indisponível. Tente novamente mais tarde.';
  }

  // 429 - Rate limit
  if (status === 429) {
    return 'Muitas tentativas em pouco tempo. Por favor, aguarde alguns instantes antes de tentar novamente.';
  }

  // 401 - Não autorizado / Credenciais inválidas
  if (status === 401) {
    if (data?.message && typeof data.message === 'string') {
      return translateValidationKey(data.message);
    }
    return 'Credenciais inválidas: e-mail ou senha incorretos.';
  }

  // 403 - Acesso proibido / Conta suspensa
  if (status === 403) {
    if (data?.message && typeof data.message === 'string') {
      return translateValidationKey(data.message);
    }
    return 'Acesso negado ou conta suspensa.';
  }

  // 404 - Não encontrado
  if (status === 404) {
    if (data?.message && typeof data.message === 'string') {
      return translateValidationKey(data.message);
    }
    return 'Recurso não encontrado.';
  }

  // 419 - CSRF / Sessão expirada
  if (status === 419) {
    return 'Sua sessão expirou. Por favor, entre novamente.';
  }

  // 422 - Erros de validação
  if (status === 422) {
    if (data?.errors && typeof data.errors === 'object') {
      const keys = Object.keys(data.errors);
      if (keys.length > 0) {
        const firstErr = data.errors[keys[0]];
        const rawMsg = Array.isArray(firstErr) ? firstErr[0] : String(firstErr);
        return translateValidationKey(rawMsg);
      }
    }
    if (data?.message && typeof data.message === 'string') {
      return translateValidationKey(data.message);
    }
    return 'Dados inválidos. Verifique as informações fornecidas.';
  }

  // 500+ - Erros internos do servidor
  if (status >= 500) {
    return 'Ocorreu uma instabilidade no servidor do ANOT. Tente novamente mais tarde.';
  }

  // Outros status com mensagem da API
  if (data && typeof data === 'object' && typeof data.message === 'string') {
    return translateValidationKey(data.message);
  }

  return fallbackMessage;
}
