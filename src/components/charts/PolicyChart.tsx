import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

interface PolicyData {
  month: string;
  policies: number;
  premium: number;
}

interface PolicyStatusData {
  name: string;
  value: number;
  color: string;
}

const monthlyData: PolicyData[] = [
  { month: 'Jan', policies: 45, premium: 1250000 },
  { month: 'Feb', policies: 52, premium: 1420000 },
  { month: 'Mar', policies: 48, premium: 1380000 },
  { month: 'Apr', policies: 61, premium: 1650000 },
  { month: 'May', policies: 55, premium: 1520000 },
  { month: 'Jun', policies: 67, premium: 1780000 },
];

const statusData: PolicyStatusData[] = [
  { name: 'Active', value: 342, color: 'hsl(var(--success))' },
  { name: 'Renewal Due', value: 48, color: 'hsl(var(--warning))' },
  { name: 'Expired', value: 23, color: 'hsl(var(--muted-foreground))' },
  { name: 'Pending', value: 15, color: 'hsl(var(--info))' },
];

export function PolicyBarChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={monthlyData}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis 
          dataKey="month" 
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
        />
        <YAxis 
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px',
          }}
        />
        <Bar 
          dataKey="policies" 
          fill="hsl(var(--primary))"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function PremiumLineChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={monthlyData}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis 
          dataKey="month" 
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
        />
        <YAxis 
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickFormatter={(value) => `₹${(value / 100000).toFixed(1)}L`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px',
          }}
          formatter={(value: number) => [`₹${(value / 100000).toFixed(1)}L`, 'Premium']}
        />
        <Line 
          type="monotone" 
          dataKey="premium" 
          stroke="hsl(var(--success))"
          strokeWidth={3}
          dot={{ fill: 'hsl(var(--success))', r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function PolicyStatusPieChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={statusData}
          cx="50%"
          cy="50%"
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        >
          {statusData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px',
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}