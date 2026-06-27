# 💸 SplitSaathi

**Dosto ke saath kharche baantao, aasani se**

A Splitwise-style expense splitting app built with React Native (Expo), Supabase, and Razorpay — ready for the App Store and Play Store.

---

## ✨ Features

- 🔐 **Auth** — Email/Password, Google OAuth, Phone OTP
- 👥 **Groups** — Create groups for trips, flats, offices
- 🧾 **Bills** — Add expenses, split equally, track categories
- 💰 **Balances** — Real-time who-owes-whom calculations
- 💳 **UPI Payments** — Settle up directly via Razorpay
- 🔔 **Reminders** — Push notifications for pending settlements
- 📱 **Friend Invites** — Via phone contacts, WhatsApp, or email
- 🔒 **Privacy-first** — Only see bills you're part of

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native (Expo SDK 51) |
| Navigation | React Navigation 6 |
| State | Zustand |
| Backend | Supabase (PostgreSQL + Auth + Realtime) |
| Payments | Razorpay |
| Notifications | Expo Notifications |
| Build/Deploy | EAS Build & Submit |

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env
# Fill in Supabase URL/key + Razorpay key

# 3. Run Supabase SQL setup
# (see STORE_SUBMISSION_GUIDE.md → Step 2)

# 4. Start dev server
npx expo start
```

---

## 📁 Project Structure

```
SplitSaathi/
├── App.js                          # Root entry
├── app.json                        # Expo config (iOS/Android)
├── eas.json                        # Build & submit config
├── src/
│   ├── theme/                      # Design tokens
│   ├── services/                   # Supabase, auth, payments, etc.
│   ├── store/                      # Zustand global state
│   ├── hooks/                      # Custom React hooks
│   ├── utils/                      # Formatters, validators, balance math
│   ├── navigation/                 # Tab + stack navigators
│   ├── components/                 # Reusable UI components
│   └── screens/                    # All app screens
├── functions/                      # Supabase Edge Functions
├── STORE_SUBMISSION_GUIDE.md       # Full deployment walkthrough
└── PRIVACY_POLICY.md               # Required for store submission
```

---

## 📦 Building for Production

```bash
# Android (AAB for Play Store)
eas build --platform android --profile production

# iOS (for App Store)
eas build --platform ios --profile production

# Submit to both stores
eas submit --platform all
```

Full step-by-step guide: see **`STORE_SUBMISSION_GUIDE.md`**

---

## 🔑 Required Accounts

| Service | Purpose | Link |
|---------|---------|------|
| Supabase | Database + Auth | supabase.com |
| Razorpay | Payments | razorpay.com |
| Apple Developer | iOS distribution | developer.apple.com |
| Google Play Console | Android distribution | play.google.com/console |
| Expo/EAS | Build service | expo.dev |

---

## 📄 License

Private project — all rights reserved.

---
*Built with ❤️ for splitting expenses the easy way*
