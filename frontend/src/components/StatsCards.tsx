import {
  Activity,
  DollarSign,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { Card, CardContent } from "./ui/card";

interface StatsCardsProps {
  stats?: {
    title: string;
    value: string;
    change: string;
    trend: "up" | "down";
    icon: React.ComponentType<{ className?: string }>;
  }[];
}

const defaultStats = [
  {
    title: "Total Users",
    value: "2,350",
    change: "+20.1%",
    trend: "up" as const,
    icon: Users,
  },
  {
    title: "Admin Users",
    value: "45",
    change: "+5.2%",
    trend: "up" as const,
    icon: DollarSign,
  },
  {
    title: "Active Sessions",
    value: "1,234",
    change: "+12%",
    trend: "up" as const,
    icon: Activity,
  },
  {
    title: "System Health",
    value: "99.9%",
    change: "-0.1%",
    trend: "down" as const,
    icon: ShoppingCart,
  },
];

export function StatsCards({ stats = defaultStats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <Card key={index} className="glass-card glass-card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold mt-2">{stat.value}</p>
              </div>
              <div className="glass-icon-container">
                <stat.icon className="h-6 w-6" />
              </div>
            </div>

            <div className="flex items-center mt-4">
              {stat.trend === "up" ? (
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span
                className={`text-sm font-medium ${
                  stat.trend === "up" ? "text-green-500" : "text-red-500"
                }`}
              >
                {stat.change}
              </span>
              <span className="text-sm text-muted-foreground ml-1">
                from last month
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
