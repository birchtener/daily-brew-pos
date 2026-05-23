import axios from 'axios';

export function extractErrorMessage(error: unknown, fallback = 'An error occurred'): string {
  if (axios.isAxiosError(error)) {
    const resp = (error.response?.data) as any;

    const candidate = resp?.error?.message || resp?.message || (typeof resp?.error === 'string' ? resp.error : undefined);
    if (candidate) return candidate;

    if (!error.response) {
      if (error.code === 'ERR_NETWORK') return 'We could not reach the server. Please check your connection and try again.';
      return 'We could not reach the server. Please try again.';
    }

    if (error.response) {
      if (error.response.status === 401) return 'Invalid username or password.';
      if (error.response.status === 403) return 'You do not have permission to perform this action.';
      if (error.response.status === 404) return 'The requested item could not be found.';
      if (error.response.status === 408) return 'The request took too long. Please try again.';
      if (error.response.status === 409) return 'This item conflicts with an existing record. Please check and try again.';
      if (error.response.status === 422) return 'The information provided is not valid. Please check your input and try again.';
      if (error.response.status === 429) return 'Too many requests. Please wait a moment and try again.';
      if (error.response.status >= 500) return 'The server had a problem processing your request. Please try again later.';
    }

    return fallback;
  }

  if (error instanceof Error) return error.message;

  return fallback;
}

export default extractErrorMessage;
