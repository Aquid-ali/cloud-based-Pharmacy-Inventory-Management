// Single source of truth for the reset-password complexity policy, shared
// between the real-time checklist on ResetPassword.jsx and its final submit
// guard. Mirrors resetPasswordValidator in server/validators/authValidator.js -
// keep the two in sync if either changes.
export const PASSWORD_RULES = [
  { id: 'length', label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
  { id: 'uppercase', label: 'One uppercase letter', test: (pw) => /[A-Z]/.test(pw) },
  { id: 'lowercase', label: 'One lowercase letter', test: (pw) => /[a-z]/.test(pw) },
  { id: 'number', label: 'One number', test: (pw) => /\d/.test(pw) },
];

export const isPasswordValid = (password) => PASSWORD_RULES.every((rule) => rule.test(password));
