export const validate = (rules, body) => {
  const errors = {};
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  for (const [field, checks] of Object.entries(rules)) {
    const value = body[field];
    for (const check of checks) {
      if (check === 'required' && (value === undefined || value === null || value === '')) {
        errors[field] = 'Este campo es obligatorio.';
      }
      if (check === 'email' && value && !emailRegex.test(String(value))) {
        errors[field] = 'Ingresa un correo electronico valido.';
      }
      if (check.startsWith('max:') && value && String(value).length > Number(check.split(':')[1])) {
        errors[field] = `Maximo ${check.split(':')[1]} caracteres.`;
      }
      if (check.startsWith('min:') && value && String(value).length < Number(check.split(':')[1])) {
        errors[field] = `Minimo ${check.split(':')[1]} caracteres.`;
      }
      if (check === 'username' && value && !/^[a-zA-Z0-9_]+$/.test(String(value))) {
        errors[field] = 'El nombre de usuario solo puede contener letras, numeros y guiones bajos.';
      }
      if (check === 'name' && value && !/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/.test(String(value).trim())) {
        errors[field] = 'El nombre completo solo puede contener letras y espacios.';
      }
    }
  }

  return errors;
};

export const hasErrors = (res, errors) => {
  if (Object.keys(errors).length === 0) return false;
  res.status(422).json({ message: 'Validacion fallida.', errors });
  return true;
};

export const isValidUrl = (value) => {
  if (!value) return true;
  try {
    const parsed = new URL(String(value));
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};
