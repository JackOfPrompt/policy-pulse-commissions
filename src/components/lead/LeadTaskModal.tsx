import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Plus, Check, X, AlertTriangle } from 'lucide-react';

interface Lead {
  id: string;
  leadNumber: string;
  customerName: string;
  phone: string;
  email?: string;
  productInterest: string;
  leadSource: string;
  assignedTo: string;
  status: 'New' | 'Contacted' | 'Quoted' | 'In Discussion' | 'Converted' | 'Dropped';
  priority: 'Low' | 'Medium' | 'High';
  createdAt: string;
  lastContactDate?: string;
  nextFollowUp?: string;
  estimatedValue?: number;
  remarks?: string;
  daysSinceLastContact?: number;
}

interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  dueTime: string;
  priority: 'Low' | 'Medium' | 'High';
  type: 'call' | 'email' | 'meeting' | 'follow_up' | 'other';
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
  completedAt?: string;
  reminderSent?: boolean;
}

interface LeadTaskModalProps {
  lead: Lead;
  open: boolean;
  onClose: () => void;
}

export const LeadTaskModal: React.FC<LeadTaskModalProps> = ({
  lead,
  open,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'existing'>('create');
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    dueDate: '',
    dueTime: '',
    priority: 'Medium' as 'Low' | 'Medium' | 'High',
    type: 'follow_up' as 'call' | 'email' | 'meeting' | 'follow_up' | 'other'
  });

  // Mock existing tasks for this lead
  const existingTasks: Task[] = [
    {
      id: '1',
      title: 'Follow-up call with customer',
      description: 'Call to discuss quote details and answer questions',
      dueDate: '2024-01-20',
      dueTime: '10:00',
      priority: 'High',
      type: 'call',
      status: 'pending',
      createdAt: '2024-01-18',
      reminderSent: false
    },
    {
      id: '2',
      title: 'Send policy comparison document',
      description: 'Email comparison of different policy options',
      dueDate: '2024-01-19',
      dueTime: '14:00',
      priority: 'Medium',
      type: 'email',
      status: 'completed',
      createdAt: '2024-01-17',
      completedAt: '2024-01-19'
    },
    {
      id: '3',
      title: 'Schedule meeting for policy discussion',
      description: 'In-person meeting to finalize policy details',
      dueDate: '2024-01-22',
      dueTime: '11:00',
      priority: 'High',
      type: 'meeting',
      status: 'pending',
      createdAt: '2024-01-18',
      reminderSent: true
    }
  ];

  const taskTypes = [
    { value: 'call', label: 'Phone Call' },
    { value: 'email', label: 'Send Email' },
    { value: 'meeting', label: 'Meeting' },
    { value: 'follow_up', label: 'Follow-up' },
    { value: 'other', label: 'Other' }
  ];

  const priorityColors = {
    'Low': 'text-green-600',
    'Medium': 'text-orange-600',
    'High': 'text-red-600'
  };

  const statusVariants = {
    'pending': 'secondary',
    'completed': 'default',
    'cancelled': 'destructive'
  } as const;

  const handleCreateTask = () => {
    if (!newTask.title || !newTask.dueDate || !newTask.dueTime) {
      return;
    }

    const task = {
      ...newTask,
      id: Date.now().toString(),
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
      reminderSent: false
    };

    // Save task to database
    console.log('Creating new task for lead:', lead.id, task);
    
    // Reset form
    setNewTask({
      title: '',
      description: '',
      dueDate: '',
      dueTime: '',
      priority: 'Medium',
      type: 'follow_up'
    });

    // Show success message
    alert('Task created successfully!');
  };

  const handleCompleteTask = (taskId: string) => {
    // Update task status in database
    console.log('Completing task:', taskId);
  };

  const handleCancelTask = (taskId: string) => {
    // Update task status in database
    console.log('Cancelling task:', taskId);
  };

  const isOverdue = (dueDate: string, dueTime: string) => {
    const due = new Date(`${dueDate}T${dueTime}`);
    return due < new Date();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Tasks & Reminders - {lead.customerName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="flex gap-4 border-b">
            <button
              className={`pb-2 px-1 border-b-2 transition-colors ${
                activeTab === 'create' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab('create')}
            >
              Create Task
            </button>
            <button
              className={`pb-2 px-1 border-b-2 transition-colors ${
                activeTab === 'existing' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab('existing')}
            >
              Existing Tasks ({existingTasks.length})
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'create' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Create New Task</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Task Type</label>
                    <Select value={newTask.type} onValueChange={(value: any) => setNewTask({...newTask, type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {taskTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Priority</label>
                    <Select value={newTask.priority} onValueChange={(value: any) => setNewTask({...newTask, priority: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Task Title</label>
                  <Input
                    placeholder="Enter task title..."
                    value={newTask.title}
                    onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    placeholder="Enter task description..."
                    value={newTask.description}
                    onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Due Date</label>
                    <Input
                      type="date"
                      value={newTask.dueDate}
                      onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Due Time</label>
                    <Input
                      type="time"
                      value={newTask.dueTime}
                      onChange={(e) => setNewTask({...newTask, dueTime: e.target.value})}
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleCreateTask}
                  disabled={!newTask.title || !newTask.dueDate || !newTask.dueTime}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Task
                </Button>
              </CardContent>
            </Card>
          )}

          {activeTab === 'existing' && (
            <div className="space-y-4">
              {existingTasks.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">No tasks found for this lead.</p>
                  </CardContent>
                </Card>
              ) : (
                existingTasks.map((task) => (
                  <Card key={task.id} className={isOverdue(task.dueDate, task.dueTime) && task.status === 'pending' ? 'border-red-200 bg-red-50' : ''}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{task.title}</h3>
                            <Badge variant={statusVariants[task.status]} className="text-xs">
                              {task.status}
                            </Badge>
                            <span className={`text-xs font-medium ${priorityColors[task.priority]}`}>
                              {task.priority}
                            </span>
                            {isOverdue(task.dueDate, task.dueTime) && task.status === 'pending' && (
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                          
                          <p className="text-sm text-muted-foreground">{task.description}</p>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{task.dueTime}</span>
                            </div>
                            <span>Type: {taskTypes.find(t => t.value === task.type)?.label}</span>
                            {task.reminderSent && (
                              <Badge variant="outline" className="text-xs">
                                Reminder Sent
                              </Badge>
                            )}
                          </div>

                          {task.completedAt && (
                            <p className="text-xs text-green-600">
                              Completed on {new Date(task.completedAt).toLocaleString()}
                            </p>
                          )}
                        </div>

                        {task.status === 'pending' && (
                          <div className="flex gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCompleteTask(task.id)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCancelTask(task.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};