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
    throw new Error(err.detail || `Stripe request failed (${res.status})`);
  }
  return res.json();
};

export const createPaymentIntent = ({ amount, currency, reference, description, customerEmail }) =>
  stripeRequest('/api/payment-intents', {
    method: 'POST',
    body: { amount, currency, reference, description, customer_email: customerEmail },
  });

export const fetchCustomerPaymentMethods = (email) =>
  stripeRequest(`/api/customers/payment-methods?email=${encodeURIComponent(email)}`);

export const chargeCustomer = ({ customerEmail, paymentMethodId, amount, currency, description, reference }) =>
  stripeRequest('/api/charge', {
    method: 'POST',
    body: {
      customer_email: customerEmail,
      payment_method_id: paymentMethodId,
      amount,
      currency,
      description,
      reference,
    },
  });

export const createStripeInvoice = ({ customerEmail, customerName, amount, currency, description, reference, dueDays }) =>
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
    },
  });
