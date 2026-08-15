import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import keycloak from './keycloak.js';

// Public pages
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';

// Authenticated pages
import Dashboard from './pages/Dashboard.jsx';
import ComplaintList from './pages/ComplaintList.jsx';
import ComplaintForm from './pages/ComplaintForm.jsx';
import ComplaintTimeline from './pages/ComplaintTimeline.jsx';
import ServiceApplicationForm from './pages/ServiceApplicationForm.jsx';
import ServiceTracker from './pages/ServiceTracker.jsx';
import OfficerDashboard from './pages/OfficerDashboard.jsx';
import OfficerApplicationView from './pages/OfficerApplicationView.jsx';
import CitizenRegister from './pages/CitizenRegister.jsx';
import MyCertificates from './pages/MyCertificates.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminOfficers from './pages/AdminOfficers.jsx';
import AdminDepartments from './pages/AdminDepartments.jsx';
import AdminCertificates from './pages/AdminCertificates.jsx';
import AdminPermits from './pages/AdminPermits.jsx';
import OfficerAssignments from './pages/OfficerAssignments.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';

// ── Welfare (Milestone 3) routes ──────────────────────────────────────────
import WelfareDashboard from './pages/WelfareDashboard.jsx';
import SchemeManagement from './pages/SchemeManagement.jsx';
import BeneficiaryManagement from './pages/BeneficiaryManagement.jsx';
import FundDistribution from './pages/FundDistribution.jsx';
import BudgetManagement from './pages/BudgetManagement.jsx';
import WelfareReports from './pages/WelfareReports.jsx';
import SchemeApplicationForm from './pages/SchemeApplicationForm.jsx';
import ApplicationVerification from './pages/ApplicationVerification.jsx';
import ApprovalScreen from './pages/ApprovalScreen.jsx';
import FundDisbursementScreen from './pages/FundDisbursementScreen.jsx';
import PaymentSuccessScreen from './pages/PaymentSuccessScreen.jsx';
import MyWelfareApplications from './pages/MyWelfareApplications.jsx';
import DepartmentWelfareDashboard from './pages/DepartmentWelfareDashboard.jsx';
import AdminWelfareDashboard from './pages/AdminWelfareDashboard.jsx';

// ── Governance Analytics (Milestone 4) routes ─────────────────────────────
import GovernanceDashboard from './pages/GovernanceDashboard.jsx';
import GovernanceCommand from './pages/GovernanceCommand.jsx';
import ReportsDashboard from './pages/ReportsDashboard.jsx';
import CitizenReports from './pages/CitizenReports.jsx';
import GrievanceReports from './pages/GrievanceReports.jsx';
import RevenueReports from './pages/RevenueReports.jsx';
import PerformanceReports from './pages/PerformanceReports.jsx';
import AuditLogs from './pages/AuditLogs.jsx';
import AiAnalysisPage from './pages/AiAnalysisPage.jsx';


