# Wassel Admin Dashboard

A modern, production-oriented **admin dashboard for the Wassel marketplace platform**, built with **Next.js, TypeScript, React, Tailwind CSS, and modern state/data management tools**.

The dashboard provides administrators with a centralized interface to monitor and manage marketplace operations, users, orders, deliveries, services, and real-time activity.

> **Live Demo:** https://web-admin-wassel.vercel.app

---

## 📌 Overview

**Wassel Admin** is the administrative web application of the Wassel platform.

The project was designed with a focus on:

- Clean and scalable architecture
- Responsive and accessible UI
- Real-time data updates
- Efficient server-state management
- Strong form validation
- Reusable components
- Type-safe development
- Production deployment

The application is built to support the operational needs of a marketplace platform where administrators need to monitor users, orders, sellers, drivers, service providers, and other platform activities from a single dashboard.

---

## ✨ Key Features

### 📊 Dashboard & Analytics

- Overview of platform activity
- Interactive statistics and charts
- Data visualization with Recharts
- Real-time information updates
- Operational metrics and summaries

### 👥 User Management

- Manage platform users
- View user information
- Manage different user roles
- Administrative actions
- Role-based workflows

### 📦 Order Management

- Monitor marketplace orders
- Track order status
- Manage order-related operations
- Support for multi-stage delivery workflows
- Real-time order updates

### 🚚 Delivery Management

The dashboard supports the platform's two-phase delivery workflow:

**Phase 1 — Seller → Driver**

- Seller prepares the order
- Driver picks up the order
- Pickup confirmation

**Phase 2 — Driver → Client**

- Driver proceeds to the client
- Client location tracking
- Delivery confirmation
- Order completion

### 🔔 Real-Time Communication

Real-time functionality is implemented using **Socket.io** for:

- Live notifications
- Real-time order updates
- Delivery status changes
- Operational events
- Instant dashboard synchronization

### 📝 Forms & Validation

Forms are built using:

- React Hook Form
- Zod
- TypeScript

This provides consistent validation and type-safe form handling across the application.

### 🌙 Dark Mode

- Light and dark themes
- Persistent user preference
- System theme support
- Consistent styling across the dashboard

### 📱 Responsive Design

The interface is designed to work across different screen sizes, with a focus on desktop and tablet administrative workflows.

---

# 🏗️ Architecture

The project follows a modular architecture designed to keep UI, state, API communication, validation, and reusable utilities separated.

```text
web-admin-wassel/
│
├── app/
│   ├── layout.tsx
│   └── page.tsx
│
├── components/
│   ├── ui/
│   ├── forms/
│   ├── dashboard/
│   └── ...
│
├── hooks/
│
├── lib/
│   ├── api.ts
│   ├── validation.ts
│   └── utils.ts
│
├── store/
│
├── types/
│
├── public/
│
├── styles/
│
├── package.json
├── tsconfig.json
└── README.md
```

---

# 🧩 Architecture Layers

## 1. Presentation Layer

The UI is built using reusable components and modern design patterns.

### Technologies

- React
- Next.js App Router
- Tailwind CSS
- shadcn/ui
- Radix UI
- Lucide React

The component structure allows common UI elements to be reused across different dashboard sections.

---

## 2. State Management

The application separates **client state** from **server state**.

### Zustand

Used for lightweight global client-side state such as:

- UI preferences
- Authentication-related state
- Application-level state

### TanStack Query

Used for server-state management including:

- Data fetching
- Caching
- Synchronization
- Loading states
- Error handling
- Query invalidation

This separation helps keep the application predictable and maintainable.

---

## 3. API Layer

API communication is centralized through an Axios-based client.

Responsibilities include:

- HTTP requests
- Authentication handling
- Error handling
- Request configuration
- Response processing

Example:

```typescript
import axios from "axios";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});
```

---

## 4. Real-Time Layer

Real-time communication is handled using Socket.io.

```typescript
import { io } from "socket.io-client";

const socket = io(process.env.NEXT_PUBLIC_API_URL, {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
});
```

This allows the dashboard to react to platform events without requiring constant manual page refreshes.

---

## 5. Validation & Type Safety

The project uses both compile-time and runtime validation.

### TypeScript

Used throughout the application to provide:

- Strong typing
- Safer refactoring
- Better developer experience
- Clear API and component contracts

### Zod

Used for runtime validation of user input and structured data.

Example:

```typescript
import { z } from "zod";

const userSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
});

type User = z.infer<typeof userSchema>;
```

---

# 🛠️ Technology Stack

