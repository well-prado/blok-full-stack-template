import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";

interface ChartSectionProps {
  data?: { name: string; total: number }[];
  title?: string;
  subtitle?: string;
}

const defaultData = [
  { name: "Jan", total: 1200 },
  { name: "Feb", total: 1900 },
  { name: "Mar", total: 1700 },
  { name: "Apr", total: 2800 },
  { name: "May", total: 2200 },
  { name: "Jun", total: 3200 },
  { name: "Jul", total: 2800 },
  { name: "Aug", total: 3800 },
  { name: "Sep", total: 3200 },
  { name: "Oct", total: 4200 },
  { name: "Nov", total: 3800 },
  { name: "Dec", total: 4800 },
];

export function ChartSection({
  data = defaultData,
  title = "User Activity Overview",
  subtitle = "Monthly user activity for the past year",
}: ChartSectionProps) {
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="rgba(99, 102, 241, 0.8)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="rgba(99, 102, 241, 0.1)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(148, 163, 184, 0.2)"
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "rgba(148, 163, 184, 0.8)", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "rgba(148, 163, 184, 0.8)", fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "12px",
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
                  color: "inherit",
                }}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="rgb(99, 102, 241)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorTotal)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
