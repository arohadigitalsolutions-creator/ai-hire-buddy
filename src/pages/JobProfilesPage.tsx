import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Download, Copy } from "lucide-react";

const fields = [
  { id: "title", label: "Job Title", placeholder: "e.g. Senior Frontend Engineer" },
  { id: "department", label: "Department", placeholder: "e.g. Engineering" },
  { id: "location", label: "Location", placeholder: "e.g. Remote / New York" },
  { id: "experience", label: "Experience", placeholder: "e.g. 5+ years" },
];

const skillsSuggestions = ["React", "TypeScript", "Node.js", "Python", "AWS", "Docker", "GraphQL", "PostgreSQL"];

const sampleJD = `## Senior Frontend Engineer

### About the Role
We're looking for a Senior Frontend Engineer to join our Engineering team. You'll lead the development of our customer-facing applications, working closely with design and product teams.

### Responsibilities
- Architect and build scalable React applications
- Mentor junior developers and conduct code reviews  
- Collaborate with designers to implement pixel-perfect UIs
- Optimize application performance and accessibility

### Requirements
- 5+ years of frontend development experience
- Expert proficiency in React, TypeScript, and modern CSS
- Experience with state management (Redux, Zustand, or similar)
- Strong understanding of web performance optimization

### Nice to Have
- Experience with design systems
- GraphQL knowledge
- Cloud deployment experience (AWS/GCP)

### Benefits
- Competitive salary and equity
- Remote-first culture
- Health insurance and wellness programs`;

export default function JobProfilesPage() {
  const [generated, setGenerated] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>(["React", "TypeScript"]);

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Job Description Generator</h1>
        <p className="text-muted-foreground mt-1">Create structured job profiles with AI in seconds.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-base font-semibold text-foreground mb-5">Job Details</h2>
          <div className="space-y-4">
            {fields.map((f) => (
              <div key={f.id}>
                <label className="block text-sm font-medium text-foreground mb-1.5">{f.label}</label>
                <input
                  type="text"
                  placeholder={f.placeholder}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
                />
              </div>
            ))}

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Key Skills</label>
              <div className="flex flex-wrap gap-2">
                {skillsSuggestions.map((skill) => (
                  <button
                    key={skill}
                    onClick={() => toggleSkill(skill)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      selectedSkills.includes(skill)
                        ? "bg-primary/15 text-primary border border-primary/30"
                        : "bg-muted text-muted-foreground border border-border hover:border-primary/20"
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Employment Type</label>
              <select className="w-full h-10 px-3 rounded-lg border border-border bg-muted/30 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition">
                <option>Full-time</option>
                <option>Part-time</option>
                <option>Contract</option>
              </select>
            </div>

            <button
              onClick={() => setGenerated(true)}
              className="w-full h-11 rounded-lg bg-gradient-primary text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-2 mt-2"
            >
              <Sparkles className="h-4 w-4" />
              Generate Job Description
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h2 className="text-base font-semibold text-foreground">Generated JD</h2>
            {generated && (
              <div className="flex gap-2">
                <button className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                  <Copy className="h-4 w-4" />
                </button>
                <button className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                  <Download className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
          <div className="p-5">
            {generated ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="prose prose-sm prose-invert max-w-none"
              >
                <pre className="whitespace-pre-wrap text-sm text-secondary-foreground font-sans leading-relaxed">
                  {sampleJD}
                </pre>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Sparkles className="h-8 w-8 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  Fill in the form and click generate to create a structured job description.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
