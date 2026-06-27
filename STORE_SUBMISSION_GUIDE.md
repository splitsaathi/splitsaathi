# 🚀 SplitSaathi — Play Store & App Store Submission Guide

---

## ✅ PRE-LAUNCH CHECKLIST

### 1. Accounts Banao (Ek baar)
| Account | Cost | Link |
|---------|------|------|
| Apple Developer | $99/year (~₹8,300) | developer.apple.com/enroll |
| Google Play Console | $25 one-time (~₹2,100) | play.google.com/console |
| Supabase | Free | supabase.com |
| Razorpay | Free (2% per txn) | razorpay.com |
| Expo EAS | Free tier available | expo.dev |

---

## 📱 STEP 1 — Local Setup

```bash
# Node.js 18+ install karo: nodejs.org

# EAS CLI install karo
npm install -g eas-cli expo-cli

# Project mein jaao
cd SplitSaathi

# Dependencies install karo
npm install

# Expo login karo
expo login
# ya
eas login

# EAS project init karo
eas init
# Ye automatically eas.json mein projectId set kar dega
```

---

## 🔥 STEP 2 — Supabase Setup (5 min)

```bash
# 1. supabase.com → New Project → naam: splitsaathi

# 2. SQL Editor mein ye run karo:
```

```sql
-- profiles table
create table profiles (
  id uuid references auth.users primary key,
  name text not null,
  email text,
  phone text,
  avatar_url text,
  push_token text,
  upi_id text,
  created_at timestamptz default now()
);
alter table profiles enable row level security;
create policy "view profiles" on profiles for select using (auth.role()='authenticated');
create policy "insert profile" on profiles for insert with check (auth.uid()=id);
create policy "update profile" on profiles for update using (auth.uid()=id);

-- groups
create table groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text default '💸',
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);
alter table groups enable row level security;
create policy "view group" on groups for select using (
  exists(select 1 from group_members where group_id=id and user_id=auth.uid()));
create policy "create group" on groups for insert with check (auth.role()='authenticated');
create policy "update group" on groups for update using (
  created_by=auth.uid());

-- group_members
create table group_members (
  group_id uuid references groups(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key(group_id, user_id)
);
alter table group_members enable row level security;
create policy "view members" on group_members for select using (
  exists(select 1 from group_members g where g.group_id=group_id and g.user_id=auth.uid()));
create policy "add member" on group_members for insert with check (auth.role()='authenticated');
create policy "remove member" on group_members for delete using (user_id=auth.uid());

-- bills
create table bills (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups(id) on delete cascade,
  title text not null,
  amount numeric not null check (amount > 0),
  paid_by uuid references profiles(id),
  split_among uuid[] not null,
  category text default 'Other',
  note text,
  date date default current_date,
  settled uuid[] default '{}',
  reminder_date date,
  notification_id text,
  created_at timestamptz default now()
);
alter table bills enable row level security;
create policy "view bill" on bills for select using (
  paid_by=auth.uid() or auth.uid()=any(split_among));
create policy "create bill" on bills for insert with check (auth.role()='authenticated');
create policy "update bill" on bills for update using (
  paid_by=auth.uid() or auth.uid()=any(split_among));

-- friendships
create table friendships (
  user_a uuid references profiles(id),
  user_b uuid references profiles(id),
  added_by uuid references profiles(id),
  created_at timestamptz default now(),
  primary key(user_a, user_b)
);
alter table friendships enable row level security;
create policy "view friendships" on friendships for select using (
  user_a=auth.uid() or user_b=auth.uid());
create policy "add friendship" on friendships for insert with check (auth.role()='authenticated');

-- payments
create table payments (
  id uuid primary key default gen_random_uuid(),
  from_user uuid references profiles(id),
  to_user uuid references profiles(id),
  amount numeric not null,
  bill_id uuid references bills(id),
  group_id uuid references groups(id),
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_signature text,
  status text default 'pending',
  created_at timestamptz default now()
);
alter table payments enable row level security;
create policy "view payment" on payments for select using (
  from_user=auth.uid() or to_user=auth.uid());
create policy "create payment" on payments for insert with check (auth.role()='authenticated');

-- Auto profile creation trigger
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles(id, name, email)
  values(
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
    new.email
  );
  return new;
end;$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
```

