import * as Contacts from 'expo-contacts';
import * as Linking  from 'expo-linking';
import { findUserByPhone } from './database';

// ── Request permission + load contacts ────────────────────────────────────────
export const getPhoneContacts = async () => {

  // Step 1: Check if permission already granted — avoid showing dialog repeatedly
  const { status: existing } = await Contacts.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    // Only ask if not already granted
    const { status: asked } = await Contacts.requestPermissionsAsync();
    finalStatus = asked;
  }

  if (finalStatus !== 'granted') return { granted: false, contacts: [] };

  // Step 2: Load contacts
  const { data } = await Contacts.getContactsAsync({
    fields: [
      Contacts.Fields.Name,
      Contacts.Fields.PhoneNumbers,
      Contacts.Fields.Emails,
      Contacts.Fields.Image,
    ],
    sort: Contacts.SortTypes.FirstName,
  });

  const cleaned = data
    .filter(c => c.name && c.phoneNumbers?.length)
    .map(c => ({
      id:    c.id,
      name:  c.name,
      phone: c.phoneNumbers[0].number.replace(/[\s\-\(\)\+]/g, '').slice(-10),
      email: c.emails?.[0]?.email || '',
      image: c.imageAvailable ? c.image?.uri : null,
    }))
    .filter(c => c.phone.length === 10);

  // Step 3: Check which contacts are on SplitSaathi (batch in chunks of 10)
  const appUsers = {};
  const chunks   = [];
  for (let i = 0; i < cleaned.length; i += 10) chunks.push(cleaned.slice(i, i + 10));

  for (const chunk of chunks) {
    const phones  = chunk.map(c => `+91${c.phone}`);
    const results = await Promise.allSettled(phones.map(p => findUserByPhone(p)));
    results.forEach((r, idx) => {
      if (r.status === 'fulfilled' && r.value?.data) {
        appUsers[chunk[idx].phone] = r.value.data;
      }
    });
  }

  return {
    granted:  true,
    contacts: cleaned.map(c => ({
      ...c,
      onApp:   !!appUsers[c.phone],
      appUser: appUsers[c.phone] || null,
    })).sort((a, b) => b.onApp - a.onApp), // App users first
  };
};

// ── WhatsApp invite ───────────────────────────────────────────────────────────
export const sendWhatsAppInvite = (phone, inviterName) => {
  const msg = `Hey! I'm ${inviterName}. I use SplitSaathi — the best app for splitting expenses! Join here: https://splitsaathi.app/download`;
  const url = `whatsapp://send?phone=91${phone}&text=${encodeURIComponent(msg)}`;
  Linking.openURL(url).catch(() => {
    Linking.openURL('market://details?id=com.whatsapp');
  });
};

// ── SMS invite (via native SMS app — no package needed) ──────────────────────
export const sendSMSInvite = (phone, inviterName) => {
  const body = encodeURIComponent(
    `${inviterName} invited you to SplitSaathi! Split expenses with friends easily. Download: https://splitsaathi.app`
  );
  Linking.openURL(`sms:+91${phone}?body=${body}`);
};

// ── Email invite ──────────────────────────────────────────────────────────────
export const sendEmailInvite = (email, inviterName) => {
  const subject = encodeURIComponent(`${inviterName} invited you to SplitSaathi!`);
  const body    = encodeURIComponent(
    `Hi!\n\n${inviterName} has invited you to SplitSaathi.\n\nSplitSaathi makes it easy to split expenses with friends.\n\nDownload here: https://splitsaathi.app\n\nThanks!`
  );
  Linking.openURL(`mailto:${email}?subject=${subject}&body=${body}`);
};