// Guard: redirects to /login if not authenticated
function Protected({ children }) {
  if (!keycloak.authenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// Redirect authenticated users away from public pages
function PublicOnly({ children }) {
  if (keycloak.authenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

import { Toaster } from '@/components/ui/sonner';

function App({ authenticated }) {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors closeButton />
      <Routes>
        {/* ===== PUBLIC ROUTES ===== */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={
          <PublicOnly><LoginPage /></PublicOnly>
        } />
        <Route path="/register" element={
          <PublicOnly><RegisterPage /></PublicOnly>
        } />

        {/* ===== AUTHENTICATED ROUTES ===== */}
        <Route path="/dashboard" element={
          <Protected><Dashboard /></Protected>
        } />

        {/* Notifications */}
        <Route path="/notifications" element={
          <Protected><NotificationsPage /></Protected>
        } />

        {/* Complaint routes */}
        <Route path="/complaints" element={
          <Protected><ComplaintList /></Protected>
        } />
        <Route path="/complaints/new" element={
          <Protected><ComplaintForm /></Protected>
        } />
        <Route path="/complaints/:id" element={
          <Protected><ComplaintTimeline /></Protected>
        } />

        {/* Profile (complete citizen profile after first login) */}
        <Route path="/profile" element={
          <Protected><CitizenRegister /></Protected>
        } />

        {/* Service routes */}
        <Route path="/services/apply" element={
          <Protected><ServiceApplicationForm /></Protected>
        } />
        <Route path="/services/tracker" element={
          <Protected><ServiceTracker /></Protected>
        } />
        <Route path="/services/my-certificates" element={
          <Protected><MyCertificates /></Protected>
        } />
        <Route path="/services/officer/dashboard" element={
          <Protected><OfficerDashboard /></Protected>
        } />
        <Route path="/services/officer/verify/:id" element={
          <Protected><OfficerApplicationView /></Protected>
        } />

        {/* Officer route (also accessible via dashboard) */}
        <Route path="/officer" element={
          <Protected><OfficerDashboard /></Protected>
        } />

        {/* Admin routes */}
        <Route path="/admin/dashboard" element={
          <Protected><AdminDashboard /></Protected>
        } />
        <Route path="/admin/certificates" element={
          <Protected><AdminCertificates /></Protected>
        } />
        <Route path="/admin/permits" element={
          <Protected><AdminPermits /></Protected>
        } />
        <Route path="/admin/assign" element={
          <Protected><OfficerAssignments /></Protected>
        } />
        <Route path="/admin/officers" element={
          <Protected><AdminOfficers /></Protected>
        } />
        <Route path="/admin/departments" element={
          <Protected><AdminDepartments /></Protected>
        } />
        <Route path="/admin/ai-analysis" element={
          <Protected><AiAnalysisPage /></Protected>
        } />
        <Route path="/reports/ai-analysis" element={
          <Protected><AiAnalysisPage /></Protected>
        } />

        {/* ===== WELFARE ROUTES (Milestone 3) ===== */}
        <Route path="/welfare/dashboard" element={
          <Protected><WelfareDashboard /></Protected>
        } />
        <Route path="/welfare/schemes" element={
          <Protected><SchemeManagement /></Protected>
        } />
        <Route path="/welfare/beneficiaries" element={
          <Protected><BeneficiaryManagement /></Protected>
        } />
        <Route path="/welfare/disbursements" element={
          <Protected><FundDistribution /></Protected>
        } />
        <Route path="/welfare/budgets" element={
          <Protected><BudgetManagement /></Protected>
        } />
        <Route path="/welfare/reports" element={
          <Protected><WelfareReports /></Protected>
        } />
        <Route path="/welfare/apply" element={
          <Protected><SchemeApplicationForm /></Protected>
        } />
        <Route path="/welfare/my-applications" element={
          <Protected><MyWelfareApplications /></Protected>
        } />
        <Route path="/welfare/verify" element={
          <Protected><ApplicationVerification /></Protected>
        } />
        <Route path="/welfare/approve" element={
          <Protected><ApprovalScreen /></Protected>
        } />
        <Route path="/welfare/disburse" element={
          <Protected><FundDisbursementScreen /></Protected>
        } />
        <Route path="/welfare/department-dashboard" element={
          <Protected><DepartmentWelfareDashboard /></Protected>
        } />
        <Route path="/welfare/admin-dashboard" element={
          <Protected><AdminWelfareDashboard /></Protected>
        } />
        <Route path="/welfare/payment-success" element={
          <Protected><PaymentSuccessScreen /></Protected>
        } />

        {/* ===== GOVERNANCE ANALYTICS & REPORTS (Milestone 4) ===== */}
        <Route path="/governance/dashboard" element={
          <Protected><GovernanceDashboard /></Protected>
        } />
        <Route path="/governance/command" element={
          <Protected><GovernanceCommand /></Protected>
        } />
        <Route path="/reports" element={
          <Protected><ReportsDashboard /></Protected>
        } />
        <Route path="/reports/citizens" element={
          <Protected><ReportsDashboard defaultTab="citizens" /></Protected>
        } />
        <Route path="/reports/grievances" element={
          <Protected><ReportsDashboard defaultTab="grievance" /></Protected>
        } />
        <Route path="/reports/revenue" element={
          <Protected><ReportsDashboard defaultTab="revenue" /></Protected>
        } />
        <Route path="/reports/performance" element={
          <Protected><ReportsDashboard defaultTab="performance" /></Protected>
        } />
        <Route path="/reports/audit-logs" element={
          <Protected><ReportsDashboard defaultTab="audit" /></Protected>
        } />


        {/* Fallback: root redirects based on auth */}
        <Route path="*" element={
          keycloak.authenticated
            ? <Navigate to="/dashboard" replace />
            : <Navigate to="/" replace />
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
