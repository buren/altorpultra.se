export function validateAdminPassword(
  input: string,
  serverPassword: string
): boolean {
  if (!input || !serverPassword) return false;
  return input === serverPassword;
}
