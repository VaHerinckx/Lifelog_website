// src/App.jsx
import './variables.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import Layout from './components/ui/Layout';
import Homepage from './pages/Home/Homepage';
import PodcastPage from './pages/Podcast/PodcastPage';
import MusicPage from './pages/Music/Musicpage';
import ReadingPage from './pages/Reading/ReadingPage';
import MoviesPage from './pages/Movies/MoviesPage';
import HealthPage from './pages/Health/HealthPage';
import NutritionPage from './pages/Nutrition/NutritionPage';

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
            <Route path="/music" element={<MusicPage />} />
            <Route path="/nutrition" element={<NutritionPage />} />
            <Route
              path="/sport"
              element={
                <div className="page-container">
                  <div className="coming-soon-text">Sport Page Coming Soon</div>
                </div>
              }
            />
            <Route path="/health" element={<HealthPage />} />
            <Route path="/reading" element={<ReadingPage />} />
            <Route path="/movies" element={<MoviesPage />} />
            <Route
              path="/finances"
              element={
                <div className="page-container">
                  <div className="coming-soon-text">Finances Page Coming Soon</div>
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
