import * as React from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

function Select({ className, children, ...props }) {
  return (
    <div className="relative">
      <select
        data-slot="select"
        className={cn(
          "h-12 w-full appearance-none rounded-2xl border border-input bg-transparent px-3 pr-10 text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 dark:bg-input/30",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
}

export { Select }
