import { apiFetch } from './client.js';

export async function sendChatMessage(message) {
  return apiFetch('/support/chat', {
    method: 'POST',
    body: { message },
  });
}

export async function getChatHistory() {
  return apiFetch('/support/chat/history');
}

export async function createSupportTicket(subject, message) {
  return apiFetch('/support/tickets', {
    method: 'POST',
    body: { subject, message },
  });
}

export async function getTickets() {
  return apiFetch('/support/tickets');
}

export async function updateTicket(id, data) {
  return apiFetch(`/support/tickets/${id}`, {
    method: 'PUT',
    body: data,
  });
}
