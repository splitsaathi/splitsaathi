import * as Contacts from 'expo-contacts';
import * as Linking  from 'expo-linking';
import { Platform } from 'react-native';
import { findUserByPhone } from './database';

// ── Request permission + load contacts ────────────────────────────────────────
export const getPhoneContacts = async () => {
  const { status: existing } = await Contacts.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status: asked } = await Contacts.requestPermissionsAsync();
    finalStatus = asked;
  }

  if (finalStatus !== 'granted') return { granted: false, contacts: [] };

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
    })).sort((a, b) => b.onApp - a.onApp),
  };
};

// ── WhatsApp invite ───────────────────────────────────────────────────────────
export const sendWhatsAppInvite = (phone, inviterName) => {
  const msg = `Hey! I'm ${inviterName}. I use Splitsathi — the best app for splitting expenses! Join here: https://Splitsathi.com`;

  if (Platform.OS === 'web') {
    const url = `https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  } else {
    const url = `whatsapp://send?phone=91${phone}&text=${encodeURIComponent(msg)}`;
    Linking.openURL(url).catch(() => {
      Linking.openURL('market://details?id=com.whatsapp');
    });
  }
};

// ── SMS invite ────────────────────────────────────────────────────────────────
export const sendSMSInvite = (phone, inviterName) => {
  const body = encodeURIComponent(
    `${inviterName} invited you to Splitsathi! Split expenses with friends easily. Download: https://Splitsathi.com`
  );

  if (Platform.OS === 'web') {
    window.open(`sms:+91${phone}?body=${body}`, '_blank');
  } else {
    Linking.openURL(`sms:+91${phone}?body=${body}`);
  }
};

// ── Email invite ──────────────────────────────────────────────────────────────
export const sendEmailInvite = (email, inviterName) => {
  const subject = encodeURIComponent(`${inviterName} invited you to Splitsathi!`);
  const body    = encodeURIComponent(
    `Hi!\n\n${inviterName} has invited you to Splitsathi.\n\nSplitsathi makes it easy to split expenses with friends.\n\nDownload here: https://Splitsathi.com\n\nThanks!`
  );
  Linking.openURL(`mailto:${email}?subject=${subject}&body=${body}`);
};

