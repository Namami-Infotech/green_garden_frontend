# Society Management System - Frontend Web App

Standalone Next.js App Router application with **TypeScript and Vanilla CSS Design System**.

## 🏗️ Architecture

Module-Based Architecture:
```text
src/
├── modules/
│   ├── auth/          # Login form & auth services
│   ├── users/         # Resident directory, tables & modals
│   ├── blocks/        # Tower cards, forms & grid views
│   ├── flats/         # Flat inventory & unit allocations
│   └── settings/      # Society bylaws & configuration forms
├── app/               # Next.js App Router pages
│   ├── login/
│   ├── dashboard/
│   ├── users/
│   ├── blocks/
│   ├── flats/
│   └── settings/
├── components/        # Shell, Sidebar, Header, Modal
├── hooks/             # useAuth hook & context
├── lib/               # Typed API client
└── utils/             # Formatters & utilities
```

## 🚀 Getting Started

### 1. Environment
```bash
cp .env.local.example .env.local
```

### 2. Install & Run
```bash
npm install
npm run dev
```

The frontend runs at `http://localhost:3000`.
