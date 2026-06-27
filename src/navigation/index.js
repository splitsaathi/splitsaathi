import React, { useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator }  from '@react-navigation/native-stack';
import { createBottomTabNavigator }    from '@react-navigation/bottom-tabs';
import { Text, View, ActivityIndicator } from 'react-native';
import { COLORS } from '../theme';
import { useAuthStore } from '../store';
import { onAuthStateChange } from '../services/auth';
import { getProfile }        from '../services/database';
import { registerForPushNotifications } from '../services/notifications';

// ── Auth Screens ──────────────────────────────────────────────────────────────
import LoginScreen        from '../screens/auth/LoginScreen';
import SignUpScreen       from '../screens/auth/SignUpScreen';
import OTPScreen          from '../screens/auth/OTPScreen';
import ForgotPassScreen   from '../screens/auth/ForgotPassScreen';

// ── Main Screens ──────────────────────────────────────────────────────────────
import DashboardScreen         from '../screens/dashboard/DashboardScreen';
import ActivityScreen          from '../screens/activity/ActivityScreen';

import GroupsListScreen        from '../screens/groups/GroupsListScreen';
import GroupDetailScreen       from '../screens/groups/GroupDetailScreen';
import CreateGroupScreen       from '../screens/groups/CreateGroupScreen';
import AddBillScreen           from '../screens/groups/AddBillScreen';
import BillDetailScreen        from '../screens/groups/BillDetailScreen';
import ItemizedSplitterScreen  from '../screens/groups/ItemizedSplitterScreen';

import FriendsScreen      from '../screens/friends/FriendsScreen';
import AddFriendScreen    from '../screens/friends/AddFriendScreen';

import AccountScreen      from '../screens/account/AccountScreen';
import EditProfileScreen  from '../screens/account/EditProfileScreen';

import TravelHubScreen        from '../screens/travel/TravelHubScreen';
import RideCompareScreen      from '../screens/travel/RideCompareScreen';
import TrainBusScreen         from '../screens/travel/TrainBusScreen';
import TripSuggestionsScreen  from '../screens/travel/TripSuggestionsScreen';
import TripDiscoveryScreen    from '../screens/travel/TripDiscoveryScreen';
import TripNavigationScreen   from '../screens/travel/TripNavigationScreen';
import TravelJournalScreen    from '../screens/travel/TravelJournalScreen';

import ReferAndEarnScreen from '../screens/social/ReferAndEarnScreen';
import PremiumScreen      from '../screens/premium/PremiumScreen';

// ── Nav Theme ─────────────────────────────────────────────────────────────────
const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background:   COLORS.bg,
    card:         COLORS.surface,
    text:         COLORS.text,
    border:       COLORS.borderLight,
    primary:      COLORS.primary,
  },
};

const TabIcon = ({ emoji, focused }) => (
  <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.4 }}>{emoji}</Text>
);

// ── Stacks ────────────────────────────────────────────────────────────────────
const Auth   = createNativeStackNavigator();
const Tab    = createBottomTabNavigator();
const DashSt = createNativeStackNavigator();
const GrpSt  = createNativeStackNavigator();
const FrdSt  = createNativeStackNavigator();
const AccSt  = createNativeStackNavigator();
const Main   = createNativeStackNavigator();

function AuthStack() {
  return (
    <Auth.Navigator screenOptions={{ headerShown: false }}>
      <Auth.Screen name="Login"      component={LoginScreen}      />
      <Auth.Screen name="SignUp"     component={SignUpScreen}     />
      <Auth.Screen name="OTP"        component={OTPScreen}        />
      <Auth.Screen name="ForgotPass" component={ForgotPassScreen} />
    </Auth.Navigator>
  );
}

// Dashboard stack — all stack screens accessible from Dashboard
function DashboardStack() {
  return (
    <DashSt.Navigator screenOptions={{ headerShown: false }}>
      <DashSt.Screen name="DashboardHome"    component={DashboardScreen}       />
      <DashSt.Screen name="TravelHub"        component={TravelHubScreen}       />
      <DashSt.Screen name="RideCompare"      component={RideCompareScreen}     />
      <DashSt.Screen name="TrainBus"         component={TrainBusScreen}        />
      <DashSt.Screen name="TripSuggestions"  component={TripSuggestionsScreen} />
      <DashSt.Screen name="TripDiscovery"    component={TripDiscoveryScreen}   />
      <DashSt.Screen name="TripNavigation"   component={TripNavigationScreen}  />
      <DashSt.Screen name="TravelJournal"    component={TravelJournalScreen}   />
      <DashSt.Screen name="ReferAndEarn"     component={ReferAndEarnScreen}    />
      <DashSt.Screen name="Premium"          component={PremiumScreen}         />
      <DashSt.Screen name="ItemizedSplitter" component={ItemizedSplitterScreen}/>
    </DashSt.Navigator>
  );
}

