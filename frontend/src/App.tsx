import { Routes, Route, Navigate } from 'react-router-dom';
import { AssessmentPage } from './pages/AssessmentPage';
import { ResultPage } from './pages/ResultPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { DashboardPage } from './pages/DashboardPage';
import { AdminTrainingPage } from './pages/AdminTrainingPage';
import { AdminAssignmentPage } from './pages/AdminAssignmentPage';
import { AdminDocumentUploadPage } from './pages/AdminDocumentUploadPage';
import { AdminReportsPage } from './pages/AdminReportsPage';
import { TrainingDetailsPage } from './pages/TrainingDetailsPage';
import { DocumentViewerPage } from './pages/DocumentViewerPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import GovernanceDashboardPage from './pages/GovernanceDashboardPage';
import { DepartmentCompliancePage } from './pages/DepartmentCompliancePage';
import { TrainingMasterPage } from './pages/TrainingMasterPage';
import ComplianceDrilldownPage from './pages/ComplianceDrilldownPage';
import { AdminAssessmentConfig } from './pages/AdminAssessmentConfig';
import { AdminAuditLogsPage } from './pages/AdminAuditLogsPage';
import { HistoryPage } from './pages/HistoryPage';
import TrainingMatrixPage from './pages/TrainingMatrixPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'Administrator' && user?.role !== 'QA') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>

      <div className="min-h-screen bg-gray-50">
        <Routes>

          {/* Public */}

          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* User */}
          <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/assessment/:id" element={<ProtectedRoute><AssessmentPage /></ProtectedRoute>} />
          <Route path="/result" element={<ProtectedRoute><ResultPage /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
          <Route path="/training/:id/details" element={<ProtectedRoute><TrainingDetailsPage /></ProtectedRoute>} />
          <Route path="/training/:id/view" element={<ProtectedRoute><DocumentViewerPage /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
          <Route path="/admin/governance-dashboard" element={<AdminRoute><GovernanceDashboardPage /></AdminRoute>} />
          <Route path="/admin/training-matrix" element={<AdminRoute><TrainingMatrixPage /></AdminRoute>} />
          <Route path="/admin/compliance/:trainingId/:department" element={<AdminRoute><DepartmentCompliancePage /></AdminRoute>} />
          <Route path="/admin/compliance-drilldown/:type/:id" element={<AdminRoute><ComplianceDrilldownPage /></AdminRoute>} />
          <Route path="/admin/trainings" element={<AdminRoute><AdminTrainingPage /></AdminRoute>} />
          <Route path="/admin/assignments" element={<AdminRoute><AdminAssignmentPage /></AdminRoute>} />
          <Route path="/admin/upload" element={<AdminRoute><AdminDocumentUploadPage /></AdminRoute>} />
          <Route path="/admin/reports" element={<AdminRoute><AdminReportsPage /></AdminRoute>} />
          <Route path="/admin/training-master" element={<AdminRoute><TrainingMasterPage /></AdminRoute>} />
          <Route path="/admin/assessment/:trainingId/config" element={<AdminRoute><AdminAssessmentConfig /></AdminRoute>} />
          <Route path="/admin/audit-logs" element={<AdminRoute><AdminAuditLogsPage /></AdminRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </div>

    </AuthProvider>
  );
}
