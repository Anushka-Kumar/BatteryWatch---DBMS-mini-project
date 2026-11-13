"use client";

import { useEffect, useState } from "react";

type Failure = {
  failureId: number;
  id: string;
  batteryId: number;
  battery: string;
  laptop: string;
  laptopId: number;
  date: string;
  symptoms: string;
  cause: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  resolvedDate: string;
};

type RegisteredLaptop = {
  laptop_id: number;
  brand: string;
  model: string;
  battery_id: number | null;
};

type FailureRow = {
  failure_id: number;
  battery_id: number;
  brand: string;
  model: string;
  failure_date: string;
  symptoms: string;
  cause: string | null;
  severity: string | null;
  resolved_date: string | null;
};

function mapFailures(rows: FailureRow[]): Failure[] {
  return rows.map((row) => {
    const rawSeverity = (row.severity || "Medium").toLowerCase();
    const normalizedSeverity =
      rawSeverity === "low" ? "Low" :
      rawSeverity === "high" ? "High" :
      rawSeverity === "critical" ? "Critical" : "Medium";

    return {
      failureId: row.failure_id,
      id: `FLR${String(row.failure_id).padStart(3, "0")}`,
      batteryId: row.battery_id,
      battery: `BAT${String(row.battery_id).padStart(3, "0")}`,
      laptop: `${row.brand} ${row.model}`,
      laptopId: 0,
      date: String(row.failure_date).slice(0, 10),
      symptoms: row.symptoms || "",
      cause: row.cause || "",
      severity: normalizedSeverity as Failure["severity"],
      resolvedDate: row.resolved_date
        ? String(row.resolved_date).slice(0, 10)
        : "",
    };
  });
}

