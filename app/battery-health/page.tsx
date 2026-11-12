
"use client";

import { useEffect, useState } from "react";

type Battery = {
  battery_id: number;
  laptop_id: number;
  initial_capacity: number;
  current_capacity: number;
  install_date: string;
  health_percentage: number;
  brand?: string;
  model?: string;
  temperature: number | null;
  cycles: number | null;
};

function getStatus(health: number) {
  if (health >= 80) return "Healthy";
  if (health >= 60) return "Warning";
  return "Critical";
}

export default function BatteryHealthPage() {
  const [batteries, setBatteries] = useState<Battery[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchBatteries() {
      try {
        const [batteryResponse, laptopResponse, sessionResponse] =
          await Promise.all([
            fetch("/api/batteries", { cache: "no-store" }),
            fetch("/api/laptops", { cache: "no-store" }),
            fetch("/api/charging-sessions", { cache: "no-store" }),
          ]);

        const batteryResult = await batteryResponse.json();
        const laptopResult = await laptopResponse.json();
        const sessionResult = await sessionResponse.json();

        if (!batteryResponse.ok || !batteryResult.success) {
          throw new Error("Unable to fetch batteries");
        }

        if (!laptopResponse.ok || !laptopResult.success) {
          throw new Error("Unable to fetch laptops");
        }

        if (!sessionResponse.ok || !sessionResult.success) {
          throw new Error("Unable to fetch charging sessions");
        }

        const mapped: Battery[] = batteryResult.data.map((battery: any) => {
          const laptop = laptopResult.data.find(
            (item: any) => Number(item.laptop_id) === Number(battery.laptop_id)
          );

          const sessions = sessionResult.data.filter(
            (item: any) => Number(item.battery_id) === Number(battery.battery_id)
          );

          const latestSession = sessions[0];

          return {
            battery_id: Number(battery.battery_id),
            laptop_id: Number(battery.laptop_id),
            initial_capacity: Number(battery.initial_capacity),
            current_capacity: Number(battery.current_capacity),
            install_date: String(battery.install_date),
            health_percentage:
              (Number(battery.current_capacity) /
                Number(battery.initial_capacity)) *
              100,
            brand: laptop?.brand,
            model: laptop?.model,
            temperature:
              latestSession?.temperature == null
                ? null
                : Number(latestSession.temperature),
            cycles:
              latestSession?.charge_cycles == null
                ? null
                : Number(latestSession.charge_cycles),
          };
        });

        setBatteries(mapped);
      } catch (err) {
        console.error("Battery Health error:", err);
        setError("Unable to load battery data from MySQL.");
      } finally {
        setLoading(false);
      }
    }

    fetchBatteries();
  }, []);

  const records = batteries
    .map((battery) => ({
      ...battery,
      id: `BAT${String(battery.battery_id).padStart(3, "0")}`,
      laptop: `${battery.brand ?? ""} ${battery.model ?? ""}`.trim() || "Laptop unavailable",
      initial: battery.initial_capacity,
      current: battery.current_capacity,
      installed: battery.install_date.slice(0, 10),
      health: battery.health_percentage,
      lost: battery.initial_capacity - battery.current_capacity,
    }))
    .filter((battery) => {
      const matchesSearch =
        battery.id.toLowerCase().includes(search.toLowerCase()) ||
        battery.laptop.toLowerCase().includes(search.toLowerCase());

      const status = getStatus(battery.health);

      return matchesSearch && (filter === "All" || status === filter);
    });

  const average =
    batteries.length > 0
      ? batteries.reduce((sum, battery) => sum + battery.health_percentage, 0) /
        batteries.length
      : 0;

  const critical = batteries.filter(
    (battery) => battery.health_percentage < 60
  ).length;


  return (
    <main className="min-h-screen bg-[#f5f7fb] p-5 text-slate-800 md:p-10">
      <a
        href="/"
        className="text-sm font-medium text-emerald-700 hover:underline"
      >
        ← Back to Dashboard
      </a>

      <header className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">
          BatteryWatch / Analytics
        </p>
        <h1 className="mt-2 text-3xl font-bold">Battery Health</h1>
        <p className="mt-2 text-sm text-slate-500">
          Review capacity loss, charging cycles and battery condition.
        </p>
      </header>

      <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Batteries monitored</p>
          <p className="mt-3 text-3xl font-bold">{batteries.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Average health</p>
          <p className="mt-3 text-3xl font-bold">{average.toFixed(1)}%</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Critical batteries</p>
          <p className="mt-3 text-3xl font-bold text-red-600">{critical}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Health threshold</p>
          <p className="mt-3 text-3xl font-bold">80%</p>
          <p className="mt-1 text-xs text-slate-400">Attention below this level</p>
        </div>
      </section>

      <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
        <div>
          <h2 className="text-lg font-bold">Battery condition report</h2>
          <p className="mt-1 text-sm text-slate-500">
            Health = current capacity ÷ initial capacity × 100.
          </p>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search battery ID or laptop..."
            className="min-w-0 flex-1 rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-emerald-500"
          />
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="rounded-lg border border-slate-200 bg-white p-3 text-sm"
          >
            <option>All</option>
            <option>Healthy</option>
            <option>Warning</option>
            <option>Critical</option>
          </select>
        </div>

        <div className="mt-6 space-y-4">
          {records.map((battery) => {
            const status = getStatus(battery.health);
            const color =
              status === "Healthy"
                ? "bg-emerald-500"
                : status === "Warning"
                  ? "bg-amber-500"
                  : "bg-red-500";

            return (
              <article
                key={battery.id}
                className="rounded-xl border border-slate-200 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-bold">{battery.laptop}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {battery.id} · Installed {battery.installed}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                      status === "Healthy"
                        ? "bg-emerald-50 text-emerald-700"
                        : status === "Warning"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-red-50 text-red-700"
                    }`}
                  >
                    {status}
                  </span>
                </div>

                <div className="mt-5 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Battery health</p>
                    <p className="mt-1 text-3xl font-bold">
                      {battery.health.toFixed(0)}%
                    </p>
                  </div>
                  <p className="text-right text-xs text-slate-500">
                    Capacity lost
                    <br />
                    <span className="mt-1 inline-block font-semibold text-slate-700">
                      {(battery.lost / 1000).toFixed(1)} Wh
                    </span>
                  </p>
                </div>

                <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${color}`}
                    style={{ width: `${battery.health}%` }}
                  />
                </div>

                <div className="mt-5 grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                  <div>
                    <p className="text-xs text-slate-400">Initial capacity</p>
                    <p className="mt-1 font-semibold">
                      {(battery.initial / 1000).toFixed(1)} Wh
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Current capacity</p>
                    <p className="mt-1 font-semibold">
                      {(battery.current / 1000).toFixed(1)} Wh
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Charge cycles</p>
                    <p className="mt-1 font-semibold">{battery.cycles}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Temperature</p>
                    <p className="mt-1 font-semibold">{battery.temperature}°C</p>
                  </div>
                </div>
              </article>
            );
          })}

          {records.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-500">
              No matching battery records.
            </p>
          )}
        </div>

        <p className="mt-5 text-xs text-slate-400">
          Prototype with illustrative data; not yet connected to MySQL.
        </p>
      </section>
    </main>
  );
}
