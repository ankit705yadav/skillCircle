"use client";

import { useEffect, useState } from "react";
import { Users, Link, Zap, FileText, Pin } from "lucide-react"; // lucide icons

interface AppStats {
  totalUsers: number;
  totalConnections: number;
  activeConnections: number;
  totalPosts: number;
  activePosts: number;
}

const StatCard = ({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: string;
}) => (
  <div
    className={`flex flex-col items-center justify-center rounded-xl px-5 py-4 text-white shadow-md`}
    style={{ backgroundColor: color }}
  >
    <div className="mb-2">{icon}</div>
    <h3 className="text-xl font-bold">{value}</h3>
    <p className="text-sm opacity-90">{label}</p>
  </div>
);

export default function StatsShowcase() {
  const [stats, setStats] = useState<AppStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/stats`,
        );
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center my-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <section className="py-8 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-center mb-6">
          Our Community by the Numbers
        </h2>

        {/* Single line row - scrollable if overflow */}
        <div className="flex flex-wrap gap-4 justify-center">
          <StatCard
            icon={<Users size={28} />}
            value={stats.totalUsers}
            label="Total Users"
            color="#3b82f6" // blue
          />
          <StatCard
            icon={<Link size={28} />}
            value={stats.totalConnections}
            label="Connections Made"
            color="#10b981" // green
          />
          <StatCard
            icon={<Zap size={28} />}
            value={stats.activeConnections}
            label="Active Connections"
            color="#f59e0b" // amber
          />
          <StatCard
            icon={<FileText size={28} />}
            value={stats.totalPosts}
            label="Total Posts"
            color="#8b5cf6" // violet
          />
          <StatCard
            icon={<Pin size={28} />}
            value={stats.activePosts}
            label="Active Posts"
            color="#ef4444" // red
          />
        </div>
      </div>
    </section>
  );
}
