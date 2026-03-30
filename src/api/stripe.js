const PAYMENTS_BASE_URL =
  import.meta.env.VITE_PAYMENTS_BASE_URL || 'http://localhost:8000';

const stripeRequest = async (path, options = {}) => {
  const { method = 'GET', body } = options;
  const config = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) {
    config.body = JSON.stringify(body);
  }
  const res = await fetch(`${PAYMENTS_BASE_URL}${path}`, config);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const detail = Array.isArray(err.detail)
      ? err.detail.map((d) => d.msg || d.message || String(d)).join(', ')
      : err.detail;
    throw new Error(detail || `Stripe request failed (${res.status})`);
  }
  return res.json();
};

export const createPaymentIntent = ({ amount, currency, reference, description, customerEmail, customerName }) =>
  stripeRequest('/api/payment-intents', {
    method: 'POST',
    body: { amount, currency, reference, description, customer_email: customerEmail, customer_name: customerName || '' },
  });

export const fetchCustomerPaymentMethods = (email, customerId, tenant) => {
  const params = new URLSearchParams({ email });
  if (customerId) params.set('customer_id', customerId);
  if (tenant) params.set('tenant', tenant);
  return stripeRequest(`/api/customers/payment-methods?${params}`);
};

export const chargeCustomer = ({ customerEmail, customerName, paymentMethodId, amount, currency, description, reference }) =>
  stripeRequest('/api/charge', {
    method: 'POST',
    body: {
      customer_email: customerEmail,
      customer_name: customerName || '',
      payment_method_id: paymentMethodId,
      amount,
      currency,
      description,
      reference,
    },
  });

export const createSetupIntent = ({ customerEmail, customerName, customerId, tenant }) =>
  stripeRequest('/api/setup-intents', {
    method: 'POST',
    body: { customer_email: customerEmail, customer_name: customerName, customer_id: customerId || undefined, tenant: tenant || undefined },
  });

export const setDefaultPaymentMethod = ({ customerEmail, paymentMethodId, tenant, customerId }) =>
  stripeRequest('/api/customers/default-payment-method', {
    method: 'POST',
    body: { email: customerEmail, payment_method_id: paymentMethodId, tenant: tenant || undefined, customer_id: customerId || undefined },
  });

export const detachPaymentMethod = ({ paymentMethodId, tenant }) =>
  stripeRequest('/api/customers/detach-payment-method', {
    method: 'POST',
    body: { payment_method_id: paymentMethodId, tenant: tenant || undefined },
  });

export const createStripeInvoice = ({ customerEmail, customerName, amount, currency, description, reference, dueDays, idempotencyKey }) =>
  stripeRequest('/api/invoices', {
    method: 'POST',
    body: {
      customer_email: customerEmail,
      customer_name: customerName,
      amount,
      currency,
      description,
      reference,
      due_days: dueDays,
      idempotency_key: idempotencyKey || undefined,
    },
  });
