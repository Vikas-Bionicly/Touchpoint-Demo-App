// Eager-import all contact and company avatar images from demo-data
const contactAvatarUrls = import.meta.glob('../../../demo-data/avatars/contacts/*', { eager: true, import: 'default' });
const companyAvatarUrls = import.meta.glob('../../../demo-data/avatars/companies/*', { eager: true, import: 'default' });

export function resolveContactAvatarUrl(filename) {
  if (!filename) return null;
  // If it's already a full URL, return as-is
  if (filename.startsWith('http')) return filename;
  const exactKey = `../../../demo-data/avatars/contacts/${filename}`;
  if (contactAvatarUrls[exactKey]) return contactAvatarUrls[exactKey];
  const matchKey = Object.keys(contactAvatarUrls).find((k) => k.toLowerCase().endsWith(`/${filename.toLowerCase()}`));
  return matchKey ? contactAvatarUrls[matchKey] : null;
}

export function resolveCompanyAvatarUrl(filename) {
  if (!filename) return null;
  if (filename.startsWith('http')) return filename;
  const exactKey = `../../../demo-data/avatars/companies/${filename}`;
  if (companyAvatarUrls[exactKey]) return companyAvatarUrls[exactKey];
  const matchKey = Object.keys(companyAvatarUrls).find((k) => k.toLowerCase().endsWith(`/${filename.toLowerCase()}`));
  return matchKey ? companyAvatarUrls[matchKey] : null;
}
