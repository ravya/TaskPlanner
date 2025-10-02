import { faker } from '@faker-js/faker';

export interface TestUser {
  id?: string;
  email: string;
  password: string;
  displayName: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  timezone: string;
  locale: string;
  role: 'user' | 'admin' | 'moderator';
  isVerified: boolean;
  createdAt: Date;
  lastLoginAt?: Date;
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    notifications: {
      email: boolean;
      push: boolean;
      desktop: boolean;
    };
    defaultView: 'list' | 'kanban' | 'calendar';
    dateFormat: string;
    timeFormat: '12h' | '24h';
    firstDayOfWeek: 0 | 1; // 0 = Sunday, 1 = Monday
  };
  stats: {
    totalTasks: number;
    completedTasks: number;
    streakDays: number;
    lastActiveDate: Date;
  };
}

export class UserGenerator {
  private static readonly COMMON_DOMAINS = [
    'gmail.com',
    'yahoo.com', 
    'hotmail.com',
    'outlook.com',
    'company.com',
    'example.org'
  ];

  private static readonly TIMEZONES = [
    'America/New_York',
    'America/Los_Angeles',
    'America/Chicago',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Australia/Sydney',
    'America/Toronto',
    'Europe/Berlin',
    'Asia/Shanghai'
  ];

  private static readonly LOCALES = [
    'en-US',
    'en-GB', 
    'fr-FR',
    'es-ES',
    'de-DE',
    'ja-JP',
    'zh-CN',
    'it-IT',
    'pt-BR',
    'ru-RU'
  ];

  /**
   * Generate a single test user with realistic data
   */
  static generateUser(overrides: Partial<TestUser> = {}): TestUser {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const domain = faker.helpers.arrayElement(this.COMMON_DOMAINS);
    
    return {
      email: faker.internet.email({ firstName, lastName, provider: domain }).toLowerCase(),
      password: this.generateSecurePassword(),
      displayName: `${firstName} ${lastName}`,
      firstName,
      lastName,
      profilePicture: faker.image.avatar(),
      phoneNumber: faker.phone.number(),
      dateOfBirth: faker.date.birthdate({ min: 18, max: 80, mode: 'age' }).toISOString().split('T')[0],
      timezone: faker.helpers.arrayElement(this.TIMEZONES),
      locale: faker.helpers.arrayElement(this.LOCALES),
      role: faker.helpers.weightedArrayElement([
        { weight: 85, value: 'user' as const },
        { weight: 10, value: 'moderator' as const },
        { weight: 5, value: 'admin' as const }
      ]),
      isVerified: faker.datatype.boolean(0.8), // 80% are verified
      createdAt: faker.date.past({ years: 2 }),
      lastLoginAt: faker.date.recent({ days: 30 }),
      preferences: {
        theme: faker.helpers.arrayElement(['light', 'dark', 'auto'] as const),
        notifications: {
          email: faker.datatype.boolean(0.7),
          push: faker.datatype.boolean(0.6),
          desktop: faker.datatype.boolean(0.4)
        },
        defaultView: faker.helpers.arrayElement(['list', 'kanban', 'calendar'] as const),
        dateFormat: faker.helpers.arrayElement(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']),
        timeFormat: faker.helpers.arrayElement(['12h', '24h'] as const),
        firstDayOfWeek: faker.helpers.arrayElement([0, 1] as const)
      },
      stats: {
        totalTasks: faker.number.int({ min: 0, max: 500 }),
        completedTasks: faker.number.int({ min: 0, max: 400 }),
        streakDays: faker.number.int({ min: 0, max: 365 }),
        lastActiveDate: faker.date.recent({ days: 7 })
      },
      ...overrides
    };
  }

  /**
   * Generate multiple test users
   */
  static generateUsers(count: number, overrides: Partial<TestUser> = {}): TestUser[] {
    return Array.from({ length: count }, () => this.generateUser(overrides));
  }

  /**
   * Generate specific test users for common scenarios
   */
  static generateTestUsers(): {
    regularUser: TestUser;
    adminUser: TestUser;
    newUser: TestUser;
    powerUser: TestUser;
    inactiveUser: TestUser;
  } {
    return {
      regularUser: this.generateUser({
        email: 'user@taskflow.dev',
        password: 'TestPass123!',
        displayName: 'Regular User',
        role: 'user',
        isVerified: true,
        stats: {
          totalTasks: 25,
          completedTasks: 18,
          streakDays: 7,
          lastActiveDate: new Date()
        }
      }),
      
      adminUser: this.generateUser({
        email: 'admin@taskflow.dev', 
        password: 'AdminPass123!',
        displayName: 'Admin User',
        role: 'admin',
        isVerified: true,
        stats: {
          totalTasks: 150,
          completedTasks: 120,
          streakDays: 45,
          lastActiveDate: new Date()
        }
      }),
      
      newUser: this.generateUser({
        email: 'newbie@taskflow.dev',
        password: 'NewPass123!',
        displayName: 'New User',
        role: 'user',
        isVerified: false,
        createdAt: new Date(),
        stats: {
          totalTasks: 0,
          completedTasks: 0,
          streakDays: 0,
          lastActiveDate: new Date()
        }
      }),
      
      powerUser: this.generateUser({
        email: 'power@taskflow.dev',
        password: 'PowerPass123!',
        displayName: 'Power User',
        role: 'user',
        isVerified: true,
        stats: {
          totalTasks: 1000,
          completedTasks: 850,
          streakDays: 200,
          lastActiveDate: new Date()
        }
      }),
      
      inactiveUser: this.generateUser({
        email: 'inactive@taskflow.dev',
        password: 'InactivePass123!',
        displayName: 'Inactive User',
        role: 'user',
        isVerified: true,
        lastLoginAt: faker.date.past({ months: 6 }),
        stats: {
          totalTasks: 10,
          completedTasks: 5,
          streakDays: 0,
          lastActiveDate: faker.date.past({ months: 6 })
        }
      })
    };
  }

  /**
   * Generate a secure password for testing
   */
  private static generateSecurePassword(): string {
    const lowercase = faker.internet.password({ length: 3, memorable: false, pattern: /[a-z]/ });
    const uppercase = faker.internet.password({ length: 2, memorable: false, pattern: /[A-Z]/ });
    const numbers = faker.string.numeric(2);
    const symbols = faker.helpers.arrayElements(['!', '@', '#', '$', '%', '&'], 1).join('');
    
    return faker.helpers.shuffle([lowercase, uppercase, numbers, symbols].join('').split('')).join('');
  }

  /**
   * Generate edge case users for testing
   */
  static generateEdgeCaseUsers(): TestUser[] {
    return [
      // Very long name
      this.generateUser({
        displayName: 'A'.repeat(100),
        firstName: 'A'.repeat(50),
        lastName: 'B'.repeat(50)
      }),
      
      // Special characters in name
      this.generateUser({
        displayName: 'José María García-López',
        firstName: 'José María',
        lastName: 'García-López'
      }),
      
      // Very long email
      this.generateUser({
        email: 'very.long.email.address.for.testing.purposes@very.long.domain.name.example.com'
      }),
      
      // Minimal data user
      this.generateUser({
        phoneNumber: undefined,
        profilePicture: undefined,
        dateOfBirth: undefined
      })
    ];
  }
}