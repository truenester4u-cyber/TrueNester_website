import { Building2, Users, Award, TrendingUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const StatsBar = () => {
  const stats = [
    { icon: Building2, value: 500, suffix: "+", label: "Properties" },
    { icon: Users, value: 70, suffix: "+", label: "Developers" },
    { icon: Award, value: 1000, suffix: "+", label: "Happy Clients" },
    { icon: TrendingUp, value: 99, suffix: "%", label: "Satisfaction" },
  ];

  return (
    <section className="bg-gradient-secondary py-6 sm:py-8 md:py-10">
      <div className="container-custom px-3 sm:px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          {stats.map((stat, index) => (
            <StatItem key={index} stat={stat} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

const StatItem = ({ stat, index }: { stat: any; index: number }) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const duration = 2000; // 2 seconds
    const steps = 60;
    const increment = stat.value / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      if (currentStep <= steps) {
        setCount(Math.floor(increment * currentStep));
      } else {
        setCount(stat.value);
        clearInterval(timer);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [isVisible, stat.value]);

  return (
    <div
      ref={ref}
      className={`text-center text-white transition-opacity duration-500 py-2 sm:py-3 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      <stat.icon className="h-6 sm:h-7 md:h-8 w-6 sm:w-7 md:w-8 mx-auto mb-1 sm:mb-2 text-accent" />
      <div className="text-lg sm:text-2xl md:text-3xl font-bold mb-0.5 sm:mb-1">
        {count}
        {stat.suffix}
      </div>
      <div className="text-[10px] sm:text-xs md:text-sm text-white/80 px-1">{stat.label}</div>
    </div>
  );
};

export default StatsBar;
