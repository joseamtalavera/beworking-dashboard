export const CANONICAL_USER_TYPES = [
  'Usuario Mesa',
  'Usuario Aulas',
  'Usuario Virtual',
  'Usuario Nómada',
  'Distribuidor',
  'Proveedor',
  'Servicios'
];

export const LEGACY_USER_TYPE_MAP = {
  'Usuario Oficinas Virtuales': 'Usuario Virtual',
  'Por Horas': 'Usuario Aulas'
};

export const normalizeUserTypeLabel = (value) => {
  if (!value) {
    return value;
  }
  return LEGACY_USER_TYPE_MAP[value] ?? value;
};
