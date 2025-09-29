import { apiFetch, resolveApiUrl } from './client.js';

const MAILROOM_BASE_PATH = '/mailroom/documents';

const documentPath = (documentId, suffix = '') => {
  const encodedId = encodeURIComponent(documentId);
  return `${MAILROOM_BASE_PATH}/${encodedId}${suffix}`;
};

export const listMailboxDocuments = () => apiFetch(MAILROOM_BASE_PATH);

export const uploadMailboxDocument = (file, metadata = {}) => {
  const formData = new FormData();
  formData.append('file', file);

  Object.entries(metadata).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value);
    }
  });

  return apiFetch(MAILROOM_BASE_PATH, { method: 'POST', body: formData });
};

export const notifyMailboxDocument = (documentId) =>
  apiFetch(documentPath(documentId, '/notify'), { method: 'POST' });

export const markMailboxDocumentViewed = (documentId) =>
  apiFetch(documentPath(documentId, '/view'), { method: 'POST' });

export const getMailboxDocumentDownloadUrl = (documentId) =>
  resolveApiUrl(documentPath(documentId, '/download'));
