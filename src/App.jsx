import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import Homepage from './components/Homepage';
import PodcastPage from './components/Pages/PodcastPage';

const App = () => {
  return (
    <Router>
      <DataProvider>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/podcast" element={<PodcastPage />} />
          <Route path="/music" element={<div>Music Page Coming Soon</div>} />
          <Route path="/nutrition" element={<div>Nutrition Page Coming Soon</div>} />
          <Route path="/sport" element={<div>Sport Page Coming Soon</div>} />
          <Route path="/health" element={<div>Health Page Coming Soon</div>} />
          <Route path="/reading" element={<div>Reading Page Coming Soon</div>} />
          <Route path="/movies-tv" element={<div>Movies & TV Page Coming Soon</div>} />
          <Route path="/finances" element={<div>Finances Page Coming Soon</div>} />
          <Route path="/work" element={<div>Work Page Coming Soon</div>} />
          </Routes>
      </DataProvider>
    </Router>
  );
};

export default App;
