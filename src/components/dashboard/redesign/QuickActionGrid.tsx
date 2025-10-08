import { UserPlus, FileUp, Calendar, FileText, Shield, Mail, BarChart3, Settings } from "lucide-react";

export function QuickActionGrid() {
  const actions = [
    { icon: UserPlus, label: "Add Employee", color: "from-blue-500 to-cyan-500", bgColor: "bg-blue-500/10" },
    { icon: FileUp, label: "Upload Document", color: "from-purple-500 to-pink-500", bgColor: "bg-purple-500/10" },
    { icon: Calendar, label: "Approve Leave", color: "from-orange-500 to-red-500", bgColor: "bg-orange-500/10" },
    { icon: FileText, label: "New Report", color: "from-green-500 to-emerald-500", bgColor: "bg-green-500/10" },
    { icon: Shield, label: "Compliance Check", color: "from-indigo-500 to-purple-500", bgColor: "bg-indigo-500/10" },
    { icon: Mail, label: "Send Notice", color: "from-pink-500 to-rose-500", bgColor: "bg-pink-500/10" },
    { icon: BarChart3, label: "View Analytics", color: "from-cyan-500 to-blue-500", bgColor: "bg-cyan-500/10" },
    { icon: Settings, label: "Settings", color: "from-gray-500 to-slate-500", bgColor: "bg-gray-500/10" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Quick Actions</h3>
        <span className="text-sm text-muted-foreground">One-click shortcuts</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {actions.map((action, index) => (
          <button
            key={index}
            className="group flex flex-col items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all hover:scale-105"
          >
            <div className={`w-12 h-12 rounded-lg ${action.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <action.icon className={`w-6 h-6 bg-gradient-to-br ${action.color} bg-clip-text text-transparent`} style={{ WebkitTextFillColor: 'transparent' }} />
            </div>
            <span className="text-xs font-medium text-center group-hover:text-primary transition-colors">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
