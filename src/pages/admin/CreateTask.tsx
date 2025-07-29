import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface Employee {
  id: string;
  name: string;
  employee_id: string;
}

interface Agent {
  id: string;
  name: string;
  agent_code: string;
}

const CreateTask = () => {
  const [formData, setFormData] = useState({
    taskTitle: "",
    description: "",
    assignedToEmployeeId: "",
    assignedToAgentId: "",
    relatedTo: "",
    relatedId: "",
    priority: "Medium",
    taskType: "",
    dueDate: new Date(),
    dueTime: "09:00",
    reminderDateTime: "",
    isRecurring: false,
    recurrencePattern: "",
    recurrenceEndDate: "",
    notes: ""
  });

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const { toast } = useToast();
  const navigate = useNavigate();

  const taskTypes = [
    "Call", "Visit", "Document Collection", "Follow-up", 
    "Renewal", "Payment Collection", "Custom"
  ];

  const priorities = ["Low", "Medium", "High"];
  const relatedToOptions = ["Lead", "Policy", "Renewal", "Agent", "Customer", "Custom"];
  const recurrencePatterns = ["Daily", "Weekly", "Monthly"];

  useEffect(() => {
    fetchEmployees();
    fetchAgents();
  }, []);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from("employees")
        .select("id, name, employee_id")
        .eq("status", "Active")
        .order("name");

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const fetchAgents = async () => {
    try {
      const { data, error } = await supabase
        .from("agents")
        .select("id, name, agent_code")
        .eq("status", "Active")
        .order("name");

      if (error) throw error;
      setAgents(data || []);
    } catch (error) {
      console.error("Error fetching agents:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.taskTitle.trim()) {
      toast({
        title: "Error",
        description: "Task title is required",
        variant: "destructive"
      });
      return;
    }

    if (!formData.taskType) {
      toast({
        title: "Error",
        description: "Task type is required",
        variant: "destructive"
      });
      return;
    }

    if (!formData.assignedToEmployeeId && !formData.assignedToAgentId) {
      toast({
        title: "Error",
        description: "Please assign the task to an employee or agent",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Combine date and time for due date
      const [hours, minutes] = formData.dueTime.split(":");
      const dueDateTime = new Date(formData.dueDate);
      dueDateTime.setHours(parseInt(hours), parseInt(minutes));

      const taskData = {
        task_title: formData.taskTitle,
        description: formData.description || null,
        assigned_to_employee_id: formData.assignedToEmployeeId || null,
        assigned_to_agent_id: formData.assignedToAgentId || null,
        related_to: formData.relatedTo as any || null,
        related_id: formData.relatedId || null,
        priority: formData.priority as any,
        task_type: formData.taskType as any,
        due_date: dueDateTime.toISOString(),
        reminder_date_time: formData.reminderDateTime ? new Date(formData.reminderDateTime).toISOString() : null,
        is_recurring: formData.isRecurring,
        recurrence_pattern: formData.isRecurring ? formData.recurrencePattern as any : null,
        recurrence_end_date: formData.isRecurring && formData.recurrenceEndDate ? formData.recurrenceEndDate : null,
        notes: formData.notes || null
      };

      const { error } = await supabase
        .from("tasks")
        .insert(taskData);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Task created successfully"
      });

      navigate("/admin/tasks");

    } catch (error) {
      console.error("Error creating task:", error);
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="border-b border-border pb-4">
        <h1 className="text-3xl font-bold text-foreground">Create New Task</h1>
        <p className="text-muted-foreground mt-1">
          Create and assign tasks to employees and agents
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Task Information */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Task Details</CardTitle>
              <CardDescription>
                Basic information about the task
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="taskTitle">Task Title *</Label>
                <Input
                  id="taskTitle"
                  value={formData.taskTitle}
                  onChange={(e) => handleInputChange("taskTitle", e.target.value)}
                  placeholder="Enter task title"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Describe the task details"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="taskType">Task Type *</Label>
                  <Select value={formData.taskType} onValueChange={(value) => handleInputChange("taskType", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {taskTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {priorities.map((priority) => (
                        <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  placeholder="Any additional notes or instructions"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Assignment and Schedule */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Assignment & Schedule</CardTitle>
              <CardDescription>
                Assign the task and set due date
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="assignedEmployee">Assigned Employee</Label>
                <Select value={formData.assignedToEmployeeId} onValueChange={(value) => handleInputChange("assignedToEmployeeId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name} ({employee.employee_id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="assignedAgent">Assigned Agent</Label>
                <Select value={formData.assignedToAgentId} onValueChange={(value) => handleInputChange("assignedToAgentId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select agent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name} ({agent.agent_code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Due Date *</Label>
                  <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.dueDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.dueDate ? format(formData.dueDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={formData.dueDate}
                        onSelect={(date) => {
                          if (date) {
                            handleInputChange("dueDate", date);
                            setShowCalendar(false);
                          }
                        }}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label htmlFor="dueTime">Due Time</Label>
                  <Input
                    id="dueTime"
                    type="time"
                    value={formData.dueTime}
                    onChange={(e) => handleInputChange("dueTime", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="reminderDateTime">Reminder Date & Time</Label>
                <Input
                  id="reminderDateTime"
                  type="datetime-local"
                  value={formData.reminderDateTime}
                  onChange={(e) => handleInputChange("reminderDateTime", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Related Entity */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Related Entity</CardTitle>
              <CardDescription>
                Link this task to a specific record
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="relatedTo">Related To</Label>
                <Select value={formData.relatedTo} onValueChange={(value) => handleInputChange("relatedTo", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select entity type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {relatedToOptions.map((option) => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="relatedId">Related ID</Label>
                <Input
                  id="relatedId"
                  value={formData.relatedId}
                  onChange={(e) => handleInputChange("relatedId", e.target.value)}
                  placeholder="Enter related entity ID"
                />
              </div>
            </CardContent>
          </Card>

          {/* Recurring Settings */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Recurring Settings</CardTitle>
              <CardDescription>
                Configure recurring tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isRecurring"
                  checked={formData.isRecurring}
                  onCheckedChange={(checked) => handleInputChange("isRecurring", checked)}
                />
                <Label htmlFor="isRecurring">Make this a recurring task</Label>
              </div>

              {formData.isRecurring && (
                <>
                  <div>
                    <Label htmlFor="recurrencePattern">Recurrence Pattern</Label>
                    <Select value={formData.recurrencePattern} onValueChange={(value) => handleInputChange("recurrencePattern", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select pattern" />
                      </SelectTrigger>
                      <SelectContent>
                        {recurrencePatterns.map((pattern) => (
                          <SelectItem key={pattern} value={pattern}>{pattern}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="recurrenceEndDate">Recurrence End Date</Label>
                    <Input
                      id="recurrenceEndDate"
                      type="date"
                      value={formData.recurrenceEndDate}
                      onChange={(e) => handleInputChange("recurrenceEndDate", e.target.value)}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate("/admin/tasks")}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="bg-gradient-primary">
            {loading ? "Creating..." : "Create Task"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateTask;