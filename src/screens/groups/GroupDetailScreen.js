import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl,
  Alert, ActivityIndicator, TextInput, Modal, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore, useBillStore, useGroupStore } from '../../store';
import { COLORS, SPACING, RADIUS, SHADOW, CAT_ICONS } from '../../theme';
import Avatar from '../../components/Avatar';
import BillCard from '../../components/BillCard';
import EmptyState from '../../components/EmptyState';
import SettleUpSheet from '../../components/SettleUpSheet';
import { exportGroupToExcel, shareExcelFile, emailExcelFile } from '../../utils/exportToExcel';

// Category colors matching web reference
const CAT_COLORS = {
  Stay:'#6366f1', Hotel:'#6366f1', Accommodation:'#6366f1',
  Travel:'#3b82f6', Transport:'#3b82f6',
  Food:'#10b981', Restaurant:'#10b981',
  Other:'#f59e0b', Shopping:'#f59e0b', Entertainment:'#f59e0b', Utilities:'#f59e0b',
};

export default function GroupDetailScreen({ route, navigation }) {
  const { group } = route.params;
  const { profile }               = useAuthStore();
  const { bills, loadBills, settle, addBill, getBalances } = useBillStore();
  const { groupMembers }          = useGroupStore();

  const [activeTab,    setActiveTab]    = useState('bills');
  const [balOpen,      setBalOpen]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [settleSheet,  setSettleSheet]  = useState(null);
  const [exporting,    setExporting]    = useState(false);

  // Budget threshold feature (from reference app)
  const [projectedBudget,  setProjectedBudget]  = useState(60000);
  const [isEditingBudget,  setIsEditingBudget]  = useState(false);
  const [newBudgetText,    setNewBudgetText]     = useState('60000');

  // Add expense modal
  const [showAddModal,     setShowAddModal]      = useState(false);
  const [expenseTitle,     setExpenseTitle]      = useState('');
  const [expenseAmount,    setExpenseAmount]     = useState('');
  const [expenseCategory,  setExpenseCategory]   = useState('Food');

  // Receipt scanner
  const [scanState,    setScanState]    = useState('idle'); // idle | scanning | parsed
  const [scannedBill,  setScannedBill]  = useState(null);
  const [showScanner,  setShowScanner]  = useState(false);

  const groupBills = bills[group.id] || [];
  const members    = groupMembers[group.id] || [];
  const myBal      = getBalances(groupBills, profile.id);
  const myNet      = Object.values(myBal).reduce((a, b) => a + b, 0);

  useEffect(() => { loadBills(group.id, profile.id); }, [group.id]);

  const getName = useCallback((uid) => {
    if (uid === profile?.id) return 'You';
    return members.find(m => m.id === uid)?.name || 'User';
  }, [members, profile]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadBills(group.id, profile.id);
    setRefreshing(false);
  }, [group.id]);

  const handleSettleSuccess = async () => {
    setSettleSheet(null);
    await loadBills(group.id, profile.id);
    Alert.alert('✅ Settled!', 'Payment successful');
  };

  // ── Dynamic group stats ────────────────────────────────────────────────────
  const totalGroupCost  = groupBills.reduce((s, b) => s + b.amount, 0);
  const utilizationPct  = projectedBudget > 0 ? Math.round((totalGroupCost / projectedBudget) * 100) : 0;
  const exceedsThreshold = utilizationPct > 80;

  // Category breakdown
  const catTotals = { Stay:0, Travel:0, Food:0, Others:0 };
  groupBills.forEach(b => {
    const amt = b.amount || 0;
    if (['Hotel','Accommodation','Stay'].includes(b.category))  catTotals.Stay   += amt;
    else if (['Travel','Transport'].includes(b.category))        catTotals.Travel += amt;
    else if (['Food','Restaurant'].includes(b.category))         catTotals.Food   += amt;
    else                                                          catTotals.Others += amt;
  });
  const totalBreakdown = Object.values(catTotals).reduce((s,v) => s+v, 0) || 1;
  const chartData = [
    { name:'Stay & Hotels',  value: catTotals.Stay,   percentage: Math.round(catTotals.Stay/totalBreakdown*100),   color:'#6366f1' },
    { name:'Travel & Cabs',  value: catTotals.Travel, percentage: Math.round(catTotals.Travel/totalBreakdown*100), color:'#3b82f6' },
    { name:'Food & Dining',  value: catTotals.Food,   percentage: Math.round(catTotals.Food/totalBreakdown*100),   color:'#10b981' },
    { name:'Miscellaneous',  value: catTotals.Others, percentage: Math.round(catTotals.Others/totalBreakdown*100), color:'#f59e0b' },
  ].filter(d => d.value > 0);

  // Member totals
  const memberTotals = members.map(u => {
    const paid = groupBills.filter(b => b.paid_by === u.id).reduce((s,b) => s+b.amount, 0);
    const owes = groupBills.filter(b => (b.split_among||[]).includes(u.id) && b.paid_by !== u.id)
      .reduce((s,b) => s+b.amount/((b.split_among||[1]).length), 0);
    return { ...u, paid, owes, net: paid - owes };
  });

  // ── Add Expense ────────────────────────────────────────────────────────────
  const handleAddExpense = async () => {
    const amt = parseFloat(expenseAmount);
    if (!expenseTitle.trim() || isNaN(amt) || amt <= 0) {
      Alert.alert('Error', 'Enter a valid title and amount.');
      return;
    }
    const { error } = await addBill({
      group_id:    group.id,
      title:       expenseTitle.trim(),
      amount:      amt,
      paid_by:     profile.id,
      split_among: members.map(m => m.id),
      category:    expenseCategory,
      note:        '',
      date:        new Date().toISOString().split('T')[0],
      settled:     [],
    }, group.id, profile.id);
    if (error) { Alert.alert('Error', error.message); return; }
    setShowAddModal(false);
    setExpenseTitle(''); setExpenseAmount('');
    Alert.alert('✅ Added!', `₹${amt} added and split equally among ${members.length} members!`);
    await loadBills(group.id, profile.id);
  };

  // ── Simulate Receipt Scanner ───────────────────────────────────────────────
  const runScanDemo = () => {
    setScanState('scanning');
    setTimeout(() => {
      setScannedBill({
        merchant: 'Cafe Himalayan Oasis',
        date: new Date().toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' }),
        total: 2450,
        items: [
          { name:'Thukpa Soup Large x2', price:480 },
          { name:'Steamed Chicken Momos x3', price:540 },
          { name:'Apple Cider Juice', price:380 },
          { name:'Woodfired Farm Pizza', price:650 },
          { name:'Service Tax', price:400 },
        ]
      });
      setScanState('parsed');
    }, 2000);
  };

  const applyScannedBill = async () => {
    if (!scannedBill) return;
    const { error } = await addBill({
      group_id:    group.id,
      title:       scannedBill.merchant,
      amount:      scannedBill.total,
      paid_by:     profile.id,
      split_among: members.map(m => m.id),
      category:    'Food',
      note:        'Scanned receipt',
      date:        new Date().toISOString().split('T')[0],
      settled:     [],
    }, group.id, profile.id);
    if (error) { Alert.alert('Error', error.message); return; }
    setScanState('idle'); setScannedBill(null); setShowScanner(false);
    Alert.alert('✅ Receipt Added!', `₹${scannedBill.total} from ${scannedBill.merchant} added and split!`);
    await loadBills(group.id, profile.id);
  };

  // ── Export ─────────────────────────────────────────────────────────────────
  const handleExport = () => {
    Alert.alert('📊 Export Report', `Export "${group.name}" expenses?`, [
      { text:'📤 Share File', onPress: async () => {
        setExporting(true);
        try {
          const { filePath } = await exportGroupToExcel({ group, bills: groupBills, members, profile });
          await shareExcelFile(filePath);
        } catch (e) { Alert.alert('Error', e.message||'Could not export'); }
        setExporting(false);
      }},
      { text:'📧 Send to My Email', onPress: async () => {
        setExporting(true);
        try {
          const { filePath, fileName } = await exportGroupToExcel({ group, bills: groupBills, members, profile });
          await emailExcelFile({ filePath, fileName, groupName: group.name, userEmail: profile.email });
        } catch (e) { Alert.alert('Error', e.message||'Could not send'); }
        setExporting(false);
      }},
      { text:'Cancel', style:'cancel' },
    ]);
  };

  const handleNudge = (name) => Alert.alert('🔔 Nudge Sent!', `Reminder sent to ${name} for outstanding dues!`);

  return (
    <View style={s.root}>
      {/* Hero Header */}
      <SafeAreaView edges={['top']} style={[s.headerSafe, { backgroundColor: COLORS.primary }]}>
        <View style={s.headerNav}>
          <TouchableOpacity style={s.circleBtn} onPress={() => navigation.goBack()}>
            <Text style={s.circleBtnText}>‹</Text>
          </TouchableOpacity>
          <View style={{ flexDirection:'row', gap:10 }}>
            <TouchableOpacity style={[s.circleBtn, exporting && { opacity:0.5 }]} onPress={handleExport} disabled={exporting}>
              {exporting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.circleBtnText}>📊</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={s.circleBtn} onPress={() => setShowScanner(true)}>
              <Text style={s.circleBtnText}>📷</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.circleBtn} onPress={onRefresh}>
              <Text style={s.circleBtnText}>↻</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={s.groupName}>{group.icon} {group.name}</Text>

        {/* Balance summary */}
        <TouchableOpacity style={s.balSummary} onPress={() => setBalOpen(p=>!p)}>
          <View style={{ flex:1 }}>
            {myNet === 0
              ? <Text style={s.balSummaryText}>✓ <Text style={{ color:'#86efac' }}>You are settled up</Text></Text>
              : myNet < 0
                ? <Text style={s.balSummaryText}>You owe <Text style={{ color:'#fb923c', fontWeight:'800' }}>₹{Math.abs(myNet).toFixed(2)}</Text></Text>
                : <Text style={s.balSummaryText}>You get back <Text style={{ color:'#4ade80', fontWeight:'800' }}>₹{myNet.toFixed(2)}</Text></Text>
            }
            {balOpen && Object.entries(myBal).map(([uid, amt]) => (
              <Text key={uid} style={s.balSubText}>
                {amt < 0 ? <>You owe <Text style={{ color:'#fb923c' }}>₹{Math.abs(amt).toFixed(2)}</Text></> : <><Text style={{ color:'#4ade80' }}>₹{amt.toFixed(2)}</Text> owed to you</>}
              </Text>
            ))}
          </View>
          <Text style={s.chevron}>{balOpen ? '∧' : '∨'}</Text>
        </TouchableOpacity>

        {/* Tab Bar */}
        <View style={s.tabBar}>
          {['bills','balances','totals','stats'].map(t => (
            <TouchableOpacity key={t} style={[s.tab, activeTab===t && s.tabActive]} onPress={() => setActiveTab(t)}>
              <Text style={[s.tabText, activeTab===t && s.tabTextActive]}>{t.charAt(0).toUpperCase()+t.slice(1)}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={s.addBillBtn} onPress={() => navigation.navigate('AddBill', { group, members })}>
            <Text style={s.addBillText}>+ Add Bill</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView style={{ flex:1 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}>

        {/* ── BILLS TAB ── */}
        {activeTab === 'bills' && (
          groupBills.length === 0
            ? <EmptyState emoji="🧾" text="No bills yet.&#10;Add your first bill!" actionLabel="+ Add Bill" onAction={() => navigation.navigate('AddBill', { group, members })} />
            : groupBills.map(bill => (
                <BillCard key={bill.id} bill={bill} currentUserId={profile.id} getName={getName}
                  onPress={() => navigation.navigate('BillDetail', { bill, group, members })} />
              ))
        )}

        {/* ── BALANCES TAB ── */}
        {activeTab === 'balances' && (
          <View style={{ paddingBottom:40 }}>
            {members.map(member => {
              const mBal = getBalances(groupBills, member.id);
              const mNet = Object.values(mBal).reduce((s,v) => s+v, 0);
              if (!Object.keys(mBal).length) return null;
              return (
                <View key={member.id} style={s.balMemberBlock}>
                  <View style={s.balMemberRow}>
                    <Avatar name={member.name} size={44} uri={member.avatar_url} />
                    <View style={{ flex:1, marginLeft:12 }}>
                      <Text style={s.balMemberName}>{member.name}{member.id===profile.id?' (You)':''}</Text>
                      <Text style={[s.balMemberNet, { color: mNet>=0? '#4ade80':'#fb923c' }]}>
                        {mNet===0 ? 'settled up' : mNet>0 ? `owes ₹${mNet.toFixed(2)} total` : `gets back ₹${Math.abs(mNet).toFixed(2)}`}
                      </Text>
                    </View>
                  </View>
                  {Object.entries(mBal).map(([oid, amt]) => (
                    <View key={oid} style={s.balSubRow}>
                      <Text style={s.balSubLabel}>
                        {amt>0 ? `${getName(oid)} owes ₹${amt.toFixed(2)} to ${member.name.split(' ')[0]}`
                               : `${member.name.split(' ')[0]} owes ₹${Math.abs(amt).toFixed(2)} to ${getName(oid)}`}
                      </Text>
                      <View style={s.balActions}>
                        <TouchableOpacity style={s.actionBtn} onPress={() => handleNudge(member.name.split(' ')[0])}>
                          <Text style={s.actionBtnText}>🔔 Nudge</Text>
                        </TouchableOpacity>
                        {(member.id===profile.id||oid===profile.id) && (
                          <TouchableOpacity style={s.actionBtn} onPress={() => {
                            const fromId = amt>0? oid: member.id;
                            const toId   = amt>0? member.id: oid;
                            if (fromId!==profile.id) { Alert.alert('Info','Only the person who owes can settle up'); return; }
                            setSettleSheet({ amount: Math.abs(amt), fromUser: profile, toUser: members.find(m=>m.id===toId), billId:null, groupId:group.id });
                          }}>
                            <Text style={s.actionBtnText}>Settle up</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        )}

        {/* ── TOTALS TAB ── */}
        {activeTab === 'totals' && (
          <View style={{ padding: SPACING.md, paddingBottom:40 }}>
            {/* Squad Partition Matrix (from reference app) */}
            <Text style={s.sectionTitle}>Squad Partition Dues</Text>
            <Text style={{ color: COLORS.textMuted, fontSize:12, marginBottom:14 }}>
              Equal split share: ₹{members.length > 0 ? Math.round(totalGroupCost/(members.length)).toLocaleString('en-IN') : 0} each
            </Text>
            {memberTotals.map((m, i) => {
              const isOwedByMe = m.net < 0; // they owe me
              const isProcessing = false;
              return (
                <View key={m.id} style={s.memberSplitRow}>
                  <View style={{ flexDirection:'row', alignItems:'center' }}>
                    <Avatar name={m.name} size={38} uri={m.avatar_url} />
                    <View style={{ marginLeft:12 }}>
                      <Text style={s.totalName}>{m.name}{m.id===profile.id?' (You)':''}</Text>
                      <Text style={{ color: COLORS.textMuted, fontSize:11, marginTop:1 }}>
                        {m.net === 0 ? 'Completely settled' : m.net > 0 ? 'Gets back money' : 'Pending settlement'}
                      </Text>
                    </View>
                  </View>
                  <View style={{ alignItems:'flex-end' }}>
                    <Text style={[s.totalNet, { color: m.net===0? COLORS.textMuted: m.net>0? '#4ade80':'#fb923c' }]}>
                      {m.net===0 ? 'Settled' : m.net>0 ? `Gets ₹${m.net.toFixed(0)}` : `Owes ₹${Math.abs(m.net).toFixed(0)}`}
                    </Text>
                    {m.net < 0 && m.id !== profile.id && (
                      <TouchableOpacity style={s.nudgeSm} onPress={() => handleNudge(m.name.split(' ')[0])}>
                        <Text style={s.nudgeSmText}>🔔 Nudge SMS</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}

            {/* Group Total Card */}
            <View style={s.groupTotalCard}>
              <Text style={s.groupTotalLabel}>GROUP TOTAL</Text>
              <Text style={s.groupTotalAmt}>₹{totalGroupCost.toLocaleString('en-IN')}</Text>
              <Text style={s.groupTotalSub}>{groupBills.length} bills · {members.length} members</Text>
            </View>

            {/* Export Button */}
            <TouchableOpacity style={s.exportBtn} onPress={handleExport} disabled={exporting}>
              {exporting ? <ActivityIndicator color="#fff" /> : <>
                <Text style={s.exportBtnIcon}>📊</Text>
                <View>
                  <Text style={s.exportBtnText}>Export to Excel</Text>
                  <Text style={s.exportBtnSub}>Share or send to email</Text>
                </View>
              </>}
            </TouchableOpacity>
          </View>
        )}

        {/* ── STATS TAB (Budget Threshold + Category Breakdown) ── */}
        {activeTab === 'stats' && (
          <View style={{ padding: SPACING.md, paddingBottom:40 }}>

            {/* Budget Threshold Guard (from reference app) */}
            <View style={s.statsCard}>
              <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <View>
                  <Text style={s.sectionTitle}>{group.name}</Text>
                  <Text style={{ color: COLORS.textMuted, fontSize:12 }}>Budget Threshold Guard</Text>
                </View>
                <TouchableOpacity onPress={() => {
                  if (isEditingBudget) {
                    const parsed = parseFloat(newBudgetText);
                    if (!isNaN(parsed) && parsed > 0) setProjectedBudget(parsed);
                    setIsEditingBudget(false);
                  } else {
                    setNewBudgetText(projectedBudget.toString());
                    setIsEditingBudget(true);
                  }
                }}>
                  <Text style={{ color: COLORS.primary, fontWeight:'700', fontSize:13 }}>
                    {isEditingBudget ? 'Save' : 'Edit Limit'}
                  </Text>
                </TouchableOpacity>
              </View>

              {isEditingBudget ? (
                <View style={s.budgetEditRow}>
                  <Text style={{ color: COLORS.primary, fontWeight:'700', fontSize:16, marginRight:4 }}>₹</Text>
                  <TextInput
                    style={s.budgetInput}
                    value={newBudgetText}
                    onChangeText={setNewBudgetText}
                    keyboardType="numeric"
                    placeholderTextColor={COLORS.textMuted}
                  />
                </View>
              ) : (
                <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:12 }}>
                  <View>
                    <Text style={{ color: COLORS.textMuted, fontSize:10, fontWeight:'700', letterSpacing:0.8 }}>DUES ACCRUED</Text>
                    <Text style={{ color: COLORS.text, fontSize:20, fontWeight:'800', marginTop:4 }}>₹{totalGroupCost.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={{ alignItems:'flex-end' }}>
                    <Text style={{ color: COLORS.textMuted, fontSize:10, fontWeight:'700', letterSpacing:0.8 }}>THRESHOLD GUARD</Text>
                    <Text style={{ color: COLORS.text, fontSize:20, fontWeight:'800', marginTop:4 }}>₹{projectedBudget.toLocaleString('en-IN')}</Text>
                  </View>
                </View>
              )}

              {/* Threshold alert badge */}
              <View style={[s.thresholdBadge, { backgroundColor: exceedsThreshold? '#fef2f2':'#f0fdf4', borderColor: exceedsThreshold? '#fecaca':'#bbf7d0' }]}>
                <Text style={{ fontSize:16, marginRight:8 }}>{exceedsThreshold ? '⚠️' : '✅'}</Text>
                <Text style={{ color: exceedsThreshold? COLORS.owe:'#15803d', fontSize:12, fontWeight:'600', flex:1 }}>
                  {exceedsThreshold
                    ? `Warning! Expenses reached ${utilizationPct}% of your limit.`
                    : `Safe! Budget utilizes ${utilizationPct}% of threshold.`}
                </Text>
              </View>

              {/* Progress bar */}
              <View style={[s.budgetBarBg, { marginTop:12 }]}>
                <View style={[s.budgetBarFill, {
                  width:`${Math.min(100,utilizationPct)}%`,
                  backgroundColor: utilizationPct>90? COLORS.owe: utilizationPct>80? '#f59e0b': COLORS.primary
                }]} />
              </View>
            </View>

            {/* Category Breakdown (matching reference app) */}
            <View style={s.statsCard}>
              <Text style={s.sectionTitle}>Category Outlay</Text>
              <Text style={{ color: COLORS.textMuted, fontSize:12, marginBottom:14 }}>Live visual split proportion</Text>
              {chartData.length === 0 ? (
                <Text style={{ color: COLORS.textMuted, fontSize:13, textAlign:'center', paddingVertical:20 }}>Add bills to see category breakdown</Text>
              ) : (
                chartData.map((item, i) => (
                  <View key={i} style={{ marginBottom:12 }}>
                    <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:4 }}>
                      <Text style={{ color: COLORS.textSub, fontSize:12, fontWeight:'700' }}>{item.name}</Text>
                      <Text style={{ color: COLORS.text, fontSize:12, fontWeight:'800' }}>₹{item.value.toLocaleString('en-IN')} ({item.percentage}%)</Text>
                    </View>
                    <View style={s.budgetBarBg}>
                      <View style={[s.budgetBarFill, { width:`${item.percentage}%`, backgroundColor: item.color }]} />
                    </View>
                  </View>
                ))
              )}

              {/* Legend grid */}
              {chartData.length > 0 && (
                <View style={s.legendGrid}>
                  {chartData.map((d, i) => (
                    <View key={i} style={s.legendItem}>
                      <View style={{ flexDirection:'row', alignItems:'center', gap:6, marginBottom:4 }}>
                        <View style={{ width:10, height:10, borderRadius:5, backgroundColor:d.color }} />
                        <Text style={{ color: COLORS.textMuted, fontSize:11, fontWeight:'700', flex:1 }} numberOfLines={1}>{d.name}</Text>
                      </View>
                      <Text style={{ color: COLORS.text, fontWeight:'800', fontSize:14 }}>₹{d.value.toLocaleString('en-IN')}</Text>
                      <Text style={{ color: COLORS.textMuted, fontSize:10, marginTop:1 }}>{d.percentage}% share</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Quick Action Buttons */}
            <View style={{ flexDirection:'row', gap:12, marginTop:4 }}>
              <TouchableOpacity style={[s.fabBtn, { flex:1 }]} onPress={() => setShowAddModal(true)}>
                <Text style={{ color:'#fff', fontWeight:'800', fontSize:13 }}>➕ Add Bill</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.fabBtn, { flex:1, backgroundColor:'transparent', borderWidth:1.5, borderColor: COLORS.primary }]}
                onPress={() => setShowScanner(true)}>
                <Text style={{ color: COLORS.primary, fontWeight:'800', fontSize:13 }}>📷 Scan Invoice</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ height:80 }} />
      </ScrollView>

      {/* ── Add Expense Modal ── */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={s.modalBackdrop}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Add Expense to {group.name}</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Text style={{ fontSize:20, color: COLORS.textMuted }}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={s.modalLabel}>Bill Title / Merchant</Text>
            <TextInput style={s.modalInput} placeholder="e.g., Hotel Stay, Taxi ride..." placeholderTextColor={COLORS.textMuted}
              value={expenseTitle} onChangeText={setExpenseTitle} />

            <Text style={s.modalLabel}>Amount in ₹</Text>
            <TextInput style={s.modalInput} placeholder="0.00" placeholderTextColor={COLORS.textMuted}
              value={expenseAmount} onChangeText={setExpenseAmount} keyboardType="numeric" />

            <Text style={s.modalLabel}>Category</Text>
            <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:20 }}>
              {[['Stay','🏨'],['Travel','🚕'],['Food','🍔'],['Other','📦']].map(([cat,icon]) => (
                <TouchableOpacity key={cat}
                  style={[s.catChip, expenseCategory===cat && { backgroundColor: COLORS.primary, borderColor: COLORS.primary }]}
                  onPress={() => setExpenseCategory(cat)}>
                  <Text style={[{ fontSize:11, color: COLORS.textSub, fontWeight:'700' }, expenseCategory===cat && { color:'#fff' }]}>
                    {icon} {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={[s.fabBtn, { marginTop:4 }]} onPress={handleAddExpense}>
              <Text style={{ color:'#fff', fontWeight:'800', fontSize:14 }}>Record & Split Bill</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Receipt Scanner Modal ── */}
      <Modal visible={showScanner} animationType="slide" transparent>
        <View style={s.modalBackdrop}>
          <View style={[s.modalContent, { maxHeight:'80%' }]}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Smart Receipt Scanner</Text>
              <TouchableOpacity onPress={() => { setShowScanner(false); setScanState('idle'); setScannedBill(null); }}>
                <Text style={{ fontSize:20, color: COLORS.textMuted }}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ color: COLORS.textMuted, fontSize:12, marginBottom:16 }}>
              AI/OCR scan to auto extract & split bill lines
            </Text>

            {scanState === 'idle' && (
              <View style={s.scanIdleBox}>
                <Text style={{ fontSize:48, marginBottom:12 }}>📷</Text>
                <Text style={{ color: COLORS.text, fontWeight:'700', fontSize:15, textAlign:'center', marginBottom:6 }}>
                  Capture receipt using camera
                </Text>
                <Text style={{ color: COLORS.textMuted, fontSize:12, textAlign:'center', marginBottom:20, lineHeight:18 }}>
                  Our AI/OCR engine will instantly parse individual splits.
                </Text>
                <TouchableOpacity style={[s.fabBtn, { paddingHorizontal:24 }]} onPress={runScanDemo}>
                  <Text style={{ color:'#fff', fontWeight:'800', fontSize:13 }}>📸 Simulate Camera Capture</Text>
                </TouchableOpacity>
              </View>
            )}

            {scanState === 'scanning' && (
              <View style={[s.scanIdleBox, { minHeight:160 }]}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={{ color: COLORS.text, fontWeight:'700', fontSize:14, marginTop:16 }}>OCR/AI Model Parsing Bill...</Text>
                <Text style={{ color: COLORS.textMuted, fontSize:11, marginTop:4 }}>Extracting items, GST, total amount and dates.</Text>
              </View>
            )}

            {scanState === 'parsed' && scannedBill && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={{ backgroundColor: COLORS.surfaceHigh, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth:1, borderColor: COLORS.borderLight }}>
                  <View style={{ flexDirection:'row', alignItems:'center', borderBottomWidth:1, borderBottomColor: COLORS.borderLight, paddingBottom:12, marginBottom:12 }}>
                    <Text style={{ fontSize:24, marginRight:12 }}>🧾</Text>
                    <View>
                      <Text style={{ color: COLORS.text, fontWeight:'800', fontSize:15 }}>{scannedBill.merchant}</Text>
                      <Text style={{ color: COLORS.textMuted, fontSize:11, marginTop:2 }}>{scannedBill.date}</Text>
                    </View>
                  </View>
                  <Text style={{ color: COLORS.textMuted, fontSize:11, fontWeight:'700', letterSpacing:0.8, marginBottom:8 }}>SCANNED ITEMS</Text>
                  {scannedBill.items.map((line, idx) => (
                    <View key={idx} style={{ flexDirection:'row', justifyContent:'space-between', paddingVertical:6 }}>
                      <Text style={{ color: COLORS.textSub, fontSize:12 }}>{line.name}</Text>
                      <Text style={{ color: COLORS.text, fontWeight:'700', fontSize:12 }}>₹{line.price}</Text>
                    </View>
                  ))}
                  <View style={{ height:1, backgroundColor: COLORS.borderLight, marginVertical:10 }} />
                  <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                    <Text style={{ color: COLORS.text, fontWeight:'800', fontSize:13 }}>Total Invoice Amount</Text>
                    <Text style={{ color: '#10b981', fontWeight:'900', fontSize:20 }}>₹{scannedBill.total}</Text>
                  </View>
                  <View style={{ flexDirection:'row', gap:10 }}>
                    <TouchableOpacity style={[s.fabBtn, { flex:2, backgroundColor:'#10b981' }]} onPress={applyScannedBill}>
                      <Text style={{ color:'#fff', fontWeight:'800', fontSize:13 }}>✓ Accept & Split Equally</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.fabBtn, { flex:1, backgroundColor: COLORS.surfaceDim }]} onPress={() => setScanState('idle')}>
                      <Text style={{ color: COLORS.text, fontWeight:'700', fontSize:13 }}>Retake</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {settleSheet && (
        <SettleUpSheet
          visible
          amount={settleSheet.amount}
          fromUser={settleSheet.fromUser}
          toUser={settleSheet.toUser}
          billId={settleSheet.billId}
          groupId={settleSheet.groupId}
          onSuccess={handleSettleSuccess}
          onClose={() => setSettleSheet(null)}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:           { flex:1, backgroundColor: COLORS.bg },
  headerSafe:     { paddingBottom:0 },
  headerNav:      { flexDirection:'row', justifyContent:'space-between', padding: SPACING.md },
  circleBtn:      { width:36, height:36, borderRadius:18, backgroundColor:'rgba(255,255,255,0.12)', alignItems:'center', justifyContent:'center' },
  circleBtnText:  { color:'#fff', fontSize:18, fontWeight:'700' },
  groupName:      { color:'rgba(255,255,255,0.85)', fontSize:26, fontWeight:'800', paddingHorizontal: SPACING.md, marginBottom: SPACING.sm, letterSpacing:-0.5 },
  balSummary:     { margin: SPACING.md, marginTop:0, backgroundColor:'rgba(0,0,0,0.25)', borderRadius: RADIUS.lg, padding: SPACING.md, flexDirection:'row', alignItems:'flex-start' },
  balSummaryText: { color:'#f1f5f9', fontSize:15, marginBottom:4 },
  balSubText:     { color:'rgba(255,255,255,0.55)', fontSize:13, marginTop:2 },
  chevron:        { color:'rgba(255,255,255,0.4)', fontSize:18, marginLeft:8 },
  tabBar:         { flexDirection:'row', paddingHorizontal: SPACING.md, borderBottomWidth:1, borderBottomColor:'rgba(255,255,255,0.08)', alignItems:'center' },
  tab:            { paddingVertical: SPACING.sm, paddingHorizontal:12, borderBottomWidth:2, borderBottomColor:'transparent' },
  tabActive:      { borderBottomColor:'#fff' },
  tabText:        { color:'rgba(255,255,255,0.45)', fontSize:13, fontWeight:'600' },
  tabTextActive:  { color:'#fff', fontWeight:'700' },
  addBillBtn:     { marginLeft:'auto', backgroundColor:'#f97316', borderRadius: RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical:6 },
  addBillText:    { color:'#fff', fontWeight:'700', fontSize:12 },

  balMemberBlock: { borderBottomWidth:1, borderBottomColor: COLORS.surface },
  balMemberRow:   { flexDirection:'row', alignItems:'center', padding: SPACING.md },
  balMemberName:  { color: COLORS.text, fontWeight:'700', fontSize:15 },
  balMemberNet:   { fontSize:13, marginTop:2 },
  balSubRow:      { paddingLeft:72, paddingRight: SPACING.md, paddingBottom: SPACING.md },
  balSubLabel:    { color: COLORS.textSub, fontSize:13, marginBottom:8 },
  balActions:     { flexDirection:'row', gap:8 },
  actionBtn:      { flex:1, borderWidth:1, borderColor: COLORS.border, borderRadius: RADIUS.sm, paddingVertical:8, alignItems:'center' },
  actionBtnText:  { color: COLORS.textSub, fontWeight:'600', fontSize:12 },

  // Totals / Stats
  sectionTitle:    { color: COLORS.text, fontWeight:'700', fontSize:16, marginBottom:6 },
  memberSplitRow:  { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingVertical:12, borderBottomWidth:1, borderBottomColor: COLORS.borderLight },
  totalName:       { color: COLORS.text, fontWeight:'700', fontSize:14 },
  totalNet:        { fontWeight:'700', fontSize:13 },
  nudgeSm:         { backgroundColor:'rgba(79,70,229,0.1)', paddingHorizontal:10, paddingVertical:4, borderRadius:12, marginTop:4 },
  nudgeSmText:     { color:'#818cf8', fontSize:10, fontWeight:'800' },
  groupTotalCard:  { backgroundColor:'rgba(99,102,241,0.1)', borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth:1, borderColor:'rgba(99,102,241,0.3)', marginTop: SPACING.md, marginBottom:12 },
  groupTotalLabel: { color: COLORS.info, fontSize:12, fontWeight:'700', textTransform:'uppercase', marginBottom:4 },
  groupTotalAmt:   { color: COLORS.text, fontSize:26, fontWeight:'800' },
  groupTotalSub:   { color: COLORS.textMuted, fontSize:13, marginTop:4 },
  exportBtn:       { flexDirection:'row', alignItems:'center', gap:14, backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, padding:16 },
  exportBtnIcon:   { fontSize:28 },
  exportBtnText:   { color:'#fff', fontWeight:'800', fontSize:16 },
  exportBtnSub:    { color:'rgba(255,255,255,0.7)', fontSize:12, marginTop:2 },

  statsCard:       { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.md, borderWidth:1, borderColor: COLORS.borderLight, marginBottom: SPACING.md, ...SHADOW.sm },
  budgetEditRow:   { flexDirection:'row', alignItems:'center', backgroundColor: COLORS.surfaceHigh, borderRadius: RADIUS.md, paddingHorizontal:12, borderWidth:1, borderColor: COLORS.primary, marginBottom:12 },
  budgetInput:     { flex:1, height:44, color: COLORS.text, fontSize:16, fontWeight:'700' },
  budgetBarBg:     { height:6, backgroundColor: COLORS.surfaceHigh, borderRadius:3 },
  budgetBarFill:   { height:6, borderRadius:3 },
  thresholdBadge:  { flexDirection:'row', alignItems:'center', padding:10, borderRadius: RADIUS.md, borderWidth:1 },
  legendGrid:      { flexDirection:'row', flexWrap:'wrap', gap:0, marginTop: SPACING.md, backgroundColor: COLORS.surfaceHigh, borderRadius: RADIUS.lg, padding: SPACING.sm, borderWidth:1, borderColor: COLORS.borderLight },
  legendItem:      { width:'50%', padding: SPACING.sm },
  fabBtn:          { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, height:46, alignItems:'center', justifyContent:'center', flexDirection:'row', gap:8 },

  // Modal
  modalBackdrop:  { flex:1, backgroundColor:'rgba(0,0,0,0.6)', justifyContent:'flex-end' },
  modalContent:   { backgroundColor: COLORS.surface, borderTopLeftRadius:20, borderTopRightRadius:20, padding: SPACING.lg, paddingBottom:36 },
  modalHeader:    { flexDirection:'row', justifyContent:'space-between', alignItems:'center', borderBottomWidth:1, borderBottomColor: COLORS.borderLight, paddingBottom:12, marginBottom:16 },
  modalTitle:     { color: COLORS.text, fontWeight:'800', fontSize:16 },
  modalLabel:     { color: COLORS.textMuted, fontSize:11, fontWeight:'700', letterSpacing:0.8, marginBottom:6 },
  modalInput:     { backgroundColor: COLORS.surfaceHigh, borderRadius: RADIUS.md, height:44, color: COLORS.text, paddingHorizontal:12, fontSize:14, marginBottom:16, borderWidth:1, borderColor: COLORS.borderLight },
  catChip:        { backgroundColor: COLORS.surfaceHigh, paddingHorizontal:10, paddingVertical:8, borderRadius:12, borderWidth:1, borderColor: COLORS.borderLight },

  // Scanner
  scanIdleBox:    { backgroundColor: COLORS.surfaceHigh, borderRadius: RADIUS.xl, padding:24, alignItems:'center', borderWidth:1, borderColor: COLORS.borderLight, borderStyle:'dashed', minHeight:220 },
});
