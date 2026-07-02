import { useEffect } from 'react';
import { useAuthStore, useGroupStore } from '../store';

export function useGroups() {
  const { profile } = useAuthStore();
  const { groups, groupMembers, loading, loadGroups, createGroup } = useGroupStore();

  useEffect(() => {
    if (profile?.id) loadGroups(profile.id);
  }, [profile?.id]);

  return {
    groups,
    groupMembers,
    loading,
    refresh: () => profile?.id && loadGroups(profile.id),
    createGroup: (name, icon, memberIds) => createGroup(name, icon, profile.id, memberIds),
  };
}

