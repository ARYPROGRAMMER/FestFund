import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";

// Register ScrollTrigger plugin
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "scale";
  trigger?: "scroll" | "mount";
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  className = "",
  delay = 0,
  direction = "up",
  trigger = "scroll",
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cardRef.current) return;

    const card = cardRef.current;

    // Initial state
    const initialState = {
      up: { y: 50, opacity: 0 },
      down: { y: -50, opacity: 0 },
      left: { x: -50, opacity: 0 },
      right: { x: 50, opacity: 0 },
      scale: { scale: 0.8, opacity: 0 },
    };

    gsap.set(card, initialState[direction]);

    if (trigger === "scroll") {
      gsap.to(card, {
        ...Object.fromEntries(
          Object.keys(initialState[direction]).map((key) => [
            key,
            key === "opacity" ? 1 : 0,
          ])
        ),
        duration: 0.8,
        delay,
        ease: "power2.out",
        scrollTrigger: {
          trigger: card,
          start: "top 85%",
          toggleActions: "play none none reverse",
        },
      });
    } else {
      gsap.to(card, {
        ...Object.fromEntries(
          Object.keys(initialState[direction]).map((key) => [
            key,
            key === "opacity" ? 1 : 0,
          ])
        ),
        duration: 0.8,
        delay,
        ease: "power2.out",
      });
    }

    // Hover animation
    const handleMouseEnter = () => {
      gsap.to(card, {
        scale: 1.02,
        y: -5,
        duration: 0.3,
        ease: "power2.out",
      });
    };

    const handleMouseLeave = () => {
      gsap.to(card, {
        scale: 1,
        y: 0,
        duration: 0.3,
        ease: "power2.out",
      });
    };

    card.addEventListener("mouseenter", handleMouseEnter);
    card.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      card.removeEventListener("mouseenter", handleMouseEnter);
      card.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [delay, direction, trigger]);

  return (
    <div ref={cardRef} className={className}>
      {children}
    </div>
  );
};

interface CountUpProps {
  end: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
}

export const AnimatedCountUp: React.FC<CountUpProps> = ({
  end,
  duration = 2,
  suffix = "",
  prefix = "",
  decimals = 0,
}) => {
  const numberRef = useRef<HTMLSpanElement>(null);
  const countRef = useRef({ value: 0 });

  useEffect(() => {
    if (!numberRef.current) return;

    gsap.to(countRef.current, {
      value: end,
      duration,
      ease: "power2.out",
      onUpdate: () => {
        if (numberRef.current) {
          numberRef.current.textContent =
            prefix + countRef.current.value.toFixed(decimals) + suffix;
        }
      },
    });
  }, [end, duration, suffix, prefix, decimals]);

  return <span ref={numberRef}>0</span>;
};

interface ZKProofAnimationProps {
  isGenerating: boolean;
  onComplete?: () => void;
}

export const ZKProofAnimation: React.FC<ZKProofAnimationProps> = ({
  isGenerating,
  onComplete,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !isGenerating) return;

    const container = containerRef.current;
    const timeline = gsap.timeline({
      onComplete: onComplete,
    });

    // Create floating particles
    const particles = Array.from({ length: 20 }, (_, i) => {
      const particle = document.createElement("div");
      particle.className =
        "absolute w-2 h-2 bg-purple-400 rounded-full opacity-0";
      container.appendChild(particle);
      return particle;
    });

    // Animate particles
    particles.forEach((particle, i) => {
      timeline.to(
        particle,
        {
          opacity: 1,
          scale: Math.random() * 0.5 + 0.5,
          x: (Math.random() - 0.5) * 200,
          y: (Math.random() - 0.5) * 200,
          duration: 0.5,
          delay: i * 0.05,
          ease: "power2.out",
        },
        0
      );

      timeline.to(
        particle,
        {
          opacity: 0,
          scale: 0,
          duration: 0.3,
          delay: 1 + i * 0.02,
        },
        0.5
      );
    });

    return () => {
      particles.forEach((particle) => particle.remove());
    };
  }, [isGenerating, onComplete]);

  if (!isGenerating) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
    >
      <div className="relative">
        <div className="w-20 h-20 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs text-purple-400 font-mono">ZK</span>
        </div>
      </div>
    </div>
  );
};

export const FloatingElements: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const elements = Array.from({ length: 10 }, (_, i) => {
      const element = document.createElement("div");
      element.className = `absolute w-4 h-4 opacity-20 ${
        i % 3 === 0
          ? "bg-purple-500"
          : i % 3 === 1
          ? "bg-blue-500"
          : "bg-green-500"
      } rounded-full`;
      element.style.left = `${Math.random() * 100}%`;
      element.style.top = `${Math.random() * 100}%`;
      container.appendChild(element);
      return element;
    });

    elements.forEach((element, i) => {
      gsap.to(element, {
        y: `${Math.random() * 50 - 25}px`,
        x: `${Math.random() * 50 - 25}px`,
        duration: 3 + Math.random() * 2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: i * 0.2,
      });
    });

    return () => {
      elements.forEach((element) => element.remove());
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none overflow-hidden z-0"
    />
  );
};
