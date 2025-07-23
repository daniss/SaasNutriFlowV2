"use client";

import { Badge } from "@/components/ui/badge";
import { useUsageCounts } from "@/hooks/useUsageCounts";
import { useSubscription } from "@/hooks/useSubscription";
import { Users, FileText, Zap } from "lucide-react";

interface UsageCounterProps {
  type: 'clients' | 'meal_plans' | 'ai_generations';
  className?: string;
}

export function UsageCounter({ type, className = "" }: UsageCounterProps) {
  const { subscription } = useSubscription();
  const { clients, mealPlans, aiGenerations } = useUsageCounts();

  if (!subscription?.planDetails) {
    return null;
  }

  const getUsageData = () => {
    if (!subscription?.planDetails) return null;
    
    switch (type) {
      case 'clients':
        return {
          current: clients.current,
          limit: subscription.planDetails.max_clients,
          icon: Users,
          label: 'Clients',
          loading: clients.loading
        };
      case 'meal_plans':
        return {
          current: mealPlans.current,
          limit: subscription.planDetails.max_meal_plans,
          icon: FileText,
          label: 'Plans',
          loading: mealPlans.loading
        };
      case 'ai_generations':
        return {
          current: aiGenerations.current,
          limit: subscription.planDetails.ai_generations_per_month,
          icon: Zap,
          label: 'IA/mois',
          loading: aiGenerations.loading
        };
      default:
        return null;
    }
  };

  const usageData = getUsageData();
  if (!usageData || usageData.limit === null) {
    return null;
  }

  const { current, limit, icon: Icon, label, loading } = usageData;
  const isAtLimit = current >= limit && limit !== -1;
  const isNearLimit = current / limit >= 0.8 && limit !== -1;

  const getBadgeVariant = () => {
    if (isAtLimit) return "destructive";
    if (isNearLimit) return "secondary";
    return "outline";
  };

  const getBadgeClassName = () => {
    if (isAtLimit) return "border-red-300 text-red-700 bg-red-50";
    if (isNearLimit) return "border-orange-300 text-orange-700 bg-orange-50";
    return "border-emerald-300 text-emerald-700 bg-emerald-50";
  };

  return (
    <Badge 
      variant={getBadgeVariant()}
      className={`flex items-center gap-2 px-3 py-1.5 font-medium ${getBadgeClassName()} ${className}`}
    >
      <Icon className="h-4 w-4" />
      <span>
        {loading ? '...' : current}/{limit === -1 ? '∞' : limit} {label}
      </span>
    </Badge>
  );
}