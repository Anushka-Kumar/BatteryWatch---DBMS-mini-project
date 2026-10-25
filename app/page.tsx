
"use client";

import { useState } from "react";

const batteries = [
  {
    id: "BAT001",
    laptop: "Dell Inspiron 15",
    type: "Lithium-ion",
    capacity: 42000,
    initial: 50000,
    cycles: 385,
    temperature: 34,
    status: "Healthy",
  },
  {
    id: "BAT002",
    laptop: "HP Pavilion",
    type: "Lithium-ion",
    capacity: 31000,
    initial: 50000,
    cycles: 612,
    temperature: 41,
    status: "Warning",
  },
  {
    id: "BAT003",
    laptop: "Lenovo IdeaPad",
    type: "Lithium-polymer",
    capacity: 18000,
    initial: 48000,
    cycles: 890,
    temperature: 46,
    status: "Critical",
  },
  {
    id: "BAT004",
    laptop: "ASUS VivoBook",
    type: "Lithium-ion",
    capacity: 45500,
    initial: 50000,
    cycles: 210,
    temperature: 31,
    status: "Healthy",
  },
];

export default function Home() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [activePage, setActivePage] = useState("Dashboard");

  const filteredBatteries = batteries.filter((battery) => {
    const matchesSearch =
      battery.id.toLowerCase().includes(search.toLowerCase()) ||
      battery.laptop.toLowerCase().includes(search.toLowerCase());

    const health = (battery.capacity / battery.initial) * 100;
    const matchesFilter =
      filter === "All" ||
      (filter === "Healthy" && health >= 80) ||
      (filter === "Warning" && health >= 60 && health < 80) ||
      (filter === "Critical" && health < 60);

    return matchesSearch && matchesFilter;
  });

  const averageHealth =
    batteries.reduce(
      (sum, battery) =>
        sum + (battery.capacity / battery.initial) * 100,
      0
    ) / batteries.length;

  const attentionCount = batteries.filter(
    (battery) => battery.capacity / battery.initial < 0.8
  ).length;

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-800">
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col bg-[#14243a] text-white md:flex">
        <div className="border-b border-white/10 px-6 py-7">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400 text-xl text-slate-900">
              ⚡
            </div>
            <div>
              <h1 className="text-xl font-bold">BatteryWatch</h1>
              <p className="text-xs text-slate-400">Battery intelligence</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-2 px-4 py-6">
          {[
            ["Dashboard", "▦", "/"],
            ["Laptops", "▣", "/laptops"],
            ["Battery Health", "◉", "/battery-health"],
            ["Charging Sessions", "ϟ", "/charging-sessions"],
            ["Maintenance", "⚒", "/maintenance"],
            ["Failure Records", "⚠", "/failure-records"],
          ].map(([name, icon, path]) => (
            <a
              key={name}
              href={path}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition ${
                name === "Dashboard"
                  ? "bg-emerald-400 font-semibold text-slate-950"
                  : "text-slate-300 hover:bg-white/10"
              }`}
            >
              <span>{icon}</span>
              {name}
            </a>
          ))}
        </nav>

        <div className="m-4 rounded-xl border border-white/10 p-4">
          <p className="text-sm font-semibold">BatteryWatch</p>
          <p className="mt-1 text-xs text-slate-400">
            Laptop degradation analysis
          </p>
        </div>
      </aside>

      <main className="min-h-screen md:ml-64">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-5 md:px-9">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-emerald-600">
              BatteryWatch / Overview
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight">
              {activePage}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Monitor battery condition and degradation.
            </p>
          </div>
          <div className="rounded-full border border-slate-200 px-4 py-2 text-sm">
            ● Demo environment
          </div>
        </header>

        <div className="space-y-7 p-5 md:p-9">
          <section className="overflow-hidden rounded-2xl bg-gradient-to-r from-[#14243a] to-[#245b62] p-7 text-white md:p-9">
            <p className="text-sm font-medium text-emerald-300">
              BATTERY INTELLIGENCE
            </p>
            <h3 className="mt-3 max-w-xl text-3xl font-bold leading-tight md:text-4xl">
              Know your battery.
              <br />
              Before it lets you down.
            </h3>
            <p className="mt-3 max-w-lg text-sm leading-6 text-slate-300">
              Track capacity, inspect charging patterns, and identify
              batteries that may need attention.
            </p>
            <button
              onClick={() => setActivePage("Battery Health")}
              className="mt-6 rounded-lg bg-emerald-400 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-300"
            >
              Explore battery health →
            </button>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "Registered laptops",
                value: "04",
                note: "Demo records",
                icon: "▣",
              },
              {
                label: "Average battery health",
                value: `${averageHealth.toFixed(1)}%`,
                note: "Across demo batteries",
                icon: "◉",
              },
              {
                label: "Need attention",
                value: String(attentionCount).padStart(2, "0"),
                note: "Below 80% health",
                icon: "⚠",
              },
              {
                label: "Highest temperature",
                value: `${Math.max(...batteries.map((b) => b.temperature))}°C`,
                note: "Among demo records",
                icon: "♨",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">{item.label}</p>
                  <span className="text-xl text-emerald-600">
                    {item.icon}
                  </span>
                </div>
                <p className="mt-4 text-3xl font-bold">{item.value}</p>
                <p className="mt-2 text-xs text-slate-400">{item.note}</p>
              </div>
            ))}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold">Battery inventory</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Inspect battery capacity and current condition.
                </p>
              </div>
              <span className="rounded-full bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                Sample data only
              </span>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search laptop or battery ID..."
                className="min-w-0 flex-1 rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500"
              />
              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500"
              >
                <option>All</option>
                <option>Healthy</option>
                <option>Warning</option>
                <option>Critical</option>
              </select>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-400">
                    <th className="px-3 py-4">Battery / Laptop</th>
                    <th className="px-3 py-4">Health</th>
                    <th className="px-3 py-4">Capacity</th>
                    <th className="px-3 py-4">Cycles</th>
                    <th className="px-3 py-4">Temperature</th>
                    <th className="px-3 py-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBatteries.map((battery) => {
                    const health = (battery.capacity / battery.initial) * 100;
                    const status =
                      health >= 80
                        ? "Healthy"
                        : health >= 60
                          ? "Warning"
                          : "Critical";

                    return (
                      <tr
                        key={battery.id}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                      >
                        <td className="px-3 py-5">
                          <p className="font-semibold">{battery.laptop}</p>
                          <p className="mt-1 text-xs text-slate-400">
                            {battery.id} · {battery.type}
                          </p>
                        </td>
                        <td className="px-3 py-5">
                          <p className="font-semibold">{health.toFixed(0)}%</p>
                          <div className="mt-2 h-1.5 w-24 rounded-full bg-slate-100">
                            <div
                              className={`h-1.5 rounded-full ${
                                health >= 80
                                  ? "bg-emerald-500"
                                  : health >= 60
                                    ? "bg-amber-500"
                                    : "bg-red-500"
                              }`}
                              style={{ width: `${health}%` }}
                            />
                          </div>
                        </td>
                        <td className="px-3 py-5">
                          {(battery.capacity / 1000).toFixed(1)} /{" "}
                          {(battery.initial / 1000).toFixed(1)} Wh
                        </td>
                        <td className="px-3 py-5">{battery.cycles}</td>
                        <td className="px-3 py-5">{battery.temperature}°C</td>
                        <td className="px-3 py-5">
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
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredBatteries.length === 0 && (
                <p className="py-10 text-center text-sm text-slate-500">
                  No batteries match your search.
                </p>
              )}
            </div>
            <p className="mt-4 text-xs text-slate-400">
              Illustrative records for UI development. Not connected to the
              project database yet.
            </p>
          </section>

          <footer className="pb-4 text-center text-xs text-slate-400">
            BatteryWatch · Laptop Battery Health &amp; Degradation Analysis
          </footer>
        </div>
      </main>
    </div>
  );
}
