import React from 'react';
import { BrowserRouter as Router, useLocation } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { useTranslation } from 'react-i18next';
import { AuthProvider } from './helpers/AuthContent';
import ToastProvider from './components/toast/ToastProvider';
import Footer from './components/footer/Footer';
import AppRoutes from './helpers/AppRoutes';
import '../index.css';
import Sidebar from './components/sidebar/Sidebar';

const FULLSCREEN_ROUTES = ['/', '/new-home', '/new-markets', '/design-preview', '/create', '/stats'];
const FULLSCREEN_PREFIXES = ['/markets/', '/admin/markets/review', '/newprofile'];

function ErrorFallback({ error, resetErrorBoundary }) {
  const { t } = useTranslation();
  const showDiagnosticDetails = import.meta.env.DEV && error?.message;

  return (
    <div
      className='flex flex-col items-center justify-center min-h-screen bg-primary-background text-white p-6 text-center'
      role='alert'
      aria-live='assertive'
    >
      <h1 className='text-4xl font-bold mb-4'>{t('error.title')}</h1>
      <p className='text-xl mb-8'>
        {t('error.message')}
      </p>
      {showDiagnosticDetails && (
        <details className='mb-8 max-w-2xl text-left'>
          <summary className='cursor-pointer text-sm text-gray-300'>
            {t('error.devDetails')}
          </summary>
          <pre className='mt-3 overflow-auto rounded bg-gray-800 p-4 text-sm text-gray-100'>
            {error.message}
          </pre>
        </details>
      )}
      <button
        onClick={resetErrorBoundary}
        className='px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors'
      >
        {t('error.tryAgain')}
      </button>
    </div>
  );
}

const AppLayout = () => {
  const { pathname } = useLocation();
  const isFullscreen = FULLSCREEN_ROUTES.includes(pathname) || FULLSCREEN_PREFIXES.some(p => pathname.startsWith(p));

  if (isFullscreen) {
    return <AppRoutes />;
  }

  return (
    <div className='App bg-primary-background min-h-screen text-white flex flex-col md:flex-row'>
      <Sidebar />
      <div className='flex flex-col flex-grow'>
        <main className='flex-grow p-4 sm:p-6 overflow-y-auto'>
          <AppRoutes />
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        // Reset the state of your app so the error doesn't happen again
      }}
    >
      <AuthProvider>
        <ToastProvider>
          <Router>
            <AppLayout />
          </Router>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
