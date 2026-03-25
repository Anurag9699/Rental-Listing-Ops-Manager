import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import ListingDashboard from './pages/ListingDashboard';
import CreateListing from './pages/CreateListing';
import ListingDetail from './pages/ListingDetail';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<ListingDashboard />} />
          <Route path="create" element={<CreateListing />} />
          <Route path="listings/:id" element={<ListingDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
