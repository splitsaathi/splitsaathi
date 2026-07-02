import { create } from 'zustand';
import * as db from '../services/database';

// ── Auth Store ─────────────────────────────────────────────────────────────────
export const useAuthStore = create((set) => ({
  user:     null,
  profile:  null,
  loading:  true,
  setUser:    (user)    => set({ user }),
  setProfile: (profile) => set({ profile, loading: false }),
  setLoading: (loading) => set({ loading }),
  clear:      ()        => set({ user: null, profile: null, loading: false }),
}));

// ── Groups Store ───────────────────────────────────────────────────────────────
export const useGroupStore = create((set, get) => ({
  groups:       [],
  groupMembers: {},
  loading:      false,

  setGroups:       (groups)           => set({ groups }),
  setGroupMembers: (groupId, members) => set(s => ({ groupMembers: { ...s.groupMembers, [groupId]: members } })),

  loadGroups: async (userId) => {
    set({ loading: true });
    const { data } = await db.getMyGroups(userId);
    const groups   = (data || []).map(r => r.groups).filter(Boolean);
    set({ groups, loading: false });

    groups.forEach(async g => {
      const { data: mem } = await db.getGroupMembers(g.id);
      if (mem) {
        const profiles = mem.map(r => r.profiles).filter(Boolean);
        set(s => ({ groupMembers: { ...s.groupMembers, [g.id]: profiles } }));
      }
    });
  },

  loadGroupMembers: async (groupId) => {
    const { data: mem } = await db.getGroupMembers(groupId);
    if (mem) {
      const profiles = mem.map(r => r.profiles).filter(Boolean);
      set(s => ({ groupMembers: { ...s.groupMembers, [groupId]: profiles } }));
      return profiles;
    }
    return [];
  },

  createGroup: async (name, icon, createdBy, memberIds) => {
    const { data, error } = await db.createGroup(name, icon, createdBy, memberIds);
    if (!error && data) {
      await get().loadGroups(createdBy);
    }
    return { data, error };
  },

  addMemberToGroup: async (groupId, userId, currentUserId) => {
    const { error } = await db.addMemberToGroup(groupId, userId);
    if (!error) {
      await get().loadGroupMembers(groupId);
    }
    return { error };
  },

  removeMemberFromGroup: async (groupId, userId) => {
    const { error } = await db.removeMemberFromGroup(groupId, userId);
    if (!error) {
      await get().loadGroupMembers(groupId);
    }
    return { error };
  },
}));

// ── Bills Store ────────────────────────────────────────────────────────────────
export const useBillStore = create((set, get) => ({
  bills:    {},
  loading:  false,

  setBills:    (groupId, bills) => set(s => ({ bills: { ...s.bills, [groupId]: bills } })),

  loadBills: async (groupId, userId) => {
    const { data } = await db.getGroupBills(groupId, userId);
    if (data) set(s => ({ bills: { ...s.bills, [groupId]: data } }));
    return data;
  },

  addBill: async (billData, groupId, userId) => {
    const { data, error } = await db.createBill(billData);
    if (!error) await get().loadBills(groupId, userId);
    return { data, error };
  },

  settle: async (billId, userId, groupId) => {
    const { error } = await db.settleBill(billId, userId);
    if (!error) await get().loadBills(groupId, userId);
    return { error };
  },

  setReminder: async (billId, date, groupId, userId) => {
    await db.setReminder(billId, date);
    await get().loadBills(groupId, userId);
  },

  removeReminder: async (billId, groupId, userId) => {
    await db.removeReminder(billId);
    await get().loadBills(groupId, userId);
  },

  getBalances: (bills, userId) => {
    const bal = {};
    (bills || []).forEach(b => {
      const sp  = b.split_among || [];
      const st  = b.settled     || [];
      const uns = sp.filter(m => !st.includes(m));
      if (!uns.length) return;
      const pp = b.amount / sp.length;
      if (b.paid_by === userId) {
        uns.forEach(m => { if (m !== userId) bal[m] = (bal[m] || 0) + pp; });
      } else if (uns.includes(userId)) {
        bal[b.paid_by] = (bal[b.paid_by] || 0) - pp;
      }
    });
    return bal;
  },
}));

// ── Friends Store ──────────────────────────────────────────────────────────────
export const useFriendStore = create((set) => ({
  friends: [],
  loading: false,

  loadFriends: async (userId) => {
    set({ loading: true });
    const { data } = await db.getMyFriends(userId);
    set({ friends: data || [], loading: false });
  },

  addFriend: async (userId, friendId) => {
    const { error } = await db.addFriend(userId, friendId);
    return { error };
  },
}));

