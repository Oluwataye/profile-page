import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";
import { StatCounter } from "./StatCounter";

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Startup Founder",
    company: "TechVentures",
    content: "Taye delivered our MVP 10x faster than traditional development. The no-code approach saved us months and thousands in development costs.",
    rating: 5,
  },
  {
    name: "Michael Chen",
    role: "Product Manager",
    company: "InnovateCo",
    content: "Exceptional work! The attention to detail and rapid iteration speed transformed our product vision into reality within weeks.",
    rating: 5,
  },
  {
    name: "Emily Rodriguez",
    role: "CEO",
    company: "GrowthLabs",
    content: "Working with Taye was a game-changer. Professional, responsive, and delivered exactly what we needed to launch successfully.",
    rating: 5,
  },
];

export const SocialProof = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary-accent/5">
      <div className="container mx-auto px-4">
        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20 max-w-4xl mx-auto">
          <StatCounter end={50} suffix="+" label="Projects Delivered" delay={0} />
          <StatCounter end={98} suffix="%" label="Client Satisfaction" delay={0.1} />
          <StatCounter end={35} suffix="+" label="Happy Clients" delay={0.2} />
          <StatCounter end={24} suffix="h" label="Response Time" delay={0.3} />
        </div>

        {/* Testimonials */}
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 animate-fade-in">
            What Clients Say
          </h2>
          <p className="text-center text-muted-foreground mb-12 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Real feedback from real projects
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card 
                key={index} 
                className="group hover:shadow-[var(--shadow-elegant)] transition-all duration-500 hover:-translate-y-2 border-2 hover:border-primary/30 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-6">
                  <Quote className="w-10 h-10 text-primary/20 mb-4" />
                  
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                    ))}
                  </div>

                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    "{testimonial.content}"
                  </p>

                  <div className="pt-4 border-t">
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    <p className="text-sm text-primary">{testimonial.company}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
