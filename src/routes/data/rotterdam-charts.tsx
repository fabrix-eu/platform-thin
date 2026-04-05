import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  getCompaniesEvolution,
  getJobsEvolution,
  type ChartData,
} from '../../lib/data-imports';

// ── Chart card ───────────────────────────────────────────────

function ChartCard({
  title,
  data,
  loading,
  error,
  color,
}: {
  title: string;
  data: ChartData[];
  loading: boolean;
  error: boolean;
  color: string;
}) {
  return (
    <div className="border border-border rounded-lg">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="p-4">
        {loading && (
          <div className="h-[300px] flex items-center justify-center">
            <div
              className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent"
              style={{ borderColor: `${color} transparent ${color} ${color}` }}
            />
          </div>
        )}
        {error && (
          <div className="h-[300px] flex items-center justify-center text-sm text-red-600">
            Failed to load chart data.
          </div>
        )}
        {!loading && !error && (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke={color} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────

export function RotterdamChartsPage() {
  const companiesQuery = useQuery({
    queryKey: ['rotterdam_companies_evolution'],
    queryFn: getCompaniesEvolution,
  });

  const jobsQuery = useQuery({
    queryKey: ['rotterdam_jobs_evolution'],
    queryFn: getJobsEvolution,
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/data/rotterdam"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to Map
        </Link>
        <Link
          to="/data/rotterdam"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-md hover:bg-gray-50"
        >
          Companies Map
        </Link>
      </div>

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            Rotterdam
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs border border-border">
            LISA
          </span>
        </div>
        <h1 className="text-2xl font-bold font-display">Trend Analysis</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Evolution of companies and jobs in the Rotterdam metropolitan area based
          on LISA database.
        </p>
      </div>

      <hr className="border-border" />

      {/* Charts grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <ChartCard
          title="Evolution of Number of Companies Over Years"
          data={companiesQuery.data ?? []}
          loading={companiesQuery.isLoading}
          error={companiesQuery.isError}
          color="#f97316"
        />
        <ChartCard
          title="Evolution of Jobs Over Years"
          data={jobsQuery.data ?? []}
          loading={jobsQuery.isLoading}
          error={jobsQuery.isError}
          color="#22c55e"
        />
      </div>

      {/* About */}
      <div className="border border-border rounded-lg p-6">
        <h3 className="text-sm font-semibold mb-2">About the Data</h3>
        <p className="text-sm text-muted-foreground mb-3">
          LISA (Landelijk Informatiesysteem van Arbeidsplaatsen) is the Dutch
          national information system for employment data. It contains comprehensive
          information about all registered businesses in the Netherlands.
        </p>
        <h4 className="text-sm font-semibold mb-1">Rotterdam Metropolitan Area</h4>
        <p className="text-sm text-muted-foreground">
          This visualization focuses on the Rotterdam metropolitan area, showing
          textile and fashion industry businesses filtered from the LISA database.
          Data is available for multiple time periods allowing trend analysis over
          the years.
        </p>
      </div>
    </div>
  );
}
