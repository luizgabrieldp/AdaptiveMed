import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-transparent bg-destructive text-destructive-foreground',
        outline: 'text-foreground border-border',
        // Status do AdaptiveMed
        concluido: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-medium',
        atrasado: 'border-red-500/30 bg-red-500/15 text-red-400 font-medium animate-pulse',
        hoje: 'border-amber-500/40 bg-amber-500/15 text-amber-300 font-semibold ring-1 ring-amber-500/30',
        programado: 'border-blue-500/30 bg-blue-500/10 text-blue-400 font-medium',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
