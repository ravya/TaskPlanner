import { faker } from '@faker-js/faker';

export interface TestTask {
  id?: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'completed' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  archivedAt?: Date;
  tags: string[];
  assignee?: string;
  assignedBy?: string;
  estimatedHours?: number;
  actualHours?: number;
  category: string;
  project?: string;
  parentTaskId?: string;
  subtasks?: TestTask[];
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
  comments?: Array<{
    id: string;
    userId: string;
    content: string;
    createdAt: Date;
  }>;
  recurring?: {
    type: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: Date;
  };
  reminder?: {
    enabled: boolean;
    datetime: Date;
    notificationSent: boolean;
  };
  location?: {
    name: string;
    address?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  customFields?: Record<string, any>;
}

export class TaskGenerator {
  private static readonly TASK_TITLES = [
    'Review project proposal',
    'Update website content',
    'Schedule team meeting',
    'Fix bug in payment system',
    'Create marketing campaign',
    'Analyze user feedback',
    'Prepare quarterly report',
    'Optimize database queries',
    'Design new user interface',
    'Conduct user interviews',
    'Write technical documentation',
    'Plan sprint backlog',
    'Test mobile application',
    'Deploy to production',
    'Configure monitoring alerts',
    'Refactor legacy code',
    'Implement new feature',
    'Update security protocols',
    'Train new employees',
    'Organize team building event',
    'Research competitor analysis',
    'Create customer survey',
    'Migrate to cloud infrastructure',
    'Set up CI/CD pipeline',
    'Review code changes',
    'Update project timeline',
    'Prepare presentation slides',
    'Schedule client call',
    'Order office supplies',
    'Renew software licenses'
  ];

  private static readonly CATEGORIES = [
    'Development',
    'Design',
    'Marketing', 
    'Sales',
    'HR',
    'Finance',
    'Operations',
    'Customer Support',
    'Research',
    'Planning',
    'Personal',
    'Admin',
    'Maintenance',
    'Training',
    'Meeting',
    'Travel',
    'Health',
    'Education',
    'Project Management',
    'Quality Assurance'
  ];

  private static readonly PROJECTS = [
    'Website Redesign',
    'Mobile App v2.0',
    'Customer Portal',
    'Analytics Dashboard',
    'API Integration',
    'Database Migration',
    'Security Audit',
    'Performance Optimization',
    'User Research Study',
    'Marketing Campaign Q4',
    'Team Onboarding',
    'Product Launch',
    'Infrastructure Upgrade',
    'Documentation Update',
    'Training Program'
  ];

  private static readonly TAGS = [
    'urgent',
    'frontend',
    'backend',
    'bug',
    'feature',
    'improvement',
    'documentation',
    'testing',
    'meeting',
    'review',
    'research',
    'design',
    'development',
    'deployment',
    'maintenance',
    'security',
    'performance',
    'user-experience',
    'accessibility',
    'mobile',
    'desktop',
    'api',
    'database',
    'integration',
    'automation',
    'monitoring',
    'analytics',
    'reporting',
    'planning',
    'personal'
  ];

