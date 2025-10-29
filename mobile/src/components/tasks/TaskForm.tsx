import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import RNPickerSelect from 'react-native-picker-select';
import { useAuth } from '../../hooks/useAuth';
import { taskService } from '../../services/taskService';
import { Task, TaskFormData } from '../../types/Task';

interface Props {
  task?: Task | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const TaskForm: React.FC<Props> = ({ task, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    startTime: '',
    priority: 'medium',
    tags: '',
    isRepeating: false,
    repeatFrequency: 'daily',
    repeatEndDate: '',
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        startDate: task.startDate,
        startTime: task.startTime || '',
        priority: task.priority,
        tags: task.tags.join(', '),
        isRepeating: task.isRepeating,
        repeatFrequency: task.repeatFrequency || 'daily',
        repeatEndDate: task.repeatEndDate || '',
      });
    }
  }, [task]);

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    setLoading(true);
    try {
      if (task) {
        // Update existing task
        const updates: Partial<Task> = {
          title: formData.title,
          description: formData.description,
          startDate: formData.startDate,
          startTime: formData.startTime || undefined,
          priority: formData.priority,
          tags: formData.tags
            .split(',')
            .map((t) => t.trim())
            .filter((t) => t.length > 0),
          isRepeating: formData.isRepeating,
          repeatFrequency: formData.isRepeating ? formData.repeatFrequency : undefined,
          repeatEndDate: formData.isRepeating ? formData.repeatEndDate : undefined,
        };
        await taskService.updateTask(task.id, updates);
      } else {
        // Create new task
        await taskService.createTask(user.uid, formData);
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving task:', error);
      Alert.alert('Error', 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setFormData({
        ...formData,
        startDate: selectedDate.toISOString().split('T')[0],
      });
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      setFormData({
        ...formData,
        startTime: `${hours}:${minutes}`,
      });
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setFormData({
        ...formData,
        repeatEndDate: selectedDate.toISOString().split('T')[0],
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{task ? 'Edit Task' : 'Create New Task'}</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.form}>
        {/* Title */}
        <Text style={styles.label}>Task Title *</Text>
        <TextInput
          style={styles.input}
          value={formData.title}
          onChangeText={(text) => setFormData({ ...formData, title: text })}
          placeholder="Enter task title"
        />

        {/* Description */}
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.description}
          onChangeText={(text) => setFormData({ ...formData, description: text })}
          placeholder="Enter task description (optional)"
          multiline
          numberOfLines={4}
        />

        {/* Date */}
        <Text style={styles.label}>Date</Text>
        <TouchableOpacity
          style={styles.input}
          onPress={() => setShowDatePicker(true)}
        >
          <Text>{formData.startDate || 'Select date'}</Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={formData.startDate ? new Date(formData.startDate) : new Date()}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}

        {/* Time */}
        <Text style={styles.label}>Time (optional)</Text>
        <TouchableOpacity
          style={styles.input}
          onPress={() => setShowTimePicker(true)}
        >
          <Text>{formData.startTime || 'Select time'}</Text>
        </TouchableOpacity>
        <Text style={styles.helperText}>Time is optional</Text>

        {showTimePicker && (
          <DateTimePicker
            value={
              formData.startTime
                ? new Date(`2000-01-01T${formData.startTime}`)
                : new Date()
            }
            mode="time"
            display="default"
            onChange={handleTimeChange}
          />
        )}

        {/* Priority */}
        <Text style={styles.label}>Priority</Text>
        <RNPickerSelect
          value={formData.priority}
          onValueChange={(value) => setFormData({ ...formData, priority: value })}
          items={[
            { label: 'Low', value: 'low' },
            { label: 'Medium', value: 'medium' },
            { label: 'High', value: 'high' },
          ]}
          style={pickerSelectStyles}
        />

        {/* Tags */}
        <Text style={styles.label}>Tags</Text>
        <TextInput
          style={styles.input}
          value={formData.tags}
          onChangeText={(text) => setFormData({ ...formData, tags: text })}
          placeholder="work, urgent, meeting"
        />
        <Text style={styles.helperText}>Separate tags with commas</Text>

        {/* Repeating Task */}
        <View style={styles.switchContainer}>
          <Text style={styles.label}>🔄 Make this a repeating task</Text>
          <Switch
            value={formData.isRepeating}
            onValueChange={(value) => setFormData({ ...formData, isRepeating: value })}
          />
        </View>

        {formData.isRepeating && (
          <>
            <Text style={styles.label}>Repeat Frequency</Text>
            <RNPickerSelect
              value={formData.repeatFrequency}
              onValueChange={(value) =>
                setFormData({ ...formData, repeatFrequency: value })
              }
              items={[
                { label: 'Daily', value: 'daily' },
                { label: 'Weekly', value: 'weekly' },
                { label: 'Monthly', value: 'monthly' },
              ]}
              style={pickerSelectStyles}
            />

            <Text style={styles.label}>Repeat Until (End Date)</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowEndDatePicker(true)}
            >
              <Text>{formData.repeatEndDate || 'Select end date'}</Text>
            </TouchableOpacity>

            {showEndDatePicker && (
              <DateTimePicker
                value={
                  formData.repeatEndDate ? new Date(formData.repeatEndDate) : new Date()
                }
                mode="date"
                display="default"
                onChange={handleEndDateChange}
              />
            )}

            {formData.repeatFrequency && formData.repeatEndDate && (
              <Text style={styles.helperText}>
                Repeats {formData.repeatFrequency} until {formData.repeatEndDate}
              </Text>
            )}
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={onClose}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.submitButton, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {task ? 'Update Task' : 'Create Task'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
  },
  form: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  button: {
    flex: 1,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    color: '#333',
  },
  inputAndroid: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    color: '#333',
  },
});
