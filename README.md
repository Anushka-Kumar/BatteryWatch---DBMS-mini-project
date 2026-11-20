# BatteryWatch — Laptop Battery Health & Degradation Analysis System

BatteryWatch is a DBMS mini-project designed to monitor and manage laptop battery health, charging behaviour, degradation, maintenance history, and battery failures. It provides a web-based interface for managing laptop and battery records, tracking charging sessions, maintaining service history, and generating diagnostic reports.

## Tech Stack

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes (REST API)
- **Relational Database:** MySQL
- **NoSQL Database:** MongoDB
- **Authentication:** Session-based authentication with role-based access control

## Features

- Dashboard with battery health and system summaries
- Laptop inventory management
- Battery information and health tracking
- Charging session management
- Maintenance records with status tracking
- Failure records with resolution tracking
- Diagnostic reports stored in MongoDB
- Search and filtering
- CRUD operations (Create, Read, Update, Delete)
- Role-based access for administrators and regular users

## Database

### MySQL Database

Database name: `BatteryWatch`

Tables:

- `users`
- `laptops`
- `batteries`
- `battery_type`
- `health_record`
- `charging_session`
- `maintenance_record`
- `failure_record`
- `location`

View:

- `battery_health_view`

### MongoDB

Database name: `BatteryWatch_NoSQL`

Collection:

- `diagnostic_reports`

MongoDB is used to store battery diagnostic reports containing diagnosis details, observations, temperature status, recommendations, analysis date, and risk level.

## Project Execution Flow

The application follows a client-server architecture using Next.js. The frontend interacts with server-side API routes, which handle authentication, validation, database operations, and authorization.

### 1. Application Startup

1. MySQL Server is started.
2. MongoDB connection is made available to the application.
3. The Next.js development server is started using `npm run dev`.
4. The application is accessed through `http://localhost:3000`.

### 2. Authentication Flow

1. The user opens the application and navigates to the login page.
2. Credentials are submitted to the authentication API.
3. The server validates the credentials against the MySQL `users` table.
4. Upon successful authentication, a session is established.
5. Protected pages and API endpoints use authentication checks to determine access.
6. Access permissions are determined based on the user's role (`admin` or `user`).

### 3. Frontend Execution Flow

The frontend is implemented using Next.js pages and React components.

- Pages inside the `app/` directory render the application's user interface.
- React state manages form inputs, filters, search queries, and displayed records.
- When a user performs an action (such as adding or editing a record), the frontend sends a request to the corresponding API route.
- API responses are used to update the UI.
- Data is fetched again or refreshed when required.

### 4. API Execution Flow

Next.js API routes act as the server-side layer between the frontend and the databases.

For each request:

1. The API receives the request from the frontend.
2. Authentication is checked using the session utilities.
3. Role and ownership permissions are verified.
4. Input data is validated.
5. The relevant database query or operation is executed.
6. The API returns a JSON response to the frontend.
7. The frontend updates the displayed information based on the response.

### 5. Database Execution Flow

**MySQL** stores structured and relational data such as users, laptops, batteries, charging sessions, maintenance records, failure records, and battery health records.

**MongoDB** stores diagnostic report documents, including observations and recommendations.

The application uses API routes to communicate with both databases rather than accessing the databases directly from the browser.

## CRUD Operations

| Module | Create | Read | Update | Delete |
|---|---|---|---|---|
| Laptops | Yes | Yes | Yes | Yes |
| Charging Sessions | Yes | Yes | Yes | Yes |
| Maintenance Records | Yes | Yes | Yes | Yes |
| Failure Records | Yes | Yes | Yes | Yes |
| Diagnostic Reports | Yes | Yes | Yes | Yes* |

\* Diagnostic report creation is restricted to administrators. Editing and deletion are subject to ownership and authorization checks.

## Role-Based Access Control

### Administrator

- View system-wide records
- Manage laptops and their battery information
- Manage charging sessions
- Manage maintenance records
- Manage and resolve failure records
- Create diagnostic reports
- Edit and delete permitted records
- Manage users through administrator functionality

### Normal User

- View their own data
- Register and manage their own laptops
- Manage their own charging sessions
- Manage their own maintenance records
- Create and manage their own failure records, subject to permissions
- View their own diagnostic reports
- Edit and delete records they are authorized to manage

Authorization checks are enforced server-side through API routes.

## Getting Started

### Prerequisites

- Node.js
- npm
- MySQL Server 8.0 or compatible
- MongoDB Server or MongoDB Atlas

### 1. Clone the repository

```bash
git clone https://github.com/Anushka-Kumar/BatteryWatch---DBMS-mini-project.git
cd BatteryWatch---DBMS-mini-project
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root and configure the database connection credentials and required environment variables.

Do not commit `.env` or expose database credentials.

### 4. Start the databases

Ensure MySQL and MongoDB are running and that the required databases and tables have been created.

### 5. Start the development server

```bash
npm run dev
```

### 6. Open the application

Navigate to:

[http://localhost:3000](http://localhost:3000)

## Application Workflow

```text
User
 │
 ▼
Next.js Frontend (React Pages)
 │
 ▼
Frontend Form / User Action
 │
 ▼
Next.js API Route
 │
 ▼
Authentication & Authorization
 │
 ▼
Input Validation
 │
 ├───────────────┐
 ▼               ▼
MySQL          MongoDB
 │               │
 ▼               ▼
Structured      Diagnostic
Records         Reports
 │               │
 └───────┬───────┘
         ▼
    JSON Response
         │
         ▼
    Frontend Update
```

## Future Improvements

- Automated battery degradation prediction
- More detailed analytics and visualization
- Improved diagnostic automation
- Exportable reports
- Notifications for battery maintenance and health deterioration
- Additional battery performance metrics

## Contributors
Anisha Nukul Niranjan - PES1UG24CS064
Anushka P - PES1UG24CS075
