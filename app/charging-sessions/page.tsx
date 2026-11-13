"use client";

import { useEffect, useState } from "react";

type Session = {
  sessionId: number;
  id: string;
  laptop: string;
  battery: string;
  batteryId: number;
  start: string;
  end: string;
  startPercent: number;
  endPercent: number;
  temperature: number;
  cycles: number;
};

type RegisteredLaptop = {
  laptop_id: number;
  brand: string;
  model: string;
  battery_id: number | null;
};

type SessionRow = {
  session_id: number;
  battery_id: number;
  brand: string;
  model: string;
  start_time: string;
  end_time: string | null;
  start_percentage: number | string;
  end_percentage: number | string;
  temperature: number | string | null;
  charge_cycles: number | null;
};

function mapSessions(rows: SessionRow[]): Session[] {
  return rows.map((row) => ({
    sessionId: row.session_id,
    id: `CHG${String(row.session_id).padStart(3, "0")}`,
    laptop: `${row.brand} ${row.model}`,
    battery: `BAT${String(row.battery_id).padStart(3, "0")}`,
    batteryId: row.battery_id,
    start: String(row.start_time).replace("T", " ").replace("Z", "").slice(0, 16),
    end: row.end_time
      ? String(row.end_time).replace("T", " ").replace("Z", "").slice(0, 16)
      : "In progress",
    startPercent: Number(row.start_percentage),
    endPercent: Number(row.end_percentage),
    temperature: row.temperature == null ? 0 : Number(row.temperature),
    cycles: Number(row.charge_cycles ?? 0),
  }));
}

