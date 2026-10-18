# SellSense - AI-Powered Restaurant Review Intelligence Platform

A premium, responsive web application that helps small restaurants, cafés, food stalls, and street food vendors understand customer opinions by analyzing reviews from Zomato, Swiggy, and Google Maps.

## Features

- **Landing Page** - Premium editorial design with smooth animations
- **Authentication** - Login and signup with demo account
- **Restaurant Setup** - Multi-step onboarding wizard with platform connections
- **Product Management** - Browse and filter food products
- **Review Analysis** - AI-powered sentiment analysis with interactive charts
- **Google Reviews** - Dedicated Google review analysis
- **Sample Database** - Pre-populated with Nelam Restaurants demo data

## Tech Stack

- **React 19** with TypeScript
- **Vite** - Fast build tool
- **React Router** - Navigation
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **Lucide React** - Icons

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Navigate to the project directory:
```bash
cd "C:\Users\AYUSH\OneDrive\Desktop\college 2nd year\sellsenns prtototype 2"
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and visit:
```
http://localhost:5173
```

## Demo Account

Use these credentials to quickly test the application:

- **Email:** demo@nelamrestaurants.com
- **Password:** demo123

Or click the "Demo Account" helper on the login page.

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Button.tsx
│   ├── MetricCard.tsx
│   ├── Navbar.tsx
│   ├── ProductCard.tsx
│   ├── SentimentBadge.tsx
│   └── Sidebar.tsx
├── pages/              # Page components
│   ├── LandingPage.tsx
│   ├── LoginPage.tsx
│   ├── SignupPage.tsx
│   ├── SetupPage.tsx
│   ├── ProductsPage.tsx
│   ├── AnalysisPage.tsx
│   └── GoogleReviewsPage.tsx
├── data/               # Sample data
│   └── sampleData.ts
├── types/              # TypeScript types
│   └── index.ts
├── utils/              # Utility functions
│   ├── analysis.ts
│   └── auth.ts
├── App.tsx            # Main app with routing
└── main.tsx           # Entry point
```

## Sample Data

The application comes with pre-populated demo data for **Nelam Restaurants** including:

- 5 food products (Paneer Tikka, Veg Biryani, Masala Dosa, Cheese Sandwich, Veg Hakka Noodles)
- 34+ sample reviews across Zomato, Swiggy, and Google
- Sentiment analysis (positive, negative, neutral)
- Review themes and patterns
- Platform-wise distribution

## User Journey

1. **Landing Page** → Explore features and benefits
2. **Sign Up / Login** → Create account or use demo credentials
3. **Restaurant Setup** → Configure business details and connect platforms (demo mode)
4. **Products Dashboard** → View all food products with sentiment indicators
5. **Product Analysis** → Deep dive into reviews, charts, and recommendations
6. **Google Reviews** → Separate analysis for Google Maps reviews

## Key Features Demonstrated

### Sentiment Analysis
- Automatic classification of reviews into positive, negative, and neutral
- Visual sentiment distribution with pie charts
- Percentage breakdowns

### Theme Detection
- Identifies frequently mentioned positive feedback (taste, freshness, portion size)
- Highlights recurring complaints (temperature, spice level, packaging)
- Representative customer quotes for each theme

### Platform Insights
- Review distribution across Zomato, Swiggy, and Google
- Platform-specific sentiment breakdowns
- Bar charts for easy comparison

### AI Recommendations
- Context-aware suggestions based on review patterns
- Actionable insights for improving food quality and service
- Prioritized by impact and frequency

### Responsive Design
- Works on desktop, tablet, and mobile devices
- Adaptive layouts and touch-friendly interactions
- Smooth animations with reduced-motion support

## Design System

### Colors
- Warm Stone: `#F3EFEA` (Primary background)
- Light Beige: `#E8E2D9` (Secondary background)
- Deep Charcoal: `#111111` (Main text)
- Muted Gray: `#77716A` (Secondary text)
- Border Beige: `#D4CEC5` (Borders)

### Typography
- **Sans-serif:** Inter (body, UI elements)
- **Serif:** Playfair Display (large headings)

### Interactions
- Smooth hover effects with scale transforms
- Fade-in animations on scroll
- Active state feedback on buttons
- Loading states for async operations

## Build for Production

```bash
npm run build
```

The production-ready files will be in the `dist/` directory.

## Notes

- This is a **prototype** with simulated data
- Platform connections use demo mode (no real API integration)
- Authentication is client-side only (not production-ready)
- All data is stored in localStorage
- Google Business Profile API integration would require proper authorization in production
- Review sentiment and themes are pre-labeled for demonstration

## Future Enhancements

- Real backend API integration
- Actual Zomato, Swiggy, and Google Business Profile API connections
- Advanced NLP for automatic sentiment analysis
- User management and multi-restaurant support
- Export reports as PDF
- Email alerts for negative review patterns
- Review response suggestions
- Competitor benchmarking

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This is a prototype project for demonstration purposes.

---

Built with ❤️ using React, TypeScript, and Tailwind CSS
