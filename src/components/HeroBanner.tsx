import { ArrowLeftRight } from "lucide-react";

const HeroBanner = () => {
  return (
    <div className="gradient-hero rounded-2xl p-6 md:p-8 text-primary-foreground relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary-foreground/20" />
        <div className="absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-primary-foreground/10" />
      </div>
      <div className="relative">
        <div className="flex items-center gap-2 mb-2">
          <ArrowLeftRight className="h-5 w-5" />
          <span className="text-sm font-medium opacity-90">Skill Barter Platform</span>
        </div>
        <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">
          Trade skills, grow together
        </h2>
        <p className="text-sm md:text-base opacity-85 max-w-lg">
          Offer what you know, learn what you need. Connect with fellow students and exchange skills — no money involved.
        </p>
      </div>
    </div>
  );
};

export default HeroBanner;
