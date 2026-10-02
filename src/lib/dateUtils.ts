/**
 * Utility functions for calculating birthday countdowns and next occurrence
 */

export interface BirthdayCountdownResult {
  daysRemaining: number;
  formattedTargetDate: string;
  isToday: boolean;
  isTomorrow: boolean;
  statusText: string;
  urgency: 'today' | 'soon' | 'approaching' | 'future';
}

export function calculateDaysUntilBirthday(dateString?: string, fallbackCreatedAt?: string): BirthdayCountdownResult {
  const now = new Date();
  const currentYear = now.getFullYear();
  
  // Set today's date to midnight for pure calendar day comparison
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let birthMonth: number | null = null;
  let birthDay: number | null = null;

  if (dateString) {
    try {
      const parts = dateString.split('-');
      if (parts.length === 3) {
        // Format: YYYY-MM-DD
        birthMonth = parseInt(parts[1], 10) - 1;
        birthDay = parseInt(parts[2], 10);
      } else if (parts.length === 2) {
        // Format: MM-DD
        birthMonth = parseInt(parts[0], 10) - 1;
        birthDay = parseInt(parts[1], 10);
      }
    } catch {
      // Fallback
    }
  }

  // If no celebrantDateOfBirth was provided, extrapolate month & day from created date
  if (birthMonth === null || birthDay === null || isNaN(birthMonth) || isNaN(birthDay)) {
    if (fallbackCreatedAt) {
      try {
        const createdDate = new Date(fallbackCreatedAt);
        birthMonth = createdDate.getMonth();
        birthDay = createdDate.getDate();
      } catch {
        birthMonth = now.getMonth();
        birthDay = now.getDate();
      }
    } else {
      birthMonth = now.getMonth();
      birthDay = now.getDate();
    }
  }

  // Calculate next occurrence of this birthday
  let nextBirthday = new Date(currentYear, birthMonth, birthDay);

  // If the birthday in the current calendar year has already passed, check next year
  if (nextBirthday.getTime() < todayMidnight.getTime()) {
    nextBirthday = new Date(currentYear + 1, birthMonth, birthDay);
  }

  const msPerDay = 1000 * 60 * 60 * 24;
  const diffTime = nextBirthday.getTime() - todayMidnight.getTime();
  const daysRemaining = Math.round(diffTime / msPerDay);

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  const formattedTargetDate = `${monthNames[birthMonth]} ${birthDay}`;

  if (daysRemaining === 0) {
    return {
      daysRemaining: 0,
      formattedTargetDate,
      isToday: true,
      isTomorrow: false,
      statusText: "It's Today! 🎉",
      urgency: 'today',
    };
  }

  if (daysRemaining === 1) {
    return {
      daysRemaining: 1,
      formattedTargetDate,
      isToday: false,
      isTomorrow: true,
      statusText: 'Tomorrow! 🎂',
      urgency: 'soon',
    };
  }

  if (daysRemaining <= 7) {
    return {
      daysRemaining,
      formattedTargetDate,
      isToday: false,
      isTomorrow: false,
      statusText: `${daysRemaining} days away`,
      urgency: 'soon',
    };
  }

  if (daysRemaining <= 30) {
    return {
      daysRemaining,
      formattedTargetDate,
      isToday: false,
      isTomorrow: false,
      statusText: `${daysRemaining} days left`,
      urgency: 'approaching',
    };
  }

  return {
    daysRemaining,
    formattedTargetDate,
    isToday: false,
    isTomorrow: false,
    statusText: `${daysRemaining} days`,
    urgency: 'future',
  };
}
