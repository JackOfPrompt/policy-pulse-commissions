import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Phone, 
  Mail, 
  Calendar, 
  User, 
  Building, 
  FileText, 
  Clock, 
  Plus,
  Edit,
  Save
} from 'lucide-react';

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

interface Interaction {
  id: string;
  date: string;
  type: 'call' | 'email' | 'meeting' | 'note';
  description: string;
  outcome?: string;
  addedBy: string;
}

interface LeadDetailsModalProps {
  lead: Lead;
  open: boolean;
  onClose: () => void;
}

export const LeadDetailsModal: React.FC<LeadDetailsModalProps> = ({
  lead,
  open,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'timeline' | 'notes'>('details');
  const [isEditing, setIsEditing] = useState(false);
  const [editedLead, setEditedLead] = useState(lead);
  const [newNote, setNewNote] = useState('');

  // Mock interaction history
  const interactions: Interaction[] = [
    {
      id: '1',
      date: '2024-01-18T10:30:00',
      type: 'call',
      description: 'Initial contact call - customer interested in motor insurance',
      outcome: 'Positive response, requested quote',
      addedBy: 'Agent Name'
    },
    {
      id: '2',
      date: '2024-01-17T14:15:00',
      type: 'email',
      description: 'Sent product brochure and initial quote',
      addedBy: 'Agent Name'
    },
    {
      id: '3',
      date: '2024-01-16T09:00:00',
      type: 'note',
      description: 'Customer has a 2019 Honda City, looking for comprehensive coverage',
      addedBy: 'Agent Name'
    }
  ];

  const getStatusBadgeVariant = (status: Lead['status']) => {
    switch (status) {
      case 'New': return 'secondary';
      case 'Contacted': return 'outline';
      case 'Quoted': return 'default';
      case 'In Discussion': return 'default';
      case 'Converted': return 'default';
      case 'Dropped': return 'destructive';
      default: return 'secondary';
    }
  };

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'call': return <Phone className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'meeting': return <User className="h-4 w-4" />;
      case 'note': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const handleSave = () => {
    // Save changes to database
    console.log('Saving lead changes:', editedLead);
    setIsEditing(false);
  };

  const handleAddNote = () => {
    if (newNote.trim()) {
      const newInteraction: Interaction = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        type: 'note',
        description: newNote,
        addedBy: 'Current User'
      };
      
      // Add to interactions list and save to database
      console.log('Adding new note:', newInteraction);
      setNewNote('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span>Lead Details - {lead.leadNumber}</span>
              <Badge variant={getStatusBadgeVariant(lead.status)}>
                {lead.status}
              </Badge>
            </div>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button size="sm" onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="flex gap-4 border-b">
            <button
              className={`pb-2 px-1 border-b-2 transition-colors ${
                activeTab === 'details' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab('details')}
            >
              Lead Details
            </button>
            <button
              className={`pb-2 px-1 border-b-2 transition-colors ${
                activeTab === 'timeline' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab('timeline')}
            >
              Timeline
            </button>
            <button
              className={`pb-2 px-1 border-b-2 transition-colors ${
                activeTab === 'notes' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab('notes')}
            >
              Notes & Updates
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'details' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Customer Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Customer Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedLead.customerName}
                        onChange={(e) => setEditedLead({...editedLead, customerName: e.target.value})}
                        className="w-full p-2 border rounded"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{lead.customerName}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Phone</label>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{lead.phone}</span>
                    </div>
                  </div>

                  {lead.email && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email</label>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{lead.email}</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Product Interest</label>
                    {isEditing ? (
                      <Select value={editedLead.productInterest} onValueChange={(value) => setEditedLead({...editedLead, productInterest: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Motor Insurance">Motor Insurance</SelectItem>
                          <SelectItem value="Health Insurance">Health Insurance</SelectItem>
                          <SelectItem value="Life Insurance">Life Insurance</SelectItem>
                          <SelectItem value="Travel Insurance">Travel Insurance</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-sm">{lead.productInterest}</span>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Lead Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Lead Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    {isEditing ? (
                      <Select value={editedLead.status} onValueChange={(value: Lead['status']) => setEditedLead({...editedLead, status: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="New">New</SelectItem>
                          <SelectItem value="Contacted">Contacted</SelectItem>
                          <SelectItem value="Quoted">Quoted</SelectItem>
                          <SelectItem value="In Discussion">In Discussion</SelectItem>
                          <SelectItem value="Converted">Converted</SelectItem>
                          <SelectItem value="Dropped">Dropped</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant={getStatusBadgeVariant(lead.status)}>
                        {lead.status}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Priority</label>
                    {isEditing ? (
                      <Select value={editedLead.priority} onValueChange={(value: Lead['priority']) => setEditedLead({...editedLead, priority: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Low">Low</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline">{lead.priority}</Badge>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Lead Source</label>
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span>{lead.leadSource}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Created Date</label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(lead.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {lead.estimatedValue && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Estimated Value</label>
                      <span className="text-lg font-semibold text-green-600">
                        ₹{lead.estimatedValue.toLocaleString()}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'timeline' && (
            <Card>
              <CardHeader>
                <CardTitle>Interaction Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {interactions.map((interaction) => (
                    <div key={interaction.id} className="flex gap-4 p-4 border-l-2 border-muted">
                      <div className="flex-shrink-0 mt-1">
                        {getInteractionIcon(interaction.type)}
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium capitalize">{interaction.type}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(interaction.date).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-foreground">{interaction.description}</p>
                        {interaction.outcome && (
                          <p className="text-xs text-muted-foreground">Outcome: {interaction.outcome}</p>
                        )}
                        <p className="text-xs text-muted-foreground">Added by: {interaction.addedBy}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'notes' && (
            <Card>
              <CardHeader>
                <CardTitle>Add Note</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Add a note about this lead..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={3}
                />
                <Button onClick={handleAddNote} disabled={!newNote.trim()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Note
                </Button>

                {lead.remarks && (
                  <div className="mt-6">
                    <h4 className="font-medium mb-2">Existing Remarks</h4>
                    <p className="text-sm bg-muted p-3 rounded">{lead.remarks}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};