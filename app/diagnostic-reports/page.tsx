"use client";

import { useEffect, useState } from "react";

type DiagnosticReport = {
  id: string;
  battery_id: number | string;
  diagnosis: string;
  observations: string[];
  temperature_status: string;
  recommendations: string[];
  analysis_date: string;
  risk_level: string;
  brand?: string;
  model?: string;
};
type RegisteredLaptop = {
  laptop_id: number;
  brand: string;
  model: string;
  battery_id: number | null;
};
export default function DiagnosticReportsPage() {
  const [reports, setReports] = useState<DiagnosticReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("All");
const [showForm, setShowForm] = useState(false);
const [laptops, setLaptops] = useState<RegisteredLaptop[]>([]);
const [selectedLaptopId, setSelectedLaptopId] = useState("");

const [diagnosis, setDiagnosis] = useState("");
const [observationsText, setObservationsText] = useState("");
const [temperatureStatus, setTemperatureStatus] = useState("NORMAL");
const [recommendationsText, setRecommendationsText] = useState("");
const [analysisDate, setAnalysisDate] = useState("");
const [newRiskLevel, setNewRiskLevel] = useState("Low");
const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchReports() {
      try {
        const response = await fetch("/api/diagnostic-reports", {
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.error || "Failed to load diagnostic reports"
          );
        }

        const mapped: DiagnosticReport[] = result.data.map(
          (row: Record<string, unknown>, index: number) => ({
            id: String(row.id ?? row._id ?? `REPORT-${index + 1}`),
            battery_id: (row.battery_id ?? "Unknown") as number | string,
            diagnosis: String(row.diagnosis ?? "Not available"),
            observations: Array.isArray(row.observations)
              ? row.observations.map(String)
              : [],
            temperature_status: String(
              row.temperature_status ?? "Not available"
            ),
            recommendations: Array.isArray(row.recommendations)
              ? row.recommendations.map(String)
              : [],
            analysis_date: String(row.analysis_date ?? ""),
            risk_level: String(row.risk_level ?? "Unknown"),
            brand: row.brand ? String(row.brand) : undefined,
            model: row.model ? String(row.model) : undefined,
          })
        );

        setReports(mapped);
      } catch (err) {
        console.error("Diagnostic reports error:", err);
        setError("Unable to load diagnostic reports. Check the API route.");
      } finally {
        setLoading(false);
      }
    }

    fetchReports();
  }, []);