export default function FailureRecordsPage() {
  const [failures, setFailures] = useState<Failure[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [resolutionFilter, setResolutionFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);

  const [laptops, setLaptops] = useState<RegisteredLaptop[]>([]);
  const [selectedLaptopId, setSelectedLaptopId] = useState("");
  const [date, setDate] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [cause, setCause] = useState("");
  const [severity, setSeverity] = useState<Failure["severity"]>("Medium");
  const [resolvedDate, setResolvedDate] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [actionId, setActionId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  async function fetchFailures() {
    const response = await fetch("/api/failure-records", {
      cache: "no-store",
    });
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || "Failed to load failure records");
    }

    setFailures(mapFailures(result.data));
  }

  useEffect(() => {
    async function loadFailures() {
      try {
        await fetchFailures();
      } catch (error) {
        console.error(error);
        setLoadError("Unable to load failure records from MySQL.");
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

        const registered: RegisteredLaptop[] = result.data.filter(
          (item: RegisteredLaptop) => item.battery_id !== null
        );

        setLaptops(registered);

        if (registered.length > 0) {
          setSelectedLaptopId(String(registered[0].laptop_id));
        }
      } catch (error) {
        console.error("Failed to fetch laptops:", error);
      }
    }

    loadFailures();
    fetchLaptops();
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

  function resetForm() {
    setDate("");
    setSymptoms("");
    setCause("");
    setSeverity("Medium");
    setResolvedDate("");
    setEditingId(null);
    setShowForm(false);

    if (laptops.length > 0) {
      setSelectedLaptopId(String(laptops[0].laptop_id));
    }
  }

  function editFailure(failure: Failure) {
    const laptop = laptops.find(
      (item) => item.battery_id === failure.batteryId
    );

    if (!laptop) {
      alert("The laptop associated with this failure could not be found.");
      return;
    }

    setEditingId(failure.failureId);
    setSelectedLaptopId(String(laptop.laptop_id));
    setDate(failure.date);
    setSymptoms(failure.symptoms);
    setCause(failure.cause);
    setSeverity(failure.severity);
    setResolvedDate(failure.resolvedDate);
    setShowForm(true);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveFailure(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const selectedLaptop = laptops.find(
      (item) => item.laptop_id === Number(selectedLaptopId)
    );

    if (!selectedLaptop?.battery_id) {
      alert("Please select a registered laptop with an assigned battery.");
      return;
    }

    if (!date || !symptoms.trim() || !cause.trim()) {
      alert("Please fill in all failure details.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        editingId
          ? `/api/failure-records?failure_id=${editingId}`
          : "/api/failure-records",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            battery_id: selectedLaptop.battery_id,
            failure_date: date,
            symptoms: symptoms.trim(),
            cause: cause.trim(),
            severity,
            resolved_date: resolvedDate || null,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to save failure record.");
      }

      alert(
        editingId
          ? "Failure record updated successfully!"
          : "Failure record saved to MySQL!"
      );

      resetForm();
      await fetchFailures();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Unable to save failure record.");
    } finally {
      setSaving(false);
    }
  }

  async function markResolved(failure: Failure) {
    if (!confirm(`Mark ${failure.id} as resolved?`)) return;

    setActionId(failure.failureId);

    try {
      const response = await fetch("/api/failure-records", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ failure_id: failure.failureId }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to resolve failure.");
      }

      await fetchFailures();
      alert("Failure marked as resolved!");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Unable to resolve failure.");
    } finally {
      setActionId(null);
    }
  }

  async function deleteFailure(failure: Failure) {
    if (!confirm(`Permanently delete ${failure.id}? This cannot be undone.`)) {
      return;
    }

    setActionId(failure.failureId);

    try {
      const response = await fetch(
        `/api/failure-records?failure_id=${failure.failureId}`,
        { method: "DELETE" }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to delete failure record.");
      }

      await fetchFailures();
      alert("Failure record deleted successfully!");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Unable to delete failure.");
    } finally {
      setActionId(null);
    }
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
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setEditingId(null);
              setShowForm(true);
            }
          }}
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
          onSubmit={saveFailure}
          className="mt-7 grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 sm:grid-cols-2"
        >
          <h2 className="text-lg font-bold sm:col-span-2">
            {editingId ? "Edit failure record" : "Report a battery failure"}
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
            Failure date
            <input
              required
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="mt-2 block w-full rounded-lg border border-slate-200 p-3"
            />
          </label>

          <label className="text-sm font-medium">
            Severity
            <select
              value={severity}
              onChange={(event) =>
                setSeverity(event.target.value as Failure["severity"])
              }
              className="mt-2 block w-full rounded-lg border border-slate-200 p-3"
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Critical</option>
            </select>
          </label>

          <label className="text-sm font-medium">
            Symptoms
            <textarea
              required
              value={symptoms}
              onChange={(event) => setSymptoms(event.target.value)}
              placeholder="What happened?"
              className="mt-2 block w-full rounded-lg border border-slate-200 p-3"
              rows={3}
            />
          </label>

          <label className="text-sm font-medium">
            Suspected cause
            <textarea
              required
              value={cause}
              onChange={(event) => setCause(event.target.value)}
              placeholder="What may have caused it?"
              className="mt-2 block w-full rounded-lg border border-slate-200 p-3"
              rows={3}
            />
          </label>

          {editingId && (
            <label className="text-sm font-medium sm:col-span-2">
              Resolution date (leave blank if unresolved)
              <input
                type="date"
                value={resolvedDate}
                onChange={(event) => setResolvedDate(event.target.value)}
                className="mt-2 block w-full rounded-lg border border-slate-200 p-3"
              />
            </label>
          )}

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[#14243a] px-5 py-3 font-semibold text-white disabled:opacity-50 sm:col-span-2"
          >
            {saving ? "Saving..." : editingId ? "Save Changes" : "Save Failure Record"}
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
          <select
            value={severityFilter}
            onChange={(event) => setSeverityFilter(event.target.value)}
            className="rounded-lg border border-slate-200 bg-white p-3 text-sm"
          >
            <option>All</option>
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
            <option>Critical</option>
          </select>

          <select
            value={resolutionFilter}
            onChange={(event) => setResolutionFilter(event.target.value)}
            className="rounded-lg border border-slate-200 bg-white p-3 text-sm"
          >
            <option>All</option>
            <option>Resolved</option>
            <option>Unresolved</option>
          </select>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[1200px] text-left text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                <th className="p-4">Failure ID</th>
                <th className="p-4">Battery / Laptop</th>
                <th className="p-4">Date</th>
                <th className="p-4">Symptoms</th>
                <th className="p-4">Cause</th>
                <th className="p-4">Severity</th>
                <th className="p-4">Resolution</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((failure) => (
                <tr key={failure.failureId} className="border-b border-slate-100">
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
                      <span className="text-orange-600">Unresolved</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => editFailure(failure)}
                        disabled={actionId === failure.failureId}
                        className="rounded-md bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 disabled:opacity-50"
                      >
                        Edit
                      </button>

                      {!failure.resolvedDate && (
                        <button
                          onClick={() => markResolved(failure)}
                          disabled={actionId === failure.failureId}
                          className="whitespace-nowrap rounded-md bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 disabled:opacity-50"
                        >
                          Mark Resolved
                        </button>
                      )}

                      <button
                        onClick={() => deleteFailure(failure)}
                        disabled={actionId === failure.failureId}
                        className="rounded-md bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
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
            <p className="py-8 text-center text-sm text-red-600">{loadError}</p>
          )}

          {!loading && !loadError && filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-500">
              No matching failure records.
            </p>
          )}
        </div>

        <p className="mt-4 text-xs text-slate-400">
          Failure records are loaded from and saved to MySQL.
        </p>
      </section>
    </main>
  );
}