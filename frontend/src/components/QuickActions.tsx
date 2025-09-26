import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Download, Plus, Settings, Upload } from "lucide-react";

import { Button } from "./ui/button";

interface Action {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  iconColor: string;
  onClick?: () => void;
}

interface QuickActionsProps {
  actions?: Action[];
}

const defaultActions: Action[] = [
  {
    title: "Add User",
    description: "Create a new user account",
    icon: Plus,
    color: "from-blue-400 to-indigo-500",
    iconColor: "text-blue-700 dark:text-blue-300",
  },
  {
    title: "Export Users",
    description: "Download user data",
    icon: Download,
    color: "from-green-400 to-emerald-500",
    iconColor: "text-green-700 dark:text-green-300",
  },
  {
    title: "Bulk Import",
    description: "Upload user data from CSV",
    icon: Upload,
    color: "from-purple-400 to-violet-500",
    iconColor: "text-purple-700 dark:text-purple-300",
  },
  {
    title: "Admin Settings",
    description: "Configure system settings",
    icon: Settings,
    color: "from-orange-400 to-red-500",
    iconColor: "text-orange-700 dark:text-orange-300",
  },
];

export function QuickActions({ actions = defaultActions }: QuickActionsProps) {
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant="ghost"
              className="h-auto p-4 flex flex-col items-start gap-2 glass-button glass-button-hover"
              onClick={action.onClick}
            >
              <div
                className={`p-2 rounded-lg bg-gradient-to-r ${action.color} bg-opacity-10`}
              >
                <action.icon className={`h-4 w-4 ${action.iconColor}`} />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">{action.title}</p>
                <p className="text-xs text-muted-foreground">
                  {action.description}
                </p>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
