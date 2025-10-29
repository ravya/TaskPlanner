export interface Task {
  id: string;
  title: string;
  description: string;
  startDate: string; // YYYY-MM-DD format
  startTime?: string; // HH:MM format (optional)
  status: 'todo' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  isRepeating: boolean;
  repeatFrequency?: 'daily' | 'weekly' | 'monthly';
  repeatEndDate?: string; // YYYY-MM-DD format
  userId: string;
  createdAt: any; // Firestore Timestamp
}

export interface TaskFormData {
  title: string;
  description: string;
  startDate: string;
  startTime: string;
  priority: 'low' | 'medium' | 'high';
  tags: string;
  isRepeating: boolean;
  repeatFrequency: 'daily' | 'weekly' | 'monthly';
  repeatEndDate: string;
}
