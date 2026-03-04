import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Download, Copy, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const fields = [
  { id: "title", label: "Job Title", placeholder: "e.g. Senior Frontend Engineer" },
  { id: "department", label: "Department", placeholder: "e.g. Engineering" },
  { id: "location", label: "Location", placeholder: "e.g. Remote / New York" },
  { id: "experience", label: "Experience", placeholder: "e.g. 5+ years" },
];

const skillsSuggestions = ["React", "TypeScript", "Node.js", "Python", "AWS", "Docker", "GraphQL", "PostgreSQL"];

export default function JobProfilesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [selectedSkills, setSelectedSkills] = useState<string[]>(["React", "TypeScript"]);
  const [employmentType, setEmploymentType] = useState("Full-time");
  const [generatedJD, setGeneratedJD] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
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

      // Save to DB
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
        <p className="text-muted-foreground mt-1">Create structured job profiles with AI in seconds.</p>
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
              <label className="block text-sm font-medium text-foreground mb-2">Key Skills</label>
              <div className="flex flex-wrap gap-2">
                {skillsSuggestions.map((skill) => (
                  <button key={skill} onClick={() => toggleSkill(skill)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedSkills.includes(skill) ? "bg-primary/15 text-primary border border-primary/30" : "bg-muted text-muted-foreground border border-border hover:border-primary/20"}`}
                  >{skill}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Employment Type</label>
              <select value={employmentType} onChange={(e) => setEmploymentType(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-border bg-muted/30 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition">
                <option>Full-time</option>
                <option>Part-time</option>
                <option>Contract</option>
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
                <p className="text-sm text-muted-foreground">Fill in the form and click generate to create a structured job description.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
