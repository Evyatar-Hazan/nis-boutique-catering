export const studioConfig = {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '',
};

export const isGoogleConfigured = Boolean(studioConfig.clientId);
