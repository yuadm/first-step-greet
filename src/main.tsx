import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { PermissionsProvider } from './contexts/PermissionsContext'
import { AuthProvider } from './contexts/AuthContext'
import { TestModeProvider } from './contexts/TestModeContext'

createRoot(document.getElementById("root")!).render(
  <TestModeProvider>
    <AuthProvider>
      <PermissionsProvider>
        <App />
      </PermissionsProvider>
    </AuthProvider>
  </TestModeProvider>
);
