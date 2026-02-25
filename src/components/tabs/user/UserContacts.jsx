import { useCallback, useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useTranslation } from 'react-i18next';
import i18n from '../../../i18n/i18n.js';
import esContacts from '../../../i18n/locales/es/contacts.json';
import enContacts from '../../../i18n/locales/en/contacts.json';

import { apiFetch } from '../../../api/client';
import ContactProfileView from '../admin/ContactProfileView.jsx';
import { normalizeUserTypeLabel, CANONICAL_USER_TYPES } from '../admin/contactConstants';

if (!i18n.hasResourceBundle('es', 'contacts')) {
  i18n.addResourceBundle('es', 'contacts', esContacts);
  i18n.addResourceBundle('en', 'contacts', enContacts);
}

const normalizeContact = (entry = {}) => {
  const contact = entry.contact ?? {};
  const billing = entry.billing ?? {};

  // Backend returns camelCase (emailPrimary, billingName, etc.)
  // Also support snake_case for compatibility with nested/merged objects
  const representativeName = [
    entry.representative_first_name || entry.representativeFirstName,
    entry.representative_last_name || entry.representativeLastName
  ].filter(Boolean).join(' ');

  const fallbackContactName = contact.name
    ?? entry.primary_contact ?? entry.contactName
    ?? (representativeName || null);
  const fallbackContactEmail = contact.email
    ?? entry.email_primary ?? entry.emailPrimary
    ?? entry.representative_email ?? entry.representativeEmail
    ?? null;

  const fallbackBilling = {
    company: billing.company ?? entry.billing_name ?? entry.billingName ?? entry.name ?? null,
    email: billing.email ?? entry.billing_email ?? entry.billingEmail ?? entry.email_primary ?? entry.emailPrimary ?? null,
    address: billing.address ?? entry.billing_address ?? entry.billingAddress ?? null,
    postal_code: billing.postal_code ?? entry.billing_postal_code ?? entry.billingPostalCode ?? null,
    city: billing.city ?? entry.billing_city ?? entry.billingCity ?? null,
    county: billing.county ?? entry.billing_province ?? entry.billingProvince ?? null,
    country: billing.country ?? entry.billing_country ?? entry.billingCountry ?? null,
    tax_id: billing.tax_id ?? entry.billing_tax_id ?? entry.billingTaxId ?? null,
    vat_valid: billing.vat_valid ?? entry.vat_valid ?? entry.vatValid ?? null,
  };

  const rawUserType = entry.user_type ?? entry.tenantType ?? '—';
  const normalizedUserType = rawUserType === '—' ? rawUserType : normalizeUserTypeLabel(rawUserType);

  const centerId = entry.center ?? entry.centerId ?? entry.center_id ?? null;

  return {
    ...entry,
    id: entry.id != null ? String(entry.id) : null,
    name: entry.name ?? entry.billing_name ?? entry.billingName ?? '—',
    plan: entry.plan ?? 'Custom',
    center: centerId != null ? String(centerId) : null,
    user_type: normalizedUserType,
    status: entry.status ?? 'Unknown',
    lastActive: entry.lastActive ?? '—',
    channel: entry.channel ?? '—',
    created_at: entry.created_at ?? entry.createdAt ?? null,
    phone_primary: entry.phone_primary ?? entry.phonePrimary ?? null,
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
  const { t } = useTranslation('contacts');

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
            setError(t('errors.noProfile'));
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || t('errors.unableToLoad'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    if (!tenantId && !email) {
      setError(t('errors.noProfileLinked'));
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
      billingCity: normalizeString(updatedProfile.billing?.city) ?? null,
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
        city: payload.billingCity ?? updatedProfile.billing?.city ?? null,
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
        {t('errors.noProfileFound')}
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
      mode="user"
    />
  );
};

export default UserContacts;
