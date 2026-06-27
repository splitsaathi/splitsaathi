import { supabase } from './supabase';

// ── Profiles ───────────────────────────────────────────────────────────────────
export const getProfile = (uid) =>
  supabase.from('profiles').select('*').eq('id', uid).single();

export const updateProfile = (uid, updates) =>
  supabase.from('profiles').update(updates).eq('id', uid);

export const searchUsers = (query) =>
  supabase.from('profiles')
    .select('*')
    .or(`name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
    .limit(10);

export const findUserByPhone = (phone) =>
  supabase.from('profiles').select('*').eq('phone', phone).single();

export const findUserByEmail = (email) =>
  supabase.from('profiles').select('*').eq('email', email).single();

// ── Groups ────────────────────────────────────────────────────────────────────
export const getMyGroups = (uid) =>
  supabase.from('group_members')
    .select('groups(id, name, icon, created_by, created_at)')
    .eq('user_id', uid)
    .order('created_at', { foreignTable: 'groups', ascending: false });

export const createGroup = async (name, icon, createdBy, memberIds) => {
  const { data: group, error } = await supabase
    .from('groups')
    .insert({ name, icon, created_by: createdBy })
    .select()
    .single();
  if (error) return { data: null, error };

  const members = [...new Set([...memberIds, createdBy])].map(uid => ({
    group_id: group.id,
    user_id:  uid,
  }));
  const { error: memberError } = await supabase.from('group_members').insert(members);
  return { data: group, error: memberError };
};

export const getGroupMembers = (groupId) =>
  supabase.from('group_members')
    .select('profiles(id, name, email, phone, avatar_url)')
    .eq('group_id', groupId);

export const addMemberToGroup = (groupId, userId) =>
  supabase.from('group_members').insert({ group_id: groupId, user_id: userId });

export const removeMemberFromGroup = (groupId, userId) =>
  supabase.from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId);

// ── Bills ─────────────────────────────────────────────────────────────────────
export const getGroupBills = async (groupId, userId) => {
  const { data, error } = await supabase
    .from('bills')
    .select('*')
    .eq('group_id', groupId)
    .order('date', { ascending: false });

  if (error) return { data: null, error };
  // Privacy: only bills where user is payer or in split
  const visible = (data || []).filter(
    b => b.paid_by === userId || (b.split_among || []).includes(userId)
  );
  return { data: visible, error: null };
};

export const createBill = (bill) =>
  supabase.from('bills').insert(bill).select().single();

export const updateBill = (billId, updates) =>
  supabase.from('bills').update(updates).eq('id', billId);

export const deleteBill = (billId) =>
  supabase.from('bills').delete().eq('id', billId);

export const settleBill = async (billId, userId) => {
  const { data } = await supabase.from('bills').select('settled').eq('id', billId).single();
  const settled  = [...new Set([...(data?.settled || []), userId])];
  return supabase.from('bills').update({ settled }).eq('id', billId);
};

export const setReminder = (billId, date) =>
  supabase.from('bills').update({ reminder_date: date }).eq('id', billId);

export const removeReminder = (billId) =>
  supabase.from('bills').update({ reminder_date: null }).eq('id', billId);

// ── Friendships ───────────────────────────────────────────────────────────────
export const getMyFriends = async (uid) => {
  const { data, error } = await supabase
    .from('friendships')
    .select('*')
    .or(`user_a.eq.${uid},user_b.eq.${uid}`);

  if (error || !data?.length) return { data: [], error };
  const friendIds = data.map(f => f.user_a === uid ? f.user_b : f.user_a);
  return supabase.from('profiles').select('*').in('id', friendIds);
};

export const addFriend = async (uid, friendId) => {
  const [a, b] = [uid, friendId].sort();
  return supabase.from('friendships')
    .upsert({ user_a: a, user_b: b, added_by: uid }, { onConflict: 'user_a,user_b' });
};

// ── Payments ──────────────────────────────────────────────────────────────────
export const recordPayment = (payment) =>
  supabase.from('payments').insert(payment).select().single();

export const getGroupPayments = (groupId) =>
  supabase.from('payments').select('*').eq('group_id', groupId);

// ── Realtime subscriptions ────────────────────────────────────────────────────
export const subscribeToBills = (groupId, onUpdate) => {
  const channel = supabase
    .channel(`bills:group:${groupId}`)
    .on('postgres_changes', {
      event:  '*',
      schema: 'public',
      table:  'bills',
      filter: `group_id=eq.${groupId}`,
    }, onUpdate)
    .subscribe();
  return () => supabase.removeChannel(channel);
};

export const subscribeToGroups = (userId, onUpdate) => {
  const channel = supabase
    .channel(`group_members:user:${userId}`)
    .on('postgres_changes', {
      event:  '*',
      schema: 'public',
      table:  'group_members',
      filter: `user_id=eq.${userId}`,
    }, onUpdate)
    .subscribe();
  return () => supabase.removeChannel(channel);
};
