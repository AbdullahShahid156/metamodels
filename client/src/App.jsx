import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import ErrorBoundary from './components/layout/ErrorBoundary';
import { ScrollToTop } from './components/layout/ScrollToTop';

// Pages
import { Landing } from './pages/Landing';
import { Auth } from './pages/Auth';
import { Marketplace } from './pages/Marketplace';
import { ModelDetail } from './pages/ModelDetail';
import { Checkout } from './pages/Checkout';
import { MyPurchases } from './pages/MyPurchases';
import { SellerDashboard } from './pages/SellerDashboard';
import { UserProfile } from './pages/UserProfile';
import { NotFound } from './pages/NotFound';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

import { CreateListing } from './pages/CreateListing';
import { ManageListings } from './pages/ManageListings';
import { AdminDashboard } from './pages/AdminDashboard';

const ApiKeyManager = () => <div className="p-20 text-center text-[#6B7280]">API Key Manager Coming Soon</div>;

const pageVariants = {
  initial: { opacity: 0, scale: 0.98, filter: 'blur(6px)' },
  animate: { 
    opacity: 1, 
    scale: 1, 
    filter: 'blur(0px)',
    transition: { 
      duration: 0.5, 
      ease: [0.25, 0.46, 0.45, 0.94],
      scale: { type: 'spring', stiffness: 300, damping: 30 }
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.98, 
    filter: 'blur(4px)',
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }
  }
};

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{ width: '100%' }}
      >
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/model/:slug" element={<ModelDetail />} />
          
          {/* Admin Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>

          {/* Buyer Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/checkout/:id" element={<Checkout />} />
            <Route path="/purchases" element={<MyPurchases />} />
            <Route path="/profile" element={<UserProfile />} />
          </Route>

          {/* Seller Routes */}
          <Route element={<ProtectedRoute requiredRole="seller" />}>
            <Route path="/seller/dashboard" element={<SellerDashboard />} />
            <Route path="/seller/create" element={<CreateListing />} />
            <Route path="/seller/listings" element={<ManageListings />} />
            <Route path="/seller/keys" element={<ApiKeyManager />} />
          </Route>

          {/* 404 Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <div className="min-h-screen flex flex-col bg-[#0C0F1A]">
            <Navbar />
            <main className="flex-1 flex flex-col relative w-full pt-16">
              <AnimatedRoutes />
            </main>
            <Footer />
          </div>
          <Toaster 
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#1C2035',
                color: '#F5F5F0',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '12px',
                fontSize: '14px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              }
            }}
          />
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
