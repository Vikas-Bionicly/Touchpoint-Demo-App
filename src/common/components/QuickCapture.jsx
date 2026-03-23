import { useState } from 'react';
import Icon from './Icon';
import { demoStore, useDemoStore } from '../store/demoStore';

const CAPTURE_TYPES = [
  { id: 'contact', label: 'Contact', icon: 'addressCard' },
  { id: 'company', label: 'Company', icon: 'buildings' },
  { id: 'touchpoint', label: 'Touchpoint', icon: 'handshake' },
  { id: 'note', label: 'Note', icon: 'note' },
  { id: 'list', label: 'List', icon: 'list' },
];

function QuickContactForm({ onDone }) {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <input placeholder="Name *" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
      <input placeholder="Company" value={company} onChange={(e) => setCompany(e.target.value)} style={inputStyle} />
      <input placeholder="Role" value={role} onChange={(e) => setRole(e.target.value)} style={inputStyle} />
      <button className="primary" disabled={!name.trim()} onClick={() => { demoStore.actions.addContact({ name, company, role }); onDone(); }} style={{ fontSize: 13 }}>Add Contact</button>
    </div>
  );
}

function QuickCompanyForm({ onDone }) {
  const [name, setName] = useState('');
  const [accountType, setAccountType] = useState('Prospective');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <input placeholder="Company Name *" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
      <select value={accountType} onChange={(e) => setAccountType(e.target.value)} style={inputStyle}>
        <option value="Client">Client</option>
        <option value="Prospective">Prospective</option>
        <option value="Other">Other</option>
      </select>
      <button className="primary" disabled={!name.trim()} onClick={() => { demoStore.actions.addCompany({ name, accountType }); onDone(); }} style={{ fontSize: 13 }}>Add Company</button>
    </div>
  );
}

function QuickTouchpointForm({ onDone }) {
  const contacts = useDemoStore((s) => s.contacts || []);
  const [contactName, setContactName] = useState(contacts[0]?.name || '');
  const [title, setTitle] = useState('');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <select value={contactName} onChange={(e) => setContactName(e.target.value)} style={inputStyle}>
        {contacts.slice(0, 50).map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
      </select>
      <input placeholder="Title *" value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} />
      <button className="primary" disabled={!title.trim()} onClick={() => {
        const contact = contacts.find((c) => c.name === contactName);
        demoStore.actions.addTouchpointTask({ contactName, company: contact?.company || '', title, source: 'quick-capture' });
        onDone();
      }} style={{ fontSize: 13 }}>Create Touchpoint</button>
    </div>
  );
}

function QuickNoteForm({ onDone }) {
  const contacts = useDemoStore((s) => s.contacts || []);
  const [contactName, setContactName] = useState(contacts[0]?.name || '');
  const [text, setText] = useState('');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <select value={contactName} onChange={(e) => setContactName(e.target.value)} style={inputStyle}>
        {contacts.slice(0, 50).map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
      </select>
      <textarea placeholder="Note text *" value={text} onChange={(e) => setText(e.target.value)} rows={3} style={inputStyle} />
      <button className="primary" disabled={!text.trim()} onClick={() => {
        const contact = contacts.find((c) => c.name === contactName);
        demoStore.actions.addContactNote({ contactId: contact?.id || '', contactName, text, type: 'General', visibility: 'private' });
        onDone();
      }} style={{ fontSize: 13 }}>Add Note</button>
    </div>
  );
}

function QuickListForm({ onDone }) {
  const [name, setName] = useState('');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <input placeholder="List Name *" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
      <button className="primary" disabled={!name.trim()} onClick={() => { demoStore.actions.createList({ name }); onDone(); }} style={{ fontSize: 13 }}>Create List</button>
    </div>
  );
}

const inputStyle = {
  border: '1px solid #d4d4d4', borderRadius: 8, padding: '8px 10px', fontSize: 13, width: '100%',
};

const FORMS = {
  contact: QuickContactForm,
  company: QuickCompanyForm,
  touchpoint: QuickTouchpointForm,
  note: QuickNoteForm,
  list: QuickListForm,
};

export default function QuickCapture() {
  const [open, setOpen] = useState(false);
  const [activeForm, setActiveForm] = useState(null);

  function handleDone() {
    setActiveForm(null);
    setOpen(false);
  }

  const FormComponent = activeForm ? FORMS[activeForm] : null;

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 100 }}>
      {open && !activeForm && (
        <div style={{
          position: 'absolute', bottom: 60, right: 0, background: '#fff',
          border: '1px solid #e5e7eb', borderRadius: 12, padding: 8,
          boxShadow: '0 20px 40px -10px rgba(0,0,0,0.15)', minWidth: 180,
          display: 'flex', flexDirection: 'column', gap: 2,
        }}>
          {CAPTURE_TYPES.map((type) => (
            <button
              key={type.id}
              className="tool-btn"
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', fontSize: 13 }}
              onClick={() => setActiveForm(type.id)}
            >
              <Icon name={type.icon} />
              <span>{type.label}</span>
            </button>
          ))}
        </div>
      )}

      {open && activeForm && FormComponent && (
        <div style={{
          position: 'absolute', bottom: 60, right: 0, background: '#fff',
          border: '1px solid #e5e7eb', borderRadius: 12, padding: 16,
          boxShadow: '0 20px 40px -10px rgba(0,0,0,0.15)', minWidth: 260, maxWidth: 320,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <strong style={{ fontSize: 14 }}>New {CAPTURE_TYPES.find((t) => t.id === activeForm)?.label}</strong>
            <button type="button" style={{ all: 'unset', cursor: 'pointer', fontSize: 16, color: '#6b7280' }} onClick={() => setActiveForm(null)}>x</button>
          </div>
          <FormComponent onDone={handleDone} />
        </div>
      )}

      <button
        type="button"
        onClick={() => { setOpen((p) => !p); if (open) setActiveForm(null); }}
        style={{
          width: 48, height: 48, borderRadius: '50%', border: 'none',
          background: '#6366f1', color: '#fff', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
          transition: 'transform 0.2s',
          transform: open ? 'rotate(45deg)' : 'none',
          fontSize: 24,
        }}
        aria-label="Quick capture"
      >
        <Icon name="plus" />
      </button>
    </div>
  );
}
