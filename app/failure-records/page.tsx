
"use client";

import { useEffect, useState } from "react";

type Failure = {
  id: string;
  battery: string;
  laptop: string;
  date: string;
  symptoms: string;
  cause: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  resolvedDate: string;
};

export default function FailureRecordsPage() {
  const [failures, setFailures] = useState<Failure[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [resolutionFilter, setResolutionFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);

  const [battery, setBattery] = useState("BAT001");
  const [laptop, setLaptop] = useState("Dell Inspiron 15");
  const [date, setDate] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [cause, setCause] = useState("");
  const [severity, setSeverity] = useState<Failure["severity"]>("Medium");

  useEffect(() => {
    async function fetchFailures() {
      try {
        const response = await fetch("/api/failure-records", {
          cache: "no-store",
        });
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || "Failed to load failure records");
        }

        const mappedFailures: Failure[] = result.data.map((row: {
          failure_id: number;
          battery_id: number;
          brand: string;
          model: string;
          failure_date: string;
          symptoms: string;
          cause: string | null;
          severity: string | null;
          resolved_date: string | null;
        }) => {
          const rawSeverity = (row.severity || "Medium").toLowerCase();
          const normalizedSeverity =
            rawSeverity === "low" ? "Low" :
            rawSeverity === "high" ? "High" :
            rawSeverity === "critical" ? "Critical" : "Medium";

          return {
            id: `FLR${String(row.failure_id).padStart(3, "0")}`,
            battery: `BAT${String(row.battery_id).padStart(3, "0")}`,
            laptop: `${row.brand} ${row.model}`,
            date: String(row.failure_date).slice(0, 10),
            symptoms: row.symptoms || "",
            cause: row.cause || "Not specified",
            severity: normalizedSeverity as Failure["severity"],
            resolvedDate: row.resolved_date
              ? String(row.resolved_date).slice(0, 10)
              : "",
          };
        });

        setFailures(mappedFailures);
      } catch (error) {
        console.error("Failed to fetch failure records:", error);
        setLoadError("Unable to load failure records from MySQL.");
      } finally {
        setLoading(false);
      }
    }

    fetchFailures();
  }, []);


  const filtered = failures.filter((failure) => {
    const text =
      `${failure.id} ${failure.battery} ${failure.laptop} ${failure.symptoms} ${failure.cause}`.toLowerCase();

    const matchesSearch = text.includes(search.toLowerCase());
    const matchesSeverity =
      severityFilter === "All" || failure.severity === severityFilter;
    const matchesResolution =
      resolutionFilter === "All" ||
      (resolutionFilter === "Resolved" && Boolean(failure.resolvedDate)) ||
      (resolutionFilter === "Unresolved" && !failure.resolvedDate);

    return matchesSearch && matchesSeverity && matchesResolution;
  });

  const unresolved = failures.filter((failure) => !failure.resolvedDate).length;
  const critical = failures.filter(
    (failure) => failure.severity === "Critical"
  ).length;
  const resolved = failures.filter((failure) => failure.resolvedDate).length;

  function addFailure(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const newFailure: Failure = {
      id: `FLR${String(Date.now()).slice(-6)}`,
      battery,
      laptop,
      date,
      symptoms: symptoms.trim(),
      cause: cause.trim(),
      severity,
      resolvedDate: "",
    };

    setFailures((current) => [newFailure, ...current]);
    setDate("");
    setSymptoms("");
    setCause("");
    setShowForm(false);
  }

  function markResolved(id: string) {
    const resolvedDate = new Date().toISOString().slice(0, 10);

    setFailures((current) =>
      current.map((failure) =>
        failure.id === id ? { ...failure, resolvedDate } : failure
      )
    );
  }

  function severityStyle(value: Failure["severity"]) {
    switch (value) {
      case "Low":
        return "bg-emerald-50 text-emerald-700";
      case "Medium":
        return "bg-amber-50 text-amber-700";
      case "High":
        return "bg-orange-50 text-orange-700";
      case "Critical":
        return "bg-red-50 text-red-700";
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
            BatteryWatch / Diagnostics
          </p>
          <h1 className="mt-2 text-3xl font-bold">Failure Records</h1>
          <p className="mt-2 text-sm text-slate-500">
            Track battery failures, identify causes and record resolutions.
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-emerald-500 px-5 py-3 font-semibold text-slate-950"
        >
          {showForm ? "Cancel" : "+ Report Failure"}
        </button>
      </header>

      <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Total failures</p>
          <p className="mt-3 text-3xl font-bold">{failures.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Unresolved</p>
          <p className="mt-3 text-3xl font-bold text-orange-600">{unresolved}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Critical incidents</p>
          <p className="mt-3 text-3xl font-bold text-red-600">{critical}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Resolved</p>
          <p className="mt-3 text-3xl font-bold text-emerald-700">{resolved}</p>
        </div>
      </section>

      {showForm && (
        <form
          onSubmit={addFailure}
          className="mt-7 grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 sm:grid-cols-2"
        >
          <h2 className="text-lg font-bold sm:col-span-2">Report a battery failure</h2>

          <label className="text-sm font-medium">
            Battery
            <select
              value={battery}
              onChange={(event) => {
                const id = event.target.value;
                setBattery(id);
                const names: Record<string, string> = {
                  BAT001: "Dell Inspiron 15",
                  BAT002: "HP Pavilion 14",
                  BAT003: "Lenovo IdeaPad Slim 5",
                  BAT004: "ASUS VivoBook 15",
                };
                setLaptop(names[id]);
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
            <input readOnly value={laptop} className="mt-2 block w-full rounded-lg border border-slate-200 bg-slate-50 p-3" />
          </label>

          <label className="text-sm font-medium">
            Failure date
            <input required type="date" value={date} onChange={(event) => setDate(event.target.value)} className="mt-2 block w-full rounded-lg border border-slate-200 p-3" />
          </label>

          <label className="text-sm font-medium">
            Severity
            <select value={severity} onChange={(event) => setSeverity(event.target.value as Failure["severity"])} className="mt-2 block w-full rounded-lg border border-slate-200 p-3">
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Critical</option>
            </select>
          </label>

          <label className="text-sm font-medium">
            Symptoms
            <textarea required value={symptoms} onChange={(event) => setSymptoms(event.target.value)} placeholder="What happened?" className="mt-2 block w-full rounded-lg border border-slate-200 p-3" rows={3} />
          </label>

          <label className="text-sm font-medium">
            Suspected cause
            <textarea required value={cause} onChange={(event) => setCause(event.target.value)} placeholder="What may have caused it?" className="mt-2 block w-full rounded-lg border border-slate-200 p-3" rows={3} />
          </label>

          <button type="submit" className="rounded-lg bg-[#14243a] px-5 py-3 font-semibold text-white sm:col-span-2">
            Save Failure Record
          </button>
        </form>
      )}

      <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
        <h2 className="text-lg font-bold">Failure history</h2>

        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search failure ID, battery, symptoms or cause..."
          className="mt-5 w-full rounded-lg border border-slate-200 p-3 text-sm"
        />

        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <select value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value)} className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
            <option>All</option>
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
            <option>Critical</option>
          </select>

          <select value={resolutionFilter} onChange={(event) => setResolutionFilter(event.target.value)} className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
            <option>All</option>
            <option>Resolved</option>
            <option>Unresolved</option>
          </select>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                <th className="p-4">Failure ID</th>
                <th className="p-4">Battery / Laptop</th>
                <th className="p-4">Date</th>
                <th className="p-4">Symptoms</th>
                <th className="p-4">Cause</th>
                <th className="p-4">Severity</th>
                <th className="p-4">Resolution</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((failure) => (
                <tr key={failure.id} className="border-b border-slate-100">
                  <td className="p-4 font-semibold">{failure.id}</td>
                  <td className="p-4">
                    {failure.battery}
                    <p className="mt-1 text-xs text-slate-400">{failure.laptop}</p>
                  </td>
                  <td className="p-4">{failure.date}</td>
                  <td className="p-4">{failure.symptoms}</td>
                  <td className="p-4">{failure.cause}</td>
                  <td className="p-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${severityStyle(failure.severity)}`}>
                      {failure.severity}
                    </span>
                  </td>
                  <td className="p-4">
                    {failure.resolvedDate ? (
                      <span className="text-emerald-700">
                        Resolved
                        <p className="mt-1 text-xs text-slate-400">{failure.resolvedDate}</p>
                      </span>
                    ) : (
                      <button
                        onClick={() => markResolved(failure.id)}
                        className="rounded-md bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                      >
                        Mark resolved
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {loading && (
            <p className="py-8 text-center text-sm text-slate-500">
              Loading failure records from MySQL...
            </p>
          )}

          {loadError && (
            <p className="py-8 text-center text-sm text-red-600">
              {loadError}
            </p>
          )}

          {!loading && !loadError && filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-500">
              No matching failure records.
            </p>
          )}
        </div>

        <p className="mt-4 text-xs text-slate-400">
          Failure records are loaded from MySQL. Adding or resolving records is not yet saved to MySQL.
        </p>
      </section>
    </main>
  );
}
