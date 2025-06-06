import { Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import FourYearPlanner from './pages/FourYearPlanner';
import YearClassesList from './pages/YearClassesList';
import Logout from './pages/LogoutPage';
import AdminViewAllPlans from './pages/AdminViewAllPlans';

function App() {
  return (
    <div>
      <NavBar />
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/planner" element={<FourYearPlanner />} />
        <Route path="/classes" element={<YearClassesList />} />
        <Route path="/leave" element={<Logout />} />
        <Route path="/all" element={<AdminViewAllPlans />} />
      </Routes>
    </div>
  );
}

export default App;
