import apiClient from './client';

// A client for mutations that automatically adds skipErrorToast: true
// This prevents the global error handler from showing a generic toast
// when a local, more specific toast is shown in a mutation's onError handler.
export const mutatingClient = {
  post: (url, data, config) =>
    apiClient.post(url, data, { ...config, skipErrorToast: true }),
  put: (url, data, config) =>
    apiClient.put(url, data, { ...config, skipErrorToast: true }),
  patch: (url, data, config) =>
    apiClient.patch(url, data, { ...config, skipErrorToast: true }),
  delete: (url, config) =>
    apiClient.delete(url, { ...config, skipErrorToast: true }),
};
