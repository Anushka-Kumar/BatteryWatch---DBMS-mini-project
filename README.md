# BatteryWatch — Laptop Battery Health & Degradation Analysis System

BatteryWatch is a DBMS mini project designed to track laptop battery health, charging sessions, battery degradation, maintenance history, and battery failure records.

## Tech Stack

- **Frontend:** Next.js, React, TypeScript
- **Database:** MySQL
- **Backend:** To be integrated

## Features

- Dashboard for battery information and health summaries
- Laptop inventory management
- Battery health monitoring
- Charging session records
- Maintenance history
- Battery failure tracking

## Database

The MySQL database is named `batterywatch`.

Tables and views include:

- `users`
- `laptops`
- `batteries`
- `battery_type`
- `health_record`
- `charging_session`
- `maintenance_record`
- `failure_record`
- `location`
- `battery_health_view`

## Getting Started

### Prerequisites

- Node.js and npm
- MySQL Server 8.0 or compatible

### Run the frontend

From the frontend project directory, install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The frontend currently uses sample data in places; database integration is a work in progress.

