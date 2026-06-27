import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as MailComposer from 'expo-mail-composer';

// ── Build Excel workbook from group bills ──────────────────────────────────────
export const exportGroupToExcel = async ({ group, bills, members, profile }) => {

  const memberMap = {};
  members.forEach(m => { memberMap[m.id] = m.name; });
  const getName = (id) => id === profile?.id ? 'You' : (memberMap[id] || 'Unknown');

  // ── Sheet 1: All Bills ────────────────────────────────────────────────────
  const billRows = bills.map((b, i) => ({
    '#':            i + 1,
    'Bill Name':    b.title,
    'Amount (₹)':  parseFloat(b.amount).toFixed(2),
    'Category':    b.category || 'General',
    'Paid By':     getName(b.paid_by),
    'Split Among': (b.split_among || []).map(getName).join(', '),
    'Per Person (₹)': ((b.amount || 0) / Math.max((b.split_among || [1]).length, 1)).toFixed(2),
    'Date':        b.date || '',
    'Note':        b.note || '',
    'Settled':     (b.settled || []).length === (b.split_among || []).length ? 'Yes' : 'Pending',
  }));

  // ── Sheet 2: Balance Summary ───────────────────────────────────────────────
  const balances = {};
  bills.forEach(b => {
    const perPerson = (b.amount || 0) / Math.max((b.split_among || [1]).length, 1);
    (b.split_among || []).forEach(uid => {
      if (uid === b.paid_by) return;
      const key = `${uid}__${b.paid_by}`;
      balances[key] = (balances[key] || 0) + perPerson;
    });
  });

  const balanceRows = Object.entries(balances).map(([key, amt]) => {
    const [fromId, toId] = key.split('__');
    return {
      'Who Owes':    getName(fromId),
      'Owes To':     getName(toId),
      'Amount (₹)':  amt.toFixed(2),
    };
  });

  // ── Sheet 3: Member-wise Totals ────────────────────────────────────────────
  const memberTotals = {};
  members.forEach(m => { memberTotals[m.id] = { paid: 0, share: 0 }; });
  bills.forEach(b => {
    const perPerson = (b.amount || 0) / Math.max((b.split_among || [1]).length, 1);
    if (memberTotals[b.paid_by]) memberTotals[b.paid_by].paid += b.amount || 0;
    (b.split_among || []).forEach(uid => {
      if (memberTotals[uid]) memberTotals[uid].share += perPerson;
    });
  });

  const totalRows = members.map(m => ({
    'Member':       getName(m.id),
    'Total Paid (₹)':  (memberTotals[m.id]?.paid  || 0).toFixed(2),
    'Total Share (₹)': (memberTotals[m.id]?.share || 0).toFixed(2),
    'Net (₹)':     ((memberTotals[m.id]?.paid || 0) - (memberTotals[m.id]?.share || 0)).toFixed(2),
    'Status':      ((memberTotals[m.id]?.paid || 0) - (memberTotals[m.id]?.share || 0)) >= 0 ? '✅ Gets back' : '🔴 Owes',
  }));

  // ── Build Workbook ─────────────────────────────────────────────────────────
  const wb = XLSX.utils.book_new();

  const ws1 = XLSX.utils.json_to_sheet(billRows.length ? billRows : [{ 'Info': 'No bills yet' }]);
  const ws2 = XLSX.utils.json_to_sheet(balanceRows.length ? balanceRows : [{ 'Info': 'All settled!' }]);
  const ws3 = XLSX.utils.json_to_sheet(totalRows.length ? totalRows : [{ 'Info': 'No members' }]);

  // Column widths
  ws1['!cols'] = [
    { wch: 4 }, { wch: 22 }, { wch: 12 }, { wch: 12 },
    { wch: 14 }, { wch: 28 }, { wch: 14 }, { wch: 12 }, { wch: 20 }, { wch: 10 },
  ];
  ws2['!cols'] = [{ wch: 18 }, { wch: 18 }, { wch: 12 }];
  ws3['!cols'] = [{ wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 12 }, { wch: 14 }];

  XLSX.utils.book_append_sheet(wb, ws1, 'All Bills');
  XLSX.utils.book_append_sheet(wb, ws2, 'Balances');
  XLSX.utils.book_append_sheet(wb, ws3, 'Member Summary');

  // ── Write to file ──────────────────────────────────────────────────────────
  const wbout   = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
  const safeName = group.name.replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `SplitSaathi_${safeName}_${new Date().toISOString().split('T')[0]}.xlsx`;
  const filePath = `${FileSystem.cacheDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(filePath, wbout, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return { filePath, fileName };
};

// ── Share file (WhatsApp, Drive, etc.) ────────────────────────────────────────
export const shareExcelFile = async (filePath) => {
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) throw new Error('Sharing not available on this device');
  await Sharing.shareAsync(filePath, {
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    dialogTitle: 'Share SplitSaathi Report',
  });
};

// ── Email file ─────────────────────────────────────────────────────────────────
export const emailExcelFile = async ({ filePath, fileName, groupName, userEmail }) => {
  const isAvailable = await MailComposer.isAvailableAsync();
  if (!isAvailable) throw new Error('Email not set up on this device');

  await MailComposer.composeAsync({
    recipients:  [userEmail],
    subject:     `SplitSaathi — ${groupName} Expense Report`,
    body:        `Hi!\n\nPlease find attached the expense report for "${groupName}" from SplitSaathi.\n\nThe report includes:\n• All bills\n• Balance summary\n• Member-wise totals\n\nGenerated on ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}.\n\nSplitSaathi — Split expenses with friends 💸`,
    attachments: [filePath],
  });
};
