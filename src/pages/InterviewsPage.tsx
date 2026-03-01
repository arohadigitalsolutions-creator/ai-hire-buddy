import { MessageSquare, Plus } from "lucide-react";

const interviews = [
  { candidate: "Sarah Chen", role: "Sr. Frontend Engineer", type: "Technical", questions: 15, date: "Mar 3, 2026", status: "Scheduled" },
  { candidate: "Alex Kim", role: "DevOps Engineer", type: "Behavioral", questions: 10, date: "Mar 4, 2026", status: "Pending" },
  { candidate: "James Wilson", role: "Backend Developer", type: "Technical", questions: 12, date: "Mar 2, 2026", status: "Completed" },
];

const statusStyles: Record<string, string> = {
  Scheduled: "bg-primary/10 text-primary",
  Pending: "bg-warning/10 text-warning",
  Completed: "bg-success/10 text-success",
};

export default function InterviewsPage() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">AI Interviews</h1>
          <p className="text-muted-foreground mt-1">Generate and manage interview question sets.</p>
        </div>
        <button className="inline-flex h-10 px-5 items-center gap-2 rounded-lg bg-gradient-primary text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" />
          New Interview
        </button>
      </div>

      <div className="grid gap-4">
        {interviews.map((interview) => (
          <div key={interview.candidate + interview.type} className="rounded-xl border border-border bg-card p-5 flex items-center justify-between hover:border-primary/20 transition-colors">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">{interview.candidate}</div>
                <div className="text-xs text-muted-foreground">{interview.role} · {interview.type} · {interview.questions} questions</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground">{interview.date}</span>
              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[interview.status]}`}>
                {interview.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
