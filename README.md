# Minty - Personal Finance Dashboard

<div align="center">

![Minty Logo](public/placeholder-logo.svg)

**A beautiful, modern personal finance management application built with Next.js 15**

[![Next.js](https://img.shields.io/badge/Next.js-15.2.4-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

### 🎯 **Track • Analyze • Optimize Your Finances**

*Minty transforms complex financial data into beautiful, actionable insights with smooth animations and an intuitive interface.*

</div>

## Features

<table>
<tr>
<td width="50%">

### 📊 **Smart Dashboard**
- **Real-time financial overview** with key metrics
- **Interactive pie charts** with hover tooltips and smooth animations
- **Monthly trend analysis** with bar charts
- **Budget alerts** and spending notifications
- **Recent transactions** at a glance

### 💳 **Transaction Management**
- **Easy transaction entry** with smart categorization
- **Advanced filtering** and search capabilities
- **Bulk import/export** functionality
- **Date range selection** for detailed analysis
- **Category-based organization**

</td>
<td width="50%">

### **Budget & Goals**
- **Custom budget creation** with spending limits
- **Category-based budgeting** with visual progress
- **Smart alerts** when approaching limits
- **Real-time budget tracking**
- **Performance analytics** and insights

### **Beautiful UI/UX**
- **Smooth animations** and micro-interactions
- **Animated pie charts** with hover effects
- **Dark/Light mode** support
- **Responsive design** for all devices
- **Custom color themes** with friendly names
- **Accessibility-first** design principles

</td>
</tr>
</table>

## Demo & Screenshots

<div align="center">

### Dashboard Overview
![Dashboard](public/placeholder.jpg)
*Beautiful, animated dashboard with real-time insights and interactive pie charts*

### Transaction Management
![Transactions](public/placeholder.jpg)
*Intuitive transaction entry and management with smart categorization*

### Budget Tracking
![Analytics](public/placeholder.jpg)
*Comprehensive budget tracking with visual progress indicators*

</div>

## Tech Stack

<div align="center">

| Category | Technologies |
|----------|-------------|
| **Frontend** | Next.js 15, React 18, TypeScript |
| **Styling** | Tailwind CSS, shadcn/ui, Lucide Icons |
| **Database** | Supabase (PostgreSQL) |
| **Charts** | Custom CSS Animations, Recharts |
| **AI/ML** | Groq API (Financial Insights) |
| **Authentication** | Supabase Auth |
| **Deployment** | Vercel |

</div>

## Quick Start

### Prerequisites

```bash
# Node.js 15+ required
node --version  # Should be 15.0.0 or higher
npm --version   # Should be 7.0.0 or higher
```

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/RA-1020/Minty.git
cd Minty

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase and Groq API keys

# 4. Start the development server
npm run dev
```

### Environment Setup

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Groq AI Configuration
GROQ_API_KEY=your_groq_api_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Key Features Highlights

### **Complete Financial Management**
- **Transaction tracking** with automatic categorization and smart insights
- **Budget management** with real-time spending alerts and progress monitoring
- **Financial analytics** with trend analysis and spending pattern recognition
- **Multi-category organization** for comprehensive expense tracking

### 🤖 **AI-Powered Insights**
- **Intelligent transaction categorization** using machine learning
- **Spending pattern analysis** with personalized recommendations
- **Budget optimization** suggestions based on your financial behavior
- **Predictive analytics** for better financial planning

### 📊 **Advanced Analytics Dashboard**
- **Real-time financial overview** with key performance indicators
- **Interactive data visualization** for deeper insights
- **Monthly and yearly trend analysis** with comparative reporting
- **Customizable reporting** for different time periods and categories

### **Smart Notifications System**
- **Budget alerts** when approaching spending limits (80% threshold)
- **Spending reminders** for consistent transaction logging
- **Weekly financial reports** with trend analysis and insights
- **Customizable notification preferences** with browser push support

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

## Roadmap

### **Version 2.0** (Coming Soon)
- [ ] **Mobile App** (React Native)
- [ ] **Multi-user Support** with family sharing
- [ ] **Advanced Analytics** with ML insights
- [ ] **Multi-currency Support**
- [ ] **Bank Integration** via Plaid API

### **Version 1.5** (In Progress)
- [x] **Animated Dashboard** with smooth transitions
- [x] **Color-coded Categories** with friendly names
- [ ] **Theme Customization**
- [ ] **PWA Support**
- [ ] **Real-time Sync**

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**If you found Minty helpful, please give it a star! **

Made with ❤by [RA-1020](https://github.com/RA-1020) & [sohjpeg](https://github.com/sohjpeg)

[🔝 Back to Top](#-minty---personal-finance-dashboard)

</div>
