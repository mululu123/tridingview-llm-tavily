<<<<<<< HEAD
import * as React from "react"

import { cn } from "@/lib/utils"
=======
import * as React from "react";
import { cn } from "@/lib/utils";
>>>>>>> origin/v0/zmpple-7535-fb84d16f

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
<<<<<<< HEAD
))
Card.displayName = "Card"
=======
));
Card.displayName = "Card";
>>>>>>> origin/v0/zmpple-7535-fb84d16f

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
<<<<<<< HEAD
))
CardHeader.displayName = "CardHeader"
=======
));
CardHeader.displayName = "CardHeader";
>>>>>>> origin/v0/zmpple-7535-fb84d16f

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
<<<<<<< HEAD
))
CardTitle.displayName = "CardTitle"
=======
));
CardTitle.displayName = "CardTitle";
>>>>>>> origin/v0/zmpple-7535-fb84d16f

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
<<<<<<< HEAD
))
CardDescription.displayName = "CardDescription"
=======
));
CardDescription.displayName = "CardDescription";
>>>>>>> origin/v0/zmpple-7535-fb84d16f

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
<<<<<<< HEAD
))
CardContent.displayName = "CardContent"
=======
));
CardContent.displayName = "CardContent";
>>>>>>> origin/v0/zmpple-7535-fb84d16f

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
<<<<<<< HEAD
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
=======
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
>>>>>>> origin/v0/zmpple-7535-fb84d16f
