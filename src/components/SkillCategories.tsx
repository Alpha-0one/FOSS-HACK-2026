import { Code, Palette, Music, Globe, Calculator, Camera, BookOpen, Dumbbell } from "lucide-react";

const categories = [
  { name: "Programming", icon: Code, color: "bg-teal-light text-teal", count: 48 },
  { name: "Design", icon: Palette, color: "bg-coral-light text-coral", count: 35 },
  { name: "Music", icon: Music, color: "bg-violet-light text-violet", count: 22 },
  { name: "Languages", icon: Globe, color: "bg-amber-light text-amber", count: 41 },
  { name: "Math", icon: Calculator, color: "bg-emerald-light text-emerald", count: 19 },
  { name: "Photography", icon: Camera, color: "bg-coral-light text-coral", count: 14 },
  { name: "Writing", icon: BookOpen, color: "bg-violet-light text-violet", count: 27 },
  { name: "Fitness", icon: Dumbbell, color: "bg-amber-light text-amber", count: 16 },
];

const SkillCategories = () => {
  return (
    <section>
      <h2 className="font-display text-lg font-semibold text-foreground mb-4">Browse by Category</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {categories.map((cat, i) => (
          <button
            key={cat.name}
            className="flex items-center gap-3 rounded-xl bg-card p-4 shadow-card transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5 text-left"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${cat.color}`}>
              <cat.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{cat.name}</p>
              <p className="text-xs text-muted-foreground">{cat.count} students</p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};

export default SkillCategories;
