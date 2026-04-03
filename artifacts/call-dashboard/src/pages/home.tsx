import { useFetchSheetData } from "@workspace/api-client-react";
import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, Search, PhoneCall, Clock, Users, ChevronLeft,
  Eye, Bell, User, Phone, TrendingUp, Activity, CheckCircle2,
  XCircle, ThumbsUp, Filter, ArrowUpDown
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  sheetUrl: z.string().url("Please enter a valid URL"),
});

type SheetRow = Record<string, string>;

interface Campaign {
  id: string;
  name: string;
  totalCalls: number;
  avgDurationMin: number;
  pickupRate: number;
  interestedRate: number;
  statusBreakdown: Record<string, number>;
  directionBreakdown: { inbound: number; outbound: number };
  sentimentBreakdown: { positive: number; negative: number; neutral: number; unknown: number };
  joinInterestYes: number;
  joinInterestNo: number;
  rows: SheetRow[];
  firstDate: string;
}

function findCol(headers: string[], patterns: string[]): string | null {
  const norm = headers.map(h => h.toLowerCase().replace(/[\s_-]+/g, "_"));
  for (const pat of patterns) {
    const idx = norm.findIndex(h => h.includes(pat.replace(/[\s_-]+/g, "_")));
    if (idx !== -1) return headers[idx];
  }
  return null;
}

function computeCampaigns(rows: SheetRow[], headers: string[]): Campaign[] {
  const bulkCallCol = findCol(headers, ["bulk_call_name", "bulk_call"]);
  const durationMinCol = findCol(headers, ["call_duration_in_minutes", "duration_in_minutes"]);
  const durationSecCol = findCol(headers, ["call_duration_in_seconds", "duration_in_seconds"]);
  const durationCol = durationMinCol ?? durationSecCol ?? findCol(headers, ["duration"]);
  const statusCol = findCol(headers, ["call_status", "status"]);
  const directionCol = findCol(headers, ["call_direction", "direction"]);
  const sentimentCol = findCol(headers, ["sentiment"]);
  const joinInterestCol = findCol(headers, ["join_interest"]);
  const dateCol = findCol(headers, ["call_date", "date", "created_at", "created"]);

  const grouped: Record<string, SheetRow[]> = {};

  rows.forEach(row => {
    const name = bulkCallCol ? (row[bulkCallCol] ?? "").trim() || "Unnamed Campaign" : "All Calls";
    if (!grouped[name]) grouped[name] = [];
    grouped[name].push(row);
  });

  return Object.entries(grouped).map(([name, campaignRows], idx) => {
    const durations = campaignRows
      .map(r => parseFloat(durationCol ? r[durationCol] ?? "" : ""))
      .filter(n => !isNaN(n) && n > 0);
    const isDurationSec = durationCol === durationSecCol;
    const durationsMin = isDurationSec ? durations.map(d => d / 60) : durations;
    const avgDurationMin = durationsMin.length > 0
      ? durationsMin.reduce((a, b) => a + b, 0) / durationsMin.length
      : 0;

    const statusBreakdown: Record<string, number> = {};
    let answered = 0;
    campaignRows.forEach(r => {
      const val = (statusCol ? r[statusCol] ?? "" : "").trim();
      if (val) {
        statusBreakdown[val] = (statusBreakdown[val] ?? 0) + 1;
        if (/completed|answered|connected|success/i.test(val)) answered++;
      }
    });
    const pickupRate = campaignRows.length > 0 ? (answered / campaignRows.length) * 100 : 0;

    const directionBreakdown = { inbound: 0, outbound: 0 };
    campaignRows.forEach(r => {
      const val = (directionCol ? r[directionCol] ?? "" : "").toLowerCase().trim();
      if (val.includes("inbound") || val === "in") directionBreakdown.inbound++;
      else if (val.includes("outbound") || val === "out") directionBreakdown.outbound++;
    });

    const sentimentBreakdown = { positive: 0, negative: 0, neutral: 0, unknown: 0 };
    campaignRows.forEach(r => {
      const val = (sentimentCol ? r[sentimentCol] ?? "" : "").toLowerCase().trim();
      if (val.includes("positive") || val === "good") sentimentBreakdown.positive++;
      else if (val.includes("negative") || val === "bad") sentimentBreakdown.negative++;
      else if (val.includes("neutral")) sentimentBreakdown.neutral++;
      else if (val !== "") sentimentBreakdown.unknown++;
    });

    let joinInterestYes = 0;
    let joinInterestNo = 0;
    if (joinInterestCol) {
      campaignRows.forEach(r => {
        const val = (r[joinInterestCol] ?? "").toLowerCase().trim();
        if (val === "yes" || val === "true" || val === "1") joinInterestYes++;
        else if (val === "no" || val === "false" || val === "0") joinInterestNo++;
      });
    }
    const interestedRate = campaignRows.length > 0 ? (joinInterestYes / campaignRows.length) * 100 : 0;

    const dates = dateCol
      ? campaignRows.map(r => r[dateCol] ?? "").filter(v => v.trim()).sort()
      : [];
    const firstDate = dates[0] ?? "";

    return {
      id: `CMP-${String(idx + 1).padStart(3, "0")}`,
      name,
      totalCalls: campaignRows.length,
      avgDurationMin,
      pickupRate,
      interestedRate,
      statusBreakdown,
      directionBreakdown,
      sentimentBreakdown,
      joinInterestYes,
      joinInterestNo,
      rows: campaignRows,
      firstDate,
    };
  }).sort((a, b) => b.totalCalls - a.totalCalls);
}

