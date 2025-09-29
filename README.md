# 🎯 AI Talent - Intelligent CV & Job Matching Platform

> A comprehensive AI-powered talent management platform that revolutionizes how organizations discover, analyze, and match candidates with job opportunities through advanced artificial intelligence.

[![Tech Stack](https://img.shields.io/badge/Tech-React%20%7C%20TypeScript%20%7C%20Firebase%20%7C%20OpenAI-blue?style=flat-square)](https://github.com/Tech9Apps/ai-talent)
[![Firebase](https://img.shields.io/badge/Backend-Firebase%20Functions-orange?style=flat-square)](https://firebase.google.com/)
[![AI Powered](https://img.shields.io/badge/AI-OpenAI%20GPT--4o--mini-green?style=flat-square)](https://openai.com/)

---

## 🚀 Overview

AI Talent is a modern web application that leverages artificial intelligence to streamline the recruitment process. It provides intelligent CV analysis, job description processing, bidirectional matching, and real-time chat capabilities for an enhanced talent management experience.

### ✨ Key Features

- 🔐 **Google Authentication** - Secure login with Google OAuth
- 📁 **File Upload & Processing** - Support for PDF and DOCX files
- 🤖 **AI-Powered Analysis** - Intelligent parsing using OpenAI GPT-4o-mini
- 🎯 **Bidirectional Matching** - CVs match jobs AND jobs match CVs
- 💬 **Interactive Chatbot** - Ask specific questions about uploaded files
- 📊 **Analytics Dashboard** - Comprehensive data grid views and charts
- 🔔 **Real-Time Notifications** - Instant match alerts and updates
- 📱 **Responsive Design** - Modern Material-UI interface

---

## 🏗️ Tech Stack

### Frontend
- **React 19** - Modern React with hooks and context
- **TypeScript** - Type-safe development
- **Material-UI v7** - Modern component library with theming
- **Vite** - Fast build tool and dev server
- **React Router** - Client-side routing
- **React-Typed** - Animated typing effects

### Backend
- **Firebase Functions** - Serverless cloud functions
- **Firebase Firestore** - NoSQL database
- **Firebase Storage** - File storage service
- **Firebase Authentication** - User management

### AI & Processing
- **OpenAI GPT-4o-mini** - Advanced text analysis and matching
- **Mammoth.js** - DOCX file processing
- **PDF-Parse** - PDF text extraction

### DevOps & Deployment
- **ESLint** - Code linting and formatting
- **TypeScript Compiler** - Type checking
- **Firebase CLI** - Deployment and management

---

## 🎨 Architecture & Best Practices

### 📁 Project Structure

```
ai-talent/
├── src/                          # Frontend React application
│   ├── components/               # Reusable UI components
│   │   ├── Auth/                # Authentication components
│   │   ├── Charts/              # Data visualization
│   │   ├── Dashboard/           # Main dashboard
│   │   ├── FileUpload/          # File upload interface
│   │   ├── Header/              # Navigation header
│   │   └── SideNav/             # Notification sidebar
│   ├── contexts/                # React contexts (Auth, Theme)
│   ├── pages/                   # Page components
│   ├── utils/                   # Frontend utilities
│   └── types/                   # TypeScript type definitions
├── functions/                    # Firebase Functions backend
│   ├── src/
│   │   ├── functions/           # Cloud functions
│   │   │   ├── ai/             # AI processing functions
│   │   │   ├── file/           # File management
│   │   │   └── matching/       # Job matching logic
│   │   ├── services/           # Business logic services
│   │   ├── middleware/         # Authentication middleware
│   │   └── utils/              # Backend utilities
│   └── lib/                    # Compiled JavaScript output
├── shared/                      # Shared types and utilities
└── public/                      # Static assets
```

### 🛡️ Security & Best Practices

- **Authentication Middleware** - All functions protected with Firebase Auth
- **Type Safety** - Comprehensive TypeScript interfaces
- **Error Handling** - Structured error reporting and logging
- **Rate Limiting** - Cloud function concurrent execution limits
- **Data Validation** - Input sanitization and validation
- **CORS Configuration** - Proper cross-origin resource sharing

### 📊 Database Schema

**Users Collection**
- User profiles and authentication data
- File ownership and permissions

**Files Subcollection**
- Document metadata and storage paths
- Processing status and timestamps

**CV/Job Analysis Collections**
- AI-extracted data and insights
- Searchable skills and requirements

**Notifications Collection**
- Real-time match alerts
- User notification preferences

---

## 🔥 Core Features Deep Dive

### 🔐 1. Authentication System
- **Google OAuth Integration** - Seamless login experience
- **Protected Routes** - Secure access to user data
- **Context Management** - Global authentication state
- **Session Persistence** - Automatic login restoration

### 📁 2. File Upload & Processing
```typescript
// Supported formats: PDF, DOCX
const uploadFile = async (file: File, type: 'cv' | 'jobDescription') => {
  // Automatic file validation, upload, and AI processing
}
```

**Features:**
- Drag & drop interface
- File type validation
- Progress tracking
- Automatic AI analysis
- Error handling with user feedback

### 🤖 3. AI-Powered Analysis

**CV Analysis Extracts:**
- Personal information and contact details
- Skills and technical competencies
- Work experience and career progression
- Education and certifications
- Language proficiencies

**Job Description Analysis Extracts:**
- Role requirements and responsibilities
- Required skills and qualifications
- Experience level expectations
- Company information and benefits
- Location and employment type

### 🎯 4. Bidirectional Matching System

**CV → Job Matching:**
- When a CV is uploaded, system finds matching job opportunities
- Analyzes skill compatibility and experience alignment
- Generates match scores (0-100%) with detailed reasoning

**Job → CV Matching:**
- When a job is posted, system searches all CVs for suitable candidates
- Cross-user matching with privacy protection
- Automatic candidate recommendations

```typescript
// Matching algorithm considers:
- Skill overlap and relevance
- Experience level compatibility
- Location preferences
- Role requirements alignment
- Career progression fit
```

### 💬 5. Interactive AI Chatbot

**Capabilities:**
- Answer specific questions about uploaded files
- Provide improvement suggestions for CVs
- Compare candidates against job requirements
- Offer career advice and skill gap analysis
- Context-aware responses with job market data

**Example Interactions:**
- "What are the main skills mentioned in this CV?"
- "How can this resume be improved?"
- "Does this candidate fit our JavaScript developer role?"
- "What skills are missing for this position?"

### 📊 6. Analytics Dashboard

**Data Grid Features:**
- Sortable and filterable CV/Job listings
- Advanced search capabilities
- Export functionality
- Bulk operations
- Real-time data updates

**Chart Visualizations:**
- Match score distributions
- Skill frequency analysis
- Upload trends and statistics
- User activity metrics

### 🔔 7. Real-Time Notification System

**Notification Types:**
- New job matches for CV owners
- Candidate recommendations for recruiters
- File processing completion alerts
- System updates and announcements

**Features:**
- Real-time updates using Firestore listeners
- Customizable notification preferences
- Mark as read/unread functionality
- Notification history and management

---

## 🚀 Getting Started

### Prerequisites
- Node.js 22+
- Firebase CLI
- OpenAI API key

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Tech9Apps/ai-talent.git
cd ai-talent
```

2. **Install frontend dependencies**
```bash
npm install
```

3. **Install backend dependencies**
```bash
cd functions
npm install
cd ..
```

4. **Configure environment variables**
```bash
# Frontend (.env)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Functions environment
firebase functions:config:set openai.api_key="your_openai_key"
```

5. **Start development servers**
```bash
# Frontend
npm run dev

# Backend functions
cd functions
npm run serve
```

### Deployment

```bash
# Build and deploy frontend
npm run build
firebase deploy --only hosting

# Deploy backend functions
cd functions
npm run deploy
```

---

## 🔧 Configuration

### Firebase Setup
1. Create a new Firebase project
2. Enable Authentication (Google provider)
3. Set up Firestore database
4. Configure Storage bucket
5. Enable Functions

### OpenAI Integration
1. Obtain OpenAI API key
2. Configure rate limits and model selection
3. Set up usage monitoring

---

## 📈 Performance & Scalability

- **Optimized Bundle Size** - Code splitting and lazy loading
- **Efficient State Management** - React contexts and hooks
- **Caching Strategy** - Firestore offline persistence
- **Function Optimization** - Cold start mitigation
- **Resource Management** - Automatic cleanup and limits

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- OpenAI for providing advanced AI capabilities
- Firebase for robust cloud infrastructure
- Material-UI for beautiful component library
- React team for the excellent framework

---

## 📞 Support

For support, email support@tech9apps.com or create an issue in this repository.

---

<div align="center">

**Made with ❤️ by [Tech9Apps](https://github.com/Tech9Apps)**

[🌐 Website](https://tech9apps.com) • [📧 Email](mailto:contact@tech9apps.com) • [🐦 Twitter](https://twitter.com/tech9apps)

</div>
