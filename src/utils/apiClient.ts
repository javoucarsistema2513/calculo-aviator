export class ApiRequestError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
  }
}

export async function fetchJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.headers || {}),
    },
  });

  const rawText = await response.text();
  const trimmed = rawText.trimStart();
  const contentType = response.headers.get('content-type') || '';

  if (trimmed.startsWith('<') || contentType.includes('text/html')) {
    if (response.status === 413) {
      throw new ApiRequestError(
        'Os dados enviados excederam o limite do servidor. Tente enviar uma sequência menor.',
        413
      );
    }
    if (response.status === 502 || response.status === 503 || response.status === 504) {
      throw new ApiRequestError(
        'O servidor está reiniciando ou demorou para responder. Aguarde alguns segundos e tente novamente.',
        response.status
      );
    }
    throw new ApiRequestError(
      'O servidor retornou HTML inesperado em vez de JSON. Atualize a página ou tente novamente em instantes.',
      response.status || 502
    );
  }

  let parsed: (T & { error?: string }) | null = null;
  if (trimmed.length > 0) {
    try {
      parsed = JSON.parse(rawText) as T & { error?: string };
    } catch {
      throw new ApiRequestError(
        `Resposta inválida do servidor (HTTP ${response.status}). Tente novamente.`,
        response.status || 500
      );
    }
  }

  if (!response.ok) {
    throw new ApiRequestError(
      parsed?.error || `Erro na requisição (HTTP ${response.status}).`,
      response.status
    );
  }

  return (parsed ?? ({} as T)) as T;
}
