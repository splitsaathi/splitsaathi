import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Pressable, StyleSheet, RefreshControl, Alert, Modal, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore, useGroupStore, useBillStore, useFriendStore } from '../../store';
import { COLORS, SPACING, RADIUS, SHADOW } from '../../theme';
import Avatar from '../../components/Avatar';
import ReminderBadge from '../../components/ReminderBadge';
import { signOut } from '../../services/auth';
import { getProfile } from '../../services/database';
import { supabase } from '../../services/supabase';

function BarChart({ data, currencySymbol = '₹' }) {
  const maxVal = Math.max(...data.map(d => d.value), 1);
  return (
    <View style={{ flexDirection:'row', alignItems:'flex-end', height:90, gap:6, paddingHorizontal:4 }}>
      {data.map((d, i) => (
        <View key={i} style={{ flex:1, alignItems:'center' }}>
          <Text style={{ fontSize:9, color: COLORS.textMuted, marginBottom:2 }}>
            {d.value > 0 ? `${currencySymbol}${(d.value/1000).toFixed(0)}k` : ''}
          </Text>
          <View style={{ width:'75%', height: Math.max(4, (d.value/maxVal)*65), backgroundColor: d.color||COLORS.primary, borderRadius:4 }} />
          <Text style={{ fontSize:9, color: COLORS.textMuted, marginTop:4, textAlign:'center' }} numberOfLines={1}>{d.label}</Text>
          <Text style={{ fontSize:8, color: d.color, fontWeight:'700', marginTop:1 }}>{d.percentage}%</Text>
        </View>
      ))}
    </View>
  );
}

function HorizontalBreakdown({ data }) {
  return (
    <View style={{ gap:10 }}>
      {data.map((d, i) => (
        <View key={i} style={{ flexDirection:'row', alignItems:'center' }}>
          <View style={{ width:10, height:10, borderRadius:5, backgroundColor:d.color, marginRight:8 }} />
          <Text style={{ flex:1, color: COLORS.textSub, fontSize:13 }}>{d.name}</Text>
          <View style={{ flex:2, height:8, backgroundColor: COLORS.surfaceHigh, borderRadius:4, marginHorizontal:8, overflow:'hidden' }}>
            <View style={{ width:`${d.percentage}%`, height:'100%', backgroundColor:d.color, borderRadius:4 }} />
          </View>
          <Text style={{ color: COLORS.textMuted, fontSize:11, minWidth:32, textAlign:'right' }}>{d.percentage}%</Text>
        </View>
      ))}
    </View>
  );
}

