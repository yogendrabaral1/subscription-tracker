# SubscriptionTracker - Recurring Subscription Management App

A React Native app built with Expo that centralizes all recurring subscriptions and payments, helping users track their spending, manage auto-pay settings, and never miss renewal dates.

## Features

### Core Subscription Management
- ✅ **Subscription Tracking**: Track all recurring subscriptions (Netflix, Spotify, Adobe, etc.)
- ✅ **Auto-pay vs Manual**: Distinguish between auto-renewing and manual subscriptions
- ✅ **Renewal/Expiry Dates**: Shows when subscriptions renew or expire
- ✅ **Spending Analytics**: Monthly and yearly spending breakdown by category
- ✅ **Smart Reminders**: Push notifications before renewal/expiry dates
- ✅ **Category Organization**: Entertainment, Productivity, Fitness, News, Cloud, etc.
- ✅ **Multiple Currencies**: Support for USD, EUR, GBP, INR, JPY
- ✅ **Offline Support**: Works without internet using local SQLite storage

### Key Features
- **Dashboard Overview**: See total monthly/yearly spending and active subscription count
- **Upcoming Renewals**: Track auto-pay subscriptions that will renew soon
- **Expiring Soon**: Monitor manual subscriptions that need renewal
- **Visual Status Indicators**: Color-coded status (Active, Expiring Soon, Expired, Cancelled)
- **Payment Type Badges**: Clear indication of Auto-pay vs Manual subscriptions
- **Flexible Billing Cycles**: Weekly, Monthly, Quarterly, Yearly support
- **Custom Reminders**: 1, 3, or 7 days before due dates

## Tech Stack

- **React Native** with Expo CLI
- **TypeScript** for type safety
- **SQLite** for local data storage
- **Expo Notifications** for push reminders
- **React Navigation** for screen navigation
- **Context API** for state management

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- Expo Go app on your mobile device (for testing)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd tracker-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Run on your device:
   - Install Expo Go app on your phone
   - Scan the QR code from the terminal
   - Or run on simulator: `npm run ios` or `npm run android`

## Project Structure

```
src/
├── components/          # Reusable UI components
├── screens/            # App screens
│   ├── SplashScreen.tsx
│   ├── OnboardingScreen.tsx
│   ├── LoginScreen.tsx
│   ├── DashboardScreen.tsx
│   ├── AddSubscriptionScreen.tsx
│   ├── BillDetailScreen.tsx
│   └── SettingsScreen.tsx
├── navigation/         # Navigation configuration
│   └── AppNavigator.tsx
├── services/          # External services
│   ├── database.ts    # SQLite operations
│   └── notifications.ts # Push notification handling
├── context/           # State management
│   └── AppContext.tsx
├── types/             # TypeScript type definitions
│   └── index.ts
└── utils/             # Helper functions
    └── helpers.ts
```

## Usage

### Adding a Subscription
1. Tap the "+" button on the dashboard
2. Fill in the subscription details:
   - **Service Name**: e.g., "Netflix", "Spotify Premium"
   - **Provider**: Company name (optional)
   - **Category**: Entertainment, Productivity, Fitness, etc.
   - **Amount & Currency**: Monthly/yearly cost
   - **Billing Cycle**: Weekly, Monthly, Quarterly, Yearly
   - **Payment Type**: Auto-pay (renews automatically) or Manual (expires)
   - **Next Billing/Expiry Date**: When it renews or expires
   - **Reminder Time**: How many days before to remind you
   - **Description**: Additional notes (optional)

### Managing Subscriptions
- **Dashboard**: View all subscriptions with spending summary
- **Upcoming Renewals**: See auto-pay subscriptions renewing soon
- **Expiring Soon**: Track manual subscriptions that need renewal
- **Subscription Details**: Tap any subscription to see full details
- **Cancel/Delete**: Manage subscription status
- **Edit**: Update subscription information

### Notifications
- Receive push notifications before renewal/expiry dates
- Configure default reminder time in settings
- Notifications work even when app is closed

## Database Schema

### Subscriptions Table
- `id`: Unique identifier
- `name`: Subscription service name
- `provider`: Company/provider name
- `category`: Entertainment, Productivity, Fitness, etc.
- `amount`: Subscription cost
- `currency`: USD, EUR, GBP, INR, JPY
- `billingCycle`: Weekly, Monthly, Quarterly, Yearly
- `nextBillingDate`: When auto-pay subscriptions renew
- `expiryDate`: When manual subscriptions expire
- `isAutoPayEnabled`: Boolean for auto-pay status
- `isActive`: Boolean for active status
- `reminderTime`: Days before due date to remind
- `description`: Additional notes
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

### Users Table
- `id`: Unique identifier
- `name`: User's full name
- `email`: User's email address
- `defaultReminderTime`: Default reminder setting
- `theme`: Light or dark mode
- `currency`: Default currency preference

## Key Concepts

### Auto-pay vs Manual Subscriptions
- **Auto-pay**: Subscriptions that automatically renew (Netflix, Spotify)
  - Shows "Renews on [date]" 
  - Tracks next billing date
  - Blue "Auto-pay" badge
  
- **Manual**: Subscriptions that expire and need manual renewal (some insurance, gym memberships)
  - Shows "Expires on [date]"
  - Tracks expiry date
  - Orange "Manual" badge

### Status Indicators
- **Green**: Active subscriptions
- **Orange**: Expiring soon (within 7 days)
- **Red**: Expired subscriptions
- **Gray**: Cancelled subscriptions

### Spending Calculation
- Automatically converts all subscriptions to monthly equivalents
- Shows both monthly and yearly spending totals
- Breaks down spending by category

## Future Enhancements

- [ ] Bank integration for automatic subscription detection
- [ ] Duplicate subscription detection
- [ ] Spending analytics and trends
- [ ] Export data functionality
- [ ] Cloud sync across devices
- [ ] Family sharing and bill splitting
- [ ] Price change alerts
- [ ] Subscription recommendations

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please open an issue in the repository.
