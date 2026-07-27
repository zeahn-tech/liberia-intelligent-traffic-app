import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Brain,
  AlertTriangle,
  Route,
  MapPin,
  Car,
  TrendingUp,
  Activity,
  Clock,
  Shield,
  RefreshCw,
  Target,
  Crosshair,
  Layers,
  Info,
  Zap,
  Gauge,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { predictiveEngine, modelRegistry, DISCLAIMER } from "@/ai/predictive";
import type {
  PredictionResult,
  RoadRiskPrediction,
  HotspotPrediction,
  AccidentRiskPrediction,
  CongestionForecast,
  OffenderRiskPrediction,
  VolumeForecast,
  PredictionSummary,
  PredictionModel,
} from "@/ai/predictive";

// ─── Helpers ─────────────────────────────────────────────

function RiskBadge({ risk, size = "sm" }: { risk: string; size?: "sm" | "xs" }) {
  const colors: Record<string, string> = {
    critical: "bg-destructive/15 text-destructive border-destructive/30",
    high: "bg-destructive/10 text-destructive border-destructive/20",
    medium: "bg-warning/10 text-warning border-warning/20",
    low: "bg-success/10 text-success border-success/20",
  };
  const sizeClass = size === "xs" ? "text-[9px] px-1.5 py-0 h-4" : "text-[10px] px-2 py-0.5 h-5";
  return (
    <Badge variant="outline" className={`clay-pill ${sizeClass} ${colors[risk] || colors.low}`}>
      {risk}
    </Badge>
  );
}

function ConfidenceBar({ score }: { score: number }) {
  const color =
    score >= 80 ? "bg-success" :
    score >= 60 ? "bg-warning" :
    score >= 35 ? "bg-orange-500" : "bg-destructive";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-[10px] font-medium text-muted-foreground w-8 text-right">{score}%</span>
    </div>
  );
}

function TrendIcon({ direction }: { direction: string }) {
  if (direction === "increasing") return <TrendingUp className="w-3 h-3 text-destructive" />;
  if (direction === "decreasing") return <TrendingUp className="w-3 h-3 text-success rotate-180" />;
  return <Activity className="w-3 h-3 text-muted-foreground" />;
}

// ─── Sub-Components ──────────────────────────────────────

function DisclaimerBanner() {
  return (
    <Alert variant="default" className="bg-amber-500/5 border-amber-500/20 rounded-xl">
      <Info className="w-4 h-4 text-amber-500" />
      <AlertTitle className="text-xs font-semibold text-amber-600">Predictive Analytics — Estimates Only</AlertTitle>
      <AlertDescription className="text-[11px] text-muted-foreground mt-1">
        {DISCLAIMER}
      </AlertDescription>
    </Alert>
  );
}

function ModelStatusBar({ summary }: { summary: PredictionSummary }) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
      <div className="flex items-center gap-1.5">
        <Shield className="w-3.5 h-3.5 text-success" />
        <span>{summary.modelsOnline} models online</span>
      </div>
      {summary.modelsTraining > 0 && (
        <div className="flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5 text-warning animate-spin" />
          <span>{summary.modelsTraining} training</span>
        </div>
      )}
      <div className="flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5" />
        <span>Updated {new Date(summary.lastUpdated).toLocaleTimeString()}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
        <span>{summary.highRiskAlerts} high-risk alerts</span>
      </div>
    </div>
  );
}

function RoadRiskCard({ prediction }: { prediction: RoadRiskPrediction }) {
  return (
    <div className="clay-card bg-card p-4 rounded-xl space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Route className="w-4 h-4 text-destructive shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{prediction.roadName}</p>
            <p className="text-[10px] text-muted-foreground">{prediction.county} · {prediction.district}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <TrendIcon direction={prediction.trendDirection} />
          <RiskBadge risk={prediction.predictedRisk} size="xs" />
        </div>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Risk Score</span>
        <span className="font-bold">{prediction.riskScore}/100</span>
      </div>
      <Progress value={prediction.riskScore} className="h-1.5" />
      <div className="flex flex-wrap gap-1">
        {prediction.factors.slice(0, 3).map((f) => (
          <Badge key={f} variant="secondary" className="clay-pill text-[9px] px-1.5 py-0 h-4">
            {f.replace(/_/g, " ")}
          </Badge>
        ))}
      </div>
      {prediction.recommendation && (
        <p className="text-[10px] text-muted-foreground italic leading-relaxed">{prediction.recommendation}</p>
      )}
      <div className="flex items-center gap-2 pt-1 border-t border-border/30">
        <ConfidenceBar score={prediction.confidenceScore} />
      </div>
    </div>
  );
}

