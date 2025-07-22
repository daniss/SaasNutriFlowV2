"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSubscription } from "@/hooks/useSubscription";
import { Crown, Star, Zap, AlertTriangle, CreditCard } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface SubscriptionStatusBadgeProps {
  expanded?: boolean;
  showUpgradeButton?: boolean;
}

export function SubscriptionStatusBadge({ 
  expanded = false, 
  showUpgradeButton = false 
}: SubscriptionStatusBadgeProps) {
  const { subscription, loading, isFree, isTrialing, isActive } = useSubscription();

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-6 w-6 bg-gray-200 rounded-full animate-pulse" />
        {expanded && (
          <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
        )}
      </div>
    );
  }

  const getPlanIcon = () => {
    if (!subscription || isFree) return <Star className="h-3 w-3" />;
    
    switch (subscription.plan) {
      case 'starter':
        return <Zap className="h-3 w-3" />;
      case 'professional':
        return <Crown className="h-3 w-3" />;
      default:
        return <Star className="h-3 w-3" />;
    }
  };

  const getPlanLabel = () => {
    if (!subscription || isFree) return 'Gratuit';
    
    switch (subscription.plan) {
      case 'starter':
        return 'Starter';
      case 'professional':
        return 'Pro';
      default:
        return 'Gratuit';
    }
  };

  const getBadgeVariant = (): "default" | "secondary" | "destructive" | "outline" => {
    if (isTrialing) return "outline";
    if (isFree) return "secondary";
    if (isActive) return "default";
    return "destructive";
  };

  const getBadgeClassName = () => {
    if (isTrialing) return "border-emerald-300 text-emerald-700 bg-emerald-50";
    if (isFree) return "border-gray-300 text-gray-700 bg-gray-50";
    if (isActive && subscription?.plan === 'professional') return "border-purple-300 text-purple-700 bg-purple-50";
    if (isActive) return "border-emerald-300 text-emerald-700 bg-emerald-50";
    return "border-red-300 text-red-700 bg-red-50";
  };

  const getStatusText = () => {
    if (isTrialing) return `Essai - ${subscription?.trialDaysLeft}j`;
    if (!isActive && !isFree) return "Expiré";
    return getPlanLabel();
  };

  const shouldShowWarning = () => {
    return isTrialing && subscription?.trialDaysLeft && subscription.trialDaysLeft <= 3;
  };

  return (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative">
            <Badge 
              variant={getBadgeVariant()}
              className={`${getBadgeClassName()} flex items-center gap-1.5 text-xs font-medium px-2 py-1 ${
                expanded ? '' : 'px-1.5'
              }`}
            >
              {getPlanIcon()}
              <AnimatePresence>
                {expanded && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="whitespace-nowrap"
                  >
                    {getStatusText()}
                  </motion.span>
                )}
              </AnimatePresence>
            </Badge>
            
            {shouldShowWarning() && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 h-3 w-3 bg-amber-500 rounded-full flex items-center justify-center"
              >
                <AlertTriangle className="h-2 w-2 text-white" />
              </motion.div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">
              Plan {getPlanLabel()}
              {isTrialing && ` (Essai)`}
            </p>
            {isTrialing && subscription?.trialDaysLeft && (
              <p className="text-sm text-muted-foreground">
                {subscription.trialDaysLeft} jour{subscription.trialDaysLeft > 1 ? 's' : ''} d'essai restant{subscription.trialDaysLeft > 1 ? 's' : ''}
              </p>
            )}
            {!isActive && !isFree && (
              <p className="text-sm text-red-600">
                Abonnement expiré
              </p>
            )}
            {isFree && (
              <p className="text-sm text-muted-foreground">
                Passez au plan payant pour débloquer toutes les fonctionnalités
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>

      {showUpgradeButton && expanded && (isFree || (isTrialing && subscription?.trialDaysLeft && subscription.trialDaysLeft <= 7)) && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              asChild
              size="sm"
              variant="outline"
              className="h-6 px-2 text-xs font-medium border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            >
              <Link href="/dashboard/upgrade?feature=pro">
                <CreditCard className="h-3 w-3 mr-1" />
                Passer au Pro
              </Link>
            </Button>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}