import React, { useState, useEffect } from 'react';
import { Save, Check, Upload, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BackButton } from '@/components/ui/back-button';
import { useFinanceAPI } from '@/hooks/useFinanceAPI';
import { useToast } from '@/hooks/use-toast';

interface JournalLine {
  id: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  currency: string;
  fxRate: number;
}

const JournalEntry = () => {
  const { createJournal, getAccounts } = useFinanceAPI();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [journalType, setJournalType] = useState('');
  const [date, setDate] = useState('');
  const [reference, setReference] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [lines, setLines] = useState<JournalLine[]>([
    {
      id: '1',
      accountCode: '',
      accountName: '',
      debit: 0,
      credit: 0,
      currency: 'INR',
      fxRate: 1
    }
  ]);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const accountsData = await getAccounts();
        setAccounts(accountsData);
      } catch (error) {
        console.error('Failed to fetch accounts:', error);
      }
    };

    fetchAccounts();
  }, [getAccounts]);

  const addLine = () => {
    const newLine: JournalLine = {
      id: Date.now().toString(),
      accountCode: '',
      accountName: '',
      debit: 0,
      credit: 0,
      currency: 'INR',
      fxRate: 1
    };
    setLines([...lines, newLine]);
  };

  const removeLine = (id: string) => {
    if (lines.length > 1) {
      setLines(lines.filter(line => line.id !== id));
    }
  };

  const updateLine = (id: string, field: keyof JournalLine, value: any) => {
    setLines(lines.map(line => 
      line.id === id ? { ...line, [field]: value } : line
    ));
  };

  const getTotalDebits = () => {
    return lines.reduce((sum, line) => sum + line.debit, 0);
  };

  const getTotalCredits = () => {
    return lines.reduce((sum, line) => sum + line.credit, 0);
  };

  const handleSaveJournal = async () => {
    try {
      setSaving(true);
      const journalData = {
        journal: {
          journal_type: journalType,
          reference_id: reference,
          description,
          created_by: 'current-user-id' // This should come from auth
        },
        lines: lines.filter(line => line.accountCode && (line.debit > 0 || line.credit > 0))
          .map(line => ({
            account_id: line.accountCode, // This should be the account_id from the selected account
            debit: line.debit,
            credit: line.credit,
            currency: line.currency,
            fx_rate: line.fxRate
          }))
      };

      await createJournal(journalData);
      toast({
        title: "Success",
        description: "Journal entry created successfully",
      });

      // Reset form
      setJournalType('');
      setDate('');
      setReference('');
      setDescription('');
      setLines([{
        id: '1',
        accountCode: '',
        accountName: '',
        debit: 0,
        credit: 0,
        currency: 'INR',
        fxRate: 1
      }]);
    } catch (error) {
      console.error('Failed to save journal:', error);
    } finally {
      setSaving(false);
    }
  };

  const isBalanced = () => {
    return getTotalDebits() === getTotalCredits() && getTotalDebits() > 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-secondary/10">
      {/* Header */}
      <header className="bg-card border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <BackButton />
            <div className="ml-4">
              <h1 className="text-xl font-bold text-primary">Journal Entry</h1>
              <p className="text-sm text-muted-foreground">Create new journal entry</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Journal Details */}
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Journal Details</CardTitle>
                <CardDescription>Enter the basic journal information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="journalType">Journal Type</Label>
                    <Select value={journalType} onValueChange={setJournalType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="accrual">Accrual</SelectItem>
                        <SelectItem value="payment">Payment</SelectItem>
                        <SelectItem value="adjustment">Adjustment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="reference">Reference</Label>
                  <Input
                    id="reference"
                    placeholder="earning_id, settlement_id, or payout_id"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Journal entry description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Journal Lines */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Journal Lines</CardTitle>
                    <CardDescription>Add debit and credit entries</CardDescription>
                  </div>
                  <Button onClick={addLine} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Line
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account Code</TableHead>
                      <TableHead>Debit</TableHead>
                      <TableHead>Credit</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead>FX Rate</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lines.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell>
                          <Select 
                            value={line.accountCode} 
                            onValueChange={(value) => {
                              const selectedAccount = accounts.find(acc => acc.account_id === value);
                              updateLine(line.id, 'accountCode', value);
                              updateLine(line.id, 'accountName', selectedAccount?.account_name || '');
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select account" />
                            </SelectTrigger>
                            <SelectContent>
                              {accounts.map((account) => (
                                <SelectItem key={account.account_id} value={account.account_id}>
                                  {account.account_code} - {account.account_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            placeholder="0.00"
                            value={line.debit || ''}
                            onChange={(e) => updateLine(line.id, 'debit', parseFloat(e.target.value) || 0)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            placeholder="0.00"
                            value={line.credit || ''}
                            onChange={(e) => updateLine(line.id, 'credit', parseFloat(e.target.value) || 0)}
                          />
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={line.currency} 
                            onValueChange={(value) => updateLine(line.id, 'currency', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="INR">INR</SelectItem>
                              <SelectItem value="USD">USD</SelectItem>
                              <SelectItem value="EUR">EUR</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.0001"
                            value={line.fxRate}
                            onChange={(e) => updateLine(line.id, 'fxRate', parseFloat(e.target.value) || 1)}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeLine(line.id)}
                            disabled={lines.length === 1}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Summary & Actions */}
          <div className="space-y-6">
            {/* Balance Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Balance Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Total Debits:</span>
                  <span className="font-medium">₹{getTotalDebits().toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Credits:</span>
                  <span className="font-medium">₹{getTotalCredits().toLocaleString()}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between items-center">
                    <span>Difference:</span>
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${isBalanced() ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{Math.abs(getTotalDebits() - getTotalCredits()).toLocaleString()}
                      </span>
                      {isBalanced() && <Check className="w-4 h-4 text-green-600" />}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full" onClick={handleSaveJournal} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Draft'}
                </Button>
                <Button variant="outline" className="w-full" disabled={!isBalanced() || saving}>
                  <Check className="w-4 h-4 mr-2" />
                  Validate
                </Button>
                <Button className="w-full" disabled={!isBalanced() || saving} onClick={handleSaveJournal}>
                  <Upload className="w-4 h-4 mr-2" />
                  {saving ? 'Posting...' : 'Post to GL'}
                </Button>
              </CardContent>
            </Card>

            {/* Attachment Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Attachments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Drop files here or click to upload</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Choose Files
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default JournalEntry;