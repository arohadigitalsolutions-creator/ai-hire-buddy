import { motion } from "framer-motion";
import { ArrowRight, Bot, Brain, Users, Zap, Shield, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

const agents = [
  { icon: Brain, title: "Job Profile Agent", desc: "Auto-generates structured job descriptions from minimal input" },
  { icon: Users, title: "Resume Analysis", desc: "Extracts skills, experience & certifications from any resume" },
  { icon: Zap, title: "Smart Matching", desc: "Weighted scoring algorithm ranks candidates 0–100" },
  { icon: Bot, title: "AI Interviewer", desc: "Generates adaptive technical & behavioral questions" },
  { icon: Shield, title: "Communication", desc: "Automated emails for invites, rejections & follow-ups" },
  { icon: BarChart3, title: "HR Insights", desc: "Hiring recommendations, risk indicators & salary bands" },
];

const plans = [
  { name: "Basic", price: "$49", period: "/mo", features: ["50 resumes/month", "JD Generator", "Basic scoring", "Email support"], highlighted: false },
  { name: "Pro", price: "$149", period: "/mo", features: ["Unlimited resumes", "All 6 AI agents", "Advanced analytics", "Priority support", "API access"], highlighted: true },
  { name: "Enterprise", price: "Custom", period: "", features: ["AI voice interviews", "Custom integrations", "Dedicated support", "SLA guarantee", "Multi-tenant"], highlighted: false },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 glass">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Brain className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">RecruitAI</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#agents" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Agents</a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
            <Link to="/auth" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
              Sign In
            </Link>
            <Link to="/auth" className="inline-flex h-9 px-4 items-center rounded-lg bg-gradient-primary text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
              Get Started <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute inset-0 opacity-[0.03] grid-pattern" />
        <img src={heroBg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-lighten" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
        
        <div className="container relative z-10">
          <motion.div
            className="max-w-3xl mx-auto text-center"
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-secondary/50 text-xs font-medium text-muted-foreground mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse-glow" />
              Multi-Agent AI Recruitment Platform
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1} className="text-5xl md:text-7xl font-extrabold leading-[1.05] mb-6">
              Hire smarter with{" "}
              <span className="text-gradient-primary">AI agents</span>
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-10">
              Six specialized AI agents work together to automate your entire hiring pipeline — from JD creation to candidate scoring to interviews.
            </motion.p>
            <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth" className="inline-flex h-12 px-8 items-center justify-center rounded-lg bg-gradient-primary text-base font-semibold text-primary-foreground shadow-glow hover:opacity-90 transition-opacity">
                Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <a href="#agents" className="inline-flex h-12 px-8 items-center justify-center rounded-lg border border-border bg-secondary/30 text-base font-medium text-foreground hover:bg-secondary/50 transition-colors">
                See How It Works
              </a>
            </motion.div>
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={fadeUp} custom={5}
            initial="hidden" animate="visible"
            className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mt-20"
          >
            {[
              ["95%", "Matching Accuracy"],
              ["6x", "Faster Hiring"],
              ["10k+", "Resumes Processed"],
            ].map(([stat, label]) => (
              <div key={label} className="text-center">
                <div className="text-3xl font-bold text-gradient-accent">{stat}</div>
                <div className="text-sm text-muted-foreground mt-1">{label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Agents */}
      <section id="agents" className="py-24">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Six AI agents.{" "}
              <span className="text-gradient-primary">One platform.</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-lg mx-auto">
              Each agent specializes in a critical part of the hiring workflow, orchestrated seamlessly.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {agents.map((agent, i) => (
              <motion.div
                key={agent.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="group relative rounded-xl border border-border bg-card p-6 hover:border-primary/30 hover:shadow-glow transition-all duration-300"
              >
                <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center mb-4">
                  <agent.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{agent.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{agent.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-gradient-hero">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Simple pricing</h2>
            <p className="text-muted-foreground text-lg">Start free. Scale as you grow.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`rounded-xl border p-6 flex flex-col ${
                  plan.highlighted
                    ? "border-primary/50 bg-card shadow-glow"
                    : "border-border bg-card"
                }`}
              >
                {plan.highlighted && (
                  <div className="text-xs font-semibold text-primary mb-3 tracking-wide uppercase">Most Popular</div>
                )}
                <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                <div className="mt-3 mb-6">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/auth"
                  className={`inline-flex h-10 items-center justify-center rounded-lg text-sm font-medium transition-all ${
                    plan.highlighted
                      ? "bg-gradient-primary text-primary-foreground hover:opacity-90"
                      : "border border-border bg-secondary/30 text-foreground hover:bg-secondary/50"
                  }`}
                >
                  Get Started
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-gradient-primary flex items-center justify-center">
              <Brain className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold text-foreground">RecruitAI</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 RecruitAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
