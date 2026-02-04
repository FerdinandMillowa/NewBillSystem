# 🍻 Pitch & Roll Bar Management System

A comprehensive, full-stack bar management system designed specifically for small and medium bar/restaurant operations with customer billing, inventory tracking, and comprehensive analytics.

![Version](https://img.shields.io/badge/version-5.0.0-blue)
![Status](https://img.shields.io/badge/status-Production%20Ready-brightgreen)
![License](https://img.shields.io/badge/license-Proprietary-orange)

## ✨ Features

### 🏗️ Core Modules
- **Customer Billing & Credit Management** - Track customer bills, payments, and outstanding balances
- **Daily Operations Tracking** - Complete inventory, revenue, and expense management
- **Products & Categories** - Full product catalog with price history and stock tracking
- **User Management** - Role-based access control (Admin/User)
- **Comprehensive Analytics** - Dual reporting for billing and operations
- **Activity Logging** - Complete audit trail for all system actions
- **Bottle-to-Shot Conversion** - Advanced inventory conversion system

### 🔥 Key Features (v5.0)
- ✅ **Read-Only Opening Stock** - Prevents data entry errors, automatically set from product stock
- ✅ **Stock Purchases Separation** - Financial tracking independent from expenses
- ✅ **Enhanced Reports** - Accurate revenue trend graphs and separated analytics
- ✅ **Deterministic Date Handling** - Consistent results across timezones
- ✅ **Bottle-to-Shot Conversion** - Comprehensive validation and tracking

## 🛠️ Tech Stack

### Backend
- **Framework**: NestJS + TypeScript
- **Database**: PostgreSQL (Supabase)
- **ORM**: TypeORM
- **Authentication**: JWT with Refresh Tokens
- **Rate Limiting**: @nestjs/throttler

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **State Management**: React Query (TanStack Query v5)
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod Validation
- **Charts**: Recharts

### Deployment
- **Backend**: Railway/Render
- **Frontend**: Vercel
- **Database**: Supabase

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- PostgreSQL database (Supabase recommended)
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/pitch-roll-bar-system.git
cd pitch-roll-bar-system
