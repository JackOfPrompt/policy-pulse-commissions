import { BarChart3, Laptop, GitCompare, Lightbulb, CheckCircle, MessageCircle } from "lucide-react";
const features = [{
  icon: BarChart3,
  title: "AI-Powered CRM & Business Analytics",
  description: "Advanced analytics and insights to help you make informed insurance decisions with data-driven recommendations.",
  color: "from-blue-500 to-indigo-500"
}, {
  icon: Laptop,
  title: "Online Policy Purchase",
  description: "Seamless digital experience for purchasing, managing, and renewing your insurance policies anytime, anywhere.",
  color: "from-green-500 to-emerald-500"
}, {
  icon: GitCompare,
  title: "Multi-Provider Comparison",
  description: "Compare policies from multiple insurers side-by-side to find the best coverage and rates for your needs.",
  color: "from-purple-500 to-pink-500"
}, {
  icon: Lightbulb,
  title: "Personalized Policy Recommendations",
  description: "Get tailored insurance suggestions based on your profile, lifestyle, and coverage requirements.",
  color: "from-orange-500 to-red-500"
}, {
  icon: CheckCircle,
  title: "Transparent Premiums & Coverage",
  description: "Clear, upfront pricing with detailed policy terms and no hidden charges for complete transparency.",
  color: "from-teal-500 to-cyan-500"
}, {
  icon: MessageCircle,
  title: "24/7 Support",
  description: "Round-the-clock customer support through chat, phone, and email for immediate assistance and claims.",
  color: "from-indigo-500 to-blue-500"
}];
const FeaturesSection = () => {
  return <section className="py-16 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Platform Features & Benefits
          </h2>
          
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => <div key={index} className="relative group" style={{
          animationDelay: `${index * 0.1}s`
        }}>
              <div className="card-feature h-full p-5">
                <div className="mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-6 h-6 text-white mx-0" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>)}
        </div>
      </div>
    </section>;
};
export default FeaturesSection;