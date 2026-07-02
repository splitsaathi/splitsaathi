import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore, useGroupStore, useBillStore } from '../../store';
import { COLORS, SPACING, RADIUS } from '../../theme';
import GroupCard from '../../components/GroupCard';
import EmptyState from '../../components/EmptyState';

export default function GroupsListScreen({ navigation }) {
  const { profile }          = useAuthStore();
  const { groups, groupMembers, loadGroups } = useGroupStore();
  const { bills, getBalances } = useBillStore();

  useEffect(() => { if (profile?.id) loadGroups(profile.id); }, [profile?.id]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Groups</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('CreateGroup')}>
          <Text style={styles.addBtnText}>+ Group</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {groups.length === 0 ? (
          <EmptyState
            emoji="👥"
            text="No groups yet.&#10;Create your first group!"
            actionLabel="+ Create Group"
            onAction={() => navigation.navigate('CreateGroup')}
          />
        ) : (
          groups.map(g => {
            const gb  = bills[g.id] || [];
            const bal = getBalances(gb, profile?.id);
            const net = Object.values(bal).reduce((a, b) => a + b, 0);
            return (
              <GroupCard
                key={g.id}
                group={g}
                memberCount={(groupMembers[g.id] || []).length}
                billCount={gb.length}
                net={net}
                onPress={() => navigation.navigate('GroupDetail', { group: g })}
              />
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.md, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  title:  { color: COLORS.text, fontSize: 22, fontWeight: '800' },
  addBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingHorizontal: 16, paddingVertical: 9 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  scroll: { padding: SPACING.md, paddingBottom: 100 },
});

