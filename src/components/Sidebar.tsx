import type { VisitedData } from '../types';
import { PROVINCES } from '../data/provinces';

interface SidebarProps {
  visited: VisitedData;
  totalCities: number;
  onClear: () => void;
  getVisitedCountByProvince: (province: string) => number;
  getVisitedCitiesByProvince: (province: string) => string[];
}

export default function Sidebar({
  visited,
  totalCities,
  onClear,
  getVisitedCountByProvince,
  getVisitedCitiesByProvince,
}: SidebarProps) {
  const visitedProvinces = PROVINCES.filter(
    (p) => getVisitedCountByProvince(p.name) > 0
  );

  const totalProvinces = visitedProvinces.length;

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
            <line x1="9" y1="3" x2="9" y2="18" />
            <line x1="15" y1="6" x2="15" y2="21" />
          </svg>
          我的旅行地图
        </h1>
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
          {totalCities > 0 && (
            <button className="clear-btn" onClick={onClear}>
              清空全部
            </button>
          )}
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
            <p className="hint">点击地图上的省份，再点击城市来标记</p>
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
