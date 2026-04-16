import { useCallback, useState } from 'react';
import ChinaMap from './components/ChinaMap';
import type { CityInfo } from './components/ChinaMap';
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

  const [allCities, setAllCities] = useState<CityInfo[]>([]);

  const handleCityMapReady = useCallback((cities: CityInfo[]) => {
    setAllCities(cities);
  }, []);

  return (
    <div className="app">
      <Sidebar
        visited={visited}
        totalCities={totalCities}
        onClear={clearAll}
        onToggleCity={toggleCity}
        allCities={allCities}
        getVisitedCountByProvince={getVisitedCountByProvince}
        getVisitedCitiesByProvince={getVisitedCitiesByProvince}
      />
      <main className="main">
        <ChinaMap
          visited={visited}
          onToggleCity={toggleCity}
          onCityMapReady={handleCityMapReady}
        />
      </main>
    </div>
  );
}

export default App;
