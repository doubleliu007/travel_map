import ChinaMap from './components/ChinaMap';
import Sidebar from './components/Sidebar';
import { useVisitedCities } from './hooks/useVisitedCities';
import './App.css';

function App() {
  const {
    visited,
    toggleCity,
    clearAll,
    totalCities,
    getVisitedCountByProvince,
    getVisitedCitiesByProvince,
  } = useVisitedCities();

  return (
    <div className="app">
      <Sidebar
        visited={visited}
        totalCities={totalCities}
        onClear={clearAll}
        getVisitedCountByProvince={getVisitedCountByProvince}
        getVisitedCitiesByProvince={getVisitedCitiesByProvince}
      />
      <main className="main">
        <ChinaMap
          visited={visited}
          onToggleCity={toggleCity}
        />
      </main>
    </div>
  );
}

export default App;
