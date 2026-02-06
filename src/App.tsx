import React, { useState, useEffect } from 'react';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { FoodProvider } from '@/contexts/FoodContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ExcelDataContext } from '@contexts/ExcelDataContext';
import Index from './pages/Index';
import ManagementDashboard from './components/ManagementDashboard';
import LoginSection from './components/LoginSection';
import StudentDashboard from './components/StudentDashboard'; // Add import for StudentDashboard
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-center">
          <h1 className="text-2xl font-bold text-red-600">Something went wrong</h1>
          <p className="mt-2">{this.state.error?.message || 'An unexpected error occurred.'}</p>
          <button
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const App = () => {
  const [excelData, setExcelData] = useState([]);

  useEffect(() => {
    const savedUser = localStorage.getItem('hostel_user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      console.log('App: Loaded user from localStorage:', userData);
      const storedExcelData = localStorage.getItem(`excelData_${userData.username}`);
      if (storedExcelData) {
        try {
          const parsedData = JSON.parse(storedExcelData);
          console.log('App: Loaded excelData from localStorage:', parsedData);
          setExcelData(parsedData);
        } catch (e) {
          console.error('App: Failed to parse excelData from localStorage:', e);
        }
      } else {
        console.log('App: No excelData found in localStorage for username:', userData.username);
      }
    } else {
      console.log('App: No user found in localStorage');
    }
    // Clear stale studentDashboardActiveTab to ensure fresh login defaults to food-menu
    if (savedUser && JSON.parse(savedUser).role === 'student') {
      localStorage.setItem('studentDashboardActiveTab', 'food-menu');
    }
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <FoodProvider>
            <TooltipProvider>
              <ExcelDataContext.Provider value={excelData}>
                <Toaster />
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/management" element={<ManagementDashboard />} />
                  <Route path="/login" element={<LoginSection />} />
                  <Route
                    path="/food-menu"
                    element={<StudentDashboardWrapper />}
                  />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </ExcelDataContext.Provider>
            </TooltipProvider>
          </FoodProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

// Wrapper component to pass AuthContext props to StudentDashboard
const StudentDashboardWrapper = () => {
  const { user, logout } = useAuth();
  const updateUserInfo = (userInfo) => {
    console.log('App: Updating user info:', userInfo);
    // Add logic to update user info if needed, e.g., updating localStorage or context
  };

  return (
    <StudentDashboard
      userInfo={user ? { email: user.email, role: user.displayName } : {}}
      onLogout={logout}
      updateUserInfo={updateUserInfo}
    />
  );
};

export default App;