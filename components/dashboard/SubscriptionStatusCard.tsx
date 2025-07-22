"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useSubscription, useUsageLimit } from "@/hooks/useSubscription";
import { 
  Crown, 
  Star, 
  Zap, 
  AlertTriangle, 
  CreditCard, 
  Users, 
  FileText,
  Calendar,
  TrendingUp
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface SubscriptionStatusCardProps {
  showUsage?: boolean;
  showActions?: boolean;
  variant?: "default" | "compact";
}

export function SubscriptionStatusCard({ 
  showUsage = true, 
  showActions = true,
  variant = "default"
}: SubscriptionStatusCardProps) {
  const { subscription, loading, isTrialing, isActive, openBillingPortal } = useSubscription();
  const { isAtLimit: clientsAtLimit, limit: clientsLimit } = useUsageLimit('clients');
  const { isAtLimit: mealPlansAtLimit, limit: mealPlansLimit } = useUsageLimit('meal_plans');

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />
            <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
            <div className="h-8 bg-gray-200 rounded w-24 animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const getPlanIcon = () => {
    if (!subscription) return <Star className="h-5 w-5" />;
    
    switch (subscription.plan) {
      case 'starter':
        return <Zap className="h-5 w-5" />;
      default:
        return <Star className="h-5 w-5" />;
    }
  };

  const getPlanLabel = () => {
    if (!subscription) return 'Aucun plan actif';
    
    switch (subscription.plan) {
      case 'starter':
        return 'Plan Starter';
      default:
        return 'Aucun plan actif';
    }
  };

  const getBadgeVariant = (): "default" | "secondary" | "destructive" | "outline" => {
    if (isTrialing) return "outline";
    if (!subscription) return "secondary";
    if (isActive) return "default";
    return "destructive";
  };

  const getBadgeClassName = () => {
    if (isTrialing) return "border-emerald-300 text-emerald-700 bg-emerald-50";
    if (!subscription) return "border-gray-300 text-gray-700 bg-gray-50";
    if (isActive) return "border-emerald-300 text-emerald-700 bg-emerald-50";
    return "border-red-300 text-red-700 bg-red-50";
  };

  const getStatusText = () => {
    if (isTrialing) return "Période d'essai";
    if (!isActive && subscription) return "Expiré";
    if (isActive) return "Actif";
    return "Inactif";
  };

  const shouldShowWarning = () => {
    return isTrialing && subscription?.trialDaysLeft && subscription.trialDaysLeft <= 3;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    try {
      return format(new Date(dateString), 'd MMMM yyyy', { locale: fr });
    } catch {
      return null;
    }
  };

  if (variant === "compact") {
    return (
      <Card className="border-l-4 border-l-emerald-500">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${
                subscription?.plan === 'starter' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-600'
              }`}>
                {getPlanIcon()}
              </div>
              <div>
                <h3 className="font-semibold">{getPlanLabel()}</h3>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={getBadgeVariant()}
                    className={getBadgeClassName()}
                  >
                    {getStatusText()}
                  </Badge>
                  {isTrialing && subscription?.trialDaysLeft && (
                    <span className="text-sm text-muted-foreground">
                      {subscription.trialDaysLeft} jour{subscription.trialDaysLeft > 1 ? 's' : ''} restant{subscription.trialDaysLeft > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {showActions && (!subscription || shouldShowWarning()) && (
              <Button asChild size="sm" variant="outline">
                <Link href="/dashboard/upgrade?feature=pro">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Passer au Pro
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-full ${
              subscription?.plan === 'starter' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-600'
            }`}>
              {getPlanIcon()}
            </div>
            <div>
              <CardTitle className="text-lg">{getPlanLabel()}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge 
                  variant={getBadgeVariant()}
                  className={getBadgeClassName()}
                >
                  {getStatusText()}
                </Badge>
                {shouldShowWarning() && (
                  <div className="flex items-center gap-1 text-amber-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">Action requise</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Trial Information */}
        {isTrialing && subscription?.trialDaysLeft && (
          <div className={`p-3 rounded-lg border ${
            subscription.trialDaysLeft <= 3 
              ? 'border-amber-200 bg-amber-50' 
              : 'border-emerald-200 bg-emerald-50'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-current" />
              <span className="font-medium">
                Période d'essai - {subscription.trialDaysLeft} jour{subscription.trialDaysLeft > 1 ? 's' : ''} restant{subscription.trialDaysLeft > 1 ? 's' : ''}
              </span>
            </div>
            {subscription.trialEndsAt && (
              <p className="text-sm text-muted-foreground">
                Se termine le {formatDate(subscription.trialEndsAt)}
              </p>
            )}
            {subscription.trialDaysLeft <= 3 && (
              <p className="text-sm font-medium text-amber-700 mt-2">
                Souscrivez bientôt pour continuer à utiliser toutes les fonctionnalités.
              </p>
            )}
          </div>
        )}

        {/* Subscription Details */}
        {isActive && subscription && subscription?.currentPeriodEnd && (
          <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              <span className="font-medium">Abonnement actif</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Renouvellement le {formatDate(subscription.currentPeriodEnd)}
            </p>
          </div>
        )}

        {/* Usage Limits */}
        {showUsage && subscription?.planDetails && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Utilisation</h4>
            
            {/* Clients Usage */}
            {subscription.planDetails.max_clients !== null && subscription.planDetails.max_clients !== -1 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>Clients</span>
                  </div>
                  <span className={`font-medium ${clientsAtLimit ? 'text-red-600' : ''}`}>
                    {/* Usage count would need to be fetched */}
                    {subscription.planDetails.max_clients === -1 ? 'Illimité' : `0/${subscription.planDetails.max_clients}`}
                  </span>
                </div>
                {subscription.planDetails.max_clients !== -1 && (
                  <Progress value={0} className="h-2" />
                )}
              </div>
            )}

            {/* Meal Plans Usage */}
            {subscription.planDetails.max_meal_plans !== null && subscription.planDetails.max_meal_plans !== -1 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>Plans alimentaires</span>
                  </div>
                  <span className={`font-medium ${mealPlansAtLimit ? 'text-red-600' : ''}`}>
                    {/* Usage count would need to be fetched */}
                    {subscription.planDetails.max_meal_plans === -1 ? 'Illimité' : `0/${subscription.planDetails.max_meal_plans}`}
                  </span>
                </div>
                {subscription.planDetails.max_meal_plans !== -1 && (
                  <Progress value={0} className="h-2" />
                )}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex gap-2 pt-2">
            {(!subscription || shouldShowWarning()) && (
              <Button asChild className="flex-1">
                <Link href="/dashboard/upgrade?feature=pro">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Passer au Pro
                </Link>
              </Button>
            )}
            
            {isActive && subscription && (
              <Button variant="outline" onClick={openBillingPortal} className="flex-1">
                Gérer l'abonnement
              </Button>
            )}
          </div>
        )}

        {/* No Active Subscription Information */}
        {!subscription && (
          <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
            <p className="text-sm text-muted-foreground mb-2">
              Vous n'avez pas d'abonnement actif.
            </p>
            <p className="text-sm font-medium text-gray-700">
              Souscrivez à un plan pour débloquer toutes les fonctionnalités.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}