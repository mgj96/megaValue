import { type HTMLAttributes } from "react";

import { cn } from "~/shared/style";

export const PageTitle = ({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) => (
  <h1
    className={cn(
      "animate-in fade-in-0 slide-in-from-top-2 inline bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-2xl font-extrabold text-transparent duration-500 lg:text-3xl",
      className,
    )}
    {...props}
  />
);