useEffect(() => {
  async function fetchLaptops() {
    try {
      const response = await fetch("/api/laptops", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error("Unable to load registered laptops.");
      }

      const availableLaptops: RegisteredLaptop[] = result.data.filter(
        (item: RegisteredLaptop) => item.battery_id !== null
      );

      setLaptops(availableLaptops);

      if (availableLaptops.length > 0) {
        setSelectedLaptopId(String(availableLaptops[0].laptop_id));
      }
    } catch (error) {
      console.error("Failed to fetch laptops:", error);
    }
  }

  fetchLaptops();
}, []);

  const filteredReports = reports.filter((report) => {
    const searchableText = [
      report.id,
      report.battery_id,
      report.diagnosis,
      report.risk_level,
      report.temperature_status,
      report.brand ?? "",
      report.model ?? "",
      ...report.observations,
      ...report.recommendations,
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch = searchableText.includes(search.toLowerCase());

    const matchesRisk =
      riskFilter === "All" ||
      report.risk_level.toLowerCase() === riskFilter.toLowerCase();

    return matchesSearch && matchesRisk;
  });

  const lowRisk = reports.filter(
    (r) => r.risk_level.toLowerCase() === "low"
  ).length;

  const mediumRisk = reports.filter(
    (r) => r.risk_level.toLowerCase() === "medium"
  ).length;

  const highRisk = reports.filter(
    (r) => r.risk_level.toLowerCase() === "high"
  ).length;

  function riskStyle(risk: string) {
    switch (risk.toLowerCase()) {
      case "low":
        return "bg-emerald-50 text-emerald-700";
      case "medium":
        return "bg-amber-50 text-amber-700";
      case "high":
      case "critical":
        return "bg-red-50 text-red-700";
      default:
        return "bg-slate-100 text-slate-600";
    }
  }

async function addReport(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();

  const selectedLaptop = laptops.find(
    (item) => item.laptop_id === Number(selectedLaptopId)
  );

  if (!selectedLaptop || selectedLaptop.battery_id === null) {
    alert("Please select a registered laptop with an assigned battery.");
    return;
  }

  const observations = observationsText
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

  const recommendations = recommendationsText
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

  if (
    !diagnosis.trim() ||
    !analysisDate ||
    observations.length === 0 ||
    recommendations.length === 0 ||
    !temperatureStatus.trim()
  ) {
    alert("Please complete all diagnostic report fields.");
    return;
  }

  setSaving(true);

  try {
    const response = await fetch("/api/diagnostic-reports", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        battery_id: selectedLaptop.battery_id,
        diagnosis: diagnosis.trim(),
        observations,
        temperature_status: temperatureStatus,
        recommendations,
        analysis_date: analysisDate,
        risk_level: newRiskLevel,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || "Unable to save diagnostic report.");
    }

    const newReport: DiagnosticReport = {
      id: result.id,
      battery_id: selectedLaptop.battery_id,
      diagnosis: diagnosis.trim(),
      observations,
      temperature_status: temperatureStatus,
      recommendations,
      analysis_date: analysisDate,
      risk_level: newRiskLevel,
      brand: selectedLaptop.brand,
      model: selectedLaptop.model,
    };

    setReports((current) => [newReport, ...current]);

    setDiagnosis("");
    setObservationsText("");
    setTemperatureStatus("NORMAL");
    setRecommendationsText("");
    setAnalysisDate("");
    setNewRiskLevel("Low");
    setShowForm(false);

    alert("Diagnostic report saved to MongoDB!");
  } catch (error) {
    console.error("Failed to save diagnostic report:", error);
    alert(
      error instanceof Error
        ? error.message
        : "Unable to save diagnostic report."
    );
  } finally {
    setSaving(false);
  }
}


  return (
    <main className="min-h-screen bg-[#f5f7fb] p-5 text-slate-800 md:p-10">
      <a
        href="/"
        className="mb-8 inline-block text-sm font-medium text-emerald-700 hover:text-emerald-800"
      >
        ← Back to Dashboard
      </a>

      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600">
          BatteryWatch / Diagnostics
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Diagnostic Reports
        </h1>
        <p className="mt-2 text-slate-500">
          Review battery diagnoses, observations and recommendations.
<button
  onClick={() => setShowForm(!showForm)}
  className="rounded-lg bg-emerald-500 px-5 py-3 font-semibold text-slate-950"
>
  {showForm ? "Cancel" : "+ Add Diagnostic Report"}
</button>
        </p>
      </header>

{showForm && (
  <form
    onSubmit={addReport}
    className="mb-8 grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2"
  >
    <h2 className="text-lg font-bold sm:col-span-2">
      Create Diagnostic Report
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
          <option
            key={item.laptop_id}
            value={String(item.laptop_id)}
          >
            {item.brand} {item.model}
          </option>
        ))}
      </select>
    </label>

    <label className="text-sm font-medium">
      Diagnosis
      <input
        required
        value={diagnosis}
        onChange={(event) => setDiagnosis(event.target.value)}
        placeholder="Enter diagnosis"
        className="mt-2 block w-full rounded-lg border border-slate-200 p-3"
      />
    </label>

    <label className="text-sm font-medium">
      Analysis date
      <input
        required
        type="date"
        value={analysisDate}
        onChange={(event) => setAnalysisDate(event.target.value)}
        className="mt-2 block w-full rounded-lg border border-slate-200 p-3"
      />
    </label>

    <label className="text-sm font-medium">
      Risk level
      <select
        value={newRiskLevel}
        onChange={(event) => setNewRiskLevel(event.target.value)}
        className="mt-2 block w-full rounded-lg border border-slate-200 p-3"
      >
        <option value="Low">Low</option>
        <option value="Medium">Medium</option>
        <option value="High">High</option>
        <option value="Critical">Critical</option>
      </select>
    </label>

    <label className="text-sm font-medium">
      Temperature status
      <select
        value={temperatureStatus}
        onChange={(event) => setTemperatureStatus(event.target.value)}
        className="mt-2 block w-full rounded-lg border border-slate-200 p-3"
      >
        <option value="NORMAL">NORMAL</option>
        <option value="WARNING">WARNING</option>
        <option value="CRITICAL">CRITICAL</option>
      </select>
    </label>

    <label className="text-sm font-medium sm:col-span-2">
      Observations (one per line)
      <textarea
        required
        rows={3}
        value={observationsText}
        onChange={(event) => setObservationsText(event.target.value)}
        placeholder={"Battery capacity has decreased\nCharging temperature is elevated"}
        className="mt-2 block w-full rounded-lg border border-slate-200 p-3"
      />
    </label>

    <label className="text-sm font-medium sm:col-span-2">
      Recommendations (one per line)
      <textarea
        required
        rows={3}
        value={recommendationsText}
        onChange={(event) => setRecommendationsText(event.target.value)}
        placeholder={"Monitor battery health\nAvoid excessive heating"}
        className="mt-2 block w-full rounded-lg border border-slate-200 p-3"
      />
    </label>

    <button
      type="submit"
      disabled={saving || laptops.length === 0}
      className="rounded-lg bg-[#14243a] px-5 py-3 font-semibold text-white disabled:opacity-50 sm:col-span-2"
    >
      {saving ? "Saving..." : "Save Diagnostic Report"}
    </button>
  </form>
)}


      <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Total reports",
            value: reports.length,
            color: "text-slate-900",
          },
          { label: "Low risk", value: lowRisk, color: "text-emerald-600" },
          {
            label: "Medium risk",
            value: mediumRisk,
            color: "text-amber-600",
          },
          { label: "High risk", value: highRisk, color: "text-red-600" },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className={`mt-3 text-3xl font-bold ${card.color}`}>
              {card.value}
            </p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <h2 className="text-xl font-bold text-slate-900">
          Diagnostic history
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Reports loaded from MongoDB.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reports..."
            className="min-w-0 flex-1 rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
          />

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-4 py-3 outline-none focus:border-emerald-500"
          >
            <option value="All">All risk levels</option>
            <option value="Low">Low risk</option>
            <option value="Medium">Medium risk</option>
            <option value="High">High risk</option>
            <option value="Critical">Critical risk</option>
          </select>
        </div>

        {loading && (
          <p className="py-10 text-center text-sm text-slate-500">
            Loading diagnostic reports from MongoDB...
          </p>
        )}

        {error && (
          <p className="py-10 text-center text-sm text-red-600">{error}</p>
        )}

        {!loading && !error && filteredReports.length === 0 && (
          <p className="py-10 text-center text-sm text-slate-500">
            No matching diagnostic reports found.
          </p>
        )}

        {!loading && !error && filteredReports.length > 0 && (
          <div className="mt-6 space-y-5">
            {filteredReports.map((report) => (
              <article
                key={report.id}
                className="rounded-xl border border-slate-200 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Report {report.id}
                    </p>

                    <h3 className="mt-1 text-lg font-bold text-slate-900">
                      Battery{" "}
                      {String(report.battery_id).startsWith("BAT")
                        ? report.battery_id
                        : `BAT${String(report.battery_id).padStart(3, "0")}`}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      {report.brand && report.model
                        ? `${report.brand} ${report.model}`
                        : "Laptop details unavailable"}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${riskStyle(report.risk_level)}`}
                  >
                    {report.risk_level} risk
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Diagnosis
                    </p>
                    <p className="mt-2 font-semibold text-slate-800">
                      {report.diagnosis}
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Temperature status
                    </p>
                    <p className="mt-2 font-semibold text-slate-800">
                      {report.temperature_status}
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <h4 className="font-semibold text-slate-800">
                    Observations
                  </h4>
                  {report.observations.length > 0 ? (
                    <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-600">
                      {report.observations.map((item, index) => (
                        <li key={`${report.id}-obs-${index}`}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-slate-500">
                      No observations recorded.
                    </p>
                  )}
                </div>

                <div className="mt-5">
                  <h4 className="font-semibold text-slate-800">
                    Recommendations
                  </h4>
                  {report.recommendations.length > 0 ? (
                    <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-600">
                      {report.recommendations.map((item, index) => (
                        <li key={`${report.id}-rec-${index}`}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-slate-500">
                      No recommendations recorded.
                    </p>
                  )}
                </div>

                <p className="mt-5 border-t border-slate-100 pt-4 text-xs text-slate-400">
                  Analysis date:{" "}
                  {report.analysis_date
                    ? report.analysis_date.slice(0, 10)
                    : "Not available"}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer className="mt-8 text-center text-xs text-slate-400">
        BatteryWatch · Laptop Battery Health &amp; Degradation Analysis
      </footer>
    </main>
  );
}