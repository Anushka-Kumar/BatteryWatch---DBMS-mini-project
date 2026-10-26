"use client";

import { useEffect, useState } from "react";

type Laptop = {
  id: string;
  brand: string;
  model: string;
  os: string;
  purchaseDate: string;
  battery: string;
};

export default function LaptopsPage() {
  const [laptops, setLaptops] = useState<Laptop[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [brand, setBrand] = useState("Dell");
  const [model, setModel] = useState("");
  const [os, setOs] = useState("Windows 11");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [serialNo, setSerialNo] = useState("");
  const [userId, setUserId] = useState("");

  async function fetchLaptops() {
    try {
      setLoadError("");

      const response = await fetch("/api/laptops", {
        cache: "no-store",
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to load laptops.");
      }

      const mappedLaptops: Laptop[] = result.data.map(
        (row: {
          laptop_id: number;
          brand: string;
          model: string;
          os: string;
          purchase_date: string | null;
        }) => ({
          id: `LAP${String(row.laptop_id).padStart(3, "0")}`,
          brand: row.brand,
          model: row.model,
          os: row.os,
          purchaseDate: row.purchase_date
            ? String(row.purchase_date).slice(0, 10)
            : "—",
          battery: "Not assigned",
        })
      );

      setLaptops(mappedLaptops);
    } catch (error) {
      console.error("Failed to fetch laptops:", error);
      setLoadError(
        error instanceof Error
          ? error.message
          : "Unable to load laptops from MySQL."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLaptops();
  }, []);

  const filteredLaptops = laptops.filter((laptop) =>
    `${laptop.id} ${laptop.brand} ${laptop.model}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  async function addLaptop(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setSaving(true);

    try {
      const response = await fetch("/api/laptops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: Number(userId),
          brand,
          model: model.trim(),
          os,
          purchase_date: purchaseDate,
          serial_no: serialNo.trim() || null,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to save laptop.");
      }

      setMessage("Laptop saved successfully to MySQL!");
      setModel("");
      setPurchaseDate("");
      setSerialNo("");
      setUserId("");
      setShowForm(false);

      await fetchLaptops();
    } catch (error) {
      console.error("Save laptop error:", error);
      setMessage(
        error instanceof Error ? error.message : "Unable to save laptop."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-5 text-slate-800 md:p-10">
      <a
        href="/"
        className="text-sm font-medium text-emerald-700 hover:underline"
      >
        ← Back to Dashboard
      </a>

      <header className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">
            BatteryWatch / Inventory
          </p>
          <h1 className="mt-2 text-3xl font-bold">Laptops</h1>
          <p className="mt-2 text-sm text-slate-500">
            Manage registered laptops and their details.
          </p>
        </div>

        <button
          onClick={() => {
            setMessage("");
            setShowForm(!showForm);
          }}
          className="rounded-lg bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
        >
          {showForm ? "Cancel" : "+ Add Laptop"}
        </button>
      </header>

      {message && (
        <div className="mt-5 rounded-lg border border-slate-200 bg-white p-4 text-sm">
          {message}
        </div>
      )}

      {loadError && (
        <div className="mt-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {loadError}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={addLaptop}
          className="mt-7 grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2"
        >
          <h2 className="text-lg font-bold sm:col-span-2">
            Register a laptop
          </h2>

          <label className="text-sm font-medium">
            User ID
            <input
              required
              type="number"
              min="1"
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              placeholder="Enter an existing MySQL user ID"
              className="mt-2 block w-full rounded-lg border border-slate-200 p-3"
            />
            <span className="mt-1 block text-xs text-slate-500">
              Use an existing user_id from your users table.
            </span>
          </label>

          <label className="text-sm font-medium">
            Brand
            <select
              value={brand}
              onChange={(event) => setBrand(event.target.value)}
              className="mt-2 block w-full rounded-lg border border-slate-200 p-3"
            >
              <option>Dell</option>
              <option>HP</option>
              <option>Lenovo</option>
              <option>ASUS</option>
              <option>Acer</option>
              <option>Apple</option>
              <option>Other</option>
            </select>
          </label>

          <label className="text-sm font-medium">
            Model
            <input
              required
              value={model}
              onChange={(event) => setModel(event.target.value)}
              placeholder="e.g. Inspiron 15"
              className="mt-2 block w-full rounded-lg border border-slate-200 p-3"
            />
          </label>

          <label className="text-sm font-medium">
            Operating system
            <select
              value={os}
              onChange={(event) => setOs(event.target.value)}
              className="mt-2 block w-full rounded-lg border border-slate-200 p-3"
            >
              <option>Windows 11</option>
              <option>Windows 10</option>
              <option>macOS</option>
              <option>Linux</option>
              <option>Other</option>
            </select>
          </label>

          <label className="text-sm font-medium">
            Purchase date
            <input
              required
              type="date"
              value={purchaseDate}
              onChange={(event) => setPurchaseDate(event.target.value)}
              className="mt-2 block w-full rounded-lg border border-slate-200 p-3"
            />
          </label>

          <label className="text-sm font-medium sm:col-span-2">
            Serial number (optional)
            <input
              value={serialNo}
              onChange={(event) => setSerialNo(event.target.value)}
              placeholder="Enter the laptop serial number"
              className="mt-2 block w-full rounded-lg border border-slate-200 p-3"
            />
          </label>

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[#14243a] px-5 py-3 font-semibold text-white hover:bg-slate-700 disabled:opacity-60 sm:col-span-2"
          >
            {saving ? "Saving..." : "Save Laptop"}
          </button>
        </form>
      )}

      <section className="mt-7 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Total laptops</p>
          <p className="mt-2 text-3xl font-bold">{laptops.length}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Different brands</p>
          <p className="mt-2 text-3xl font-bold">
            {new Set(laptops.map((laptop) => laptop.brand)).size}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Assigned batteries</p>
          <p className="mt-2 text-3xl font-bold">
            {
              laptops.filter(
                (laptop) => laptop.battery !== "Not assigned"
              ).length
            }
          </p>
        </div>
      </section>

      <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
        <h2 className="text-lg font-bold">Laptop inventory</h2>
        <p className="mt-1 text-sm text-slate-500">
          Search and review registered devices.
        </p>

        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by ID, brand, or model..."
          className="mt-5 w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-emerald-500"
        />

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                <th className="p-4">Laptop ID</th>
                <th className="p-4">Brand</th>
                <th className="p-4">Model</th>
                <th className="p-4">Operating system</th>
                <th className="p-4">Purchase date</th>
                <th className="p-4">Battery ID</th>
              </tr>
            </thead>
            <tbody>
              {filteredLaptops.map((laptop) => (
                <tr key={laptop.id} className="border-b border-slate-100">
                  <td className="p-4 font-semibold">{laptop.id}</td>
                  <td className="p-4">{laptop.brand}</td>
                  <td className="p-4">{laptop.model}</td>
                  <td className="p-4">{laptop.os}</td>
                  <td className="p-4">{laptop.purchaseDate}</td>
                  <td className="p-4">{laptop.battery}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {loading && (
            <p className="py-8 text-center text-sm text-slate-500">
              Loading laptops from MySQL...
            </p>
          )}

          {!loading && filteredLaptops.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-500">
              No laptops match your search.
            </p>
          )}
        </div>

        <p className="mt-4 text-xs text-slate-400">
          Laptop records are loaded from MySQL. New laptops are saved through
          the backend API.
        </p>
      </section>
    </main>
  );
}
