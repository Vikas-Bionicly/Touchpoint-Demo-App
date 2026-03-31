export function buildRowSecurityScope({ personaId, companies = [], contacts = [] }) {
  const id = personaId || 'partner';

  const clientAccounts = companies.filter(
    (c) => (c.accountType === 'Client' || c.category1 === 'Client') && c.ownerId === 'current-user'
  );
  const accountSectorSet = new Set(clientAccounts.map((c) => c.category2).filter(Boolean));
  const accountSectorCompanySet = new Set(
    companies
      .filter((c) => c.ownerId === 'current-user' || accountSectorSet.has(c.category2))
      .map((c) => c.name)
      .filter(Boolean)
  );

  const legalAssistantCompanySet = new Set(
    contacts.filter((c) => c.ownerId === 'other-user').map((c) => c.company).filter(Boolean)
  );
  const associateCompanySet = new Set(
    contacts.filter((c) => c.ownerId === 'current-user').map((c) => c.company).filter(Boolean)
  );

  const legalAssistantContactSet = new Set(contacts.filter((c) => c.ownerId === 'other-user').map((c) => c.id));
  const associateContactSet = new Set(contacts.filter((c) => c.ownerId === 'current-user').map((c) => c.id));

  function canSeeCompanyName(companyName) {
    if (!companyName) return true;
    if (id === 'bd-standard' || id === 'non-equity-partner') return accountSectorCompanySet.has(companyName);
    if (id === 'legal-assistant') return legalAssistantCompanySet.has(companyName);
    if (id === 'associate') return associateCompanySet.has(companyName);
    return true;
  }

  function canSeeContact(contact) {
    if (!contact) return false;
    if (id === 'legal-assistant') return legalAssistantContactSet.has(contact.id);
    if (id === 'associate') return associateContactSet.has(contact.id);
    if (id === 'bd-standard' || id === 'non-equity-partner') return canSeeCompanyName(contact.company);
    return true;
  }

  function canSeeTouchpoint(tp, contactsByName = new Map()) {
    if (!tp) return false;
    if (tp.contactName) {
      const contact = contactsByName.get(tp.contactName);
      if (contact) return canSeeContact(contact);
    }
    if (tp.company) return canSeeCompanyName(tp.company);
    return true;
  }

  function canSeeList(list, contactsById = new Map()) {
    if (!list) return false;
    const memberIds = Array.isArray(list.memberIds) ? list.memberIds : [];
    if (!memberIds.length) return true;
    return memberIds.some((idValue) => {
      const member = contactsById.get(idValue);
      return member ? canSeeContact(member) : false;
    });
  }

  return {
    canSeeCompanyName,
    canSeeContact,
    canSeeTouchpoint,
    canSeeList,
  };
}

