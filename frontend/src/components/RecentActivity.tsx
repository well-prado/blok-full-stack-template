import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface Activity {
  user: string;
  action: string;
  time: string;
  avatar?: string;
  initials: string;
}

interface RecentActivityProps {
  activities?: Activity[];
}

const defaultActivities: Activity[] = [
  {
    user: "Admin User",
    action: "logged in",
    time: "2 minutes ago",
    initials: "AU",
  },
  {
    user: "Sarah Wilson",
    action: "updated profile",
    time: "5 minutes ago",
    initials: "SW",
  },
  {
    user: "Mike Johnson",
    action: "registered account",
    time: "10 minutes ago",
    initials: "MJ",
  },
  {
    user: "Emily Davis",
    action: "changed password",
    time: "15 minutes ago",
    initials: "ED",
  },
];

export function RecentActivity({
  activities = defaultActivities,
}: RecentActivityProps) {
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 dark:hover:bg-white/5 transition-colors"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={activity.avatar} alt={activity.user} />
                <AvatarFallback className="text-xs">
                  {activity.initials}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-medium">{activity.user}</span>
                  <span className="text-muted-foreground ml-1">
                    {activity.action}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
