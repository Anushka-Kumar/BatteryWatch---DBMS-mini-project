
"use client";

import { useState } from "react";

type Session = {
  id: string;
  laptop: string;
  battery: string;
  start: string;
  end: string;
  startPercent: number;
  endPercent: number;
  temperature: number;
  cycles: number;
};

const initialSessions: Session[] = [
  {
    id: "CHG001",
    laptop: "Dell Inspiron 15",
    battery: "BAT001",
    start: "2026-10-25T08:00",
    end: "2026-10-25T09:25",
    startPercent: 20,
    endPercent: 95,
    temperature: 34,
    cycles: 385,
  },
  {
    id: "CHG002",
    laptop: "HP Pavilion 14",
    battery: "BAT002",
    start: "2026-10-24T10:15",
    end: "2026-10-24T11:50",
    startPercent: 15,
    endPercent: 85,
    temperature: 41,
    cycles: 612,
  },
  {
    id: "CHG003",
    laptop: "Lenovo IdeaPad Slim 5",
    battery: "BAT003",
    start: "2026-10-23T14:00",
    end: "2026-10-23T15:40",
    startPercent: 10,
    endPercent: 78,
    temperature: 46,
    cycles: 890,
  },
  {
    id: "CHG004",
    laptop: "ASUS VivoBook 15",
    battery: "BAT004",
    start: "2026-10-22T09:30",
    end: "2026-10-22T10:35",
    startPercent: 35,
    endPercent: 90,
    temperature: 31,
    cycles: 210,
  },
];

