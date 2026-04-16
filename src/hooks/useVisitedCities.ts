import { useState, useCallback, useEffect } from 'react';
import type { VisitedData } from '../types';

const STORAGE_KEY = 'travel-map-visited';

function loadVisited(): VisitedData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function useVisitedCities() {
  const [visited, setVisited] = useState<VisitedData>(loadVisited);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visited));
  }, [visited]);

  const toggleCity = useCallback((cityName: string, province: string) => {
    setVisited((prev) => {
      const next = { ...prev };
      if (next[cityName]) {
        delete next[cityName];
      } else {
        next[cityName] = {
          province,
          visitedAt: new Date().toISOString(),
        };
      }
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setVisited({});
  }, []);

  const getVisitedCountByProvince = useCallback(
    (province: string) => {
      return Object.values(visited).filter((v) => v.province === province).length;
    },
    [visited]
  );

  const getVisitedCitiesByProvince = useCallback(
    (province: string) => {
      return Object.entries(visited)
        .filter(([, v]) => v.province === province)
        .map(([name]) => name);
    },
    [visited]
  );

  return {
    visited,
    toggleCity,
    clearAll,
    totalCities: Object.keys(visited).length,
    getVisitedCountByProvince,
    getVisitedCitiesByProvince,
  };
}
