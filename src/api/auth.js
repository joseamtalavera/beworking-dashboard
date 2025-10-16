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
