// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import Layout from './components/ui/Layout';
import Homepage from './pages/Home/Homepage';
import PodcastPage from './pages/Podcast/PodcastPage';

const App = () => {
  return (
    <DataProvider>
      <Router>
        <Routes>
          {/* Homepage outside of Layout */}
          <Route path="/" element={<Homepage />} />

          {/* All other pages wrapped in Layout */}
          <Route element={<Layout />}>
            <Route path="/podcast" element={<PodcastPage />} />
            <Route
              path="/music"
              element={
                <div className="page-container">
                  <div>Music Page Coming Soon</div>
                </div>
              }
            />
            <Route
              path="/nutrition"
              element={
                <div className="page-container">
                  <div>Nutrition Page Coming Soon</div>
                </div>
              }
            />
            <Route
              path="/sport"
              element={
                <div className="page-container">
                  <div>Sport Page Coming Soon</div>
                </div>
              }
            />
            <Route
              path="/health"
              element={
                <div className="page-container">
                  <div>Health Page Coming Soon</div>
                </div>
              }
            />
            <Route
              path="/reading"
              element={
                <div className="page-container">
                  <div>Reading Page Coming Soon</div>
                </div>
              }
            />
            <Route
              path="/movies-tv"
              element={
                <div className="page-container">
                  <div>Movies & TV Page Coming Soon</div>
                </div>
              }
            />
            <Route
              path="/finances"
              element={
                <div className="page-container">
                  <div>Finances Page Coming Soon</div>
                </div>
              }
            />
            <Route
              path="/work"
              element={
                <div className="page-container">
                  <div>Work Page Coming Soon</div>
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
