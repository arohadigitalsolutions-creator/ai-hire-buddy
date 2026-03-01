import { BarChart3, TrendingUp, Users, Clock } from "lucide-react";

const metrics = [
  { label: "Time to Hire", value: "18 days", change: "-3 days", icon: Clock },
  { label: "Candidates/Job", value: "24", change: "+5", icon: Users },
  { label: "Offer Rate", value: "34%", change: "+8%", icon: TrendingUp },
  { label: "AI Accuracy", value: "96.2%", change: "+1.4%", icon: BarChart3 },
];

export default function AnalyticsPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground mt-1">Hiring performance insights powered by AI.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-xl border border-border bg-card p-5">
            <m.icon className="h-5 w-5 text-primary mb-3" />
            <div className="text-2xl font-bold text-foreground">{m.value}</div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-muted-foreground">{m.label}</span>
              <span className="text-xs text-success font-medium">{m.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Placeholder chart area */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-base font-semibold text-foreground mb-4">Hiring Funnel</h2>
        <div className="space-y-3">
          {[
            { stage: "Applied", count: 284, pct: 100 },
            { stage: "Screened", count: 156, pct: 55 },
            { stage: "Interviewed", count: 68, pct: 24 },
            { stage: "Offered", count: 31, pct: 11 },
            { stage: "Hired", count: 23, pct: 8 },
          ].map((s) => (
            <div key={s.stage} className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground w-24">{s.stage}</span>
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-primary transition-all duration-700"
                  style={{ width: `${s.pct}%` }}
                />
              </div>
              <span className="text-sm font-medium text-foreground w-12 text-right">{s.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
