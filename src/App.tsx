import { useCallback, useState, useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import ChinaMap from './components/ChinaMap';
import type { CityInfo } from './components/ChinaMap';
import Sidebar from './components/Sidebar';
import { useVisitedCities } from './hooks/useVisitedCities';
import './App.css';

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= breakpoint
  );
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    setIsMobile(mq.matches);
    return () => mq.removeEventListener('change', handler);
  }, [breakpoint]);
  return isMobile;
}

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
  const isMobile = useIsMobile();
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleCityMapReady = useCallback((cities: CityInfo[]) => {
    setAllCities(cities);
  }, []);

  const visitedProvinceCount = new Set(
    Object.values(visited).map((v) => v.province)
  ).size;

  if (isMobile) {
    return (
      <div className="app mobile">
        <main className="main">
          <ChinaMap
            visited={visited}
            onToggleCity={toggleCity}
            onCityMapReady={handleCityMapReady}
          />
        </main>

        {/* Mobile top bar */}
        <div className="mobile-top-bar">
          <div className="mobile-top-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
              <line x1="9" y1="3" x2="9" y2="18" />
              <line x1="15" y1="6" x2="15" y2="21" />
            </svg>
            我的旅行地图
          </div>
          <div className="mobile-top-stats">
            <span className="mobile-stat">{visitedProvinceCount} 省</span>
            <span className="mobile-stat-sep">·</span>
            <span className="mobile-stat">{totalCities} 市</span>
          </div>
        </div>

        {/* FAB to open sheet */}
        <button
          className="mobile-fab"
          onClick={() => setSheetOpen(true)}
          aria-label="打开面板"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span className="mobile-fab-label">搜索 & 足迹</span>
        </button>

        {/* Bottom sheet overlay + panel */}
        <div
          className={`mobile-sheet-overlay ${sheetOpen ? 'open' : ''}`}
          onClick={() => setSheetOpen(false)}
        />
        <div className={`mobile-sheet ${sheetOpen ? 'open' : ''}`}>
          <div className="mobile-sheet-handle" onClick={() => setSheetOpen(false)}>
            <div className="handle-bar" />
          </div>
          <Sidebar
            visited={visited}
            totalCities={totalCities}
            onClear={clearAll}
            onToggleCity={toggleCity}
            allCities={allCities}
            getVisitedCountByProvince={getVisitedCountByProvince}
            getVisitedCitiesByProvince={getVisitedCitiesByProvince}
            onClose={() => setSheetOpen(false)}
            isMobile
          />
        </div>
        <Analytics />
      </div>
    );
  }

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
      <Analytics />
    </div>
  );
}

export default App;
