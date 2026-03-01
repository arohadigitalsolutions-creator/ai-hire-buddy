import { motion } from "framer-motion";
import { Upload, Search, Filter } from "lucide-react";

const candidates = [
  { name: "Sarah Chen", role: "Sr. Frontend Engineer", score: 94, skills: ["React", "TypeScript", "GraphQL"], status: "Interview", experience: "7 years" },
  { name: "James Wilson", role: "Backend Developer", score: 87, skills: ["Node.js", "Python", "AWS"], status: "Screening", experience: "5 years" },
  { name: "Maria Garcia", role: "Product Manager", score: 82, skills: ["Agile", "Analytics", "Strategy"], status: "Matched", experience: "6 years" },
  { name: "Alex Kim", role: "DevOps Engineer", score: 79, skills: ["Docker", "K8s", "Terraform"], status: "Interview", experience: "4 years" },
  { name: "David Park", role: "Data Scientist", score: 76, skills: ["Python", "ML", "SQL"], status: "Screening", experience: "3 years" },
  { name: "Emily Brown", role: "UX Designer", score: 71, skills: ["Figma", "Research", "Prototyping"], status: "Matched", experience: "5 years" },
];

function ScoreBar({ score }: { score: number }) {
  const color = score >= 90 ? "bg-success" : score >= 80 ? "bg-primary" : score >= 70 ? "bg-warning" : "bg-destructive";
  return (
    <div className="flex items-center gap-3">
      <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
      <span className="text-sm font-semibold text-foreground w-8">{score}</span>
    </div>
  );
}

const statusStyles: Record<string, string> = {
  Interview: "bg-primary/10 text-primary",
  Screening: "bg-accent/10 text-accent",
  Matched: "bg-success/10 text-success",
};

export default function CandidatesPage() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Candidates</h1>
          <p className="text-muted-foreground mt-1">Manage and score your candidate pipeline.</p>
        </div>
        <button className="inline-flex h-10 px-5 items-center gap-2 rounded-lg bg-gradient-primary text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
          <Upload className="h-4 w-4" />
          Upload Resumes
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search candidates..."
            className="w-full h-10 pl-10 pr-3 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
          />
        </div>
        <button className="inline-flex h-10 px-4 items-center gap-2 rounded-lg border border-border bg-card text-sm text-muted-foreground hover:text-foreground transition-colors">
          <Filter className="h-4 w-4" />
          Filter
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Candidate</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Experience</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Skills</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Fit Score</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {candidates.map((c, i) => (
              <motion.tr
                key={c.name}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                className="hover:bg-muted/20 transition-colors cursor-pointer"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold text-secondary-foreground shrink-0">
                      {c.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.role}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-muted-foreground">{c.experience}</td>
                <td className="px-5 py-4">
                  <div className="flex gap-1.5 flex-wrap">
                    {c.skills.map((s) => (
                      <span key={s} className="px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground">{s}</span>
                    ))}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <ScoreBar score={c.score} />
                </td>
                <td className="px-5 py-4">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[c.status] || ""}`}>
                    {c.status}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