// Groups stack
function GroupsStack() {
  return (
    <GrpSt.Navigator screenOptions={{ headerShown: false }}>
      <GrpSt.Screen name="GroupsList"        component={GroupsListScreen}       />
      <GrpSt.Screen name="GroupDetail"       component={GroupDetailScreen}      />
      <GrpSt.Screen name="CreateGroup"       component={CreateGroupScreen}      />
      <GrpSt.Screen name="AddBill"           component={AddBillScreen}          />
      <GrpSt.Screen name="BillDetail"        component={BillDetailScreen}       />
      <GrpSt.Screen name="ItemizedSplitter"  component={ItemizedSplitterScreen} />
      <GrpSt.Screen name="TripDiscovery"     component={TripDiscoveryScreen}    />
      <GrpSt.Screen name="TripNavigation"    component={TripNavigationScreen}   />
    </GrpSt.Navigator>
  );
}

// Friends stack
function FriendsStack() {
  return (
    <FrdSt.Navigator screenOptions={{ headerShown: false }}>
      <FrdSt.Screen name="FriendsList" component={FriendsScreen}   />
      <FrdSt.Screen name="AddFriend"   component={AddFriendScreen} />
    </FrdSt.Navigator>
  );
}

// Account stack
function AccountStack() {
  return (
    <AccSt.Navigator screenOptions={{ headerShown: false }}>
      <AccSt.Screen name="AccountHome"  component={AccountScreen}      />
      <AccSt.Screen name="EditProfile"  component={EditProfileScreen}  />
      <AccSt.Screen name="ReferAndEarn" component={ReferAndEarnScreen} />
      <AccSt.Screen name="Premium"      component={PremiumScreen}      />
    </AccSt.Navigator>
  );
}

// Bottom Tab Navigator
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor:      COLORS.surface,
          borderTopColor:       COLORS.borderLight,
          borderTopWidth:       1,
          height:               80,
          paddingBottom:        20,
          paddingTop:           8,
        },
        tabBarActiveTintColor:   COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle:        { fontSize: 11, fontWeight: '600', marginTop: 2 },
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardStack}
        options={{ tabBarLabel:'Home',     tabBarIcon: ({focused}) => <TabIcon emoji="💸" focused={focused} /> }} />
      <Tab.Screen name="Groups"    component={GroupsStack}
        options={{ tabBarLabel:'Groups',   tabBarIcon: ({focused}) => <TabIcon emoji="🏠" focused={focused} /> }} />
      <Tab.Screen name="Activity"  component={ActivityScreen}
        options={{ tabBarLabel:'Activity', tabBarIcon: ({focused}) => <TabIcon emoji="📊" focused={focused} /> }} />
      <Tab.Screen name="Friends"   component={FriendsStack}
        options={{ tabBarLabel:'Friends',  tabBarIcon: ({focused}) => <TabIcon emoji="👥" focused={focused} /> }} />
      <Tab.Screen name="Account"   component={AccountStack}
        options={{ tabBarLabel:'Account',  tabBarIcon: ({focused}) => <TabIcon emoji="👤" focused={focused} /> }} />
    </Tab.Navigator>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function AppNavigator() {
  const { user, setUser, setProfile, clear } = useAuthStore();
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    const sub = onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        const { data: profile } = await getProfile(session.user.id);
        setProfile(profile);
        try { await registerForPushNotifications(session.user.id); } catch(e) {}
      } else {
        clear();
      }
      setLoading(false);
    });
    return () => sub?.unsubscribe?.();
  }, []);

  if (loading) return (
    <View style={{ flex:1, backgroundColor: COLORS.bg, alignItems:'center', justifyContent:'center' }}>
      <Text style={{ fontSize:52, marginBottom:16 }}>💸</Text>
      <Text style={{ color: COLORS.primary, fontSize:26, fontWeight:'800', marginBottom:4 }}>SplitSaathi</Text>
      <Text style={{ color: COLORS.textMuted, fontSize:13, marginBottom:24 }}>Split expenses with friends</Text>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );

  return (
    <NavigationContainer theme={navTheme}>
      <Main.Navigator screenOptions={{ headerShown: false }}>
        {user
          ? <Main.Screen name="App"  component={TabNavigator} />
          : <Main.Screen name="Auth" component={AuthStack}    />
        }
      </Main.Navigator>
    </NavigationContainer>
  );
}
