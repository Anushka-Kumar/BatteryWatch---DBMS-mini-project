
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

const initialLaptops: Laptop[] = [
  {
    id: "LAP001",
    brand: "Dell",
    model: "Inspiron 15",
    os: "Windows 11",
    purchaseDate: "2024-06-12",
    battery: "BAT001",
  },
  {
    id: "LAP002",
    brand: "HP",
    model: "Pavilion 14",
    os: "Windows 11",
    purchaseDate: "2023-09-20",
    battery: "BAT002",
  },
  {
    id: "LAP003",
    brand: "Lenovo",
    model: "IdeaPad Slim 5",
    os: "Windows 11",
    purchaseDate: "2022-03-15",
    battery: "BAT003",
  },
  {
    id: "LAP004",
    brand: "ASUS",
    model: "VivoBook 15",
    os: "Windows 11",
    purchaseDate: "2025-01-08",
    battery: "BAT004",
  },
];

export default function LaptopsPage() {
  const [laptops, setLaptops] = useState<Laptop[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [brand, setBrand] = useState("Dell");
  const [model, setModel] = useState("");
  const [os, setOs] = useState("Windows 11");
  const [purchaseDate, setPurchaseDate] = useState("");
  useEffect(() => {
  async function fetchLaptops() {
    try {
      const response = await fetch("/api/laptops", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to load laptops");
      }

      const mappedLaptops: Laptop[] = result.data.map((row: {
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
          : "",
        battery: "Not assigned",
      }));

      setLaptops(mappedLaptops);
    } catch (error) {
      console.error("Failed to fetch laptops:", error);
      setLoadError("Unable to load laptops from MySQL.");
    } finally {
      setLoading(false);
    }
  }

  fetchLaptops();
}, []);

  const filteredLaptops = laptops.filter((laptop) =>
    `${laptop.id} ${laptop.brand} ${laptop.model}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  function addLaptop(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const newLaptop: Laptop = {
      id: `LAP${String(Date.now()).slice(-6)}`,
      brand,
      model: model.trim(),
      os,
      purchaseDate,
      battery: "Not assigned",
    };

    setLaptops((current) => [...current, newLaptop]);
    setModel("");
    setPurchaseDate("");
    setShowForm(false);
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
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
        >
          {showForm ? "Cancel" : "+ Add Laptop"}
        </button>
      </header>

      {showForm && (
        <form
          onSubmit={addLaptop}
          className="mt-7 grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2"
        >
          <h2 className="text-lg font-bold sm:col-span-2">
            Register a laptop
          </h2>

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

          <button
            type="submit"
            className="rounded-lg bg-[#14243a] px-5 py-3 font-semibold text-white hover:bg-slate-700 sm:col-span-2"
          >
            Save Laptop
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

          {filteredLaptops.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-500">
              No laptops match your search.
            </p>
          )}
        </div>

        <p className="mt-4 text-xs text-slate-400">
          Prototype only: changes are temporary and are not yet saved to MySQL.
        </p>
      </section>
    </main>
  );
}
