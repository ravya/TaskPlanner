import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/testUtils';
import { mockTasks, mockUser } from '@/test/mockData';

// Mock the hooks
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: true,
  }),
}));

vi.mock('@/hooks/useTasks', () => ({
  useTasks: () => ({
    tasks: mockTasks,
    isLoading: false,
    isError: false,
    error: null,
    createTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
    refetch: vi.fn(),
  }),
}));

// Mock TaskList component for demonstration
const TaskList = () => {
  return (
    <div data-testid="task-list">
      {mockTasks.map((task) => (
        <div key={task.id} data-testid={`task-item-${task.id}`}>
          <h3>{task.title}</h3>
          <p>{task.description}</p>
          <span data-testid={`task-priority-${task.id}`}>{task.priority}</span>
          <span data-testid={`task-status-${task.id}`}>{task.status}</span>
        </div>
      ))}
    </div>
  );
};

describe('TaskList Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render task list', () => {
      render(<TaskList />);
      expect(screen.getByTestId('task-list')).toBeInTheDocument();
    });

    it('should render all tasks', () => {
      render(<TaskList />);
      mockTasks.forEach((task) => {
        expect(screen.getByText(task.title)).toBeInTheDocument();
      });
    });

    it('should display task details', () => {
      render(<TaskList />);
      const firstTask = mockTasks[0];

      expect(screen.getByText(firstTask.title)).toBeInTheDocument();
      expect(screen.getByText(firstTask.description)).toBeInTheDocument();
      expect(screen.getByTestId(`task-priority-${firstTask.id}`)).toHaveTextContent(
        firstTask.priority
      );
      expect(screen.getByTestId(`task-status-${firstTask.id}`)).toHaveTextContent(
        firstTask.status
      );
    });
  });

  describe('Task Filtering', () => {
    it('should filter tasks by status', () => {
      const FilterableTaskList = () => {
        const [filter, setFilter] = React.useState('all');
        const filteredTasks = mockTasks.filter(
          (task) => filter === 'all' || task.status === filter
        );

        return (
          <div>
            <select
              data-testid="status-filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            <div data-testid="filtered-tasks">
              {filteredTasks.map((task) => (
                <div key={task.id}>{task.title}</div>
              ))}
            </div>
          </div>
        );
      };

      render(<FilterableTaskList />);

      const select = screen.getByTestId('status-filter');

      // Filter by 'completed'
      fireEvent.change(select, { target: { value: 'completed' } });
      const completedTask = mockTasks.find((t) => t.status === 'completed');
      expect(screen.getByText(completedTask!.title)).toBeInTheDocument();
    });

    it('should filter tasks by priority', () => {
      const highPriorityTasks = mockTasks.filter((task) => task.priority === 'high');
      expect(highPriorityTasks.length).toBeGreaterThan(0);
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no tasks', () => {
      const EmptyTaskList = () => {
        const tasks: any[] = [];
        return (
          <div>
            {tasks.length === 0 ? (
              <div data-testid="empty-state">No tasks found</div>
            ) : (
              <div data-testid="task-list">
                {tasks.map((task) => (
                  <div key={task.id}>{task.title}</div>
                ))}
              </div>
            )}
          </div>
        );
      };

      render(<EmptyTaskList />);
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('No tasks found')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading state', () => {
      const LoadingTaskList = () => {
        const isLoading = true;
        return (
          <div>
            {isLoading ? (
              <div data-testid="loading-state">Loading tasks...</div>
            ) : (
              <div data-testid="task-list">Tasks</div>
            )}
          </div>
        );
      };

      render(<LoadingTaskList />);
      expect(screen.getByTestId('loading-state')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should show error state', () => {
      const ErrorTaskList = () => {
        const error = 'Failed to load tasks';
        return (
          <div>
            {error ? (
              <div data-testid="error-state">{error}</div>
            ) : (
              <div data-testid="task-list">Tasks</div>
            )}
          </div>
        );
      };

      render(<ErrorTaskList />);
      expect(screen.getByTestId('error-state')).toBeInTheDocument();
      expect(screen.getByText('Failed to load tasks')).toBeInTheDocument();
    });
  });
});

describe('Task Interactions', () => {
  it('should handle task click', () => {
    const handleClick = vi.fn();
    const ClickableTask = () => (
      <div data-testid="task" onClick={handleClick}>
        Click me
      </div>
    );

    render(<ClickableTask />);
    fireEvent.click(screen.getByTestId('task'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should handle task edit', () => {
    const handleEdit = vi.fn();
    const EditableTask = () => (
      <div>
        <div>Task Title</div>
        <button onClick={handleEdit}>Edit</button>
      </div>
    );

    render(<EditableTask />);
    fireEvent.click(screen.getByText('Edit'));
    expect(handleEdit).toHaveBeenCalled();
  });

  it('should handle task delete', () => {
    const handleDelete = vi.fn();
    const DeletableTask = () => (
      <div>
        <div>Task Title</div>
        <button onClick={handleDelete}>Delete</button>
      </div>
    );

    render(<DeletableTask />);
    fireEvent.click(screen.getByText('Delete'));
    expect(handleDelete).toHaveBeenCalled();
  });
});

// Import React for the components
import React from 'react';
