import { apiFetch } from './client.js';

export const fetchCurrentUser = (options = {}) => apiFetch('/auth/me', options);

export const updateUserAvatar = (avatarUrl, options = {}) => 
  apiFetch('/auth/me/avatar', {
    method: 'PUT',
    body: { avatar: avatarUrl },
    ...options
  });

export const updateUserProfile = (profileData, options = {}) =>
  apiFetch('/auth/me', {
    method: 'PUT',
    body: profileData,
    ...options
  });

export const changePassword = (currentPassword, newPassword, options = {}) =>
  apiFetch('/auth/me/password', {
    method: 'PUT',
    body: { currentPassword, newPassword },
    ...options
  });

export const fetchMyAccounts = (options = {}) => apiFetch('/auth/my-accounts', options);

export const switchAccount = (contactProfileId, options = {}) =>
  apiFetch('/auth/switch-account', {
    method: 'POST',
    body: { contactProfileId },
    ...options
  });
