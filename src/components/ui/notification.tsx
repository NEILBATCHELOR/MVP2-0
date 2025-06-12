import React from "react";
import { X } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils";

const notificationVariants = cva(
  "group relative w-full rounded-lg border p-4 shadow-lg",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
        success:
          "border-green-500/50 bg-green-50 text-green-800 dark:border-green-500 [&>svg]:text-green-500",
        warning:
          "border-yellow-500/50 bg-yellow-50 text-yellow-800 dark:border-yellow-500 [&>svg]:text-yellow-500",
        info: "border-blue-500/50 bg-blue-50 text-blue-800 dark:border-blue-500 [&>svg]:text-blue-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

interface NotificationProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof notificationVariants> {}

const Notification = React.forwardRef<HTMLDivElement, NotificationProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(notificationVariants({ variant }), className)}
        {...props}
      />
    );
  },
);
Notification.displayName = "Notification";

const NotificationTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
));
NotificationTitle.displayName = "NotificationTitle";

const NotificationDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
));
NotificationDescription.displayName = "NotificationDescription";

interface NotificationCloseProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const NotificationClose = React.forwardRef<
  HTMLButtonElement,
  NotificationCloseProps
>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-70 transition-opacity hover:text-foreground hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100",
      className,
    )}
    {...props}
  >
    <X className="h-4 w-4" />
    <span className="sr-only">Close</span>
  </button>
));
NotificationClose.displayName = "NotificationClose";

export {
  Notification,
  NotificationTitle,
  NotificationDescription,
  NotificationClose,
};
