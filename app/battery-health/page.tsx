
"use client";

import { useState } from "react";

const batteries = [
  {
    id: "BAT001",
    laptop: "Dell Inspiron 15",
    initial: 50000,
    current: 42000,
    cycles: 385,
    temperature: 34,
    installed: "2024-06-20",
  },
  {
    id: "BAT002",
    laptop: "HP Pavilion 14",
    initial: 50000,
    current: 31000,
    cycles: 612,
    temperature: 41,
    installed: "2023-10-01",
  },
  {
    id: "BAT003",
    laptop: "Lenovo IdeaPad Slim 5",
    initial: 48000,
    current: 18000,
    cycles: 890,
    temperature: 46,
    installed: "2022-04-01",
  },
  {
    id: "BAT004",
    laptop: "ASUS VivoBook 15",
    initial: 50000,
    current: 45500,
    cycles: 210,
    temperature: 31,
    installed: "2025-01-15",
  },
];

function getStatus(health: number) {
  if (health >= 80) return "Healthy";
  if (health >= 60) return "Warning";
  return "Critical";
}

export default function BatteryHealthPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const records = batteries
    .map((battery) => ({
      ...battery,
      health: (battery.current / battery.initial) * 100,
      lost: battery.initial - battery.current,
    }))
    .filter((battery) => {
      const matchesSearch =
        battery.id.toLowerCase().includes(search.toLowerCase()) ||
        battery.laptop.toLowerCase().includes(search.toLowerCase());

      const status = getStatus(battery.health);
      return (
        matchesSearch && (filter === "All" || status === filter)
      );
    });

  const average =
    batteries.reduce(
      (sum, battery) => sum + (battery.current / battery.initial) * 100,
      0
    ) / batteries.length;

  const critical = batteries.filter(
    (battery) => (battery.current / battery.initial) * 100 < 60
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
