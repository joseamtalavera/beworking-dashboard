import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

import Contacts from './Contacts';
import theme from '../../../theme';
import { apiFetch } from '../../../api/client';

vi.mock('../../../api/client', () => ({
  apiFetch: vi.fn()
}));

const renderWithTheme = (ui) => render(
  <ThemeProvider theme={theme}>
    {ui}
  </ThemeProvider>
);

const baseContact = {
  id: '1',
  name: 'Acme Corp',
  status: 'Activo',
  user_type: 'Usuario Mesa',
  lastActive: 'Yesterday',
  created_at: '2024-01-01',
  contact: {
    name: 'Ana Admin',
    email: 'ana@example.com'
  }
};

beforeEach(() => {
  apiFetch.mockReset();
  localStorage.clear();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('Contacts (admin)', () => {
  it('renders contacts from the API', async () => {
    apiFetch.mockResolvedValueOnce({ items: [baseContact], totalElements: 1 });

    renderWithTheme(<Contacts />);

    expect(await screen.findByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('ana@example.com')).toBeInTheDocument();
  });

  it('requests a new query when searching by name', async () => {
    vi.useFakeTimers();
    apiFetch.mockResolvedValueOnce({ items: [], totalElements: 0 });
    apiFetch.mockResolvedValueOnce({ items: [baseContact], totalElements: 1 });

    renderWithTheme(<Contacts />);
    await waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(1));

    fireEvent.change(screen.getByLabelText(/search by name/i), {
      target: { value: 'Acme' }
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    await waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(2));
    expect(apiFetch.mock.calls[1][0]).toContain('search=Acme');

    vi.useRealTimers();
  });

  it('filters contacts by status', async () => {
    apiFetch.mockResolvedValueOnce({ items: [baseContact], totalElements: 1 });
    apiFetch.mockResolvedValueOnce({ items: [baseContact], totalElements: 1 });

    renderWithTheme(<Contacts />);
    await screen.findByText('Acme Corp');

    fireEvent.mouseDown(screen.getByLabelText(/status/i));
    fireEvent.click(screen.getByRole('option', { name: 'Activo' }));

    await waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(2));
    expect(apiFetch.mock.calls[1][0]).toContain('status=Activo');
  });

  it('opens a profile view when a row is clicked', async () => {
    apiFetch.mockResolvedValueOnce({ items: [baseContact], totalElements: 1 });

    renderWithTheme(<Contacts />);
    await screen.findByText('Acme Corp');

    fireEvent.click(screen.getByText('Acme Corp'));

    expect(await screen.findByRole('button', { name: /back to contacts/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /edit profile/i })).toBeInTheDocument();
  });

  it('creates a user from the add dialog', async () => {
    apiFetch
      .mockResolvedValueOnce({ items: [], totalElements: 0 })
      .mockResolvedValueOnce({ id: '2', name: 'New User' })
      .mockResolvedValueOnce({ items: [baseContact], totalElements: 1 });

    renderWithTheme(<Contacts />);
    await waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole('button', { name: /\+ New user/i }));

    fireEvent.change(screen.getByLabelText(/user.*company name/i), {
      target: { value: 'New User' }
    });
    fireEvent.change(screen.getByLabelText(/^Email$/i), {
      target: { value: 'new@user.com' }
    });

    fireEvent.click(screen.getByRole('button', { name: /save user/i }));

    await waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(3));
    expect(apiFetch.mock.calls[1][0]).toBe('/contact-profiles');
    expect(apiFetch.mock.calls[1][1]).toMatchObject({ method: 'POST' });

    await waitFor(() => {
      expect(screen.queryByText(/Add New User/i)).not.toBeInTheDocument();
    });
  });

  it('deletes a user from the list', async () => {
    apiFetch
      .mockResolvedValueOnce({ items: [baseContact], totalElements: 1 })
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ items: [], totalElements: 0 });

    renderWithTheme(<Contacts />);
    await screen.findByText('Acme Corp');

    fireEvent.click(screen.getByTitle('Delete user'));
    expect(screen.getByText(/Delete User/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^Delete User$/i }));

    await waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(3));
    expect(apiFetch.mock.calls[1][1]).toMatchObject({ method: 'DELETE' });
  });
});