function HotspotCard({ prediction }: { prediction: HotspotPrediction }) {
  return (
    <div className="clay-card bg-card p-4 rounded-xl space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <MapPin className="w-4 h-4 text-warning shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{prediction.locationName}</p>
            <p className="text-[10px] text-muted-foreground">{prediction.county} · {prediction.district}</p>
          </div>
        </div>
        <Badge variant="outline" className={`clay-pill text-[9px] ${
          prediction.estimatedImpact === "high" ? "bg-destructive/10 text-destructive" :
          prediction.estimatedImpact === "medium" ? "bg-warning/10 text-warning" :
          "bg-success/10 text-success"
        }`}>
          {prediction.estimatedImpact} impact
        </Badge>
      </div>
      <div className="space-y-1.5">
        {prediction.predictedViolationTypes.map((vt, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{vt.type}</span>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">{vt.estimatedFrequency}</span>
              <span className={`font-medium ${
                vt.probability >= 70 ? "text-destructive" : vt.probability >= 50 ? "text-warning" : "text-success"
              }`}>
                {vt.probability}%
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5 text-[10px]">
        <span className="text-muted-foreground">Peak:</span>
        {prediction.peakTimes.map((t) => (
          <Badge key={t} variant="outline" className="clay-pill text-[9px] px-1.5 py-0 h-4">{t}</Badge>
        ))}
        {prediction.peakDays.slice(0, 2).map((d) => (
          <Badge key={d} variant="outline" className="clay-pill text-[9px] px-1.5 py-0 h-4">{d}</Badge>
        ))}
      </div>
      <ConfidenceBar score={prediction.confidenceScore} />
    </div>
  );
}

function AccidentRiskCard({ prediction }: { prediction: AccidentRiskPrediction }) {
  return (
    <div className="clay-card bg-card p-4 rounded-xl space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{prediction.roadName}</p>
            <p className="text-[10px] text-muted-foreground truncate">{prediction.locationDescription}</p>
          </div>
        </div>
        <RiskBadge risk={prediction.riskLevel} size="xs" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="text-center p-2 rounded-lg bg-secondary/30">
          <p className="text-lg font-bold">{prediction.probabilityScore}%</p>
          <p className="text-[9px] text-muted-foreground">Probability</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-secondary/30">
          <p className="text-lg font-bold">{prediction.historicalAccidents}</p>
          <p className="text-[9px] text-muted-foreground">Past Accidents</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {prediction.contributingFactors.slice(0, 3).map((f) => (
          <Badge key={f} variant="secondary" className="clay-pill text-[9px] px-1.5 py-0 h-4">
            {f.replace(/_/g, " ")}
          </Badge>
        ))}
      </div>
      <ConfidenceBar score={prediction.confidenceScore} />
    </div>
  );
}

function OffenderRiskCard({ prediction }: { prediction: OffenderRiskPrediction }) {
  return (
    <div className="clay-card bg-card p-4 rounded-xl space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Car className="w-4 h-4 text-warning shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-bold font-mono">{prediction.licensePlate}</p>
            <p className="text-[10px] text-muted-foreground">{prediction.totalViolations} violations · avg every {prediction.averageFrequencyDays}d</p>
          </div>
        </div>
        <RiskBadge risk={prediction.riskLevel} size="xs" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="text-center p-2 rounded-lg bg-secondary/30">
          <p className="text-lg font-bold">{prediction.riskScore}%</p>
          <p className="text-[9px] text-muted-foreground">Risk Score</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-secondary/30">
          <p className="text-lg font-bold">{prediction.escalationProbability}%</p>
          <p className="text-[9px] text-muted-foreground">Escalation Risk</p>
        </div>
      </div>
      <div className="space-y-1">
        {prediction.violationsByType.map((v) => (
          <div key={v.type} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <TrendIcon direction={v.trend} />
              <span className="text-muted-foreground">{v.type}</span>
            </div>
            <span className="font-medium">{v.count}x</span>
          </div>
        ))}
      </div>
      {prediction.recommendation && (
        <p className="text-[10px] text-muted-foreground italic leading-relaxed">{prediction.recommendation}</p>
      )}
      <ConfidenceBar score={prediction.confidenceScore} />
    </div>
  );
}

function VolumeForecastCard({ prediction }: { prediction: VolumeForecast }) {
  return (
    <div className="clay-card bg-card p-4 rounded-xl space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-info shrink-0" />
          <div>
            <p className="text-sm font-medium capitalize">{prediction.forecastType} Forecast</p>
            <p className="text-[10px] text-muted-foreground">Period: {prediction.period}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold">{prediction.estimatedVolume}</p>
          <div className={`flex items-center gap-0.5 text-[10px] ${
            prediction.trend === "increasing" ? "text-destructive" :
            prediction.trend === "decreasing" ? "text-success" : "text-muted-foreground"
          }`}>
            {prediction.trend === "increasing" && <TrendingUp className="w-2.5 h-2.5" />}
            {prediction.trend === "decreasing" && <TrendingUp className="w-2.5 h-2.5 rotate-180" />}
            {prediction.comparisonToPrevious > 0 ? "+" : ""}{prediction.comparisonToPrevious}%
          </div>
        </div>
      </div>
      <div className="relative h-8 bg-secondary rounded-lg overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-between px-3 text-[10px] text-muted-foreground">
          <span>{prediction.lowerBound}</span>
          <span className="font-bold text-foreground">{prediction.estimatedVolume} est.</span>
          <span>{prediction.upperBound}</span>
        </div>
        <div
          className="h-full bg-gradient-to-r from-info/20 via-info/40 to-info/20 rounded-lg"
          style={{
            marginLeft: `${10}%`,
            width: `${Math.min((prediction.upperBound - prediction.lowerBound) / prediction.estimatedVolume * 100, 80)}%`,
          }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>95% confidence interval</span>
        <span>±{prediction.upperBound - prediction.estimatedVolume}</span>
      </div>
      <ConfidenceBar score={prediction.confidenceScore} />
    </div>
  );
}

function CongestionCard({ prediction }: { prediction: CongestionForecast }) {
  return (
    <div className="clay-card bg-card p-4 rounded-xl space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Gauge className="w-4 h-4 text-info shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{prediction.roadName}</p>
            <p className="text-[10px] text-muted-foreground truncate">{prediction.segment}</p>
          </div>
        </div>
        <Badge variant="outline" className={`clay-pill text-[9px] ${
          prediction.predictedCongestion === "severe" ? "bg-destructive/10 text-destructive" :
          prediction.predictedCongestion === "heavy" ? "bg-warning/10 text-warning" :
          "bg-info/10 text-info"
        }`}>
          {prediction.predictedCongestion}
        </Badge>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Avg speed</span>
        <span className="font-bold">{prediction.averageSpeed} km/h</span>
      </div>
      <Progress
        value={Math.max(10, 100 - prediction.averageSpeed * 1.5)}
        className="h-1.5"
      />
      <div className="space-y-1">
        {prediction.peakForecast.slice(0, 2).map((pf, i) => (
          <div key={i} className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground">{pf.day} {pf.timeRange}</span>
            <div className="flex items-center gap-1.5">
              <RiskBadge risk={pf.expectedLevel} size="xs" />
              <span className="text-muted-foreground">+{pf.delayMinutes}min</span>
            </div>
          </div>
        ))}
      </div>
      <ConfidenceBar score={prediction.confidenceScore} />
    </div>
  );
}

function ModelInfoPanel({ models }: { models: PredictionModel[] }) {
  return (
    <div className="space-y-2">
      {models.map((model) => (
        <div key={model.id} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
          <div className="min-w-0">
            <p className="text-xs font-medium">{model.name}</p>
            <p className="text-[10px] text-muted-foreground">v{model.version}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">{model.accuracy}% acc.</span>
            <Badge variant="outline" className={`clay-pill text-[9px] ${
              model.status === "active" ? "bg-success/10 text-success" :
              model.status === "training" ? "bg-warning/10 text-warning" :
              model.status === "deprecated" ? "bg-secondary text-muted-foreground" :
              "bg-destructive/10 text-destructive"
            }`}>
              {model.status}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────

export function PredictiveAnalyticsPanel() {
  const [tab, setTab] = useState("overview");
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [summary, setSummary] = useState<PredictionSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const results = await predictiveEngine.predictAll();
        setPredictions(results);
        setSummary(predictiveEngine.getSummary());
      } catch {
        // Silently handle errors
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const roadRisks = predictions.filter((p): p is RoadRiskPrediction => p.category === "road_risk");
  const hotspots = predictions.filter((p): p is HotspotPrediction => p.category === "hotspot_prediction");
  const accidentRisks = predictions.filter((p): p is AccidentRiskPrediction => p.category === "accident_risk");
  const congestion = predictions.filter((p): p is CongestionForecast => p.category === "congestion_forecast");
  const offenders = predictions.filter((p): p is OffenderRiskPrediction => p.category === "offender_risk");
  const volumes = predictions.filter((p): p is VolumeForecast => p.category === "volume_forecast");
  const models = modelRegistry.getAll();

  if (loading) {
    return (
      <div className="space-y-4">
        <DisclaimerBanner />
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Generating predictive analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <DisclaimerBanner />

      {summary && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <ModelStatusBar summary={summary} />
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl text-xs h-8"
            onClick={async () => {
              setLoading(true);
              const results = await predictiveEngine.predictAll();
              setPredictions(results);
              setSummary(predictiveEngine.getSummary());
              setLoading(false);
            }}
          >
            <RefreshCw className="w-3 h-3 mr-1.5" />
            Refresh
          </Button>
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="clay-card bg-secondary/50 p-1 rounded-xl flex-wrap">
          <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-card data-[state=active]:clay-card text-xs">
            <Activity className="w-3 h-3 mr-1" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="roads" className="rounded-lg data-[state=active]:bg-card data-[state=active]:clay-card text-xs">
            <Route className="w-3 h-3 mr-1" />
            Road Risk
          </TabsTrigger>
          <TabsTrigger value="hotspots" className="rounded-lg data-[state=active]:bg-card data-[state=active]:clay-card text-xs">
            <Target className="w-3 h-3 mr-1" />
            Hotspots
          </TabsTrigger>
          <TabsTrigger value="accidents" className="rounded-lg data-[state=active]:bg-card data-[state=active]:clay-card text-xs">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Accidents
          </TabsTrigger>
          <TabsTrigger value="offenders" className="rounded-lg data-[state=active]:bg-card data-[state=active]:clay-card text-xs">
            <Car className="w-3 h-3 mr-1" />
            Offenders
          </TabsTrigger>
          <TabsTrigger value="volume" className="rounded-lg data-[state=active]:bg-card data-[state=active]:clay-card text-xs">
            <TrendingUp className="w-3 h-3 mr-1" />
            Volume
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: "Road Risks", value: roadRisks.length, icon: Route, color: "from-destructive/30 to-destructive/10" },
              { label: "Hotspots", value: hotspots.length, icon: Crosshair, color: "from-warning/30 to-warning/10" },
              { label: "Accident Risks", value: accidentRisks.length, icon: AlertTriangle, color: "from-orange-500/30 to-orange-500/10" },
              { label: "Congestion", value: congestion.length, icon: Gauge, color: "from-info/30 to-info/10" },
              { label: "Offenders", value: offenders.length, icon: Car, color: "from-fuchsia-500/30 to-fuchsia-500/10" },
              { label: "Forecasts", value: volumes.length, icon: TrendingUp, color: "from-emerald-500/30 to-emerald-500/10" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="clay-card bg-card p-3 rounded-xl text-center"
              >
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mx-auto mb-1.5`}>
                  <stat.icon className="w-4 h-4" />
                </div>
                <p className="text-lg font-bold">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Model Status */}
          <Card className="clay-card border-border/50 !rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Prediction Models</CardTitle>
              <CardDescription>Registered models and their status</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="px-4 pb-3">
                <ModelInfoPanel models={models} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roads" className="mt-4">
          {roadRisks.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No road risk predictions available.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {roadRisks.map((r) => (
                <RoadRiskCard key={r.id} prediction={r} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="hotspots" className="mt-4">
          {hotspots.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No hotspot predictions available.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {hotspots.map((h) => (
                <HotspotCard key={h.id} prediction={h} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="accidents" className="mt-4">
          {accidentRisks.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No accident risk predictions available.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {accidentRisks.map((a) => (
                <AccidentRiskCard key={a.id} prediction={a} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="offenders" className="mt-4">
          {offenders.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No repeat offender predictions available.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {offenders.map((o) => (
                <OffenderRiskCard key={o.id} prediction={o} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="volume" className="mt-4">
          {volumes.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No volume forecasts available.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {volumes.map((v) => (
                <VolumeForecastCard key={v.id} prediction={v} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
