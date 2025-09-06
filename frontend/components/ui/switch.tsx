import * as React from "react";

import { cn } from "../../lib/utils";

const Switch = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    onCheckedChange?: (checked: boolean) => void;
  }
>(({ className, onCheckedChange, ...props }, ref) => (
  <label className="relative inline-flex items-center cursor-pointer">
    <input
      type="checkbox"
      ref={ref}
      className="sr-only peer"
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      {...props}
    />
    <div
      className={cn(
        "relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600",
        className
      )}
    />
  </label>
));
Switch.displayName = "Switch";

export { Switch };