```bash
# 3. Authentication enable karo:
# Dashboard → Authentication → Providers
# Email ✓ ON
# Google ✓ ON (optional)
# Phone ✓ ON (Twilio se)

# 4. Keys .env mein daalo:
# Dashboard → Project Settings → API
SUPABASE_URL=https://YOUR_ID.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
```

---

## 💳 STEP 3 — Razorpay Setup

```bash
# 1. razorpay.com → Sign Up → Business details fill karo
# 2. Dashboard → Settings → API Keys → Generate Key

# 3. .env mein daalo:
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=xxxxx   # sirf Supabase mein — app mein mat daalna!

# 4. Supabase mein secret set karo:
supabase secrets set RAZORPAY_KEY_ID=rzp_live_xxxxx
supabase secrets set RAZORPAY_KEY_SECRET=xxxxx

# 5. Edge function deploy karo:
supabase functions deploy create-razorpay-order
supabase functions deploy send-notification
```

---

## 🏗️ STEP 4 — App Config Update Karo

### app.json mein:
```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.YOURNAME.splitsaathi"
    },
    "android": {
      "package": "com.YOURNAME.splitsaathi"
    },
    "extra": {
      "supabaseUrl": "https://YOUR_ID.supabase.co",
      "supabaseAnonKey": "YOUR_ANON_KEY",
      "razorpayKeyId": "rzp_live_xxxxx"
    }
  }
}
```

### eas.json mein:
```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your@apple.id",
        "ascAppId": "1234567890",
        "appleTeamId": "ABCDE12345"
      }
    }
  }
}
```

---

## 📦 STEP 5 — Assets Banao

