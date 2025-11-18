// src/App.jsx
import './styles/variables.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import Layout from './components/ui/Layout';
import Homepage from './pages/Home/Homepage';
import ReadingPage from './pages/Reading/ReadingPage';

const App = () => {
  return (
    <DataProvider>
      <Router>
        <Routes>
          {/* Homepage outside of Layout */}
          <Route path="/" element={<Homepage />} />

          {/* All other pages wrapped in Layout */}
          <Route element={<Layout />}>
            <Route path="/reading" element={<ReadingPage />} />
            <Route
              path="/sport"
              element={
                <div className="page-container">
                  <div className="coming-soon-text">Sport Page Coming Soon</div>
                </div>
              }
            />
            <Route
              path="/work"
              element={
                <div className="page-container">
                  <div className="coming-soon-text">Work Page Coming Soon</div>
                </div>
              }
            />
          </Route>
        </Routes>
      </Router>
    </DataProvider>
  );
};

export default App;
