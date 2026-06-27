import { useState, useCallback } from 'react';
import { getPhoneContacts } from '../services/contacts';

export function useContacts() {
  const [permission, setPermission] = useState('prompt'); // prompt | granted | denied
  const [contacts,   setContacts]   = useState([]);
  const [loading,    setLoading]    = useState(false);

  const requestAndLoad = useCallback(async () => {
    setLoading(true);
    const { granted, contacts: list } = await getPhoneContacts();
    setPermission(granted ? 'granted' : 'denied');
    if (granted) setContacts(list);
    setLoading(false);
    return granted;
  }, []);

  const search = useCallback((query) => {
    if (!query) return contacts;
    return contacts.filter(c =>
      c.name?.toLowerCase().includes(query.toLowerCase()) || c.phone?.includes(query)
    );
  }, [contacts]);

  return { permission, contacts, loading, requestAndLoad, search };
}
