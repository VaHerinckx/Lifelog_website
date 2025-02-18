// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import Layout from './components/Reusable_components/Layout';
import Homepage from './components/Homepage';
import PodcastPage from './components/Pages/PodcastPage';
import MusicPage from './components/Pages/MusicPage';

const App = () => {
  return (
    <Router>
      <DataProvider>
        <Routes>
          {/* Homepage route */}
          <Route path="/" element={<Homepage />} />

          {/* Layout wrapper route */}
          <Route element={<Layout />}>
            <Route path="/podcast" element={<PodcastPage />} />
            <Route path="/music" element={<MusicPage />} />

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
      </DataProvider>
    </Router>
  );
};

export default App;
