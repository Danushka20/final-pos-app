import axios from 'axios';

/** Check that the Laravel API responds (any HTTP response below 500 = reachable). */
export async function testBackendConnection(apiBaseUrl: string): Promise<void> {
  try {
    const response = await axios.get(apiBaseUrl, {
      timeout: 15000,
      headers: { Accept: 'application/json' },
      validateStatus: status => status < 500,
    });

    if (response.status >= 500) {
      throw new Error(`Server error (${response.status}). Check your Laravel backend.`);
    }
  } catch (error) {
    if (axios.isAxiosError(error) && !error.response) {
      throw new Error(
        'Cannot reach server. Check the website URL, Wi‑Fi, and that Laravel is running.',
      );
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Connection failed');
  }
}
