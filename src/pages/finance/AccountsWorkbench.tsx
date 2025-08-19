import React, { useState } from 'react';
import { Search, Filter, Download, Eye, Plus, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BackButton } from '@/components/ui/back-button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

interface Account {
  code: string;
  name: string;
  type: 'Asset' | 'Liability' | 'Income' | 'Expense' | 'Equity';
  balance: number;
  lastActivity: string;
  transactions: Transaction[];
}

interface Transaction {
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

const AccountsWorkbench = () => {
  const [accounts] = useState<Account[]>([
    {
      code: '1001',
      name: 'Cash in Hand',
      type: 'Asset',
      balance: 125000,
      lastActivity: '2024-01-17',
      transactions: [
        { date: '2024-01-15', description: 'Opening Balance', debit: 100000, credit: 0, balance: 100000 },
        { date: '2024-01-16', description: 'Cash Receipt', debit: 25000, credit: 0, balance: 125000 }
      ]
    },
    {
      code: '2001',
      name: 'Commission Payable',
      type: 'Liability',
      balance: 75000,
      lastActivity: '2024-01-16',
      transactions: [
        { date: '2024-01-15', description: 'Commission Accrual', debit: 0, credit: 75000, balance: 75000 }
      ]
    },
    {
      code: '4001',
      name: 'Premium Income',
      type: 'Income',
      balance: 200000,
      lastActivity: '2024-01-17',
      transactions: [
        { date: '2024-01-15', description: 'Motor Premium', debit: 0, credit: 50000, balance: 50000 },
        { date: '2024-01-16', description: 'Health Premium', debit: 0, credit: 75000, balance: 125000 },
        { date: '2024-01-17', description: 'Life Premium', debit: 0, credit: 75000, balance: 200000 }
      ]
    }
  ]);

  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Asset': return 'bg-green-100 text-green-800';
      case 'Liability': return 'bg-red-100 text-red-800';
      case 'Income': return 'bg-blue-100 text-blue-800';
      case 'Expense': return 'bg-orange-100 text-orange-800';
      case 'Equity': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-secondary/10">
      {/* Header */}
      <header className="bg-card border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <BackButton />
            <div className="ml-4">
              <h1 className="text-xl font-bold text-primary flex items-center">
                <TrendingUp className="w-6 h-6 mr-2" />
                Accounts Workbench
              </h1>
              <p className="text-sm text-muted-foreground">Manage chart of accounts and ledgers</p>
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
                placeholder="Search accounts..."
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
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Account
            </Button>
          </div>
        </div>

        {/* Accounts Grid */}
        <Card>
          <CardHeader>
            <CardTitle>Chart of Accounts</CardTitle>
            <CardDescription>All accounts with their current balances</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account Code</TableHead>
                  <TableHead>Account Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account) => (
                  <TableRow key={account.code}>
                    <TableCell className="font-medium">{account.code}</TableCell>
                    <TableCell>{account.name}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${getTypeColor(account.type)}`}>
                        {account.type}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ₹{account.balance.toLocaleString()}
                    </TableCell>
                    <TableCell>{account.lastActivity}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Sheet>
                          <SheetTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedAccount(account)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </SheetTrigger>
                          <SheetContent className="w-[600px] sm:w-[700px]">
                            <SheetHeader>
                              <SheetTitle>Account Ledger - {selectedAccount?.name}</SheetTitle>
                              <SheetDescription>
                                T-account view with running balance
                              </SheetDescription>
                            </SheetHeader>
                            {selectedAccount && (
                              <div className="mt-6">
                                {/* Account Summary */}
                                <Card className="mb-6">
                                  <CardContent className="pt-6">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <p className="text-sm font-medium">Account Code</p>
                                        <p className="text-lg">{selectedAccount.code}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium">Current Balance</p>
                                        <p className="text-lg font-bold">₹{selectedAccount.balance.toLocaleString()}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium">Account Type</p>
                                        <span className={`px-2 py-1 rounded-full text-xs ${getTypeColor(selectedAccount.type)}`}>
                                          {selectedAccount.type}
                                        </span>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium">Last Activity</p>
                                        <p className="text-lg">{selectedAccount.lastActivity}</p>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>

                                {/* T-Account View */}
                                <div className="space-y-4">
                                  <h3 className="text-lg font-semibold">Transaction History</h3>
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="text-right">Debit</TableHead>
                                        <TableHead className="text-right">Credit</TableHead>
                                        <TableHead className="text-right">Balance</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {selectedAccount.transactions.map((txn, index) => (
                                        <TableRow key={index}>
                                          <TableCell>{txn.date}</TableCell>
                                          <TableCell>{txn.description}</TableCell>
                                          <TableCell className="text-right">
                                            {txn.debit > 0 ? `₹${txn.debit.toLocaleString()}` : '-'}
                                          </TableCell>
                                          <TableCell className="text-right">
                                            {txn.credit > 0 ? `₹${txn.credit.toLocaleString()}` : '-'}
                                          </TableCell>
                                          <TableCell className="text-right font-medium">
                                            ₹{txn.balance.toLocaleString()}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            )}
                          </SheetContent>
                        </Sheet>
                        <Button variant="ghost" size="sm">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
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

export default AccountsWorkbench;