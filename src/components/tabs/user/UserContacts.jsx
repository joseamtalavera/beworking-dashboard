import { useCallback, useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { apiFetch } from '../../../api/client';
import ContactProfileView from '../admin/ContactProfileView.jsx';
import { normalizeUserTypeLabel, CANONICAL_USER_TYPES } from '../admin/contactConstants';

const normalizeContact = (entry = {}) => {
  const contact = entry.contact ?? {};
  const billing = entry.billing ?? {};

  const representativeName = [entry.representative_first_name, entry.representative_last_name]
    .filter(Boolean)
    .join(' ');
  const fallbackContactName = contact.name
    ?? entry.primary_contact
    ?? (representativeName || null);
  const fallbackContactEmail = contact.email
    ?? entry.email_primary
    ?? entry.representative_email
    ?? null;

  const fallbackBilling = {
    company: billing.company ?? entry.billing_name ?? entry.name ?? null,
    email: billing.email ?? entry.billing_email ?? entry.email_primary ?? null,
    address: billing.address ?? entry.billing_address ?? null,
    postal_code: billing.postal_code ?? entry.billing_postal_code ?? null,
    county: billing.county ?? entry.billing_province ?? null,
    country: billing.country ?? entry.billing_country ?? null,
    tax_id: billing.tax_id ?? entry.billing_tax_id ?? null,
  };

  const rawUserType = entry.user_type ?? '—';
  const normalizedUserType = rawUserType === '—' ? rawUserType : normalizeUserTypeLabel(rawUserType);

  return {
    ...entry,
    id: entry.id != null ? String(entry.id) : null,
    name: entry.name ?? entry.billing_name ?? '—',
    plan: entry.plan ?? 'Custom',
    center: entry.center != null ? String(entry.center) : null,
    user_type: normalizedUserType,
    status: entry.status ?? 'Unknown',
    lastActive: entry.lastActive ?? '—',
    channel: entry.channel ?? '—',
    created_at: entry.created_at ?? null,
    phone_primary: entry.phone_primary ?? null,
    avatar: entry.avatar ?? null,
    contact: {
      name: fallbackContactName ?? '—',
      email: fallbackContactEmail ?? '—',
    },
    billing: fallbackBilling,
  };
};

const UserContacts = ({ userProfile, refreshProfile }) => {
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const tenantId = userProfile?.tenantId;
  const email = userProfile?.email;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        let data = null;

        // Try by tenantId first
        if (tenantId) {
          try {
            data = await apiFetch(`/contact-profiles/${tenantId}`);
          } catch {
            // tenantId lookup failed (e.g. 404), fall through to email search
          }
        }

        // Fall back to email search
        if (!data && email) {
          const params = new URLSearchParams({ search: email, page: '0', size: '1' });
          const result = await apiFetch(`/contact-profiles?${params}`);
          const items = Array.isArray(result?.content)
            ? result.content
            : Array.isArray(result?.items)
              ? result.items
              : Array.isArray(result)
                ? result
                : [];
          if (items.length > 0) {
            data = items[0];
          }
        }

        if (!cancelled) {
          if (data) {
            setContact(normalizeContact(data));
          } else {
            setError('No contact profile found for your account.');
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Unable to load your profile.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    if (!tenantId && !email) {
      setError('No contact profile linked to your account.');
      setLoading(false);
      return;
    }

    load();
    return () => { cancelled = true; };
  }, [tenantId, email]);

  const handleSave = useCallback(async (updatedProfile) => {
    if (!updatedProfile?.id) return;

    const normalizeString = (value) => {
      if (value == null) return undefined;
      const trimmed = String(value).trim();
      return trimmed || undefined;
    };

    const normalizedUserType = normalizeUserTypeLabel(updatedProfile.user_type);

    const payload = {
      name: normalizeString(updatedProfile.name) ?? updatedProfile.name ?? '',
      status: normalizeString(updatedProfile.status) ?? null,
      plan: normalizeString(updatedProfile.plan) ?? null,
      primaryContact: normalizeString(updatedProfile.contact?.name) ?? null,
      email: normalizeString(updatedProfile.contact?.email) ?? null,
      phone: normalizeString(updatedProfile.phone_primary) ?? null,
      userType: normalizedUserType ?? null,
      tenantType: normalizedUserType ?? null,
      center: normalizeString(updatedProfile.center) ?? null,
      channel: normalizeString(updatedProfile.channel) ?? null,
      avatar: updatedProfile.avatar ?? null,
      billingCompany: normalizeString(updatedProfile.billing?.company) ?? null,
      billingEmail: normalizeString(updatedProfile.billing?.email) ?? null,
      billingAddress: normalizeString(updatedProfile.billing?.address) ?? null,
      billingPostalCode: normalizeString(updatedProfile.billing?.postal_code) ?? null,
      billingCounty: normalizeString(updatedProfile.billing?.county) ?? null,
      billingCountry: normalizeString(updatedProfile.billing?.country) ?? null,
      billingTaxId: normalizeString(updatedProfile.billing?.tax_id) ?? null,
    };

    await apiFetch(`/contact-profiles/${updatedProfile.id}`, {
      method: 'PUT',
      body: payload,
    });

    const merged = normalizeContact({
      ...updatedProfile,
      name: payload.name || updatedProfile.name,
      status: payload.status || updatedProfile.status,
      plan: payload.plan || updatedProfile.plan,
      user_type: payload.tenantType || updatedProfile.user_type,
      center: payload.center ?? updatedProfile.center,
      channel: payload.channel ?? updatedProfile.channel,
      phone_primary: payload.phone ?? updatedProfile.phone_primary,
      avatar: payload.avatar ?? updatedProfile.avatar ?? null,
      contact: {
        ...(updatedProfile.contact || {}),
        name: payload.primaryContact ?? updatedProfile.contact?.name ?? null,
        email: payload.email ?? updatedProfile.contact?.email ?? null,
      },
      billing: {
        ...(updatedProfile.billing || {}),
        company: payload.billingCompany ?? updatedProfile.billing?.company ?? null,
        email: payload.billingEmail ?? updatedProfile.billing?.email ?? null,
        address: payload.billingAddress ?? updatedProfile.billing?.address ?? null,
        postal_code: payload.billingPostalCode ?? updatedProfile.billing?.postal_code ?? null,
        county: payload.billingCounty ?? updatedProfile.billing?.county ?? null,
        country: payload.billingCountry ?? updatedProfile.billing?.country ?? null,
        tax_id: payload.billingTaxId ?? updatedProfile.billing?.tax_id ?? null,
      },
    });

    setContact(merged);
    return merged;
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ mx: 2 }}>{error}</Alert>;
  }

  if (!contact) {
    return (
      <Typography variant="body1" sx={{ color: 'text.secondary', textAlign: 'center', py: 6 }}>
        No profile found.
      </Typography>
    );
  }

  return (
    <ContactProfileView
      contact={contact}
      onBack={null}
      onSave={handleSave}
      userTypeOptions={[...CANONICAL_USER_TYPES]}
      refreshProfile={refreshProfile}
    />
  );
};

export default UserContacts;
