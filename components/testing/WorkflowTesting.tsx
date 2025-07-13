"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  runE2EWorkflowTests,
  type WorkflowTestResult,
} from "@/lib/e2e-workflow-tester";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  Play,
  RefreshCw,
  TestTube,
  XCircle,
} from "lucide-react";
import { useState } from "react";

export function WorkflowTesting() {
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<WorkflowTestResult[]>([]);
  const [currentTest, setCurrentTest] = useState<string>("");

  const runTests = async () => {
    setIsRunning(true);
    setResults([]);
    setCurrentTest("");

    try {
      toast({
        title: "Tests démarrés",
        description: "Exécution des tests de workflows en cours...",
      });

      // Run the E2E workflow tests
      const testResults = await runE2EWorkflowTests();
      setResults(testResults);

      const passedCount = testResults.filter((r) => r.passed).length;
      const totalCount = testResults.length;

      if (passedCount === totalCount) {
        toast({
          title: "Tests réussis ✅",
          description: `Tous les ${totalCount} workflows fonctionnent correctement`,
        });
      } else {
        toast({
          title: "Tests partiellement réussis ⚠️",
          description: `${passedCount}/${totalCount} workflows ont réussi`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Test execution error:", error);
      toast({
        title: "Erreur de test",
        description: "Impossible d'exécuter les tests de workflow",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
      setCurrentTest("");
    }
  };

  const exportResults = () => {
    const csvContent = [
      ["Test Name", "Status", "Duration (ms)", "Error"],
      ...results.map((result) => [
        result.testName,
        result.passed ? "PASSED" : "FAILED",
        result.duration.toString(),
        result.error || "",
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `workflow-test-results-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export réussi",
      description: "Les résultats des tests ont été exportés",
    });
  };

  const getStatusIcon = (passed: boolean) => {
    return passed ? (
      <CheckCircle2 className="h-5 w-5 text-green-600" />
    ) : (
      <XCircle className="h-5 w-5 text-red-600" />
    );
  };

  const getStatusBadge = (passed: boolean) => {
    return (
      <Badge variant={passed ? "default" : "destructive"}>
        {passed ? "RÉUSSI" : "ÉCHEC"}
      </Badge>
    );
  };

  const successRate =
    results.length > 0
      ? (results.filter((r) => r.passed).length / results.length) * 100
      : 0;

  const failedTests = results.filter((r) => !r.passed);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <TestTube className="h-6 w-6 text-emerald-600" />
            Tests de workflows E2E
          </h2>
          <p className="text-slate-600">
            Testez les parcours utilisateur complets pour valider le bon
            fonctionnement du système
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={runTests}
            disabled={isRunning}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isRunning ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            {isRunning ? "Tests en cours..." : "Lancer les tests"}
          </Button>
          {results.length > 0 && (
            <Button onClick={exportResults} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          )}
        </div>
      </div>

      {/* Current Test Indicator */}
      {isRunning && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            Tests en cours d'exécution... Cela peut prendre quelques minutes.
          </AlertDescription>
        </Alert>
      )}

      {/* Results Summary */}
      {results.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tests exécutés
              </CardTitle>
              <TestTube className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{results.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Taux de réussite
              </CardTitle>
              {successRate === 100 ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {successRate.toFixed(1)}%
              </div>
              <Progress value={successRate} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tests échoués
              </CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{failedTests.length}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Failed Tests Alert */}
      {failedTests.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {failedTests.length} test(s) ont échoué. Consultez les détails
            ci-dessous pour identifier les problèmes.
          </AlertDescription>
        </Alert>
      )}

      {/* Test Results Table */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Résultats détaillés</CardTitle>
            <CardDescription>
              Résultats de chaque test de workflow avec détails des erreurs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Durée</TableHead>
                  <TableHead>Détails</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((result, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(result.passed)}
                        <span className="font-medium">{result.testName}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(result.passed)}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {result.duration}ms
                    </TableCell>
                    <TableCell>
                      {result.error ? (
                        <div className="text-red-600 text-sm max-w-md">
                          <details className="cursor-pointer">
                            <summary className="hover:underline">
                              Voir l'erreur
                            </summary>
                            <pre className="mt-2 p-2 bg-red-50 rounded text-xs whitespace-pre-wrap">
                              {result.error}
                            </pre>
                          </details>
                        </div>
                      ) : (
                        <span className="text-green-600 text-sm">Succès</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Test Descriptions */}
      <Card>
        <CardHeader>
          <CardTitle>Tests inclus</CardTitle>
          <CardDescription>
            Description des workflows testés automatiquement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">🧑‍💼 Gestion des clients</h4>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Processus d'onboarding complet</li>
                <li>• Création et récupération des données</li>
                <li>• Mesures de poids initiales</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-sm">🍽️ Plans alimentaires</h4>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Création de plans personnalisés</li>
                <li>• Validation des données nutritionnelles</li>
                <li>• Livraison aux clients</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-sm">📄 Gestion documentaire</h4>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Upload et stockage de fichiers</li>
                <li>• Catégorisation et filtrage</li>
                <li>• Contrôle de visibilité client</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-sm">📅 Rendez-vous</h4>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Planification de consultations</li>
                <li>• Gestion des statuts</li>
                <li>• Intégration calendrier</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-sm">📈 Suivi des progrès</h4>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Historique des pesées</li>
                <li>• Calculs de progression</li>
                <li>• Photos de progrès</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-sm">💰 Facturation</h4>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Création de factures</li>
                <li>• Gestion des statuts de paiement</li>
                <li>• Calculs automatiques</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-sm">💬 Messagerie</h4>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Conversations structurées</li>
                <li>• Envoi et récupération de messages</li>
                <li>• Intégration avec les clients</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-sm">📊 Analytics</h4>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Agrégations de données</li>
                <li>• Filtrage par date</li>
                <li>• Métriques de performance</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
