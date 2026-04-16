import { useState, useMemo, useRef, useEffect } from 'react';
import type { VisitedData } from '../types';
import type { CityInfo } from './ChinaMap';
import { PROVINCES } from '../data/provinces';

interface SidebarProps {
  visited: VisitedData;
  totalCities: number;
  onClear: () => void;
  onToggleCity: (cityName: string, province: string) => void;
  allCities: CityInfo[];
  getVisitedCountByProvince: (province: string) => number;
  getVisitedCitiesByProvince: (province: string) => string[];
  isMobile?: boolean;
  onClose?: () => void;
}

function exportData(visited: VisitedData, allCities: CityInfo[]) {
  const byProvince = new Map<string, { visited: string[]; unvisited: string[] }>();

  for (const p of PROVINCES) {
    byProvince.set(p.name, { visited: [], unvisited: [] });
  }

  for (const city of allCities) {
    const bucket = byProvince.get(city.province);
    if (!bucket) continue;
    if (visited[city.name]) {
      bucket.visited.push(city.name);
    } else {
      bucket.unvisited.push(city.name);
    }
  }

  const lines: string[] = ['省/自治区/直辖市,城市,是否去过'];
  for (const [province, { visited: v, unvisited: u }] of byProvince) {
    for (const name of v) lines.push(`${province},${name},已去过`);
    for (const name of u) lines.push(`${province},${name},未去过`);
  }

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `旅行足迹_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Sidebar({
  visited,
  totalCities,
  onClear,
  onToggleCity,
  allCities,
  getVisitedCountByProvince,
  getVisitedCitiesByProvince,
  isMobile = false,
  onClose,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const visitedProvinces = PROVINCES.filter(
    (p) => getVisitedCountByProvince(p.name) > 0
  );
  const totalProvinces = visitedProvinces.length;

  const searchResults = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return [];
    return allCities
      .filter((c) => c.name.includes(q) || c.province.includes(q))
      .slice(0, 50);
  }, [searchQuery, allCities]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        searchRef.current &&
        !searchRef.current.contains(e.target as Node)
      ) {
        setSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showDropdown = searchFocused && searchQuery.trim().length > 0;

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
            <line x1="9" y1="3" x2="9" y2="18" />
            <line x1="15" y1="6" x2="15" y2="21" />
          </svg>
          {isMobile ? '搜索 & 足迹' : '我的旅行地图'}
        </h1>
        {isMobile && onClose && (
          <button className="sheet-close-btn" onClick={onClose} aria-label="关闭">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Search */}
      <div className="search-section">
        <div className="search-wrapper">
          <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={searchRef}
            type="text"
            className="search-input"
            placeholder="搜索城市名称，快速标记..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
          />
          {searchQuery && (
            <button
              className="search-clear"
              onClick={() => { setSearchQuery(''); searchRef.current?.focus(); }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
        {showDropdown && (
          <div className="search-dropdown" ref={dropdownRef}>
            {searchResults.length === 0 ? (
              <div className="search-empty">没有找到匹配的城市</div>
            ) : (
              searchResults.map((city) => {
                const isVisited = !!visited[city.name];
                return (
                  <button
                    key={city.name}
                    className={`search-result-item ${isVisited ? 'visited' : ''}`}
                    onClick={() => {
                      onToggleCity(city.name, city.province);
                    }}
                  >
                    <div className="search-result-info">
                      <span className="search-result-name">{city.name}</span>
                      <span className="search-result-province">{city.province}</span>
                    </div>
                    <span className={`search-result-badge ${isVisited ? 'visited' : ''}`}>
                      {isVisited ? '已去过' : '标记'}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{totalProvinces}</div>
          <div className="stat-label">省/自治区/直辖市</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{totalCities}</div>
          <div className="stat-label">城市</div>
        </div>
        <div className="stat-card wide">
          <div className="stat-progress">
            <div
              className="stat-progress-bar"
              style={{ width: `${(totalProvinces / 34) * 100}%` }}
            />
          </div>
          <div className="stat-label">
            已解锁 {((totalProvinces / 34) * 100).toFixed(1)}% 的省级区域
          </div>
        </div>
      </div>

      <div className="visited-list">
        <div className="list-header">
          <h2>足迹详情</h2>
          <div className="list-header-actions">
            {allCities.length > 0 && (
              <button
                className="export-btn"
                onClick={() => exportData(visited, allCities)}
                title="导出 CSV"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                导出
              </button>
            )}
            {totalCities > 0 && (
              <button className="clear-btn" onClick={onClear}>
                清空全部
              </button>
            )}
          </div>
        </div>

        {totalCities === 0 ? (
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.3">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2" />
              <line x1="9" y1="9" x2="9.01" y2="9" />
              <line x1="15" y1="9" x2="15.01" y2="9" />
            </svg>
            <p>还没有旅行记录</p>
            <p className="hint">点击地图上的城市，或使用上方搜索来标记</p>
          </div>
        ) : (
          <div className="province-groups">
            {visitedProvinces.map((province) => {
              const cities = getVisitedCitiesByProvince(province.name);
              return (
                <div key={province.name} className="province-group">
                  <div className="province-name">
                    <span>{province.name}</span>
                    <span className="city-count">{cities.length} 个市</span>
                  </div>
                  <div className="city-tags">
                    {cities.map((city) => (
                      <span key={city} className="city-tag">
                        {city}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
