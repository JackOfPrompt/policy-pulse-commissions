import { supabase } from "@/integrations/supabase/client";

export interface TaskUploadData {
  taskTitle: string;
  description: string;
  assignedToEmployeeId: string;
  assignedToAgentId: string;
  relatedTo: string;
  relatedId: string;
  priority: string;
  taskType: string;
  dueDate: string;
  reminderDateTime: string;
  isRecurring: string;
  recurrencePattern: string;
  recurrenceEndDate: string;
  notes: string;
}

export const taskTemplate = {
  filename: "task_upload_template.csv",
  columns: [
    "taskTitle",
    "description",
    "assignedToEmployeeId",
    "assignedToAgentId",
    "relatedTo",
    "relatedId",
    "priority",
    "taskType",
    "dueDate",
    "reminderDateTime",
    "isRecurring",
    "recurrencePattern",
    "recurrenceEndDate",
    "notes"
  ]
};

export const taskSampleData: TaskUploadData[] = [
  {
    taskTitle: "Follow up with lead customer",
    description: "Contact potential customer about insurance needs",
    assignedToEmployeeId: "EMP001",
    assignedToAgentId: "",
    relatedTo: "Lead",
    relatedId: "",
    priority: "Medium",
    taskType: "Call",
    dueDate: "2024-12-25 10:00:00",
    reminderDateTime: "2024-12-24 09:00:00",
    isRecurring: "false",
    recurrencePattern: "",
    recurrenceEndDate: "",
    notes: "Customer showed interest in health insurance"
  },
  {
    taskTitle: "Policy document collection",
    description: "Collect signed policy documents from customer",
    assignedToEmployeeId: "EMP002",
    assignedToAgentId: "AGT001",
    relatedTo: "Policy",
    relatedId: "",
    priority: "High",
    taskType: "Document Collection",
    dueDate: "2024-12-20 14:00:00",
    reminderDateTime: "2024-12-19 12:00:00",
    isRecurring: "false",
    recurrencePattern: "",
    recurrenceEndDate: "",
    notes: "Documents required for policy activation"
  }
];

export const validateTaskData = (data: TaskUploadData[]): { valid: TaskUploadData[], errors: string[] } => {
  const valid: TaskUploadData[] = [];
  const errors: string[] = [];

  const validPriorities = ["Low", "Medium", "High"];
  const validTaskTypes = ["Call", "Visit", "Document Collection", "Follow-up", "Renewal", "Payment Collection", "Custom"];
  const validRelatedTo = ["Lead", "Policy", "Renewal", "Agent", "Customer", "Custom"];
  const validRecurrence = ["Daily", "Weekly", "Monthly"];

  data.forEach((row, index) => {
    const rowErrors: string[] = [];

    if (!row.taskTitle?.trim()) {
      rowErrors.push(`Row ${index + 1}: Task Title is required`);
    }

    if (!row.taskType?.trim()) {
      rowErrors.push(`Row ${index + 1}: Task Type is required`);
    } else if (!validTaskTypes.includes(row.taskType)) {
      rowErrors.push(`Row ${index + 1}: Invalid task type. Use: ${validTaskTypes.join(', ')}`);
    }

    if (!row.dueDate?.trim()) {
      rowErrors.push(`Row ${index + 1}: Due Date is required`);
    } else {
      const date = new Date(row.dueDate);
      if (isNaN(date.getTime())) {
        rowErrors.push(`Row ${index + 1}: Invalid due date format`);
      }
    }

    if (row.priority && !validPriorities.includes(row.priority)) {
      rowErrors.push(`Row ${index + 1}: Invalid priority. Use: ${validPriorities.join(', ')}`);
    }

    if (row.relatedTo && !validRelatedTo.includes(row.relatedTo)) {
      rowErrors.push(`Row ${index + 1}: Invalid related to. Use: ${validRelatedTo.join(', ')}`);
    }

    if (row.reminderDateTime && row.reminderDateTime.trim()) {
      const reminderDate = new Date(row.reminderDateTime);
      if (isNaN(reminderDate.getTime())) {
        rowErrors.push(`Row ${index + 1}: Invalid reminder date format`);
      }
    }

    if (row.isRecurring && !["true", "false"].includes(row.isRecurring.toLowerCase())) {
      rowErrors.push(`Row ${index + 1}: Is Recurring must be true or false`);
    }

    if (row.recurrencePattern && !validRecurrence.includes(row.recurrencePattern)) {
      rowErrors.push(`Row ${index + 1}: Invalid recurrence pattern. Use: ${validRecurrence.join(', ')}`);
    }

    if (row.recurrenceEndDate && row.recurrenceEndDate.trim()) {
      const endDate = new Date(row.recurrenceEndDate);
      if (isNaN(endDate.getTime())) {
        rowErrors.push(`Row ${index + 1}: Invalid recurrence end date format`);
      }
    }

    if (rowErrors.length === 0) {
      valid.push(row);
    } else {
      errors.push(...rowErrors);
    }
  });

  return { valid, errors };
};

export const uploadTaskData = async (data: TaskUploadData[]): Promise<{ success: number, failed: number, errors: string[] }> => {
  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const task of data) {
    try {
      let assignedEmployeeId = null;
      let assignedAgentId = null;

      // Look up employee by ID or name
      if (task.assignedToEmployeeId?.trim()) {
        const { data: employeeData, error: employeeError } = await supabase
          .from("employees")
          .select("id")
          .or(`employee_id.eq.${task.assignedToEmployeeId},name.ilike.%${task.assignedToEmployeeId}%`)
          .single();

        if (employeeError || !employeeData) {
          errors.push(`Employee not found: ${task.assignedToEmployeeId}`);
          failed++;
          continue;
        }
        assignedEmployeeId = employeeData.id;
      }

      // Look up agent by code or name
      if (task.assignedToAgentId?.trim()) {
        const { data: agentData, error: agentError } = await supabase
          .from("agents")
          .select("id")
          .or(`agent_code.eq.${task.assignedToAgentId},name.ilike.%${task.assignedToAgentId}%`)
          .single();

        if (agentError || !agentData) {
          errors.push(`Agent not found: ${task.assignedToAgentId}`);
          failed++;
          continue;
        }
        assignedAgentId = agentData.id;
      }

      // Insert task
      const { error: insertError } = await supabase
        .from("tasks")
        .insert({
          task_title: task.taskTitle,
          description: task.description || null,
          assigned_to_employee_id: assignedEmployeeId,
          assigned_to_agent_id: assignedAgentId,
          related_to: task.relatedTo as any || null,
          related_id: task.relatedId || null,
          priority: task.priority as any || "Medium",
          task_type: task.taskType as any,
          due_date: new Date(task.dueDate).toISOString(),
          reminder_date_time: task.reminderDateTime ? new Date(task.reminderDateTime).toISOString() : null,
          is_recurring: task.isRecurring?.toLowerCase() === "true",
          recurrence_pattern: task.recurrencePattern as any || null,
          recurrence_end_date: task.recurrenceEndDate ? task.recurrenceEndDate : null,
          notes: task.notes || null
        });

      if (insertError) {
        errors.push(`Failed to create task "${task.taskTitle}": ${insertError.message}`);
        failed++;
      } else {
        success++;
      }

    } catch (error) {
      errors.push(`Unexpected error processing task "${task.taskTitle}": ${error}`);
      failed++;
    }
  }

  return { success, failed, errors };
};