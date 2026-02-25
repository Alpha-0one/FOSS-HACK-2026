import DashboardHeader from "@/components/DashboardHeader";
import HeroBanner from "@/components/HeroBanner";
import StatsBar from "@/components/StatsBar";
import SkillCategories from "@/components/SkillCategories";
import SkillManager from "@/components/SkillManager";
import TradeListings from "@/components/TradeListings";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6">
        <HeroBanner />
        <StatsBar />
        <div className="grid md:grid-cols-2 gap-4">
          <SkillManager
            title="Skills I Can Teach"
            subtitle="Add skills you're ready to share with others"
            variant="offer"
            initialSkills={["JavaScript", "Guitar", "Photography"]}
          />
          <SkillManager
            title="Skills I Want to Learn"
            subtitle="What would you like to pick up from peers?"
            variant="want"
            initialSkills={["Figma", "Spanish"]}
          />
        </div>
        <SkillCategories />
        <TradeListings />
      </main>
    </div>
  );
};

export default Index;
