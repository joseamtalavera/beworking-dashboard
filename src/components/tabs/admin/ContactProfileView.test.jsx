import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { describe, expect, it, vi } from 'vitest';

import ContactProfileView from './ContactProfileView';
import theme from '../../../theme';

const renderWithTheme = (ui) => render(
  <ThemeProvider theme={theme}>
    {ui}
  </ThemeProvider>
);

const contact = {
  id: '42',
  name: 'Maria Lopez',
  status: 'Active',
  user_type: 'Usuario Virtual',
  created_at: '2024-01-10',
  channel: 'Email',
  contact: {
    name: 'Maria Lopez',
    email: 'maria@example.com'
  },
  billing: {
    company: 'Lopez LLC',
    email: 'billing@example.com'
  }
};

describe('ContactProfileView', () => {
  it('renders the profile header and allows going back', () => {
    const onBack = vi.fn();

    renderWithTheme(
      <ContactProfileView
        contact={contact}
        onBack={onBack}
        onSave={vi.fn()}
        userTypeOptions={['Usuario Virtual']}
      />
    );

    expect(screen.getByText('Maria Lopez')).toBeInTheDocument();
    expect(screen.getByText('maria@example.com')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /back to contacts/i }));
    expect(onBack).toHaveBeenCalled();
  });

  it('edits and saves contact details', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);

    renderWithTheme(
      <ContactProfileView
        contact={contact}
        onBack={vi.fn()}
        onSave={onSave}
        userTypeOptions={['Usuario Virtual']}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /edit profile/i }));

    const nameField = await screen.findByLabelText(/user name/i);
    fireEvent.change(nameField, { target: { value: 'Maria Updated' } });

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Maria Updated'
      }));
    });
  });
});
