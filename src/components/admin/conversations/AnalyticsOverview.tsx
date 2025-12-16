import { AnalyticsSnapshot } from "@/types/conversations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, Pie, PieChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download, RefreshCcw } from "lucide-react";

interface AnalyticsOverviewProps {
  data?: AnalyticsSnapshot;
  loading: boolean;
  range: string;
  onRangeChange: (value: string) => void;
  onRefresh: () => void;
  onExport: (format: "csv" | "xlsx") => void;
}

const rangeOptions = [
  { label: "Today", value: "1d" },
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Quarter", value: "90d" },
];

export const AnalyticsOverview = ({ data, loading, range, onRangeChange, onRefresh, onExport }: AnalyticsOverviewProps) => {
  return (
    <Card className="p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="text-lg">Analytics</CardTitle>
          <p className="text-xs text-slate-500">Lead and conversation performance</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={range} onValueChange={onRangeChange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {rangeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => onExport("csv")}>
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => onExport("xlsx")}>
            <Download className="h-4 w-4" /> Excel
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Loading analytics...</div>
      ) : data ? (
        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          <div className="space-y-4">
            <MetricGrid data={data} />
            <Card className="p-4">
              <p className="text-sm font-semibold text-slate-700">Conversation Volume</p>
              <ChartContainer
                config={{ conversations: { label: "Conversations", color: "#1D74B8" } }}
                className="h-56"
              >
                <AreaChart data={data.conversationVolumeTrend}>
                  <defs>
                    <linearGradient id="conversationGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1D74B8" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#1D74B8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="count" stroke="#1D74B8" fillOpacity={1} fill="url(#conversationGradient)" />
                </AreaChart>
              </ChartContainer>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="p-4">
              <p className="text-sm font-semibold text-slate-700">Lead Quality Distribution</p>
              <ChartContainer
                config={{ 
                  hot: { label: "Hot", color: "#ef4444" },
                  warm: { label: "Warm", color: "#f59e0b" },
                  cold: { label: "Cold", color: "#3b82f6" },
                }}
                className="h-[220px]"
              >
                <PieChart>
                  <Pie dataKey="count" nameKey="quality" data={data.leadQualityDistribution} innerRadius={60} outerRadius={90} label />
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                </PieChart>
              </ChartContainer>
            </Card>

            <Card className="p-4">
              <p className="text-sm font-semibold text-slate-700">Agent Performance</p>
              <ChartContainer
                config={{ conversations: { label: "Conversations", color: "#219F68" } }}
                className="h-48"
              >
                <BarChart data={data.agentPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="agentName" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="conversations" fill="#219F68" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </Card>

            <Card className="p-4">
              <p className="text-sm font-semibold text-slate-700">Conversion Funnel</p>
              <ChartContainer
                config={{ funnel: { label: "Stage", color: "#F97316" } }}
                className="h-48"
              >
                <LineChart data={data.conversionFunnel}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="stage" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="value" stroke="#F97316" strokeWidth={3} dot={false} />
                </LineChart>
              </ChartContainer>
            </Card>
          </div>
        </div>
      ) : (
        <div className="py-8 text-center text-slate-400">No analytics available</div>
      )}
    </Card>
  );
};

const MetricGrid = ({ data }: { data: AnalyticsSnapshot }) => (
  <div className="grid gap-3 md:grid-cols-3">
    <StatCard label="Conversations" value={data.totalConversations} trend="today" />
    <StatCard label="Hot leads" value={data.hotLeads} trend="score > 80" tone="danger" />
    <StatCard label="Conversion rate" value={`${data.conversionRate}%`} trend="vs last period" tone="success" />
  </div>
);

const StatCard = ({ label, value, trend, tone = "info" }: { label: string; value: number | string; trend?: string; tone?: "info" | "danger" | "success" }) => {
  const toneMap: Record<string, string> = {
    info: "text-slate-500",
    danger: "text-red-500",
    success: "text-emerald-600",
  };

  return (
    <Card className="p-4">
      <CardHeader className="p-0 pb-2">
        <CardTitle className="text-xs uppercase text-slate-400">{label}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <p className="text-2xl font-semibold text-slate-900">{value}</p>
        {trend && <p className={`text-xs mt-1 ${toneMap[tone]}`}>{trend}</p>}
      </CardContent>
    </Card>
  );
};
