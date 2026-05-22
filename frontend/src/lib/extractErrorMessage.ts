import axios from 'axios';

export function extractErrorMessage(error: unknown, fallback = 'An error occurred'): string {
  if (axios.isAxiosError(error)) {
    const resp = (error.response?.data) as any;

    const candidate = resp?.error?.message || resp?.message || (typeof resp?.error === 'string' ? resp.error : undefined);
    if (candidate) return candidate;

    if (error.response) {
      if (error.response.status === 401) return 'Invalid username or password.';
      if (error.response.status === 403) return 'Access denied.';
    }

    return fallback;
  }

  if (error instanceof Error) return error.message;

  return fallback;
}

export default extractErrorMessage;
