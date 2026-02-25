import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SkillManagerProps {
  title: string;
  subtitle: string;
  variant: "offer" | "want";
  initialSkills?: string[];
}

const SkillManager = ({ title, subtitle, variant, initialSkills = [] }: SkillManagerProps) => {
  const [skills, setSkills] = useState<string[]>(initialSkills);
  const [input, setInput] = useState("");

  const addSkill = () => {
    const trimmed = input.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setInput("");
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const borderColor = variant === "offer" ? "border-primary/30" : "border-accent/30";
  const badgeClass = variant === "offer"
    ? "bg-teal-light text-teal hover:bg-teal-light/80"
    : "bg-coral-light text-coral hover:bg-coral-light/80";

  return (
    <div className={`rounded-xl bg-card p-5 shadow-card border-l-4 ${borderColor}`}>
      <h3 className="font-display text-base font-semibold text-foreground">{title}</h3>
      <p className="text-xs text-muted-foreground mb-3">{subtitle}</p>

      <div className="flex gap-2 mb-3">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addSkill()}
          placeholder={variant === "offer" ? "e.g. Python, Guitar..." : "e.g. Figma, Spanish..."}
          className="text-sm bg-secondary border-none"
        />
        <Button size="sm" onClick={addSkill} variant={variant === "offer" ? "default" : "outline"} className={variant === "want" ? "border-accent text-accent hover:bg-accent hover:text-accent-foreground" : ""}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <Badge key={skill} variant="secondary" className={`${badgeClass} gap-1 pr-1.5 text-xs font-medium`}>
            {skill}
            <button onClick={() => removeSkill(skill)} className="ml-0.5 rounded-full p-0.5 hover:bg-foreground/10">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        {skills.length === 0 && (
          <p className="text-xs text-muted-foreground italic">No skills added yet</p>
        )}
      </div>
    </div>
  );
};

export default SkillManager;
