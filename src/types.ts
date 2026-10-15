export type BirthwishCategory = 
  | 'Father'
  | 'Mother'
  | 'Sister'
  | 'Brother'
  | 'Relation'
  | 'Friend'
  | 'Others';

export type RainbowColor = 
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'indigo'
  | 'violet'
  | 'pink';

export type CelebrantGender = 'male' | 'female' | 'others';

export type GiftStatus = 'unfunded' | 'holding' | 'claimed';

export interface ClaimDetails {
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  claimedAt: string;
  koraReference?: string;
  narration?: string;
}

export interface BirthdayReminderSettings {
  enabled: boolean;
  notify24HoursBefore: boolean;
  notifyOnDay: boolean;
  browserAlertEnabled: boolean;
  emailAlertEnabled: boolean;
  reminderEmail?: string;
  customNote?: string;
  lastNotifiedDate?: string;
  lastNotifiedType?: '24h' | 'day';
}

export interface Birthwish {
  id: string;
  createdAt: string;
  userId: string;
  category: BirthwishCategory;
  customCategory?: string;
  colorTheme: RainbowColor;
  celebrantName: string;
  celebrantNickname?: string;
  celebrantGender: CelebrantGender;
  celebrantDateOfBirth?: string;
  coverImage: string;
  mainImage: string;
  shortMessage: string;
  finalEpistle: string;
  senderRelation: string;
  senderName: string;
  hasGift: boolean;
  giftAmount?: number;
  giftCurrency?: string;
  giftPasscode?: string;
  giftStatus?: GiftStatus;
  giftClaimedAt?: string;
  claimDetails?: ClaimDetails;
  koraPaymentReference?: string;
  reminder?: BirthdayReminderSettings;
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  photoURL?: string;
  phoneNumber?: string;
  isPremium?: boolean;
  premiumExpiresAt?: string;
  subscriptionPlan?: 'free' | 'premium' | 'founder';
  premiumSubscribedAt?: string;
}

export interface RainbowColorConfig {
  id: RainbowColor;
  name: string;
  primary: string;
  secondary: string;
  glow: string;
  bgGradient: string;
  cardBorder: string;
  accentText: string;
  badgeBg: string;
  badgeText: string;
  particleColors: string[];
}
