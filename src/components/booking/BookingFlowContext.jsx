import { createContext, useContext, useReducer, useCallback } from 'react';

const initialState = {
  activeStep: 0,
  // Step 0 — details
  centro: null,
  producto: null,
  userType: 'Usuario Aulas',
  reservationType: 'Por Horas',
  dateFrom: '',
  dateTo: '',
  startTime: '09:00',
  endTime: '10:00',
  weekdays: [],
  openEnded: false,
  attendees: '',
  configuracion: '',
  note: '',
  // Step 1 — contact & billing
  contact: null, // selected contact object (admin) or manual form (user)
  contactInputValue: '',
  tarifa: '',
  status: 'Booked',
  // Step 2 — payment
  paymentMethod: null, // { type: 'charge' | 'invoice' | 'stripe', ... }
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'SET_FIELDS':
      return { ...state, ...action.fields };
    case 'NEXT_STEP':
      return { ...state, activeStep: Math.min(state.activeStep + 1, 2) };
    case 'PREV_STEP':
      return { ...state, activeStep: Math.max(state.activeStep - 1, 0) };
    case 'GO_TO_STEP':
      return { ...state, activeStep: action.step };
    case 'RESET':
      return { ...initialState, dateFrom: action.defaultDate || '', dateTo: action.defaultDate || '' };
    default:
      return state;
  }
}

const BookingFlowContext = createContext(null);

export function BookingFlowProvider({ children, defaultDate }) {
  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    dateFrom: defaultDate || '',
    dateTo: defaultDate || '',
  });

  const setField = useCallback((field, value) => {
    dispatch({ type: 'SET_FIELD', field, value });
  }, []);

  const setFields = useCallback((fields) => {
    dispatch({ type: 'SET_FIELDS', fields });
  }, []);

  const nextStep = useCallback(() => dispatch({ type: 'NEXT_STEP' }), []);
  const prevStep = useCallback(() => dispatch({ type: 'PREV_STEP' }), []);
  const goToStep = useCallback((step) => dispatch({ type: 'GO_TO_STEP', step }), []);
  const reset = useCallback((defaultDate) => dispatch({ type: 'RESET', defaultDate }), []);

  return (
    <BookingFlowContext.Provider
      value={{ state, setField, setFields, nextStep, prevStep, goToStep, reset }}
    >
      {children}
    </BookingFlowContext.Provider>
  );
}

export function useBookingFlow() {
  const ctx = useContext(BookingFlowContext);
  if (!ctx) throw new Error('useBookingFlow must be used within BookingFlowProvider');
  return ctx;
}
