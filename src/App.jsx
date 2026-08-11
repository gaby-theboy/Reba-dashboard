// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PasswordGate from './components/auth/PasswordGate';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import Transactions from './pages/Transactions';
import Expenses from './pages/Expenses';
import Contacts from './pages/Contacts';

function App() {
  return (
    <PasswordGate>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/contacts" element={<Contacts />} />
        </Routes>
      </BrowserRouter>
    </PasswordGate>
  );
}

export default App;
