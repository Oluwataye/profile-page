import { Code2, Zap, Database, Layers } from "lucide-react";

const techItems = [
  { name: "Lovable", icon: Zap, color: "from-primary to-primary-glow" },
  { name: "Bolt", icon: Zap, color: "from-accent to-cyan-400" },
  { name: "V0", icon: Code2, color: "from-secondary-accent to-purple-400" },
  { name: "Replit", icon: Database, color: "from-orange-500 to-red-500" },
  { name: "Bubble", icon: Layers, color: "from-blue-500 to-indigo-500" },
  { name: "TypeScript", icon: Code2, color: "from-blue-600 to-blue-400" },
];

export const TechStack = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-muted/30 to-background">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 animate-fade-in">
          Tech Stack
        </h2>
        <p className="text-center text-muted-foreground mb-12 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          Modern tools for rapid development
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 max-w-5xl mx-auto">
          {techItems.map((tech, index) => (
            <div
              key={tech.name}
              className="group relative animate-bounce-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex flex-col items-center gap-3 p-6 rounded-xl bg-card border-2 border-transparent hover:border-primary/30 transition-all duration-300 hover:shadow-[var(--shadow-elegant)] hover:-translate-y-2">
                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${tech.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <tech.icon className="w-8 h-8 text-white" />
                </div>
                <span className="text-sm font-semibold text-foreground">{tech.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
