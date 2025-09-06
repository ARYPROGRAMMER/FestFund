import React, { useEffect, useRef, useState } from "react";
import { motion, useAnimation, useInView } from "framer-motion";

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
  const controls = useAnimation();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });

  const variants = {
    hidden: {
      up: { y: 20, opacity: 0 },
      down: { y: -20, opacity: 0 },
      left: { x: -20, opacity: 0 },
      right: { x: 20, opacity: 0 },
      scale: { scale: 0.95, opacity: 0 },
    },
    visible: {
      up: { y: 0, opacity: 1 },
      down: { y: 0, opacity: 1 },
      left: { x: 0, opacity: 1 },
      right: { x: 0, opacity: 1 },
      scale: { scale: 1, opacity: 1 },
    },
  };

  useEffect(() => {
    if (trigger === "scroll" && inView) {
      controls.start("visible");
    } else if (trigger === "mount") {
      controls.start("visible");
    }
  }, [controls, inView, trigger]);

  return (
    <motion.div
      ref={ref}
      animate={controls}
      initial="hidden"
      variants={{
        hidden: variants.hidden[direction],
        visible: {
          ...variants.visible[direction],
          transition: {
            duration: 0.4,
            delay,
            ease: "easeOut",
          },
        },
      }}
      whileHover={{
        scale: 1.01,
        y: -2,
        transition: { duration: 0.2, ease: "easeOut" },
      }}
      className={className}
    >
      {children}
    </motion.div>
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
  duration = 1.2,
  suffix = "",
  prefix = "",
  decimals = 0,
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (inView) {
      let startTime: number;
      let animationId: number;

      const animate = (currentTime: number) => {
        if (!startTime) startTime = currentTime;
        const progress = Math.min(
          (currentTime - startTime) / (duration * 1000),
          1
        );

        // Ease out function
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentValue = end * easeOut;

        setDisplayValue(currentValue);

        if (progress < 1) {
          animationId = requestAnimationFrame(animate);
        }
      };

      animationId = requestAnimationFrame(animate);

      return () => {
        if (animationId) {
          cancelAnimationFrame(animationId);
        }
      };
    }
  }, [end, duration, inView]);

  return (
    <span ref={ref}>
      {prefix}
      {displayValue.toFixed(decimals)}
      {suffix}
    </span>
  );
};

interface ZKProofAnimationProps {
  isGenerating: boolean;
  onComplete?: () => void;
}

export const ZKProofAnimation: React.FC<ZKProofAnimationProps> = ({
  isGenerating,
  onComplete,
}) => {
  const [particles, setParticles] = useState<number[]>([]);

  useEffect(() => {
    if (isGenerating) {
      setParticles(Array.from({ length: 20 }, (_, i) => i));
      const timer = setTimeout(() => {
        setParticles([]);
        onComplete?.();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isGenerating, onComplete]);

  if (!isGenerating) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="relative">
        <motion.div
          className="w-20 h-20 border-4 border-purple-500/30 border-t-purple-500 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs text-purple-400 font-mono">ZK</span>
        </div>

        {/* Animated particles */}
        {particles.map((i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-purple-400 rounded-full"
            initial={{
              opacity: 0,
              scale: 0,
              x: 0,
              y: 0,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, Math.random() * 0.5 + 0.5, 0],
              x: (Math.random() - 0.5) * 200,
              y: (Math.random() - 0.5) * 200,
            }}
            transition={{
              duration: 1.5,
              delay: i * 0.05,
              ease: "easeOut",
            }}
            style={{
              left: "50%",
              top: "50%",
            }}
          />
        ))}
      </div>
    </div>
  );
};

export const FloatingElements: React.FC = () => {
  const elements = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    color:
      i % 3 === 0
        ? "bg-purple-500"
        : i % 3 === 1
        ? "bg-blue-500"
        : "bg-green-500",
    left: Math.random() * 100,
    top: Math.random() * 100,
    duration: 8 + Math.random() * 4,
    delay: i * 0.5,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {elements.map((element) => (
        <motion.div
          key={element.id}
          className={`absolute w-3 h-3 opacity-10 ${element.color} rounded-full`}
          style={{
            left: `${element.left}%`,
            top: `${element.top}%`,
          }}
          animate={{
            y: [0, Math.random() * 20 - 10, 0],
            x: [0, Math.random() * 20 - 10, 0],
          }}
          transition={{
            duration: element.duration,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
            delay: element.delay,
          }}
        />
      ))}
    </div>
  );
};
