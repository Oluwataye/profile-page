import { useEffect, useState } from "react";

interface StatCounterProps {
  end: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  label: string;
  delay?: number;
}

export const StatCounter = ({ 
  end, 
  duration = 2000, 
  suffix = "", 
  prefix = "",
  label,
  delay = 0 
}: StatCounterProps) => {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          
          const startTime = Date.now();
          const endTime = startTime + duration;

          const timer = setInterval(() => {
            const now = Date.now();
            const progress = Math.min((now - startTime) / duration, 1);
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            setCount(Math.floor(easeOutQuart * end));

            if (now >= endTime) {
              setCount(end);
              clearInterval(timer);
            }
          }, 16);

          return () => clearInterval(timer);
        }
      },
      { threshold: 0.5 }
    );

    const element = document.getElementById(`stat-${label.replace(/\s/g, '-')}`);
    if (element) observer.observe(element);

    return () => observer.disconnect();
  }, [end, duration, hasAnimated, label]);

  return (
    <div 
      id={`stat-${label.replace(/\s/g, '-')}`}
      className="text-center animate-scale-in"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-accent to-secondary-accent bg-clip-text text-transparent mb-2">
        {prefix}{count}{suffix}
      </div>
      <p className="text-muted-foreground font-medium">{label}</p>
    </div>
  );
};
