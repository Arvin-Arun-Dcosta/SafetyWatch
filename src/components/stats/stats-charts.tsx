"use client";

import { motion } from "motion/react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const COLORS = [
  "#3b82f6", // blue-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#ef4444", // red-500
  "#8b5cf6", // violet-500
  "#06b6d4", // cyan-500
  "#ec4899", // pink-500
];

const tooltipStyle = {
  backgroundColor: "#fff",
  borderRadius: "6px",
  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
};

type Count = { name: string; count: number };

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="h-full shadow-sm hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </motion.div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-muted-foreground text-center py-12">{children}</p>;
}

/** The four statistics charts. All numbers are aggregated on the server. */
export function StatsCharts({
  byType,
  byCity,
  byMonth,
  byHour,
}: {
  byType: Count[];
  byCity: Count[];
  byMonth: Count[];
  byHour: Count[];
}) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartCard title="Crime Types Distribution">
          {byType.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={byType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="name"
                  label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                >
                  {byType.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <Empty>No data available for crime types.</Empty>
          )}
        </ChartCard>

        <ChartCard title="Top 10 Crime Locations">
          {byCity.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={byCity}
                layout="vertical"
                margin={{ left: 20, right: 20, bottom: 5, top: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" stroke="#6b7280" allowDecimals={false} />
                <YAxis dataKey="name" type="category" width={100} interval={0} stroke="#6b7280" />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Bar dataKey="count" fill={COLORS[3]} name="Reports" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Empty>No data available for locations.</Empty>
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <ChartCard title="Monthly Crime Trends">
          {byMonth.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={byMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Bar dataKey="count" fill={COLORS[1]} name="Reports" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Empty>No data available for monthly trends.</Empty>
          )}
        </ChartCard>

        <ChartCard title="Crime Reports by Hour of Day">
          {byHour.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={byHour}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Bar dataKey="count" fill={COLORS[2]} name="Reports" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Empty>No data available for hourly trends.</Empty>
          )}
        </ChartCard>
      </div>
    </>
  );
}