export default function ChargingSessionsPage() {
  const [sessions, setSessions] = useState<Session[]>(initialSessions);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [battery, setBattery] = useState("BAT001");
  const [laptop, setLaptop] = useState("Dell Inspiron 15");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [startPercent, setStartPercent] = useState("20");
  const [endPercent, setEndPercent] = useState("80");
  const [temperature, setTemperature] = useState("35");

  const filtered = sessions.filter((session) =>
    `${session.id} ${session.laptop} ${session.battery}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const averageGain =
    sessions.length === 0
      ? 0
      : sessions.reduce(
          (sum, session) => sum + session.endPercent - session.startPercent,
          0
        ) / sessions.length;

  function addSession(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const from = Number(startPercent);
    const to = Number(endPercent);
    const temp = Number(temperature);

    if (new Date(end) <= new Date(start)) {
      alert("End time must be after start time.");
      return;
    }

    if (to <= from) {
      alert("End battery percentage must be greater than start percentage.");
      return;
    }

    if (from < 0 || to > 100 || temp < 0 || temp > 100) {
      alert("Enter valid percentages and temperature.");
      return;
    }

    const newSession: Session = {
      id: `CHG${String(Date.now()).slice(-6)}`,
      laptop,
      battery,
      start,
      end,
      startPercent: from,
      endPercent: to,
      temperature: temp,
      cycles: 0,
    };

    setSessions((current) => [newSession, ...current]);
    setStart("");
    setEnd("");
    setShowForm(false);
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-5 text-slate-800 md:p-10">
      <a href="/" className="text-sm font-medium text-emerald-700 hover:underline">
        ← Back to Dashboard
      </a>

      <header className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">
            BatteryWatch / Monitoring
          </p>
          <h1 className="mt-2 text-3xl font-bold">Charging Sessions</h1>
          <p className="mt-2 text-sm text-slate-500">
            Review charging duration, percentage gain and temperature.
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
        >
          {showForm ? "Cancel" : "+ Add Session"}
        </button>
      </header>

      <section className="mt-7 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Total sessions</p>
          <p className="mt-3 text-3xl font-bold">{sessions.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Average charge gain</p>
          <p className="mt-3 text-3xl font-bold">{averageGain.toFixed(1)}%</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Highest temperature</p>
          <p className="mt-3 text-3xl font-bold">
            {Math.max(...sessions.map((session) => session.temperature))}°C
          </p>
        </div>
      </section>

      {showForm && (
        <form
          onSubmit={addSession}
          className="mt-7 grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2"
        >
          <h2 className="text-lg font-bold sm:col-span-2">Record a charging session</h2>

          <label className="text-sm font-medium">
            Battery ID
            <select
              value={battery}
              onChange={(event) => {
                setBattery(event.target.value);
                const names: Record<string, string> = {
                  BAT001: "Dell Inspiron 15",
                  BAT002: "HP Pavilion 14",
                  BAT003: "Lenovo IdeaPad Slim 5",
                  BAT004: "ASUS VivoBook 15",
                };
                setLaptop(names[event.target.value]);
              }}
              className="mt-2 block w-full rounded-lg border border-slate-200 p-3"
            >
              <option value="BAT001">BAT001</option>
              <option value="BAT002">BAT002</option>
              <option value="BAT003">BAT003</option>
              <option value="BAT004">BAT004</option>
            </select>
          </label>

          <label className="text-sm font-medium">
            Laptop
            <input
              readOnly
              value={laptop}
              className="mt-2 block w-full rounded-lg border border-slate-200 bg-slate-50 p-3"
            />
          </label>

          <label className="text-sm font-medium">
            Start time
            <input
              required
              type="datetime-local"
              value={start}
              onChange={(event) => setStart(event.target.value)}
              className="mt-2 block w-full rounded-lg border border-slate-200 p-3"
            />
          </label>

          <label className="text-sm font-medium">
            End time
            <input
              required
              type="datetime-local"
              value={end}
              onChange={(event) => setEnd(event.target.value)}
              className="mt-2 block w-full rounded-lg border border-slate-200 p-3"
            />
          </label>

          <label className="text-sm font-medium">
            Starting battery (%)
            <input
              required
              type="number"
              min="0"
              max="99"
              value={startPercent}
              onChange={(event) => setStartPercent(event.target.value)}
              className="mt-2 block w-full rounded-lg border border-slate-200 p-3"
            />
          </label>

          <label className="text-sm font-medium">
            Ending battery (%)
            <input
              required
              type="number"
              min="1"
              max="100"
              value={endPercent}
              onChange={(event) => setEndPercent(event.target.value)}
              className="mt-2 block w-full rounded-lg border border-slate-200 p-3"
            />
          </label>

          <label className="text-sm font-medium sm:col-span-2">
            Temperature (°C)
            <input
              required
              type="number"
              min="0"
              max="100"
              value={temperature}
              onChange={(event) => setTemperature(event.target.value)}
              className="mt-2 block w-full rounded-lg border border-slate-200 p-3"
            />
          </label>

          <button
            type="submit"
            className="rounded-lg bg-[#14243a] px-5 py-3 font-semibold text-white sm:col-span-2"
          >
            Save Session
          </button>
        </form>
      )}

      <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
        <h2 className="text-lg font-bold">Charging history</h2>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search session ID, laptop or battery..."
          className="mt-5 w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-emerald-500"
        />

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                <th className="p-4">Session</th>
                <th className="p-4">Laptop / Battery</th>
                <th className="p-4">Start time</th>
                <th className="p-4">End time</th>
                <th className="p-4">Charge gain</th>
                <th className="p-4">Temperature</th>
                <th className="p-4">Cycles</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((session) => (
                <tr key={session.id} className="border-b border-slate-100">
                  <td className="p-4 font-semibold">{session.id}</td>
                  <td className="p-4">
                    <p className="font-medium">{session.laptop}</p>
                    <p className="mt-1 text-xs text-slate-400">{session.battery}</p>
                  </td>
                  <td className="p-4">{session.start.replace("T", " ")}</td>
                  <td className="p-4">{session.end.replace("T", " ")}</td>
                  <td className="p-4 font-semibold text-emerald-700">
                    +{session.endPercent - session.startPercent}%
                  </td>
                  <td className="p-4">{session.temperature}°C</td>
                  <td className="p-4">{session.cycles}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-500">
              No matching charging sessions.
            </p>
          )}
        </div>

        <p className="mt-4 text-xs text-slate-400">
          Demo records only. New sessions are temporary and are not yet saved to MySQL.
        </p>
      </section>
    </main>
  );
}
