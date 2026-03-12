import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Download, Copy, Loader2, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const fields = [
  { id: "title", label: "Job Title", placeholder: "e.g. Senior Frontend Engineer, Marketing Manager, HR Director" },
  { id: "department", label: "Department", placeholder: "e.g. Engineering, Marketing, Sales, Finance, HR" },
  { id: "location", label: "Location", placeholder: "e.g. Remote / New York / London" },
  { id: "experience", label: "Experience", placeholder: "e.g. 5+ years" },
];

const skillCategories: Record<string, string[]> = {
  Technology: ["React", "TypeScript", "Python", "AWS", "Docker", "Node.js", "SQL", "Java"],
  Marketing: ["SEO", "Content Strategy", "Google Ads", "Social Media", "Analytics", "Copywriting", "Branding", "CRM"],
  Sales: ["Lead Generation", "CRM", "Negotiation", "Pipeline Management", "B2B Sales", "Account Management", "Forecasting", "Cold Outreach"],
  Finance: ["Financial Modeling", "Excel", "Forecasting", "Budgeting", "Compliance", "Audit", "SAP", "Risk Analysis"],
  HR: ["Talent Acquisition", "Employee Relations", "HRIS", "Benefits Administration", "Onboarding", "Performance Management", "Labor Law", "DEI"],
  Design: ["Figma", "Adobe Suite", "UI/UX", "Prototyping", "Design Systems", "User Research", "Typography", "Motion Design"],
  Operations: ["Process Improvement", "Supply Chain", "Lean/Six Sigma", "Vendor Management", "Logistics", "ERP", "Quality Assurance", "Project Management"],
  General: ["Leadership", "Communication", "Problem Solving", "Team Management", "Strategic Planning", "Data Analysis", "Stakeholder Management", "Agile"],
};

function detectCategory(title: string, department: string): string[] {
  const text = `${title} ${department}`.toLowerCase();
  const matched: string[] = [];
  if (/engineer|develop|software|tech|devops|data|frontend|backend|fullstack|cloud|it\b|sre/.test(text)) matched.push("Technology");
  if (/market|brand|growth|seo|content|digital|social media|advertising/.test(text)) matched.push("Marketing");
  if (/sales|business develop|account|revenue|commercial/.test(text)) matched.push("Sales");
  if (/financ|account|audit|treasury|tax|controller|cfo/.test(text)) matched.push("Finance");
  if (/\bhr\b|human resource|recruit|talent|people|workforce/.test(text)) matched.push("HR");
  if (/design|creative|ux|ui|graphic|product design|visual/.test(text)) matched.push("Design");
  if (/operat|supply|logistics|procurement|quality|process/.test(text)) matched.push("Operations");
  if (matched.length === 0) matched.push("General");
  return matched;
}

export default function JobProfilesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState("");
  const [employmentType, setEmploymentType] = useState("Full-time");
  const [generatedJD, setGeneratedJD] = useState("");
  const [loading, setLoading] = useState(false);

  const categories = detectCategory(formData.title || "", formData.department || "");
  const suggestedSkills = Array.from(new Set(categories.flatMap((c) => skillCategories[c] || skillCategories["General"])));

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const addCustomSkill = () => {
    const skill = customSkill.trim();
    if (skill && !selectedSkills.includes(skill)) {
      setSelectedSkills((prev) => [...prev, skill]);
    }
    setCustomSkill("");
  };

  const handleGenerate = async () => {
    if (!formData.title) {
      toast({ title: "Please enter a job title", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-jd", {
        body: { title: formData.title, department: formData.department, location: formData.location, experience: formData.experience, skills: selectedSkills, employmentType },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setGeneratedJD(data.jd_text);

      if (user) {
        await supabase.from("job_profiles").insert({
          user_id: user.id,
          title: formData.title,
          department: formData.department || null,
          location: formData.location || null,
          experience: formData.experience || null,
          skills: selectedSkills,
          employment_type: employmentType,
          jd_text: data.jd_text,
        });
      }
      toast({ title: "Job description generated and saved!" });
    } catch (e: any) {
      toast({ title: "Generation failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedJD);
    toast({ title: "Copied to clipboard!" });
  };

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Job Description Generator</h1>
        <p className="text-muted-foreground mt-1">Create structured job profiles for any role with AI.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-base font-semibold text-foreground mb-5">Job Details</h2>
          <div className="space-y-4">
            {fields.map((f) => (
              <div key={f.id}>
                <label className="block text-sm font-medium text-foreground mb-1.5">{f.label}</label>
                <input
                  type="text"
                  placeholder={f.placeholder}
                  value={formData[f.id] || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, [f.id]: e.target.value }))}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
                />
              </div>
            ))}

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Key Skills
                {categories.length > 0 && (
                  <span className="ml-2 text-xs text-muted-foreground font-normal">
                    Suggestions: {categories.join(", ")}
                  </span>
                )}
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {suggestedSkills.map((skill) => (
                  <button key={skill} onClick={() => toggleSkill(skill)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedSkills.includes(skill) ? "bg-primary/15 text-primary border border-primary/30" : "bg-muted text-muted-foreground border border-border hover:border-primary/20"}`}
                  >{skill}</button>
                ))}
              </div>
              {/* Custom skill input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add custom skill..."
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomSkill())}
                  className="flex-1 h-9 px-3 rounded-lg border border-border bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
                />
                <button onClick={addCustomSkill} className="h-9 px-3 rounded-lg border border-border bg-muted/30 text-sm text-muted-foreground hover:text-foreground hover:border-primary/20 transition-colors">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              {/* Show selected custom skills not in suggestions */}
              {selectedSkills.filter((s) => !suggestedSkills.includes(s)).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedSkills.filter((s) => !suggestedSkills.includes(s)).map((skill) => (
                    <span key={skill} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/15 text-primary border border-primary/30">
                      {skill}
                      <button onClick={() => toggleSkill(skill)}><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Employment Type</label>
              <select value={employmentType} onChange={(e) => setEmploymentType(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-border bg-muted/30 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition">
                <option>Full-time</option>
                <option>Part-time</option>
                <option>Contract</option>
                <option>Internship</option>
                <option>Freelance</option>
              </select>
            </div>

            <button onClick={handleGenerate} disabled={loading}
              className="w-full h-11 rounded-lg bg-gradient-primary text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-2 mt-2 disabled:opacity-50">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading ? "Generating..." : "Generate Job Description"}
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h2 className="text-base font-semibold text-foreground">Generated JD</h2>
            {generatedJD && (
              <div className="flex gap-2">
                <button onClick={handleCopy} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"><Copy className="h-4 w-4" /></button>
                <button className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"><Download className="h-4 w-4" /></button>
              </div>
            )}
          </div>
          <div className="p-5">
            {generatedJD ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="prose prose-sm prose-invert max-w-none">
                <pre className="whitespace-pre-wrap text-sm text-secondary-foreground font-sans leading-relaxed">{generatedJD}</pre>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Sparkles className="h-8 w-8 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">Fill in the form and click generate to create a structured job description for any role.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