| Category         | Technology      |
| ---------------- | --------------- |
| Framework        | Next.js 16      |
| UI               | React 19        |
| Language         | TypeScript      |
| Styling          | Tailwind CSS    |
| Components       | shadcn/ui       |
| UI Primitives    | Radix UI        |
| State Management | Zustand         |
| Server State     | TanStack Query  |
| HTTP Client      | Axios           |
| Real-Time        | Socket.io       |
| Forms            | React Hook Form |
| Validation       | Zod             |
| Charts           | Recharts        |
| Icons            | Lucide React    |
| Notifications    | Sonner          |
| Theme            | next-themes     |
| Deployment       | Vercel          |

---

# 💼 Project Highlights

This project demonstrates practical experience building a modern administrative application rather than a simple static dashboard.

### Key engineering areas

- Modern Next.js architecture
- Type-safe React development
- Reusable component design
- Server-state management
- Real-time application updates
- Form architecture and validation
- Responsive UI development
- Dashboard data visualization
- Authentication-aware application flows
- API integration
- Production deployment

---

# 🎨 UI & UX

The dashboard focuses on providing administrators with a clean and efficient interface.

### Design principles

- Clear information hierarchy
- Reusable UI components
- Consistent spacing and typography
- Responsive layouts
- Accessible interactive components
- Light and dark themes
- Clear loading and error states
- Toast notifications for user feedback

---

# 📈 Performance

The application takes advantage of Next.js and modern React patterns to improve performance and maintainability.

### Implemented practices

- Route-based code splitting
- Optimized React components
- Server-state caching with TanStack Query
- Reusable components
- Tree-shaking through the modern build pipeline
- Optimized static assets
- Efficient API data synchronization

---

# 🔐 Security Considerations

Security is considered throughout the application architecture.

The project uses:

- Environment variables for configuration
- TypeScript for stronger application contracts
- Zod for runtime input validation
- React's default output escaping
- Authentication-aware API communication
- Separation of public and private configuration

> **Important:** Production secrets, API keys, tokens, database credentials, and private environment variables should never be committed to the repository.

---

# 🚀 Getting Started

## Prerequisites

Make sure you have installed:

- Node.js 18+
- npm, yarn, pnpm, or Bun

---

## Installation

Clone the repository:

```bash
git clone https://github.com/oussamatght/web-admin-wassel.git

cd web-admin-wassel
```

Install dependencies:

```bash
npm install
```

---

## Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
NEXT_PUBLIC_APP_NAME=Wassel Admin
```

> Never commit `.env.local` or other files containing secrets.

---

## Run Development Server

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

---

# 📜 Available Scripts

```bash
npm run dev
```

Start the development server.

```bash
npm run build
```

Create a production build.

```bash
npm start
```

Start the production server.

```bash
npm run lint
```

Run ESLint checks.

---

# 🌐 Deployment

The application is deployed using **Vercel**.

Typical deployment workflow:

```text
GitHub
   ↓
Vercel
   ↓
Production Build
   ↓
Live Dashboard
```

Production environment variables are configured through the deployment platform rather than committed to the repository.

---

# 📸 Screenshots

> Add screenshots of the main dashboard here.

Recommended screenshots:

1. Dashboard overview
2. Users management
3. Orders management
4. Delivery tracking
5. Analytics
6. Dark mode
7. Responsive layout

Example:

```md
![Dashboard Overview](./public/screenshots/dashboard.png)

![Orders Management](./public/screenshots/orders.png)

![Analytics](./public/screenshots/analytics.png)
```

---

# 🔗 Links

**Live Application**

https://web-admin-wassel.vercel.app

**GitHub Repository**

https://github.com/oussamatght/web-admin-wassel

---

# 👨‍💻 Developer

## Oussama Taright

**Full-Stack Web Developer**

Specialized in building modern web applications using technologies such as:

- React
- Next.js
- TypeScript
- Node.js
- Express
- MongoDB
- PostgreSQL
- REST APIs
- Tailwind CSS

For freelance projects and collaboration, feel free to connect through GitHub.

**GitHub:**
https://github.com/oussamatght

---

# 🤝 Contributing

This repository is primarily maintained as a portfolio and project showcase.

If you would like to suggest an improvement, feel free to open an issue or submit a pull request.

---

# 📄 License

This project is private and proprietary.

All rights reserved.

The source code is publicly available for portfolio and demonstration purposes. Reuse, redistribution, or commercial use is not permitted without explicit permission from the author.

---

# 🙏 Acknowledgments

Built using and inspired by the following technologies and open-source projects:

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Radix UI
- TanStack Query
- Zustand
- Socket.io
- React Hook Form
- Zod
- Recharts
- Lucide

---

<p align="center">
  Built with ❤️ by <strong>Oussama Taright</strong>
</p>