export default function DashboardScreen({ navigation }) {
  const { profile }                          = useAuthStore();
  const CUR = profile?.currency_symbol || '₹';
  const { groups, groupMembers, loadGroups } = useGroupStore();
  const { bills, loadBills, getBalances }    = useBillStore();
  const { friends, loadFriends }             = useFriendStore();
  const [refreshing,   setRefreshing]         = useState(false);
  const [chartType,    setChartType]          = useState('bar');
  const [settleModal,  setSettleModal]        = useState(null);
  const [popularTrips, setPopularTrips]       = useState([]);

  // Fetch popular trips from Supabase
  useEffect(() => {
    const fetchPopularTrips = async () => {
      try {
        const { data } = await supabase
          .from('popular_trips')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });
        if (data && data.length > 0) setPopularTrips(data);
      } catch (e) { console.log('Popular trips fetch error:', e); }
    };
    fetchPopularTrips();
  }, []); // { name, upiId, amount }

  useEffect(() => {
    if (profile?.id) { loadGroups(profile.id); loadFriends(profile.id); }
  }, [profile?.id]);

  useEffect(() => {
    if (groups.length > 0 && profile?.id) {
      groups.forEach(g => loadBills(g.id, profile.id));
    }
  }, [groups.length, profile?.id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadGroups(profile.id), loadFriends(profile.id)]);
    await Promise.all(groups.map(g => loadBills(g.id, profile.id)));
    setRefreshing(false);
  }, [profile, groups]);

  const getName = useCallback((uid) => {
    if (uid === profile?.id) return 'You';
    for (const mem of Object.values(groupMembers)) {
      const u = mem.find(m => m.id === uid);
      if (u) return u.name;
    }
    return friends.find(f => f.id === uid)?.name || 'User';
  }, [profile, groupMembers, friends]);

  const allMyBills = useMemo(() =>
    Object.values(bills).flat().filter(
      b => b.paid_by === profile?.id || (b.split_among||[]).includes(profile?.id)
    ), [bills, profile?.id]);

  const dashBal   = useMemo(() => getBalances(allMyBills, profile?.id), [allMyBills, profile?.id]);
  const totalOwed = Object.values(dashBal).filter(v => v > 0).reduce((a,b) => a+b, 0);
  const totalOwe  = Math.abs(Object.values(dashBal).filter(v => v < 0).reduce((a,b) => a+b, 0));

  const thisMonthBills = useMemo(() => allMyBills.filter(b => {
    const d = new Date(b.date||b.created_at), now = new Date();
    return d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear();
  }), [allMyBills]);

  const totalMonthlySpending = thisMonthBills.reduce((s,b) =>
    s + (b.amount / Math.max((b.split_among||[1]).length, 1)), 0);

  const totalGroupCost = Object.values(bills).flat().reduce((s,b) => s + (b.amount||0), 0);
  const projectedBudget = useMemo(() => {
    if (totalGroupCost > 0) return Math.max(20000, Math.ceil((totalGroupCost * 1.5) / 5000) * 5000);
    return 30000;
  }, [totalGroupCost]);

  const monthlyBudget  = Math.max(projectedBudget, 50000);
  const budgetPct      = Math.min(100, Math.round((totalMonthlySpending / monthlyBudget) * 100));
  const utilizationPct = projectedBudget > 0 ? Math.round((totalGroupCost / projectedBudget) * 100) : 0;
  const overBudget     = budgetPct > 80;

  const catTotals = useMemo(() => {
    const totals = { Stay:0, Travel:0, Food:0, Others:0 };
    allMyBills.forEach(b => {
      const amt = b.amount || 0;
      if      (['Hotel','Accommodation'].includes(b.category)) totals.Stay   += amt;
      else if (['Travel','Transport'].includes(b.category))    totals.Travel += amt;
      else if (['Food','Restaurant'].includes(b.category))     totals.Food   += amt;
      else                                                      totals.Others += amt;
    });
    return totals;
  }, [allMyBills]);

  const totalBreakdown = Object.values(catTotals).reduce((s,v) => s+v, 0) || 1;

  const chartData = useMemo(() => [
    { name:'Accommodation', label:'Stay',   value: catTotals.Stay,   percentage: Math.round(catTotals.Stay/totalBreakdown*100),   color:'#6366f1' },
    { name:'Travel & Cabs', label:'Travel', value: catTotals.Travel, percentage: Math.round(catTotals.Travel/totalBreakdown*100), color:'#3b82f6' },
    { name:'Food & Dining', label:'Food',   value: catTotals.Food,   percentage: Math.round(catTotals.Food/totalBreakdown*100),   color:'#10b981' },
    { name:'Miscellaneous', label:'Other',  value: catTotals.Others, percentage: Math.round(catTotals.Others/totalBreakdown*100), color:'#f59e0b' },
  ].filter(d => d.value > 0), [catTotals, totalBreakdown]);

  const displayChart = chartData.length > 0 ? chartData : [
    { name:'No Data Yet', label:'Add bills', value:1, percentage:100, color: COLORS.borderLight },
  ];

  const upcoming = allMyBills.filter(b => b.reminder_date && !(b.settled||[]).length);
  const handleNudge = (friendName) => Alert.alert('🔔 Nudge Sent!', `Reminder sent to ${friendName} to settle up!`);
  const goToTab = (tabName) => navigation.getParent()?.navigate(tabName);

  const handleSettle = async (uid, amt) => {
    console.log('handleSettle called', uid, amt); // DEBUG
    if (amt < 0) {
      const friendName = getName(uid);
      const amount = Math.abs(amt);
      try {
        const { data } = await getProfile(uid);
        const upiId = data?.upi_id;
        if (upiId) {
          setSettleModal({ name: friendName, upiId, amount, uid });
        } else {
          Alert.alert(
            '✓ Settle Up',
            `${friendName} ne UPI ID set nahi ki hai.\n\nApp mein UPI ID add karo phir QR se pay kar sakte ho!`,
            [
              { text: 'Go to Groups', onPress: () => goToTab('Groups') },
              { text: 'OK', style: 'cancel' }
            ]
          );
        }
      } catch (e) {
        Alert.alert('Settle Up', `You owe ${CUR}${amount.toFixed(2)} to ${friendName}`, [
          { text: 'Go to Groups', onPress: () => goToTab('Groups') },
          { text: 'Cancel', style: 'cancel' }
        ]);
      }
    } else {
      handleNudge(getName(uid));
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Avatar name={profile?.name||'?'} size={40} uri={profile?.avatar_url} />
          <View style={{ marginLeft:10, flex:1 }}>
            <Text style={s.greeting}>Hi, {profile?.name?.split(' ')[0]}! 👋</Text>
            <Text style={s.email} numberOfLines={1}>{profile?.email}</Text>
          </View>
        </View>
        <TouchableOpacity style={s.logoutBtn} onPress={signOut}>
          <Text style={s.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Balance Cards */}
        <View style={s.balanceGrid}>
          <View style={s.balCard}>
            <Text style={s.balLabel}>YOU ARE OWED</Text>
            <Text style={[s.balAmt, { color: COLORS.primary }]}>{CUR}{totalOwed.toLocaleString('en-IN', { minimumFractionDigits:2 })}</Text>
            <Text style={s.balSub}>overall</Text>
            <TouchableOpacity style={s.settleBtn} onPress={() => goToTab('Activity')}>
              <Text style={s.settleBtnText}>SETTLE UP</Text>
            </TouchableOpacity>
          </View>
          <View style={[s.balCard, { borderTopColor: COLORS.border }]}>
            <Text style={s.balLabel}>YOU OWE</Text>
            <Text style={[s.balAmt, { color: COLORS.owe }]}>{CUR}{totalOwe.toLocaleString('en-IN', { minimumFractionDigits:2 })}</Text>
            <Text style={s.balSub}>to friends</Text>
            <TouchableOpacity style={[s.settleBtn, { backgroundColor:'transparent', borderWidth:1.5, borderColor: COLORS.primary }]} onPress={() => goToTab('Activity')}>
              <Text style={[s.settleBtnText, { color: COLORS.primary }]}>PAY BALANCES</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── 🔥 Popular Trips Banner ── */}
        <View style={{ marginHorizontal: SPACING.md, marginTop: SPACING.lg }}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>🔥 Popular Trips</Text>
            <TouchableOpacity onPress={() => navigation.navigate('TripDiscovery')}>
              <Text style={s.sectionLink}>SEE ALL →</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {(popularTrips.length > 0 ? popularTrips : [
              { title:'Goa Beaches',        emoji:'🏖️', cost:'₹6,500',  rating:'4.9', tag:'TRENDING',   color:'#06b6d4', bg:'#0e7490' },
              { title:'Manali Snow Peaks',  emoji:'🏔️', cost:'₹9,800',  rating:'4.9', tag:'BESTSELLER', color:'#8b5cf6', bg:'#6d28d9' },
              { title:'Jim Corbett Safari', emoji:'🐯', cost:'₹12,500', rating:'4.9', tag:'WILDLIFE',    color:'#10b981', bg:'#065f46' },
              { title:'Rajasthan Heritage', emoji:'🏰', cost:'₹7,500',  rating:'4.8', tag:'CULTURE',     color:'#f59e0b', bg:'#92400e' },
              { title:'Kerala Backwaters',  emoji:'🚣', cost:'₹9,000',  rating:'4.8', tag:'PEACEFUL',    color:'#3b82f6', bg:'#1e40af' },
              { title:'Leh Ladakh',         emoji:'🏍️', cost:'₹20,000', rating:'4.9', tag:'ADVENTURE',   color:'#ef4444', bg:'#991b1b' },
            ]).map((trip, i) => (
              <TouchableOpacity
                key={i}
                style={[s.popularTripCard, { backgroundColor: trip.bg }]}
                onPress={() => navigation.navigate('TripDiscovery')}
                activeOpacity={0.85}
              >
                <View style={[s.popularTripTag, { backgroundColor: trip.color }]}>
                  <Text style={s.popularTripTagText}>{trip.tag}</Text>
                </View>
                <Text style={s.popularTripEmoji}>{trip.emoji}</Text>
                <Text style={s.popularTripTitle} numberOfLines={2}>{trip.title}</Text>
                <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginTop:8 }}>
                  <Text style={{ color:'rgba(255,255,255,0.9)', fontSize:11 }}>⭐ {trip.rating}</Text>
                  <Text style={s.popularTripPrice}>{trip.cost}</Text>
                </View>
                <TouchableOpacity style={s.popularTripBtn} onPress={() => navigation.navigate('TripDiscovery')}>
                  <Text style={s.popularTripBtnText}>Explore →</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Friend Balances with Settle */}
        {Object.keys(dashBal).length > 0 && (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Friend Balances</Text>
              <TouchableOpacity onPress={() => goToTab('Friends')}>
                <Text style={s.sectionLink}>VIEW ALL →</Text>
              </TouchableOpacity>
            </View>
            {Object.entries(dashBal).slice(0,4).map(([uid, amt]) => (
              <View key={uid} style={s.friendRow}>
                <Avatar name={getName(uid)} size={38} />
                <View style={{ flex:1, marginLeft:12 }}>
                  <Text style={s.friendName}>{getName(uid)}</Text>
                  <Text style={s.friendMeta}>Recent activity</Text>
                </View>
                <View style={{ alignItems:'flex-end' }}>
                  <Text style={[s.friendAmt, { color: amt>0? COLORS.primary: COLORS.owe }]}>
                    {CUR}{Math.abs(amt).toFixed(2)}
                  </Text>
                  <Text style={[s.friendStatus, { color: amt>0? COLORS.primary: COLORS.owe }]}>
                    {amt>0 ? 'owes you' : 'you owe'}
                  </Text>
                  <View style={{ flexDirection:'row', gap:6, marginTop:6 }}>
                    {/* Remind button removed */}
                    {/* ✅ FIXED: TouchableOpacity → Pressable with cursor:pointer */}
                    <Pressable
                      style={[
                        s.settleSmBtn,
                        {
                          backgroundColor: amt < 0 ? COLORS.primary : 'transparent',
                          borderColor: COLORS.primary,
                        }
                      ]}
                      onPress={() => {
                        console.log('Settle button pressed!', uid, amt);
                        handleSettle(uid, amt);
                      }}
                    >
                      <Text style={[s.settleSmBtnText, { color: amt < 0 ? '#fff' : COLORS.primary }]}>
                        {amt < 0 ? '✓ Settle' : '💸 Request'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Explore Trips */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>🔍 Explore Trips</Text>
            <TouchableOpacity onPress={() => navigation.navigate('TripDiscovery')}>
              <Text style={s.sectionLink}>SEE ALL →</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              { title:'Jim Corbett Safari', emoji:'🐯', cost:'₹12,500', type:'Wildlife',    dist:'245 km' },
              { title:'Rishikesh Rafting',  emoji:'🚣', cost:'₹4,200',  type:'Adventure',   dist:'260 km' },
              { title:'Jaipur Heritage',    emoji:'🏰', cost:'₹8,900',  type:'Heritage',    dist:'270 km' },
              { title:'Goa Beaches',        emoji:'🏖️', cost:'₹7,800',  type:'Beaches',     dist:'1900 km' },
              { title:'Manali Snow Peaks',  emoji:'🏔️', cost:'₹9,800',  type:'Hill Station',dist:'540 km' },
              { title:'Varanasi Spiritual', emoji:'🕌', cost:'₹3,500',  type:'Spiritual',   dist:'320 km' },
              { title:'Coorg Coffee Trail', emoji:'☕', cost:'₹7,200',  type:'Nature',      dist:'2100 km' },
              { title:'Kaziranga Safari',   emoji:'🦏', cost:'₹15,000', type:'Wildlife',    dist:'1900 km' },
            ].map((t,i) => (
              <TouchableOpacity key={i} style={s.exploreCard}
                onPress={() => navigation.navigate('TripDiscovery')} activeOpacity={0.8}>
                <Text style={s.exploreEmoji}>{t.emoji}</Text>
                <Text style={s.exploreTitle} numberOfLines={2}>{t.title}</Text>
                <View style={s.exploreBadge}>
                  <Text style={s.exploreBadgeText}>{t.type}</Text>
                </View>
                <Text style={s.exploreDist}>{t.dist}</Text>
                <Text style={s.exploreCost}>{t.cost}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Monthly Spending */}
        <View style={[s.budgetCard, overBudget && { borderLeftColor: COLORS.owe }]}>
          <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <Text style={s.budgetLabel}>MONTHLY SPENDING</Text>
            {overBudget && (
              <View style={s.warnBadge}><Text style={s.warnText}>⚠️ Budget Alert!</Text></View>
            )}
          </View>
          <Text style={[s.budgetAmt, overBudget && { color: COLORS.owe }]}>
            {CUR}{totalMonthlySpending.toLocaleString('en-IN', { maximumFractionDigits:0 })}
          </Text>
          <View style={s.budgetBarBg}>
            <View style={[s.budgetBarFill, {
              width:`${budgetPct}%`,
              backgroundColor: budgetPct > 90 ? COLORS.owe : budgetPct > 80 ? '#f59e0b' : COLORS.primary
            }]} />
          </View>
          <Text style={[s.budgetSub, overBudget && { color: COLORS.owe }]}>
            {budgetPct}% of {CUR}{monthlyBudget.toLocaleString('en-IN')} budget used
            {overBudget && ' — Consider slowing down!'}
          </Text>
          {utilizationPct > 0 && (
            <Text style={{ color: COLORS.textMuted, fontSize:11, marginTop:4 }}>
              Group trips: {utilizationPct}% of projected {CUR}{projectedBudget.toLocaleString('en-IN')} budget utilized
            </Text>
          )}
        </View>

        {/* Spending Analytics */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Spending Breakdown</Text>
            <View style={s.chartToggle}>
              {['bar','pie'].map(t => (
                <TouchableOpacity key={t} style={[s.chartBtn, chartType===t && s.chartBtnActive]} onPress={() => setChartType(t)}>
                  <Text style={[s.chartBtnText, chartType===t && { color:'#fff' }]}>{t==='bar'?'📊 Bar':'📋 List'}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={s.chartCard}>
            {allMyBills.length === 0 ? (
              <View style={{ alignItems:'center', paddingVertical:20 }}>
                <Text style={{ color: COLORS.textMuted, fontSize:13 }}>Add bills to see your spending breakdown</Text>
              </View>
            ) : chartType === 'bar' ? (
              <BarChart data={displayChart} currencySymbol={CUR} />
            ) : (
              <HorizontalBreakdown data={displayChart} />
            )}
            {allMyBills.length > 0 && (
              <View style={s.legendGrid}>
                {displayChart.map((item, i) => (
                  <View key={i} style={s.legendItem}>
                    <View style={{ flexDirection:'row', alignItems:'center', gap:6, marginBottom:4 }}>
                      <View style={{ width:10, height:10, borderRadius:5, backgroundColor:item.color }} />
                      <Text style={s.legendName} numberOfLines={1}>{item.name}</Text>
                    </View>
                    <Text style={s.legendAmt}>{CUR}{item.value.toLocaleString('en-IN')}</Text>
                    <Text style={s.legendPct}>{item.percentage}% share</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Quick Actions</Text>
          {[
            { icon:'👥', label:'New Group',         onPress: () => goToTab('Groups') },
            { icon:'🧮', label:'Itemized Splitter', onPress: () => navigation.navigate('ItemizedSplitter', { members: [], profile }) },
            { icon:'🧳', label:'Plan a Trip',        onPress: () => navigation.navigate('TravelHub') },
            { icon:'🔍', label:'Explore Trips',      onPress: () => navigation.navigate('TripDiscovery') },
          ].map(a => (
            <TouchableOpacity key={a.label} style={s.quickAction} onPress={a.onPress} activeOpacity={0.7}>
              <Text style={s.quickIcon}>{a.icon}</Text>
              <Text style={s.quickLabel}>{a.label}</Text>
              <Text style={{ color: COLORS.textMuted, fontSize:20 }}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Active Groups */}
        {groups.length > 0 && (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Active Groups</Text>
              <TouchableOpacity onPress={() => goToTab('Groups')}>
                <Text style={s.sectionLink}>SEE ALL →</Text>
              </TouchableOpacity>
            </View>
            {groups.slice(0,3).map(g => {
              const gb    = bills[g.id]||[];
              const total = gb.reduce((s,b) => s+b.amount, 0);
              const settledPct = gb.length ? Math.round(gb.filter(b=>(b.settled||[]).length>0).length/gb.length*100) : 0;
              const members = groupMembers[g.id]||[];
              const perPerson = members.length > 0 && total > 0 ? Math.round(total/members.length) : 0;
              return (
                <TouchableOpacity key={g.id} style={s.groupCard} onPress={() => goToTab('Groups')}>
                  <View style={[s.groupAccent, { backgroundColor: COLORS.primary }]} />
                  <View style={{ flex:1, padding: SPACING.md }}>
                    <View style={{ flexDirection:'row', alignItems:'center', marginBottom:6 }}>
                      <Text style={{ fontSize:22, marginRight:10 }}>{g.icon||'👥'}</Text>
                      <View style={{ flex:1 }}>
                        <Text style={s.groupName}>{g.name}</Text>
                        <Text style={s.groupMeta}>{members.length} members · {gb.length} bills</Text>
                      </View>
                      <View style={s.ongoingBadge}><Text style={s.ongoingText}>● ONGOING</Text></View>
                    </View>
                    {total > 0 && (
                      <View>
                        <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:4 }}>
                          <Text style={{ color: COLORS.textMuted, fontSize:11 }}>
                            Total: {CUR}{total.toLocaleString('en-IN')}
                            {perPerson > 0 ? `  ·  ${CUR}${perPerson.toLocaleString('en-IN')}/person` : ''}
                          </Text>
                          <Text style={{ color: COLORS.primary, fontSize:11, fontWeight:'700' }}>Settled: {settledPct}%</Text>
                        </View>
                        <View style={s.groupProgressBg}>
                          <View style={[s.groupProgressFill, { width:`${settledPct}%` }]} />
                        </View>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Trip Suggestions */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Plan Your Next Trip</Text>
            <TouchableOpacity onPress={() => navigation.navigate('TripDiscovery')}>
              <Text style={s.sectionLink}>SEE ALL →</Text>
            </TouchableOpacity>
          </View>
          {[
            { title:'Weekend in Goa',  cost:'₹8,500',  desc:'Beaches & nightlife.', emoji:'🏖️', type:'Weekend' },
            { title:'Himalayan Trek',  cost:'₹12,200', desc:'Roopkund Trail.',       emoji:'🏔️', type:'Adventure' },
            { title:'Heritage Jaipur', cost:'₹6,000',  desc:'Forts & markets.',     emoji:'🏰', type:'Heritage' },
          ].map((t,i) => (
            <TouchableOpacity key={i} style={s.tripCard} onPress={() => navigation.navigate('TripDiscovery')} activeOpacity={0.8}>
              <Text style={{ fontSize:34, marginRight:12 }}>{t.emoji}</Text>
              <View style={{ flex:1 }}>
                <View style={{ flexDirection:'row', alignItems:'center', gap:8, marginBottom:2 }}>
                  <Text style={s.tripTitle}>{t.title}</Text>
                  <View style={s.tripTypeBadge}><Text style={s.tripTypeText}>{t.type}</Text></View>
                </View>
                <Text style={s.tripDesc}>{t.desc}</Text>
                <Text style={s.tripCost}>{t.cost} per person</Text>
              </View>
              <Text style={{ color: COLORS.primary, fontWeight:'700', fontSize:18 }}>→</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Reminders */}
        {upcoming.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>🔔 Reminders ({upcoming.length})</Text>
            {upcoming.map(b => (
              <View key={b.id} style={s.reminderRow}>
                <View>
                  <Text style={s.reminderTitle}>{b.title}</Text>
                  <Text style={{ color: COLORS.textMuted, fontSize:12 }}>{CUR}{(b.amount/(b.split_among||[1]).length).toFixed(2)}</Text>
                </View>
                <ReminderBadge date={b.reminder_date} />
              </View>
            ))}
          </View>
        )}
        <View style={{ height:100 }} />
      </ScrollView>

      {/* ── UPI QR Settle Modal ── */}
      <Modal visible={!!settleModal} animationType="slide" transparent onRequestClose={() => setSettleModal(null)}>
        <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.6)', justifyContent:'flex-end' }}>
          <View style={{ backgroundColor: COLORS.surface, borderTopLeftRadius:24, borderTopRightRadius:24, padding:24, paddingBottom:40 }}>
            {/* Header */}
            <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <Text style={{ color: COLORS.text, fontWeight:'800', fontSize:18 }}>✓ Settle Up</Text>
              <TouchableOpacity onPress={() => setSettleModal(null)}>
                <Text style={{ fontSize:22, color: COLORS.textMuted }}>✕</Text>
              </TouchableOpacity>
            </View>

            {settleModal && (
              <>
                {/* Amount */}
                <View style={{ alignItems:'center', marginBottom:20 }}>
                  <Text style={{ color: COLORS.textMuted, fontSize:13 }}>Pay to</Text>
                  <Text style={{ color: COLORS.text, fontWeight:'800', fontSize:20, marginTop:4 }}>{settleModal.name}</Text>
                  <Text style={{ color: COLORS.primary, fontWeight:'900', fontSize:32, marginTop:8 }}>
                    {CUR}{settleModal.amount.toFixed(2)}
                  </Text>
                  <Text style={{ color: COLORS.textMuted, fontSize:12, marginTop:4 }}>UPI: {settleModal.upiId}</Text>
                </View>

                {/* QR Code */}
                <View style={{ alignItems:'center', marginBottom:20 }}>
                  <View style={{ backgroundColor:'#fff', padding:12, borderRadius:16, borderWidth:1, borderColor: COLORS.borderLight }}>
                    <Image
                      source={{
                        uri: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=${settleModal.upiId}&pn=${settleModal.name}&am=${settleModal.amount.toFixed(2)}&cu=INR&tn=Splitsathi`)}`
                      }}
                      style={{ width:200, height:200 }}
                      resizeMode="contain"
                    />
                  </View>
                  <Text style={{ color: COLORS.textMuted, fontSize:12, marginTop:12, textAlign:'center' }}>
                    Kisi bhi UPI app se scan karo{'\n'}(GPay, PhonePe, Paytm, etc.)
                  </Text>
                </View>

                {/* UPI Deep Link Button */}
                <TouchableOpacity
                  style={{ backgroundColor: '#10b981', borderRadius:14, padding:16, alignItems:'center', marginBottom:12 }}
                  onPress={() => {
                    const upiUrl = `upi://pay?pa=${settleModal.upiId}&pn=${settleModal.name}&am=${settleModal.amount.toFixed(2)}&cu=INR&tn=Splitsathi`;
                    if (Platform.OS === 'web') {
                      window.open(upiUrl, '_blank');
                    } else {
                      require('react-native').Linking.openURL(upiUrl).catch(() => {
                        Alert.alert('UPI App nahi mili', 'GPay, PhonePe ya Paytm install karo');
                      });
                    }
                  }}
                >
                  <Text style={{ color:'#fff', fontWeight:'800', fontSize:16 }}>💳 Open UPI App</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{ borderWidth:1, borderColor: COLORS.border, borderRadius:14, padding:14, alignItems:'center' }}
                  onPress={() => setSettleModal(null)}
                >
                  <Text style={{ color: COLORS.textSub, fontWeight:'600' }}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex:1, backgroundColor: COLORS.bg },
  header:  { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal: SPACING.md, paddingVertical:12, backgroundColor: COLORS.surface, borderBottomWidth:1, borderBottomColor: COLORS.borderLight },
  headerLeft: { flexDirection:'row', alignItems:'center', flex:1 },
  greeting:   { color: COLORS.text, fontWeight:'700', fontSize:15 },
  email:      { color: COLORS.textMuted, fontSize:11, marginTop:1 },
  logoutBtn:  { borderWidth:1, borderColor: COLORS.border, borderRadius: RADIUS.sm, paddingHorizontal:10, paddingVertical:6 },
  logoutText: { color: COLORS.textSub, fontSize:12, fontWeight:'600' },
  scroll:     { paddingBottom:100 },
  balanceGrid: { flexDirection:'row', gap:12, margin: SPACING.md },
  balCard:     { flex:1, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, borderTopWidth:4, borderTopColor: COLORS.primary, borderWidth:1, borderColor: COLORS.borderLight, ...SHADOW.sm },
  balLabel:    { color: COLORS.textMuted, fontSize:10, fontWeight:'700', letterSpacing:0.8, marginBottom:4 },
  balAmt:      { fontSize:20, fontWeight:'700', marginBottom:2 },
  balSub:      { color: COLORS.textMuted, fontSize:11, marginBottom:12 },
  settleBtn:   { backgroundColor: COLORS.primary, borderRadius: RADIUS.sm, paddingVertical:8, alignItems:'center' },
  settleBtnText:{ color:'#fff', fontWeight:'700', fontSize:11, letterSpacing:0.5 },
  section:       { marginTop: SPACING.lg, marginHorizontal: SPACING.md },
  sectionHeader: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12 },
  sectionTitle:  { color: COLORS.text, fontSize:16, fontWeight:'700' },
  sectionLink:   { color: COLORS.primary, fontSize:11, fontWeight:'700', letterSpacing:0.5 },
  friendRow:   { flexDirection:'row', alignItems:'center', paddingVertical:12, borderBottomWidth:1, borderBottomColor: COLORS.borderLight },
  friendName:  { color: COLORS.text, fontWeight:'600', fontSize:14 },
  friendMeta:  { color: COLORS.textMuted, fontSize:12, marginTop:1 },
  friendAmt:   { fontWeight:'700', fontSize:14 },
  friendStatus:{ fontSize:11, fontWeight:'600', marginTop:1 },
  nudgeText:   { color: COLORS.primary, fontSize:11, fontWeight:'700' },
  remindBtn:   { borderWidth:1, borderColor: COLORS.border, borderRadius:8, paddingHorizontal:8, paddingVertical:4, cursor:'pointer' },
  remindBtnText: { color: COLORS.textSub, fontSize:11, fontWeight:'600' },
  // ✅ FIXED: cursor:pointer aur zIndex add kiya
  settleSmBtn:   { borderWidth:1, borderRadius:8, paddingHorizontal:10, paddingVertical:4, cursor:'pointer', zIndex:10 },
  settleSmBtnText: { fontSize:11, fontWeight:'700' },
  budgetCard:   { marginHorizontal: SPACING.md, marginTop: SPACING.lg, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, borderLeftWidth:4, borderLeftColor: COLORS.primary, borderWidth:1, borderColor: COLORS.borderLight },
  budgetLabel:  { color: COLORS.textMuted, fontSize:11, fontWeight:'700', letterSpacing:0.8 },
  budgetAmt:    { color: COLORS.primary, fontSize:24, fontWeight:'700', marginVertical:6 },
  budgetBarBg:  { height:6, backgroundColor: COLORS.surfaceHigh, borderRadius:3, marginBottom:6 },
  budgetBarFill:{ height:6, borderRadius:3 },
  budgetSub:    { color: COLORS.textMuted, fontSize:12 },
  warnBadge:    { backgroundColor:'#fef2f2', borderRadius: RADIUS.sm, paddingHorizontal:8, paddingVertical:3 },
  warnText:     { color: COLORS.owe, fontSize:11, fontWeight:'700' },
  chartCard:    { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth:1, borderColor: COLORS.borderLight },
  chartToggle:  { flexDirection:'row', backgroundColor: COLORS.surfaceHigh, borderRadius: RADIUS.md, padding:3, gap:3 },
  chartBtn:     { paddingHorizontal:10, paddingVertical:6, borderRadius: RADIUS.sm },
  chartBtnActive:{ backgroundColor: COLORS.primary },
  chartBtnText: { color: COLORS.textMuted, fontSize:12, fontWeight:'600' },
  legendGrid:   { flexDirection:'row', flexWrap:'wrap', gap:0, marginTop: SPACING.md, backgroundColor: COLORS.surfaceHigh, borderRadius: RADIUS.lg, padding: SPACING.sm, borderWidth:1, borderColor: COLORS.borderLight },
  legendItem:   { width:'50%', padding: SPACING.sm },
  legendName:   { color: COLORS.textMuted, fontSize:11, fontWeight:'700', flex:1 },
  legendAmt:    { color: COLORS.text, fontWeight:'800', fontSize:14, marginTop:2 },
  legendPct:    { color: COLORS.textMuted, fontSize:10, fontWeight:'500', marginTop:1 },
  quickAction: { flexDirection:'row', alignItems:'center', gap:14, paddingVertical:14, borderBottomWidth:1, borderBottomColor: COLORS.borderLight },
  quickIcon:   { fontSize:20, width:32, textAlign:'center' },
  quickLabel:  { color: COLORS.text, fontSize:15, fontWeight:'500', flex:1 },
  groupCard:      { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, marginBottom:12, flexDirection:'row', borderWidth:1, borderColor: COLORS.borderLight, overflow:'hidden', ...SHADOW.sm },
  groupAccent:    { width:5 },
  groupName:      { color: COLORS.text, fontWeight:'700', fontSize:15 },
  groupMeta:      { color: COLORS.textMuted, fontSize:12, marginTop:1 },
  ongoingBadge:   { backgroundColor: COLORS.goldLight, borderRadius: RADIUS.sm, paddingHorizontal:6, paddingVertical:3 },
  ongoingText:    { color: COLORS.warning, fontSize:9, fontWeight:'700', letterSpacing:0.5 },
  groupProgressBg:  { height:4, backgroundColor: COLORS.surfaceHigh, borderRadius:2 },
  groupProgressFill:{ height:4, backgroundColor: COLORS.primary, borderRadius:2 },
  tripCard:     { flexDirection:'row', alignItems:'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom:10, borderWidth:1, borderColor: COLORS.borderLight, ...SHADOW.sm },
  tripTitle:    { color: COLORS.text, fontWeight:'700', fontSize:14 },
  tripDesc:     { color: COLORS.textMuted, fontSize:12, marginTop:1 },
  tripCost:     { color: COLORS.primary, fontWeight:'700', fontSize:12, marginTop:4 },
  tripTypeBadge:{ backgroundColor: COLORS.primary+'15', borderRadius: RADIUS.sm, paddingHorizontal:6, paddingVertical:2 },
  tripTypeText: { color: COLORS.primary, fontSize:9, fontWeight:'700' },
  reminderRow:  { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingVertical:12, borderBottomWidth:1, borderBottomColor: COLORS.borderLight },
  reminderTitle:{ color: COLORS.text, fontSize:14, fontWeight:'600' },
  exploreCard:      { width:130, backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding:14, marginRight:12, borderWidth:1, borderColor: COLORS.borderLight, ...SHADOW.sm },
  exploreEmoji:     { fontSize:32, marginBottom:8 },
  exploreTitle:     { color: COLORS.text, fontWeight:'700', fontSize:12, marginBottom:6, lineHeight:16 },
  exploreBadge:     { backgroundColor: COLORS.primary+'15', borderRadius: RADIUS.sm, paddingHorizontal:6, paddingVertical:3, alignSelf:'flex-start', marginBottom:4 },
  exploreBadgeText: { color: COLORS.primary, fontSize:9, fontWeight:'700' },
  exploreDist:      { color: COLORS.textMuted, fontSize:10, marginBottom:2 },
  exploreCost:      { color: COLORS.primary, fontWeight:'800', fontSize:13 },
  premiumBtn:    { backgroundColor: COLORS.goldLight, borderRadius: RADIUS.sm, paddingHorizontal:10, paddingVertical:6 },
  premiumBtnText:{ color:'#78350f', fontSize:12, fontWeight:'700' },

  // Popular Trips Banner
  popularTripCard:    { width:160, borderRadius:16, padding:14, marginRight:12, overflow:'hidden', position:'relative' },
  popularTripTag:     { borderRadius:6, paddingHorizontal:7, paddingVertical:3, alignSelf:'flex-start', marginBottom:10 },
  popularTripTagText: { color:'#fff', fontSize:9, fontWeight:'800', letterSpacing:0.5 },
  popularTripEmoji:   { fontSize:36, marginBottom:8 },
  popularTripTitle:   { color:'#fff', fontWeight:'800', fontSize:14, lineHeight:18, minHeight:36 },
  popularTripPrice:   { color:'#fff', fontWeight:'900', fontSize:13 },
  popularTripBtn:     { backgroundColor:'rgba(255,255,255,0.2)', borderRadius:8, paddingVertical:6, alignItems:'center', marginTop:10, borderWidth:1, borderColor:'rgba(255,255,255,0.3)' },
  popularTripBtnText: { color:'#fff', fontWeight:'700', fontSize:12 },
});

