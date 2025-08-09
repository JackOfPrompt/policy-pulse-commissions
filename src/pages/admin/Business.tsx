import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FunnelChart, Funnel, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import { Target, TrendingUp, Users, Building2, FileText, Download, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { DateRange } from "react-day-picker";
import { addDays } from "date-fns";
import { useBusinessData } from "@/hooks/useBusinessData";

export default function Business() {
  const { data: businessData, loading, error } = useBusinessData();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedTeam, setSelectedTeam] = useState("all");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading business data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold">Error Loading Business Data</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  const { 
    businessSummary, 
    conversionFunnelData, 
    branchPerformanceData, 
    teamTargetsData, 
    leadSourceData 
  } = businessData;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getAchievementColor = (achievement: number) => {
    if (achievement >= 100) return "text-green-600";
    if (achievement >= 80) return "text-blue-600";
    if (achievement >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getAchievementBadge = (achievement: number) => {
    if (achievement >= 100) return "bg-green-100 text-green-800";
    if (achievement >= 80) return "bg-blue-100 text-blue-800";
    if (achievement >= 60) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div></div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Business Report
          </Button>
          <Button>
            <Target className="h-4 w-4 mr-2" />
            Set Business Targets
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{businessSummary.totalLeads.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Generated this month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{businessSummary.conversionRate}%</div>
            <Progress value={businessSummary.conversionRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {businessSummary.convertedPolicies} policies converted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Policy Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {businessSummary.cancelledPolicies + businessSummary.rejectedPolicies}
            </div>
            <p className="text-xs text-muted-foreground">
              {businessSummary.cancelledPolicies} cancelled, {businessSummary.rejectedPolicies} rejected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Target Achievement</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{businessSummary.targetAchievement}%</div>
            <Progress value={businessSummary.targetAchievement} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Current quarter performance
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Business Overview</TabsTrigger>
          <TabsTrigger value="branches">Branch Performance</TabsTrigger>
          <TabsTrigger value="targets">Team Targets</TabsTrigger>
          <TabsTrigger value="conversion">Conversion Funnel</TabsTrigger>
          <TabsTrigger value="sources">Lead Sources</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Conversion Funnel Overview</CardTitle>
                <CardDescription>
                  Lead to policy conversion journey
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <FunnelChart>
                    <Funnel 
                      dataKey="value" 
                      data={conversionFunnelData} 
                      isAnimationActive
                    >
                      {conversionFunnelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Funnel>
                    <Tooltip />
                  </FunnelChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Business Health Indicators</CardTitle>
                <CardDescription>
                  Key performance indicators at a glance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Lead Quality Score</span>
                  <span className="text-sm font-bold text-green-600">85%</span>
                </div>
                <Progress value={85} />

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Customer Satisfaction</span>
                  <span className="text-sm font-bold text-blue-600">92%</span>
                </div>
                <Progress value={92} />

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Policy Retention Rate</span>
                  <span className="text-sm font-bold text-purple-600">88%</span>
                </div>
                <Progress value={88} />

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Agent Productivity</span>
                  <span className="text-sm font-bold text-orange-600">78%</span>
                </div>
                <Progress value={78} />
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Business Analysis Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4 items-center">
                <DatePickerWithRange
                  value={dateRange}
                  onChange={setDateRange}
                  placeholder="Select date range"
                />
                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select Branch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    <SelectItem value="mumbai">Mumbai Central</SelectItem>
                    <SelectItem value="delhi">Delhi North</SelectItem>
                    <SelectItem value="bangalore">Bangalore Tech</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select Team" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Teams</SelectItem>
                    <SelectItem value="sales-a">Sales Team A</SelectItem>
                    <SelectItem value="sales-b">Sales Team B</SelectItem>
                    <SelectItem value="renewal">Renewal Team</SelectItem>
                  </SelectContent>
                </Select>
                <Button>Apply Filters</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branches" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Branch-wise Performance</CardTitle>
              <CardDescription>
                Detailed performance metrics for each branch
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Branch</TableHead>
                      <TableHead>Leads</TableHead>
                      <TableHead>Converted</TableHead>
                      <TableHead>Conversion Rate</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Target Achievement</TableHead>
                      <TableHead>Team Size</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {branchPerformanceData.map((branch, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{branch.branchName}</div>
                            <div className="text-sm text-muted-foreground">{branch.branchCode}</div>
                          </div>
                        </TableCell>
                        <TableCell>{branch.totalLeads}</TableCell>
                        <TableCell>{branch.convertedPolicies}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{branch.conversionRate}%</span>
                            <Progress value={branch.conversionRate} className="w-20" />
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(branch.revenue)}</TableCell>
                        <TableCell>
                          <Badge className={getAchievementBadge(branch.targetAchievement)}>
                            {branch.targetAchievement}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{branch.employees} employees</div>
                            <div className="text-muted-foreground">{branch.agents} agents</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">View Details</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="targets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Targets vs Achievement</CardTitle>
              <CardDescription>
                Track team performance against set targets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {teamTargetsData.map((team, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-medium">{team.teamName}</h4>
                        <p className="text-sm text-muted-foreground">
                          Led by {team.leader} • {team.period}
                        </p>
                      </div>
                      <Badge className={getAchievementBadge(team.achievement)}>
                        {team.achievement}% Achieved
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Target: {formatCurrency(team.target)}</span>
                        <span>Achieved: {formatCurrency(team.achieved)}</span>
                      </div>
                      <Progress value={team.achievement} />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Remaining: {formatCurrency(team.target - team.achieved)}</span>
                        <span className={getAchievementColor(team.achievement)}>
                          {team.achievement >= 100 ? "Target Exceeded!" : "In Progress"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Conversion Analysis</CardTitle>
              <CardDescription>
                Deep dive into the lead to policy conversion process
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={conversionFunnelData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
              
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Quote to Policy</span>
                  </div>
                  <div className="text-2xl font-bold">67.8%</div>
                  <p className="text-sm text-muted-foreground">Conversion efficiency</p>
                </Card>
                
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">Underwriting Success</span>
                  </div>
                  <div className="text-2xl font-bold">86.6%</div>
                  <p className="text-sm text-muted-foreground">Approval rate</p>
                </Card>
                
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    <span className="font-medium">Payment Success</span>
                  </div>
                  <div className="text-2xl font-bold">94.0%</div>
                  <p className="text-sm text-muted-foreground">Collection efficiency</p>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lead Source Performance</CardTitle>
              <CardDescription>
                Analyze conversion rates by lead source
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lead Source</TableHead>
                      <TableHead>Total Leads</TableHead>
                      <TableHead>Converted</TableHead>
                      <TableHead>Conversion Rate</TableHead>
                      <TableHead>Performance</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leadSourceData.map((source, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{source.source}</TableCell>
                        <TableCell>{source.leads}</TableCell>
                        <TableCell>{source.converted}</TableCell>
                        <TableCell>{source.rate}%</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={source.rate} className="w-20" />
                            <span className={getAchievementColor(source.rate)}>
                              {source.rate >= 60 ? "Excellent" : 
                               source.rate >= 50 ? "Good" : 
                               source.rate >= 40 ? "Average" : "Poor"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">Optimize</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}