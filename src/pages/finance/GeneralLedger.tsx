import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Download, Eye, FileText, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BackButton } from '@/components/ui/back-button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useFinanceAPI } from '@/hooks/useFinanceAPI';

interface JournalEntry {
  id: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  status: 'Draft' | 'Posted';
  source: 'Revenue' | 'Manual' | 'Payout';
  trace_id: string;
}

const GeneralLedger = () => {
  const navigate = useNavigate();
  const { getJournals } = useFinanceAPI();
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJournal, setSelectedJournal] = useState<JournalEntry | null>(null);

  useEffect(() => {
    const fetchJournals = async () => {
      try {
        const data = await getJournals();
        // Transform the data to match JournalEntry interface
        const transformedData = data.map((journal: any) => ({
          id: journal.journal_id,
          date: journal.created_at.split('T')[0],
          description: journal.description,
          debit: journal.finance_journal_lines?.reduce((sum: number, line: any) => sum + parseFloat(line.debit || 0), 0) || 0,
          credit: journal.finance_journal_lines?.reduce((sum: number, line: any) => sum + parseFloat(line.credit || 0), 0) || 0,
          balance: 0, // Calculate running balance if needed
          status: journal.status as 'Draft' | 'Posted',
          source: journal.journal_type as 'Revenue' | 'Manual' | 'Payout',
          trace_id: journal.trace_id
        }));
        setJournals(transformedData);
      } catch (error) {
        console.error('Failed to fetch journals:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJournals();
  }, [getJournals]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Posted': return 'default';
      case 'Draft': return 'secondary';
      default: return 'outline';
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'Revenue': return 'bg-green-100 text-green-800';
      case 'Payout': return 'bg-blue-100 text-blue-800';
      case 'Manual': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-secondary/10 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 animate-spin border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading journals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-secondary/10">
      {/* Header */}
      <header className="bg-card border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <BackButton />
            <div className="ml-4">
              <h1 className="text-xl font-bold text-primary flex items-center">
                <FileText className="w-6 h-6 mr-2" />
                General Ledger
              </h1>
              <p className="text-sm text-muted-foreground">View and manage journal entries</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search journals..."
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => navigate('/tenant-admin-dashboard/finance/journal-entry')}>
              <Plus className="w-4 h-4 mr-2" />
              New Entry
            </Button>
          </div>
        </div>

        {/* Journal Entries Grid */}
        <Card>
          <CardHeader>
            <CardTitle>Journal Entries</CardTitle>
            <CardDescription>All journal entries with their current status</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Journal ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Trace ID</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {journals.map((journal) => (
                  <TableRow key={journal.id}>
                    <TableCell className="font-medium">{journal.id}</TableCell>
                    <TableCell>{journal.date}</TableCell>
                    <TableCell>{journal.description}</TableCell>
                    <TableCell className="text-right">
                      {journal.debit > 0 ? `₹${journal.debit.toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {journal.credit > 0 ? `₹${journal.credit.toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell className="text-right">₹{journal.balance.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(journal.status)}>{journal.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${getSourceColor(journal.source)}`}>
                        {journal.source}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{journal.trace_id}</TableCell>
                    <TableCell>
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedJournal(journal)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </SheetTrigger>
                        <SheetContent>
                          <SheetHeader>
                            <SheetTitle>Journal Entry Details</SheetTitle>
                            <SheetDescription>
                              View detailed information for journal {selectedJournal?.id}
                            </SheetDescription>
                          </SheetHeader>
                          {selectedJournal && (
                            <div className="mt-6 space-y-4">
                              <div>
                                <label className="text-sm font-medium">Description</label>
                                <p className="text-sm text-muted-foreground">{selectedJournal.description}</p>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium">Debit</label>
                                  <p className="text-sm">₹{selectedJournal.debit.toLocaleString()}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Credit</label>
                                  <p className="text-sm">₹{selectedJournal.credit.toLocaleString()}</p>
                                </div>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Status</label>
                                <p className="text-sm">
                                  <Badge variant={getStatusColor(selectedJournal.status)}>
                                    {selectedJournal.status}
                                  </Badge>
                                </p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Trace ID</label>
                                <p className="text-sm font-mono">{selectedJournal.trace_id}</p>
                              </div>
                            </div>
                          )}
                        </SheetContent>
                      </Sheet>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default GeneralLedger;