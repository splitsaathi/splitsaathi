// src/utils/balances.js
// Core balance / split calculation logic — used across the app

/**
 * Calculate net balances for a given user across a set of bills.
 * Positive value = that person owes the user.
 * Negative value = the user owes that person.
 */
export const calcBalances = (bills, userId) => {
  const bal = {};
  (bills || []).forEach(b => {
    const splitAmong = b.split_among || [];
    const settled    = b.settled || [];
    const unsettled  = splitAmong.filter(m => !settled.includes(m));
    if (!unsettled.length) return;

    const perPerson = b.amount / splitAmong.length;

    if (b.paid_by === userId) {
      unsettled.forEach(m => {
        if (m !== userId) bal[m] = (bal[m] || 0) + perPerson;
      });
    } else if (unsettled.includes(userId)) {
      bal[b.paid_by] = (bal[b.paid_by] || 0) - perPerson;
    }
  });
  return bal;
};

/** Net total (positive = user is owed overall, negative = user owes overall) */
export const netBalance = (balances) =>
  Object.values(balances).reduce((sum, v) => sum + v, 0);

/** Total amount owed TO the user */
export const totalOwed = (balances) =>
  Object.values(balances).filter(v => v > 0).reduce((sum, v) => sum + v, 0);

/** Total amount the user owes others */
export const totalOwing = (balances) =>
  Math.abs(Object.values(balances).filter(v => v < 0).reduce((sum, v) => sum + v, 0));

/** Per-member paid/owes/net totals for a group's Totals tab */
export const memberTotals = (bills, members) =>
  members.map(u => {
    const paid = (bills || []).filter(b => b.paid_by === u.id).reduce((s, b) => s + b.amount, 0);
    const owes = (bills || [])
      .filter(b => (b.split_among || []).includes(u.id) && b.paid_by !== u.id)
      .reduce((s, b) => s + b.amount / (b.split_among || [1]).length, 0);
    return { ...u, paid, owes, net: paid - owes };
  });

/**
 * Simplify debts algorithm — minimizes number of transactions needed
 * to settle a group. Returns array of { from, to, amount }.
 */
export const simplifyDebts = (bills, memberIds) => {
  const netMap = {};
  memberIds.forEach(id => { netMap[id] = 0; });

  (bills || []).forEach(b => {
    const sp = b.split_among || [];
    const st = b.settled || [];
    const unsettled = sp.filter(m => !st.includes(m));
    if (!unsettled.length) return;
    const pp = b.amount / sp.length;
    unsettled.forEach(m => {
      if (m === b.paid_by) return;
      netMap[m] = (netMap[m] || 0) - pp;
      netMap[b.paid_by] = (netMap[b.paid_by] || 0) + pp;
    });
  });

  const creditors = Object.entries(netMap).filter(([, v]) => v > 0.01).map(([id, v]) => ({ id, amt: v }));
  const debtors    = Object.entries(netMap).filter(([, v]) => v < -0.01).map(([id, v]) => ({ id, amt: -v }));

  const transactions = [];
  let ci = 0, di = 0;
  while (ci < creditors.length && di < debtors.length) {
    const amt = Math.min(creditors[ci].amt, debtors[di].amt);
    transactions.push({ from: debtors[di].id, to: creditors[ci].id, amount: amt });
    creditors[ci].amt -= amt;
    debtors[di].amt   -= amt;
    if (creditors[ci].amt < 0.01) ci++;
    if (debtors[di].amt < 0.01) di++;
  }
  return transactions;
};

/** Is a bill fully settled by everyone */
export const isBillSettled = (bill) => {
  const sp = bill.split_among || [];
  const st = bill.settled || [];
  return sp.every(m => m === bill.paid_by || st.includes(m));
};

/** Amount the current user owes/lent on a single bill */
export const myShareOnBill = (bill, userId) => {
  const sp = bill.split_among || [];
  const st = bill.settled || [];
  const pp = bill.amount / sp.length;
  const iPaid = bill.paid_by === userId;
  const iOwe  = !iPaid && sp.includes(userId) && !st.includes(userId);

  if (isBillSettled(bill)) return { amount: 0, type: 'settled' };
  if (iPaid) return { amount: pp * (sp.length - 1), type: 'lent' };
  if (iOwe)  return { amount: pp, type: 'owe' };
  return { amount: 0, type: null };
};

