import React from "react";
import { Loader2 } from "lucide-react";

const cn = (...classes: (string | undefined | boolean)[]) => {
  return classes.filter(Boolean).join(" ");
};

interface LoaderProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
}

export const Loader: React.FC<LoaderProps> = ({
  size = "md",
  className,
  text,
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="flex flex-col items-center space-y-2">
        <Loader2
          className={cn("animate-spin text-purple-600", sizeClasses[size])}
        />
        {text && <p className="text-sm text-gray-400 animate-pulse">{text}</p>}
      </div>
    </div>
  );
};

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = "md", className }) => {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-6 h-6 border-2",
    lg: "w-8 h-8 border-3",
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-purple-600 border-t-transparent",
        sizeClasses[size],
        className
      )}
    />
  );
};

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
  return (
    <div className={cn("animate-pulse rounded-md bg-gray-800/50", className)} />
  );
};

interface FullPageLoaderProps {
  text?: string;
}

export const FullPageLoader: React.FC<FullPageLoaderProps> = ({
  text = "Loading...",
}) => {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-purple-600/30 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-xl text-white mb-2">{text}</p>
        <p className="text-gray-400">Please wait while we load the data...</p>
      </div>
    </div>
  );
};

interface LoadingStateProps {
  isLoading: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  isLoading,
  children,
  fallback,
}) => {
  if (isLoading) {
    return fallback || <Loader size="lg" text="Loading..." />;
  }

  return <>{children}</>;
};
