import { useEffect, useCallback } from 'react';
import { useAuthStore, useBillStore } from '../store';
import { subscribeToBills } from '../services/database';

export function useBills(groupId) {
  const { profile } = useAuthStore();
  const { bills, loadBills, addBill, settle, setReminder, removeReminder, getBalances } = useBillStore();

  const groupBills = bills[groupId] || [];

  useEffect(() => {
    if (!groupId || !profile?.id) return;
    loadBills(groupId, profile.id);

    // Realtime subscription — auto-refresh when any member adds/updates a bill
    const unsub = subscribeToBills(groupId, () => loadBills(groupId, profile.id));
    return unsub;
  }, [groupId, profile?.id]);

  const refresh = useCallback(() => {
    if (groupId && profile?.id) return loadBills(groupId, profile.id);
  }, [groupId, profile?.id]);

  return {
    bills: groupBills,
    refresh,
    addBill: (billData) => addBill(billData, groupId, profile.id),
    settle: (billId, userId) => settle(billId, userId, groupId),
    setReminder: (billId, date) => setReminder(billId, date, groupId, profile.id),
    removeReminder: (billId) => removeReminder(billId, groupId, profile.id),
    balances: getBalances(groupBills, profile?.id),
  };
}