export default function ChargingSessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [laptops, setLaptops] = useState<RegisteredLaptop[]>([]);
  const [selectedLaptopId, setSelectedLaptopId] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [startPercent, setStartPercent] = useState("20");
  const [endPercent, setEndPercent] = useState("80");
  const [temperature, setTemperature] = useState("35");
  const [cycles, setCycles] = useState("0");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [actionId, setActionId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  async function fetchSessions() {
    const response = await fetch("/api/charging-sessions", {
      cache: "no-store",
    });
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || "Failed to load charging sessions");
    }

    setSessions(mapSessions(result.data));
  }

  useEffect(() => {
    async function loadData() {
      try {
        await fetchSessions();
      } catch (error) {
        console.error(error);
        setLoadError("Unable to load charging sessions from MySQL.");
      } finally {
        setLoading(false);
      }
    }

    async function fetchLaptops() {
      try {
        const response = await fetch("/api/laptops", {
          cache: "no-store",
        });
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error("Unable to load registered laptops.");
        }

        const registeredLaptops: RegisteredLaptop[] = result.data.filter(
          (item: RegisteredLaptop) => item.battery_id !== null
        );

        setLaptops(registeredLaptops);

        if (registeredLaptops.length > 0) {
          setSelectedLaptopId(String(registeredLaptops[0].laptop_id));
        }
      } catch (error) {
        console.error("Failed to fetch laptops:", error);
      }
    }

    loadData();
    fetchLaptops();
  }, []);

  const filtered = sessions.filter((session) => {
    const matchesSearch = `${session.id} ${session.laptop} ${session.battery}`
      .toLowerCase()
      .includes(search.toLowerCase());

    const isCompleted = session.end !== "In progress";
    const matchesStatus =
      filter === "All" ||
      (filter === "Completed" && isCompleted) ||
      (filter === "Pending" && !isCompleted);

    return matchesSearch && matchesStatus;
  });

  const completedSessions = sessions.filter(
    (session) => session.end !== "In progress"
  );

  const averageGain =
    completedSessions.length === 0
      ? 0
      : completedSessions.reduce(
          (sum, session) =>
            sum + session.endPercent - session.startPercent,
          0
        ) / completedSessions.length;

  function resetForm() {
    setStart("");
    setEnd("");
    setStartPercent("20");
    setEndPercent("80");
    setTemperature("35");
    setCycles("0");
    setEditingId(null);
    setShowForm(false);

    if (laptops.length > 0) {
      setSelectedLaptopId(String(laptops[0].laptop_id));
    }
  }

  function editSession(session: Session) {
    const laptop = laptops.find(
      (item) => item.battery_id === session.batteryId
    );

    if (!laptop) {
      alert("The laptop associated with this session could not be found.");
      return;
    }

    setEditingId(session.sessionId);
    setSelectedLaptopId(String(laptop.laptop_id));
    setStart(session.start.replace(" ", "T"));
    setEnd(
      session.end === "In progress"
        ? ""
        : session.end.replace(" ", "T")
    );
    setStartPercent(String(session.startPercent));
    setEndPercent(String(session.endPercent));
    setTemperature(String(session.temperature));
    setCycles(String(session.cycles));
    setShowForm(true);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function addSession(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedLaptopId) {
      alert("Please select a registered laptop with an assigned battery.");
      return;
    }

    if (!start || !end) {
      alert("Please enter both start and end times.");
      return;
    }

    const from = Number(startPercent);
    const to = Number(endPercent);
    const temp = Number(temperature);
    const cycleCount = Number(cycles);

    if (new Date(end) <= new Date(start)) {
      alert("End time must be after start time.");
      return;
    }

    if (
      from < 0 ||
      from > 100 ||
      to < 0 ||
      to > 100 ||
      to <= from ||
      temp < 0 ||
      temp > 100 ||
      !Number.isInteger(cycleCount) ||
      cycleCount < 0
    ) {
      alert("Enter valid percentages, temperature and cycle count.");
      return;
    }

    const selectedLaptop = laptops.find(
      (item) => item.laptop_id === Number(selectedLaptopId)
    );

    if (!selectedLaptop?.battery_id) {
      alert("The selected laptop does not have an assigned battery.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        editingId
          ? `/api/charging-sessions?session_id=${editingId}`
          : "/api/charging-sessions",
        {
          method: editingId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            battery_id: selectedLaptop.battery_id,
            start_time: start,
            end_time: end,
            start_percentage: from,
            end_percentage: to,
            temperature: temp,
            charge_cycles: cycleCount,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to save charging session");
      }

      alert(
        editingId
          ? "Charging session updated successfully!"
          : "Charging session saved to MySQL!"
      );

      resetForm();
      await fetchSessions();
    } catch (error) {
      console.error("Failed to save charging session:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Unable to save charging session."
      );
    } finally {
      setSaving(false);
    }
  }

  async function markCompleted(session: Session) {
    if (!confirm(`Mark ${session.id} as completed?`)) return;

    setActionId(session.sessionId);

    try {
      const response = await fetch("/api/charging-sessions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: session.sessionId }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to complete session");
      }

      await fetchSessions();
      alert("Charging session marked as completed!");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Unable to complete session.");
    } finally {
      setActionId(null);
    }
  }

  async function deleteSession(session: Session) {
    if (!confirm(`Permanently delete ${session.id}? This cannot be undone.`)) {
      return;
    }

    setActionId(session.sessionId);

    try {
      const response = await fetch(
        `/api/charging-sessions?session_id=${session.sessionId}`,
        { method: "DELETE" }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to delete session");
      }

      await fetchSessions();
      alert("Charging session deleted successfully!");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Unable to delete session.");
    } finally {
      setActionId(null);
    }
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
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setEditingId(null);
              setShowForm(true);
            }
          }}
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
            {sessions.length > 0
              ? `${Math.max(...sessions.map((session) => session.temperature))}°C`
              : "N/A"}
          </p>
        </div>
      </section>

      {showForm && (
        <form
          onSubmit={addSession}
          className="mt-7 grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2"
        >
          <h2 className="text-lg font-bold sm:col-span-2">
            {editingId ? "Edit charging session" : "Record a charging session"}
          </h2>

          <label className="text-sm font-medium sm:col-span-2">
            Select Laptop
            <select
              required
              value={selectedLaptopId}
              onChange={(event) => setSelectedLaptopId(event.target.value)}
              className="mt-2 block w-full rounded-lg border border-slate-200 p-3"
            >
              {laptops.length === 0 && (
                <option value="">No registered laptops with batteries</option>
              )}
              {laptops.map((item) => (
                <option key={item.laptop_id} value={String(item.laptop_id)}>
                  {item.brand} {item.model}
                </option>
              ))}
            </select>
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

          <label className="text-sm font-medium">
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

          <label className="text-sm font-medium">
            Charge cycles
            <input
              required
              type="number"
              min="0"
              step="1"
              value={cycles}
              onChange={(event) => setCycles(event.target.value)}
              className="mt-2 block w-full rounded-lg border border-slate-200 p-3"
            />
          </label>

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[#14243a] px-5 py-3 font-semibold text-white disabled:opacity-50 sm:col-span-2"
          >
            {saving ? "Saving..." : editingId ? "Save Changes" : "Save Session"}
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

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium text-slate-600">
            Status:
          </label>
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm"
          >
            <option value="All">All</option>
            <option value="Completed">Completed</option>
            <option value="Pending">Pending</option>
          </select>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[1150px] text-left text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                <th className="p-4">Session</th>
                <th className="p-4">Laptop / Battery</th>
                <th className="p-4">Start time</th>
                <th className="p-4">End time</th>
                <th className="p-4">Charge gain</th>
                <th className="p-4">Temperature</th>
                <th className="p-4">Cycles</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((session) => {
                const isCompleted = session.end !== "In progress";

                return (
                  <tr key={session.sessionId} className="border-b border-slate-100">
                    <td className="p-4 font-semibold">{session.id}</td>
                    <td className="p-4">
                      <p className="font-medium">{session.laptop}</p>
                      <p className="mt-1 text-xs text-slate-400">{session.battery}</p>
                    </td>
                    <td className="p-4">{session.start}</td>
                    <td className="p-4">{session.end}</td>
                    <td className="p-4 font-semibold text-emerald-700">
                      {isCompleted
                        ? `+${session.endPercent - session.startPercent}%`
                        : "—"}
                    </td>
                    <td className="p-4">{session.temperature}°C</td>
                    <td className="p-4">{session.cycles}</td>
                    <td className="p-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          isCompleted
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {isCompleted ? "Completed" : "Pending"}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => editSession(session)}
                          disabled={actionId === session.sessionId}
                          className="rounded-md bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 disabled:opacity-50"
                        >
                          Edit
                        </button>

                        {!isCompleted && (
                          <button
                            onClick={() => markCompleted(session)}
                            disabled={actionId === session.sessionId}
                            className="whitespace-nowrap rounded-md bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 disabled:opacity-50"
                          >
                            Mark Completed
                          </button>
                        )}

                        <button
                          onClick={() => deleteSession(session)}
                          disabled={actionId === session.sessionId}
                          className="rounded-md bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {loading && (
            <p className="py-8 text-center text-sm text-slate-500">
              Loading charging sessions from MySQL...
            </p>
          )}

          {loadError && (
            <p className="py-8 text-center text-sm text-red-600">
              {loadError}
            </p>
          )}

          {!loading && !loadError && filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-500">
              No matching charging sessions.
            </p>
          )}
        </div>

        <p className="mt-4 text-xs text-slate-400">
          Charging sessions are loaded from and saved to MySQL.
        </p>
      </section>
    </main>
  );
}