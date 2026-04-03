import { useFetchSheetData, useFetchSheetSummary } from "@workspace/api-client-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Search, Table as TableIcon, PhoneCall, Clock, Users, Database } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  sheetUrl: z.string().url("Please enter a valid URL"),
});

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function Home() {
  const { toast } = useToast();
  const [analyzedUrl, setAnalyzedUrl] = useState<string | null>(null);

  const fetchSheetData = useFetchSheetData();
  const fetchSheetSummary = useFetchSheetSummary();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sheetUrl: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setAnalyzedUrl(values.sheetUrl);
      await Promise.all([
        fetchSheetData.mutateAsync({ data: { sheetUrl: values.sheetUrl } }),
        fetchSheetSummary.mutateAsync({ data: { sheetUrl: values.sheetUrl } })
      ]);
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Could not analyze the provided sheet. Please check the URL and permissions.",
        variant: "destructive"
      });
      setAnalyzedUrl(null);
    }
  };

  const isLoading = fetchSheetData.isPending || fetchSheetSummary.isPending;
  const isError = fetchSheetData.isError || fetchSheetSummary.isError;
  const hasData = fetchSheetData.isSuccess && fetchSheetSummary.isSuccess;

  const dataResponse = fetchSheetData.data;
  const summaryResponse = fetchSheetSummary.data;

  // Pagination for raw data table
  const [page, setPage] = useState(0);
  const rowsPerPage = 20;
  const totalRows = dataResponse?.rows?.length || 0;
  const maxPage = Math.ceil(totalRows / rowsPerPage) - 1;
  const paginatedRows = dataResponse?.rows?.slice(page * rowsPerPage, (page + 1) * rowsPerPage) || [];

  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground flex flex-col items-center">
      
      <div className="w-full max-w-7xl px-4 py-8 flex flex-col gap-8">
        
        {/* Header / Input Area */}
        <div className="flex flex-col gap-4 items-center text-center py-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Database className="w-4 h-4" />
            <span>Call Center Analytics Engine</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
            Command Center
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Paste your Google Sheets data URL below to instantly generate an adaptive command dashboard with actionable call metrics and deep insights.
          </p>

          <div className="w-full max-w-xl mt-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="relative flex w-full items-center">
                <FormField
                  control={form.control}
                  name="sheetUrl"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormControl>
                        <div className="relative">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <Input 
                            placeholder="https://docs.google.com/spreadsheets/d/..." 
                            className="w-full pl-12 pr-32 h-14 bg-card border-card-border text-base rounded-full shadow-lg focus-visible:ring-primary/50"
                            {...field} 
                            disabled={isLoading}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="absolute mt-2" />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-10 rounded-full px-6 font-semibold"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Analyze
                </Button>
              </form>
            </Form>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <div className="text-xl font-medium text-foreground">Processing Sheet Data...</div>
            <div className="text-muted-foreground">Detecting schema and aggregating metrics</div>
          </div>
        )}

        {/* Error State */}
        {isError && !isLoading && (
          <Card className="w-full max-w-2xl mx-auto border-destructive/50 bg-destructive/10">
            <CardHeader className="text-center">
              <CardTitle className="text-destructive">Analysis Error</CardTitle>
              <CardDescription className="text-destructive/80">
                Failed to process the Google Sheet. Ensure the link is correct and publicly accessible, or it is a valid CSV export URL.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Dashboard Content */}
        {hasData && summaryResponse && dataResponse && !isLoading && (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Top Level Stat Cards */}
            {summaryResponse.detectedFeatures.hasCallMetrics && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-card/50 backdrop-blur border-border/50">
                  <CardHeader className="pb-2">
                    <CardDescription className="font-medium flex items-center gap-2">
                      <PhoneCall className="w-4 h-4 text-primary" />
                      Total Calls
                    </CardDescription>
                    <CardTitle className="text-4xl text-white">{summaryResponse.totalCalls.toLocaleString()}</CardTitle>
                  </CardHeader>
                </Card>
                <Card className="bg-card/50 backdrop-blur border-border/50">
                  <CardHeader className="pb-2">
                    <CardDescription className="font-medium flex items-center gap-2">
                      <TableIcon className="w-4 h-4 text-primary" />
                      Total Rows
                    </CardDescription>
                    <CardTitle className="text-4xl text-white">{summaryResponse.totalRows.toLocaleString()}</CardTitle>
                  </CardHeader>
                </Card>
                <Card className="bg-card/50 backdrop-blur border-border/50">
                  <CardHeader className="pb-2">
                    <CardDescription className="font-medium flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      Avg Duration (Min)
                    </CardDescription>
                    <CardTitle className="text-4xl text-white">{summaryResponse.avgDurationMinutes?.toFixed(1) || "0"}</CardTitle>
                  </CardHeader>
                </Card>
                <Card className="bg-card/50 backdrop-blur border-border/50">
                  <CardHeader className="pb-2">
                    <CardDescription className="font-medium flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      Total Duration
                    </CardDescription>
                    <CardTitle className="text-4xl text-white">{summaryResponse.totalDurationMinutes?.toLocaleString() || "0"}</CardTitle>
                  </CardHeader>
                </Card>
              </div>
            )}

            {summaryResponse.detectedFeatures.hasJoinInterest && summaryResponse.joinInterestCount !== undefined && (
              <div className="grid grid-cols-1 gap-4">
                <Card className="bg-primary/10 border-primary/20">
                  <CardHeader className="pb-4">
                    <CardDescription className="font-medium flex items-center gap-2 text-primary">
                      <Users className="w-4 h-4" />
                      Join Interest Identified
                    </CardDescription>
                    <div className="flex items-baseline gap-4">
                      <CardTitle className="text-5xl text-white">{summaryResponse.joinInterestCount.toLocaleString()}</CardTitle>
                      <span className="text-muted-foreground">leads interested</span>
                    </div>
                  </CardHeader>
                </Card>
              </div>
            )}

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              
              {summaryResponse.detectedFeatures.hasCallDirection && summaryResponse.callDirectionBreakdown && (
                <Card className="col-span-1 border-border/50 bg-card/40">
                  <CardHeader>
                    <CardTitle className="text-lg">Call Direction</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { name: 'Inbound', value: summaryResponse.callDirectionBreakdown.inbound },
                        { name: 'Outbound', value: summaryResponse.callDirectionBreakdown.outbound }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip 
                          cursor={{fill: 'hsl(var(--muted)/0.5)'}}
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                        />
                        <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {summaryResponse.detectedFeatures.hasSentiment && summaryResponse.sentimentBreakdown && (
                <Card className="col-span-1 border-border/50 bg-card/40">
                  <CardHeader>
                    <CardTitle className="text-lg">Sentiment Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Positive', value: summaryResponse.sentimentBreakdown.positive },
                            { name: 'Negative', value: summaryResponse.sentimentBreakdown.negative },
                            { name: 'Neutral', value: summaryResponse.sentimentBreakdown.neutral },
                            { name: 'Unknown', value: summaryResponse.sentimentBreakdown.unknown }
                          ].filter(d => d.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {[0,1,2,3].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {summaryResponse.detectedFeatures.hasCallStatus && summaryResponse.callStatusBreakdown && (
                <Card className="col-span-1 border-border/50 bg-card/40">
                  <CardHeader>
                    <CardTitle className="text-lg">Call Status</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={Object.entries(summaryResponse.callStatusBreakdown)
                            .map(([name, value]) => ({ name, value }))
                            .sort((a,b) => b.value - a.value)
                            .slice(0, 5) // top 5
                          }
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          dataKey="value"
                          label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {Object.entries(summaryResponse.callStatusBreakdown).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>

            {summaryResponse.detectedFeatures.hasBulkCalls && summaryResponse.topBulkCallNames && summaryResponse.topBulkCallNames.length > 0 && (
              <Card className="border-border/50 bg-card/40">
                <CardHeader>
                  <CardTitle className="text-lg">Top Bulk Call Campaigns</CardTitle>
                </CardHeader>
                <CardContent className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={summaryResponse.topBulkCallNames} 
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis dataKey="name" type="category" width={150} stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        cursor={{fill: 'hsl(var(--muted)/0.5)'}}
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                      />
                      <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Raw Data Table */}
            <Card className="border-border/50 bg-card/40 overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Raw Call Data</CardTitle>
                  <CardDescription>
                    Viewing {page * rowsPerPage + 1} - {Math.min((page + 1) * rowsPerPage, totalRows)} of {totalRows} rows
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    Previous
                  </Button>
                  <div className="text-sm font-medium text-muted-foreground px-2">
                    Page {page + 1} of {maxPage + 1}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setPage(p => Math.min(maxPage, p + 1))}
                    disabled={page >= maxPage}
                  >
                    Next
                  </Button>
                </div>
              </CardHeader>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50 hover:bg-transparent">
                      {dataResponse.columns.filter(c => c.nonEmptyCount > 0).map(col => (
                        <TableHead key={col.name} className="whitespace-nowrap text-muted-foreground font-medium">
                          {col.name}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRows.length > 0 ? paginatedRows.map((row, i) => (
                      <TableRow key={i} className="border-border/50 hover:bg-muted/50">
                        {dataResponse.columns.filter(c => c.nonEmptyCount > 0).map(col => (
                          <TableCell key={col.name} className="max-w-[200px] truncate">
                            {row[col.name] || "-"}
                          </TableCell>
                        ))}
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={dataResponse.columns.length} className="text-center py-8 text-muted-foreground">
                          No data available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