  private static readonly ATTACHMENT_TYPES = [
    { ext: 'pdf', type: 'application/pdf' },
    { ext: 'docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
    { ext: 'xlsx', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
    { ext: 'png', type: 'image/png' },
    { ext: 'jpg', type: 'image/jpeg' },
    { ext: 'txt', type: 'text/plain' },
    { ext: 'zip', type: 'application/zip' }
  ];

  /**
   * Generate a single test task with realistic data
   */
  static generateTask(overrides: Partial<TestTask> = {}): TestTask {
    const createdAt = faker.date.past({ years: 1 });
    const status = overrides.status || faker.helpers.weightedArrayElement([
      { weight: 40, value: 'todo' as const },
      { weight: 25, value: 'in_progress' as const },
      { weight: 30, value: 'completed' as const },
      { weight: 5, value: 'archived' as const }
    ]);

    const priority = faker.helpers.weightedArrayElement([
      { weight: 35, value: 'low' as const },
      { weight: 40, value: 'medium' as const },
      { weight: 20, value: 'high' as const },
      { weight: 5, value: 'urgent' as const }
    ]);

    const updatedAt = faker.date.between({ from: createdAt, to: new Date() });
    const completedAt = status === 'completed' ? faker.date.between({ from: updatedAt, to: new Date() }) : undefined;
    const archivedAt = status === 'archived' ? faker.date.between({ from: completedAt || updatedAt, to: new Date() }) : undefined;

    return {
      title: faker.helpers.arrayElement(this.TASK_TITLES),
      description: faker.datatype.boolean(0.7) ? faker.lorem.sentences(faker.number.int({ min: 1, max: 4 })) : undefined,
      status,
      priority,
      dueDate: faker.datatype.boolean(0.6) ? faker.date.future({ years: 1 }) : undefined,
      createdAt,
      updatedAt,
      completedAt,
      archivedAt,
      tags: faker.helpers.arrayElements(this.TAGS, { min: 0, max: 5 }),
      assignee: faker.datatype.boolean(0.7) ? faker.person.fullName() : undefined,
      assignedBy: faker.datatype.boolean(0.3) ? faker.person.fullName() : undefined,
      estimatedHours: faker.datatype.boolean(0.5) ? faker.number.int({ min: 1, max: 40 }) : undefined,
      actualHours: faker.datatype.boolean(0.3) ? faker.number.int({ min: 1, max: 50 }) : undefined,
      category: faker.helpers.arrayElement(this.CATEGORIES),
      project: faker.datatype.boolean(0.6) ? faker.helpers.arrayElement(this.PROJECTS) : undefined,
      parentTaskId: faker.datatype.boolean(0.1) ? faker.string.uuid() : undefined,
      attachments: faker.datatype.boolean(0.2) ? this.generateAttachments() : undefined,
      comments: faker.datatype.boolean(0.3) ? this.generateComments() : undefined,
      recurring: faker.datatype.boolean(0.1) ? this.generateRecurring() : undefined,
      reminder: faker.datatype.boolean(0.4) ? this.generateReminder() : undefined,
      location: faker.datatype.boolean(0.1) ? this.generateLocation() : undefined,
      customFields: faker.datatype.boolean(0.2) ? this.generateCustomFields() : undefined,
      ...overrides
    };
  }

  /**
   * Generate multiple test tasks
   */
  static generateTasks(count: number, overrides: Partial<TestTask> = {}): TestTask[] {
    return Array.from({ length: count }, () => this.generateTask(overrides));
  }

  /**
   * Generate tasks with specific statuses
   */
  static generateTasksByStatus(): {
    todo: TestTask[];
    inProgress: TestTask[];
    completed: TestTask[];
    archived: TestTask[];
  } {
    return {
      todo: this.generateTasks(15, { status: 'todo' }),
      inProgress: this.generateTasks(8, { status: 'in_progress' }),
      completed: this.generateTasks(25, { status: 'completed' }),
      archived: this.generateTasks(5, { status: 'archived' })
    };
  }

  /**
   * Generate tasks with specific priorities
   */
  static generateTasksByPriority(): {
    low: TestTask[];
    medium: TestTask[];
    high: TestTask[];
    urgent: TestTask[];
  } {
    return {
      low: this.generateTasks(20, { priority: 'low' }),
      medium: this.generateTasks(25, { priority: 'medium' }),
      high: this.generateTasks(15, { priority: 'high' }),
      urgent: this.generateTasks(5, { priority: 'urgent' })
    };
  }

  /**
   * Generate overdue tasks
   */
  static generateOverdueTasks(count: number = 10): TestTask[] {
    return this.generateTasks(count, {
      status: faker.helpers.arrayElement(['todo', 'in_progress']),
      dueDate: faker.date.past({ days: 30 })
    });
  }

  /**
   * Generate upcoming tasks
   */
  static generateUpcomingTasks(count: number = 10): TestTask[] {
    return this.generateTasks(count, {
      status: faker.helpers.arrayElement(['todo', 'in_progress']),
      dueDate: faker.date.future({ days: 7 })
    });
  }

  /**
   * Generate test data for specific scenarios
   */
  static generateTestScenarios(): {
    emptyProject: TestTask[];
    fullProject: TestTask[];
    personalTasks: TestTask[];
    teamTasks: TestTask[];
    longRunningTasks: TestTask[];
  } {
    return {
      emptyProject: [],
      
      fullProject: this.generateTasks(50, {
        project: 'Website Redesign',
        assignee: 'John Doe'
      }),
      
      personalTasks: this.generateTasks(15, {
        category: 'Personal',
        assignee: undefined,
        project: undefined
      }),
      
      teamTasks: this.generateTasks(30, {
        assignee: faker.person.fullName(),
        assignedBy: 'Team Lead'
      }),
      
      longRunningTasks: this.generateTasks(10, {
        createdAt: faker.date.past({ years: 2 }),
        status: 'in_progress',
        estimatedHours: faker.number.int({ min: 100, max: 500 })
      })
    };
  }

  /**
   * Generate edge case tasks for testing
   */
  static generateEdgeCaseTasks(): TestTask[] {
    return [
      // Very long title
      this.generateTask({
        title: faker.lorem.words(50).substring(0, 200),
        description: faker.lorem.paragraphs(10)
      }),

      // Empty description
      this.generateTask({
        title: 'Task with no description',
        description: undefined
      }),

      // Maximum tags
      this.generateTask({
        title: 'Task with many tags',
        tags: faker.helpers.arrayElements(this.TAGS, this.TAGS.length)
      }),

      // Future creation date (edge case)
      this.generateTask({
        title: 'Future task',
        createdAt: faker.date.future({ days: 1 }),
        updatedAt: faker.date.future({ days: 2 })
      }),

      // Task with special characters
      this.generateTask({
        title: 'Special chars: @#$%^&*()_+-=[]{}|;":,.<>?',
        description: 'Description with émojis: 🚀 💪 ✅ and special chars: àáâãäåæçèéêë'
      }),

      // Very old task
      this.generateTask({
        title: 'Very old task',
        createdAt: faker.date.past({ years: 5 }),
        status: 'completed',
        completedAt: faker.date.past({ years: 4 })
      })
    ];
  }

  private static generateAttachments() {
    const count = faker.number.int({ min: 1, max: 5 });
    return Array.from({ length: count }, () => {
      const attachment = faker.helpers.arrayElement(this.ATTACHMENT_TYPES);
      return {
        id: faker.string.uuid(),
        name: `${faker.system.fileName()}.${attachment.ext}`,
        url: faker.internet.url(),
        type: attachment.type,
        size: faker.number.int({ min: 1000, max: 10000000 })
      };
    });
  }

  private static generateComments() {
    const count = faker.number.int({ min: 1, max: 8 });
    return Array.from({ length: count }, () => ({
      id: faker.string.uuid(),
      userId: faker.string.uuid(),
      content: faker.lorem.sentences(faker.number.int({ min: 1, max: 3 })),
      createdAt: faker.date.past({ months: 3 })
    }));
  }

  private static generateRecurring() {
    return {
      type: faker.helpers.arrayElement(['daily', 'weekly', 'monthly', 'yearly'] as const),
      interval: faker.number.int({ min: 1, max: 12 }),
      endDate: faker.datatype.boolean(0.5) ? faker.date.future({ years: 1 }) : undefined
    };
  }

  private static generateReminder() {
    return {
      enabled: faker.datatype.boolean(0.8),
      datetime: faker.date.future({ days: 30 }),
      notificationSent: faker.datatype.boolean(0.3)
    };
  }

  private static generateLocation() {
    return {
      name: faker.location.buildingNumber() + ' ' + faker.location.street(),
      address: faker.location.streetAddress(),
      coordinates: {
        lat: parseFloat(faker.location.latitude()),
        lng: parseFloat(faker.location.longitude())
      }
    };
  }

  private static generateCustomFields() {
    const fields: Record<string, any> = {};
    const fieldCount = faker.number.int({ min: 1, max: 5 });
    
    for (let i = 0; i < fieldCount; i++) {
      const fieldName = faker.lorem.word();
      const fieldType = faker.helpers.arrayElement(['string', 'number', 'boolean', 'date']);
      
      switch (fieldType) {
        case 'string':
          fields[fieldName] = faker.lorem.words(3);
          break;
        case 'number':
          fields[fieldName] = faker.number.int({ min: 1, max: 100 });
          break;
        case 'boolean':
          fields[fieldName] = faker.datatype.boolean();
          break;
        case 'date':
          fields[fieldName] = faker.date.future();
          break;
      }
    }
    
    return fields;
  }
}