### App Icon (REQUIRED)
- Size: **1024×1024 px** PNG, no alpha/transparency
- Path: `assets/images/icon.png`
- Tool: Figma, Canva ya Adobe Illustrator
- Template: 💸 emoji pe dark navy (#0f172a) background

### Splash Screen
- Size: **1284×2778 px** (iPhone 14 Pro Max)
- Path: `assets/images/splash.png`
- Background: `#0f172a`

### Android Adaptive Icon
- Foreground: **1024×1024 px** with safe zone (66%)
- Path: `assets/images/adaptive-icon.png`

### Notification Icon (Android)
- Size: **96×96 px** white on transparent
- Path: `assets/images/notification-icon.png`

---

## 🔨 STEP 6 — Build Karo

```bash
# Preview build (testing ke liye — APK file milegi)
eas build --platform android --profile preview
# QR scan karo Android phone par install karne ke liye

# iOS simulator test
eas build --platform ios --profile development

# ─── PRODUCTION BUILD ───────────────────────────────────────────

# Android production (AAB — Play Store ke liye)
eas build --platform android --profile production

# iOS production (IPA — App Store ke liye)
# Pehle certificates chahiye (EAS automatically manage karta hai)
eas build --platform ios --profile production

# Dono ek saath:
eas build --platform all --profile production
```

---

## 🤖 STEP 7 — Google Play Store

```bash
# 1. play.google.com/console → All apps → Create app
# App name: SplitSaathi
# Language: Hindi
# App or game: App
# Free or paid: Free

# 2. Store listing fill karo:
# - Short description (80 char): "Dosto ke saath kharche aasani se baantao"
# - Full description: (neeche sample diya hai)
# - Screenshots: 2-8 (phone + 7" tablet)
# - Feature graphic: 1024×500 px
# - App icon: 512×512 px

# 3. Content rating questionnaire complete karo
# 4. Target audience: 13+

# 5. Service account key banao (EAS submit ke liye):
# Console → Setup → API access → Service accounts → Create
# JSON key download karo → google-play-key.json mein save karo

# 6. Submit karo:
eas submit --platform android
# ya manual:
# Console → Production → Create new release → Upload AAB
```

### Play Store Description (Hindi):
```
SplitSaathi — Dosto ke saath kharche baantao!

Yatra par gaye? Dinner par gaye? Ghar ka kiraya split karna hai?
SplitSaathi se yeh sab aasaan ho jaata hai!

✨ FEATURES:
• Groups banao — trip, flat, office ke liye alag-alag
• Bills add karo aur equal split karo
• Dekhte raho — kisne kitna dena/lena hai
• UPI se seedha settle karo — Razorpay powered
• Settlement reminders set karo
• WhatsApp/Email se friends ko invite karo
• Sirf tumhare bills tumhe dikhenge — private & secure

💸 BILKUL FREE
📱 WORKS OFFLINE TOO
🔒 YOUR DATA IS SAFE
```

---

## 🍎 STEP 8 — Apple App Store

```bash
# 1. developer.apple.com → Certificates, IDs & Profiles
# App ID: com.YOURNAME.splitsaathi

# 2. appstoreconnect.apple.com → My Apps → + → New App
# Platform: iOS
# Name: SplitSaathi
# Bundle ID: com.YOURNAME.splitsaathi
# SKU: splitsaathi-v1

# 3. App Information fill karo:
# Category: Finance
# Age Rating: 4+
# Privacy Policy URL: (zaroor chahiye)

# 4. Screenshots ke sizes:
# 6.7" iPhone (1290×2796): Required
# 5.5" iPhone (1242×2208): Required
# 12.9" iPad Pro (2048×2732): Required if supports iPad

# 5. Submit karo:
eas submit --platform ios
# ya manual: Xcode → Organizer → Distribute App → App Store Connect
```

### App Store Description:
```
SplitSaathi makes splitting expenses with friends effortless!

Going on a trip? Sharing a flat? Dining out together?
Add bills, split them equally, and track who owes what — all in one place.

FEATURES
- Create groups for trips, home, office
- Add bills and split equally
- Real-time balance tracking
- Settle up via UPI (Razorpay)
- Set settlement reminders
- Invite friends via WhatsApp, Email, or Contacts
- Privacy-first: only see bills you're part of

Free to download. No subscription.
```

---

## ⏱️ STEP 9 — Review Timeline

| Store | Review Time |
|-------|-------------|
| Google Play | 1–3 days (new app) |
| Apple App Store | 1–7 days (new app) |
| Razorpay Approval | 2–3 business days |

### Common Rejection Reasons & Fixes:
```
❌ iOS: Missing Privacy Policy URL
✅ Fix: termly.io par free privacy policy banao

❌ iOS: App crashes on launch
✅ Fix: TestFlight par test karo pehle

❌ Android: Target API level too low
✅ Fix: app.json mein targetSdkVersion: 34

❌ iOS: Screenshots don't show actual app
✅ Fix: Real device screenshots lo (Simulator nahi)

❌ Both: Account/login required without explanation
✅ Fix: Demo account info screenshots mein daalo
```

---

## 🔄 STEP 10 — Updates (OTA & Store)

```bash
# Minor bug fix — koi build nahi chahiye (OTA update):
eas update --branch production --message "Bug fix"
# Users ko automatically milega within 24hrs

# Major feature / native change — full build chahiye:
eas build --platform all --profile production
eas submit --platform all
```

---

## 📊 POST-LAUNCH MONITORING

```bash
# Crash reports:
# Expo Dashboard → Your project → Crashes

# Analytics (add karo):
npm install @react-native-firebase/analytics @react-native-firebase/crashlytics

# Performance:
# Supabase Dashboard → Database → Query performance
```

---

## 💰 ESTIMATED TOTAL COST

| Item | Cost |
|------|------|
| Apple Developer Account | ₹8,300/year |
| Google Play One-time | ₹2,100 |
| Supabase (Free tier) | ₹0 |
| Razorpay (2% per txn) | Variable |
| Domain (optional) | ₹800/year |
| **Total First Year** | **~₹11,200** |

---

## 📞 SUPPORT LINKS

- Expo Docs: docs.expo.dev
- EAS Build: docs.expo.dev/build/introduction
- Supabase Docs: supabase.com/docs
- Razorpay Docs: razorpay.com/docs
- App Store Connect: appstoreconnect.apple.com
- Google Play Console: play.google.com/console

---
*SplitSaathi — Ek baar banao, hamesha use karo 💸*
