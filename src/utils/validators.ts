export const isValidEmail = (email: string): boolean => {
  const trimmed = email.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
};

export const isValidPassword = (password: string): boolean =>
  password.trim().length >= 6;

export const getAuthErrorMessage = (error: unknown): string => {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: string }).message);
  }
  return 'Something went wrong. Please try again.';
};