function formatDuration(minutes: number): string {
  if (minutes <= 0) return "—";
  const m = Math.floor(minutes);
  const s = Math.round((minutes - m) * 60);
  return `${m}m ${s}s`;
}

function StatCard({
  icon, label, value, color
}: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-gray-100">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
}

const PIE_COLORS = ["#6366f1", "#22c55e", "#ef4444", "#f59e0b", "#06b6d4"];
const YESNO_COLORS = ["#22c55e", "#ef4444"];

export default function Home() {
  const { toast } = useToast();
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  // Campaign detail filters
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterDirection, setFilterDirection] = useState<string>("all");
  const [filterSentiment, setFilterSentiment] = useState<string>("all");
  const [filterJoinInterest, setFilterJoinInterest] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Table pagination
  const [detailPage, setDetailPage] = useState(0);
  const rowsPerPage = 15;

  const fetchSheetData = useFetchSheetData();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { sheetUrl: "" },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await fetchSheetData.mutateAsync({ data: { sheetUrl: values.sheetUrl } });
      setHasAnalyzed(true);
      setSelectedCampaign(null);
    } catch {
      toast({
        title: "Failed to Load Sheet",
        description: "Make sure the Google Sheets link is publicly accessible (Anyone with link can view).",
        variant: "destructive",
      });
    }
  };

  const dataResponse = fetchSheetData.data;
  const headers = useMemo(
    () => dataResponse?.columns?.map(c => c.name) ?? [],
    [dataResponse]
  );

  const campaigns = useMemo(
    () => dataResponse ? computeCampaigns(dataResponse.rows, headers) : [],
    [dataResponse, headers]
  );

  // Global summary stats
  const totalCalls = campaigns.reduce((s, c) => s + c.totalCalls, 0);
  const avgPickupRate = campaigns.length > 0
    ? campaigns.reduce((s, c) => s + c.pickupRate, 0) / campaigns.length : 0;
  const avgInterestedRate = campaigns.length > 0
    ? campaigns.reduce((s, c) => s + c.interestedRate, 0) / campaigns.length : 0;

  // Campaign search
  const [campaignSearch, setCampaignSearch] = useState("");
  const filteredCampaigns = campaigns.filter(c =>
    c.name.toLowerCase().includes(campaignSearch.toLowerCase())
  );

  // Detail view filtered rows
  const joinInterestCol = findCol(headers, ["join_interest"]);
  const statusCol = findCol(headers, ["call_status", "status"]);
  const directionCol = findCol(headers, ["call_direction", "direction"]);
  const sentimentCol = findCol(headers, ["sentiment"]);

  const filteredDetailRows = useMemo(() => {
    if (!selectedCampaign) return [];
    return selectedCampaign.rows.filter(row => {
      if (filterStatus !== "all" && statusCol) {
        if ((row[statusCol] ?? "").trim() !== filterStatus) return false;
      }
      if (filterDirection !== "all" && directionCol) {
        const dir = (row[directionCol] ?? "").toLowerCase();
        if (filterDirection === "inbound" && !dir.includes("inbound") && dir !== "in") return false;
        if (filterDirection === "outbound" && !dir.includes("outbound") && dir !== "out") return false;
      }
      if (filterSentiment !== "all" && sentimentCol) {
        const sent = (row[sentimentCol] ?? "").toLowerCase();
        if (filterSentiment === "positive" && !sent.includes("positive") && sent !== "good") return false;
        if (filterSentiment === "negative" && !sent.includes("negative") && sent !== "bad") return false;
        if (filterSentiment === "neutral" && !sent.includes("neutral")) return false;
      }
      if (filterJoinInterest !== "all" && joinInterestCol) {
        const val = (row[joinInterestCol] ?? "").toLowerCase().trim();
        const isYes = val === "yes" || val === "true" || val === "1";
        const isNo = val === "no" || val === "false" || val === "0";
        if (filterJoinInterest === "yes" && !isYes) return false;
        if (filterJoinInterest === "no" && !isNo) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return Object.values(row).some(v => v.toLowerCase().includes(q));
      }
      return true;
    });
  }, [selectedCampaign, filterStatus, filterDirection, filterSentiment, filterJoinInterest, searchQuery, statusCol, directionCol, sentimentCol, joinInterestCol]);

  const detailMaxPage = Math.ceil(filteredDetailRows.length / rowsPerPage) - 1;
  const paginatedDetailRows = filteredDetailRows.slice(detailPage * rowsPerPage, (detailPage + 1) * rowsPerPage);

  // Detail YES/NO recomputed from filtered rows
  const filteredYes = filteredDetailRows.filter(r => {
    if (!joinInterestCol) return false;
    const val = (r[joinInterestCol] ?? "").toLowerCase().trim();
    return val === "yes" || val === "true" || val === "1";
  }).length;
  const filteredNo = filteredDetailRows.filter(r => {
    if (!joinInterestCol) return false;
    const val = (r[joinInterestCol] ?? "").toLowerCase().trim();
    return val === "no" || val === "false" || val === "0";
  }).length;

  // Visible columns for detail table
  const visibleColumns = headers.filter(h => {
    const col = dataResponse?.columns.find(c => c.name === h);
    return col && col.nonEmptyCount > 0;
  });

  const hasBulkCalls = campaigns.length > 1;

  return (
    <div className="min-h-screen bg-[#f5f6fa] text-gray-800 flex flex-col">
      {/* Top Nav */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          {selectedCampaign && (
            <button
              onClick={() => { setSelectedCampaign(null); setFilterStatus("all"); setFilterDirection("all"); setFilterSentiment("all"); setFilterJoinInterest("all"); setSearchQuery(""); setDetailPage(0); }}
              className="flex items-center gap-1 text-gray-400 hover:text-gray-700 transition-colors mr-2"
              data-testid="button-back"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <PhoneCall className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-lg font-bold text-gray-900">
            {selectedCampaign ? selectedCampaign.name : "Campaign Dashboard"}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {!hasAnalyzed ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-center gap-2" data-testid="form-url">
                <FormField
                  control={form.control}
                  name="sheetUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            placeholder="Paste Google Sheets URL..."
                            className="w-80 pl-9 h-9 bg-gray-50 border-gray-200 rounded-lg text-sm"
                            {...field}
                            disabled={fetchSheetData.isPending}
                            data-testid="input-sheet-url"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={fetchSheetData.isPending} className="h-9 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4" data-testid="button-analyze">
                  {fetchSheetData.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Analyze"}
                </Button>
              </form>
            </Form>
          ) : (
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={selectedCampaign ? "Search calls..." : "Search campaigns..."}
                  className="w-56 pl-9 h-9 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  value={selectedCampaign ? searchQuery : campaignSearch}
                  onChange={e => selectedCampaign ? setSearchQuery(e.target.value) : setCampaignSearch(e.target.value)}
                  data-testid="input-search"
                />
              </div>
              <button
                onClick={() => { fetchSheetData.reset(); setHasAnalyzed(false); setSelectedCampaign(null); setCampaignSearch(""); }}
                className="h-9 px-3 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                data-testid="button-new-url"
              >
                Change URL
              </button>
            </div>
          )}
          <button className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors relative" data-testid="button-notifications">
            <Bell className="w-4 h-4 text-gray-400" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          <button className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors" data-testid="button-user">
            <User className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </header>

      <main className="flex-1 px-6 py-6 max-w-[1400px] mx-auto w-full">
        {/* Landing / URL entry state */}
        {!hasAnalyzed && !fetchSheetData.isPending && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <PhoneCall className="w-8 h-8 text-white" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Campaign Dashboard</h2>
              <p className="text-gray-400 max-w-md">Paste your Google Sheets URL in the top bar to automatically generate a campaign analytics dashboard.</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-6 max-w-sm w-full shadow-sm text-sm text-gray-500">
              <p className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Make sure your sheet is set to:
              </p>
              <p className="pl-6 text-gray-500">Share &rarr; Anyone with the link &rarr; Viewer</p>
            </div>
          </div>
        )}

        {/* Loading */}
        {fetchSheetData.isPending && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
            <p className="text-lg font-semibold text-gray-700">Analyzing your sheet...</p>
            <p className="text-gray-400 text-sm">Detecting campaigns and computing metrics</p>
          </div>
        )}

        {/* Error */}
        {fetchSheetData.isError && !fetchSheetData.isPending && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center">
              <XCircle className="w-7 h-7 text-red-500" />
            </div>
            <p className="text-lg font-semibold text-gray-700">Could not load sheet</p>
            <p className="text-gray-400 text-sm text-center max-w-sm">
              Make sure the sheet is publicly shared and the URL is correct.
            </p>
          </div>
        )}

        {/* ===== CAMPAIGN LIST VIEW ===== */}
        {hasAnalyzed && !fetchSheetData.isPending && !selectedCampaign && dataResponse && (
          <div className="flex flex-col gap-6">
            {/* Page title */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Campaign Dashboard</h2>
                <p className="text-sm text-gray-400 mt-0.5">Overview of all your voice campaigns</p>
              </div>
            </div>

            {/* Summary stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
              <StatCard
                icon={<Activity className="w-5 h-5" />}
                label="Total Campaigns"
                value={campaigns.length}
                color="bg-indigo-500"
              />
              <StatCard
                icon={<Phone className="w-5 h-5" />}
                label="Total Calls"
                value={totalCalls.toLocaleString()}
                color="bg-sky-500"
              />
              <StatCard
                icon={<TrendingUp className="w-5 h-5" />}
                label="Avg Duration"
                value={(() => {
                  const avg = campaigns.length > 0 ? campaigns.reduce((s, c) => s + c.avgDurationMin, 0) / campaigns.length : 0;
                  return formatDuration(avg);
                })()}
                color="bg-violet-500"
              />
              <StatCard
                icon={<CheckCircle2 className="w-5 h-5" />}
                label="Pickup Rate"
                value={`${avgPickupRate.toFixed(0)}%`}
                color="bg-orange-400"
              />
              <StatCard
                icon={<ThumbsUp className="w-5 h-5" />}
                label="Interested Rate"
                value={`${avgInterestedRate.toFixed(0)}%`}
                color="bg-emerald-500"
              />
              <StatCard
                icon={<Users className="w-5 h-5" />}
                label="Total Interested"
                value={campaigns.reduce((s, c) => s + c.joinInterestYes, 0).toLocaleString()}
                color="bg-pink-500"
              />
            </div>

            {/* Campaigns table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-gray-100 bg-gray-50/60">
                      <TableHead className="text-xs font-semibold text-gray-400 uppercase tracking-wide pl-6">Campaign Name</TableHead>
                      {hasBulkCalls && <TableHead className="text-xs font-semibold text-gray-400 uppercase tracking-wide">ID</TableHead>}
                      <TableHead className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total Calls</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Avg Duration</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Pickup Rate</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Interested Rate</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Interested (YES)</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-400 uppercase tracking-wide pr-6">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCampaigns.map((campaign) => (
                      <TableRow
                        key={campaign.id}
                        className="border-b border-gray-50 hover:bg-indigo-50/30 transition-colors cursor-pointer"
                        onClick={() => { setSelectedCampaign(campaign); setDetailPage(0); }}
                        data-testid={`row-campaign-${campaign.id}`}
                      >
                        <TableCell className="font-semibold text-gray-800 pl-6 py-4">{campaign.name}</TableCell>
                        {hasBulkCalls && <TableCell className="text-gray-400 text-sm font-mono">{campaign.id}</TableCell>}
                        <TableCell className="font-medium text-gray-700">{campaign.totalCalls.toLocaleString()}</TableCell>
                        <TableCell className="text-gray-600">{formatDuration(campaign.avgDurationMin)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full max-w-[80px]">
                              <div className="h-1.5 bg-orange-400 rounded-full" style={{ width: `${Math.min(100, campaign.pickupRate)}%` }} />
                            </div>
                            <span className="text-gray-700 text-sm font-medium">{campaign.pickupRate.toFixed(0)}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full max-w-[80px]">
                              <div className="h-1.5 bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, campaign.interestedRate)}%` }} />
                            </div>
                            <span className="text-gray-700 text-sm font-medium">{campaign.interestedRate.toFixed(0)}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2.5 py-0.5 text-sm font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> {campaign.joinInterestYes}
                          </span>
                        </TableCell>
                        <TableCell className="pr-6">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedCampaign(campaign); setDetailPage(0); }}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            data-testid={`button-view-${campaign.id}`}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredCampaigns.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12 text-gray-400">
                          No campaigns found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}

        {/* ===== CAMPAIGN DETAIL VIEW ===== */}
        {hasAnalyzed && !fetchSheetData.isPending && selectedCampaign && (
          <div className="flex flex-col gap-6">
            {/* Campaign header */}
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                  <button onClick={() => { setSelectedCampaign(null); setFilterStatus("all"); setFilterDirection("all"); setFilterSentiment("all"); setFilterJoinInterest("all"); setSearchQuery(""); }} className="hover:text-indigo-600 transition-colors" data-testid="link-campaigns">Campaigns</button>
                  <span>/</span>
                  <span className="text-gray-600 font-medium">{selectedCampaign.name}</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900">{selectedCampaign.name}</h2>
                <p className="text-sm text-gray-400">{selectedCampaign.totalCalls.toLocaleString()} total calls</p>
              </div>
            </div>

            {/* Summary stat cards for this campaign */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={<PhoneCall className="w-5 h-5" />} label="Total Calls" value={selectedCampaign.totalCalls.toLocaleString()} color="bg-indigo-500" />
              <StatCard icon={<Clock className="w-5 h-5" />} label="Avg Duration" value={formatDuration(selectedCampaign.avgDurationMin)} color="bg-violet-500" />
              <StatCard icon={<CheckCircle2 className="w-5 h-5" />} label="Interested (YES)" value={selectedCampaign.joinInterestYes.toLocaleString()} color="bg-emerald-500" />
              <StatCard icon={<XCircle className="w-5 h-5" />} label="Not Interested (NO)" value={selectedCampaign.joinInterestNo.toLocaleString()} color="bg-red-400" />
            </div>

            {/* Filters row */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                <Filter className="w-4 h-4" />
                Filters:
              </div>

              {/* Join Interest filter */}
              {joinInterestCol && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-400 mr-1">Join Interest:</span>
                  {["all", "yes", "no"].map(v => (
                    <button
                      key={v}
                      onClick={() => { setFilterJoinInterest(v); setDetailPage(0); }}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${filterJoinInterest === v
                        ? v === "yes" ? "bg-emerald-500 text-white" : v === "no" ? "bg-red-400 text-white" : "bg-indigo-600 text-white"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                      data-testid={`filter-joininterest-${v}`}
                    >
                      {v === "all" ? "All" : v === "yes" ? "YES" : "NO"}
                    </button>
                  ))}
                </div>
              )}

              {/* Status filter */}
              {statusCol && Object.keys(selectedCampaign.statusBreakdown).length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-xs text-gray-400 mr-1">Status:</span>
                  <button
                    onClick={() => { setFilterStatus("all"); setDetailPage(0); }}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${filterStatus === "all" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                    data-testid="filter-status-all"
                  >All</button>
                  {Object.entries(selectedCampaign.statusBreakdown)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([status]) => (
                      <button
                        key={status}
                        onClick={() => { setFilterStatus(status); setDetailPage(0); }}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${filterStatus === status ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                        data-testid={`filter-status-${status}`}
                      >{status}</button>
                    ))}
                </div>
              )}

              {/* Direction filter */}
              {directionCol && (selectedCampaign.directionBreakdown.inbound > 0 || selectedCampaign.directionBreakdown.outbound > 0) && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-400 mr-1">Direction:</span>
                  {["all", "inbound", "outbound"].map(v => (
                    <button
                      key={v}
                      onClick={() => { setFilterDirection(v); setDetailPage(0); }}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${filterDirection === v ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                      data-testid={`filter-direction-${v}`}
                    >{v === "all" ? "All" : v.charAt(0).toUpperCase() + v.slice(1)}</button>
                  ))}
                </div>
              )}

              {/* Sentiment filter */}
              {sentimentCol && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-400 mr-1">Sentiment:</span>
                  {["all", "positive", "negative", "neutral"].map(v => (
                    <button
                      key={v}
                      onClick={() => { setFilterSentiment(v); setDetailPage(0); }}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${filterSentiment === v
                        ? v === "positive" ? "bg-emerald-500 text-white" : v === "negative" ? "bg-red-400 text-white" : v === "neutral" ? "bg-amber-400 text-white" : "bg-indigo-600 text-white"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                      data-testid={`filter-sentiment-${v}`}
                    >{v === "all" ? "All" : v.charAt(0).toUpperCase() + v.slice(1)}</button>
                  ))}
                </div>
              )}

              <div className="ml-auto text-sm text-gray-400 font-medium">
                {filteredDetailRows.length.toLocaleString()} results
              </div>
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {/* YES / NO Breakdown */}
              {joinInterestCol && (filteredYes > 0 || filteredNo > 0) && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <h3 className="font-semibold text-gray-700 mb-1">Join Interest</h3>
                  <p className="text-xs text-gray-400 mb-4">YES vs NO breakdown</p>
                  <div className="flex items-center gap-4">
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: "YES", value: filteredYes },
                            { name: "NO", value: filteredNo },
                          ].filter(d => d.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {[0, 1].map((_, i) => (
                            <Cell key={i} fill={YESNO_COLORS[i]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => [v, ""]} contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }} />
                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex gap-4 mt-2">
                    <div className="flex-1 bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100">
                      <p className="text-2xl font-bold text-emerald-600">{filteredYes.toLocaleString()}</p>
                      <p className="text-xs text-emerald-500 font-medium">YES</p>
                    </div>
                    <div className="flex-1 bg-red-50 rounded-xl p-3 text-center border border-red-100">
                      <p className="text-2xl font-bold text-red-500">{filteredNo.toLocaleString()}</p>
                      <p className="text-xs text-red-400 font-medium">NO</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Call Status */}
              {statusCol && Object.keys(selectedCampaign.statusBreakdown).length > 0 && (() => {
                const statusData = Object.entries(selectedCampaign.statusBreakdown)
                  .map(([name, value]) => ({ name, value }))
                  .sort((a, b) => b.value - a.value)
                  .slice(0, 6);
                return (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="font-semibold text-gray-700 mb-1">Call Status</h3>
                    <p className="text-xs text-gray-400 mb-3">Breakdown by status</p>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={statusData} layout="vertical" margin={{ left: 0, right: 16 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                        <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11, fill: "#6b7280" }} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }} />
                        <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                          {statusData.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                );
              })()}

              {/* Sentiment */}
              {sentimentCol && (selectedCampaign.sentimentBreakdown.positive + selectedCampaign.sentimentBreakdown.negative + selectedCampaign.sentimentBreakdown.neutral + selectedCampaign.sentimentBreakdown.unknown > 0) && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <h3 className="font-semibold text-gray-700 mb-1">Sentiment</h3>
                  <p className="text-xs text-gray-400 mb-3">Call sentiment analysis</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Positive", value: selectedCampaign.sentimentBreakdown.positive },
                          { name: "Negative", value: selectedCampaign.sentimentBreakdown.negative },
                          { name: "Neutral", value: selectedCampaign.sentimentBreakdown.neutral },
                          { name: "Unknown", value: selectedCampaign.sentimentBreakdown.unknown },
                        ].filter(d => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {[0, 1, 2, 3].map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Call direction bar */}
            {directionCol && (selectedCampaign.directionBreakdown.inbound > 0 || selectedCampaign.directionBreakdown.outbound > 0) && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-semibold text-gray-700 mb-3">Call Direction</h3>
                <ResponsiveContainer width="100%" height={100}>
                  <BarChart data={[
                    { name: "Inbound", value: selectedCampaign.directionBreakdown.inbound },
                    { name: "Outbound", value: selectedCampaign.directionBreakdown.outbound },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6b7280" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }} />
                    <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Raw Data Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div>
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <ArrowUpDown className="w-4 h-4 text-gray-400" />
                    Call Records
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {detailPage * rowsPerPage + 1}–{Math.min((detailPage + 1) * rowsPerPage, filteredDetailRows.length)} of {filteredDetailRows.length.toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setDetailPage(p => Math.max(0, p - 1))} disabled={detailPage === 0} className="h-8 text-xs" data-testid="button-prev-page">
                    Previous
                  </Button>
                  <span className="text-xs text-gray-400 px-2">Page {detailPage + 1} / {Math.max(1, detailMaxPage + 1)}</span>
                  <Button variant="outline" size="sm" onClick={() => setDetailPage(p => Math.min(detailMaxPage, p + 1))} disabled={detailPage >= detailMaxPage} className="h-8 text-xs" data-testid="button-next-page">
                    Next
                  </Button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-gray-100 bg-gray-50/60">
                      {visibleColumns.map(col => (
                        <TableHead key={col} className="text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap px-4">
                          {col}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedDetailRows.length > 0 ? paginatedDetailRows.map((row, i) => (
                      <TableRow key={i} className="border-b border-gray-50 hover:bg-indigo-50/20 transition-colors" data-testid={`row-call-${i}`}>
                        {visibleColumns.map(col => {
                          const val = row[col] ?? "";
                          let cell: React.ReactNode = val || <span className="text-gray-300">—</span>;

                          // Highlight join_interest
                          if (joinInterestCol && col === joinInterestCol) {
                            const isYes = /^(yes|true|1)$/i.test(val.trim());
                            const isNo = /^(no|false|0)$/i.test(val.trim());
                            cell = isYes
                              ? <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">YES</Badge>
                              : isNo
                                ? <Badge className="bg-red-100 text-red-600 border-red-200 hover:bg-red-100">NO</Badge>
                                : <span className="text-gray-400 text-xs">{val || "—"}</span>;
                          }

                          // Highlight call_status
                          if (statusCol && col === statusCol && val) {
                            const isGood = /completed|answered|connected|success/i.test(val);
                            const isBad = /failed|busy|no.answer|canceled/i.test(val);
                            cell = (
                              <Badge className={`${isGood ? "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100" : isBad ? "bg-red-100 text-red-600 border-red-200 hover:bg-red-100" : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100"}`}>
                                {val}
                              </Badge>
                            );
                          }

                          return (
                            <TableCell key={col} className="text-sm text-gray-700 max-w-[180px] truncate px-4 py-3">
                              {cell}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={visibleColumns.length} className="text-center py-12 text-gray-400">
                          No records match the selected filters
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
