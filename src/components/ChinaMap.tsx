import { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { PROVINCES } from '../data/provinces';
import type { VisitedData } from '../types';

export interface CityInfo {
  name: string;
  province: string;
}

interface ChinaMapProps {
  visited: VisitedData;
  onToggleCity: (cityName: string, province: string) => void;
  onCityMapReady?: (cities: CityInfo[]) => void;
}

interface CityMeta {
  province: string;
}

const GEO_BASE = 'https://geo.datav.aliyun.com/areas_v3/bound';
const MAP_NAME = 'china-cities';

const WHOLE_REGION_ADCODES = new Set([
  110000, 120000, 310000, 500000, 710000, 810000, 820000,
]);

let cachedGeoJSON: any = null;
let cachedCityMap: Map<string, CityMeta> | null = null;
let cachedProvinceBorders: { coords: number[][] }[] | null = null;

async function fetchJSON(url: string): Promise<any> {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed to fetch: ${url}`);
  return resp.json();
}

function extractBorderLines(geo: any): { coords: number[][] }[] {
  const lines: { coords: number[][] }[] = [];
  for (const feature of geo.features ?? []) {
    const geom = feature.geometry;
    if (!geom) continue;
    if (geom.type === 'Polygon') {
      for (const ring of geom.coordinates) lines.push({ coords: ring });
    } else if (geom.type === 'MultiPolygon') {
      for (const polygon of geom.coordinates)
        for (const ring of polygon) lines.push({ coords: ring });
    }
  }
  return lines;
}

interface LoadResult {
  geoJSON: any;
  cityMap: Map<string, CityMeta>;
  provinceBorders: { coords: number[][] }[];
}

async function loadAllData(
  onProgress: (loaded: number, total: number) => void
): Promise<LoadResult> {
  if (cachedGeoJSON && cachedCityMap && cachedProvinceBorders) {
    return { geoJSON: cachedGeoJSON, cityMap: cachedCityMap, provinceBorders: cachedProvinceBorders };
  }

  const total = PROVINCES.length + 1; // +1 for province boundaries
  let loaded = 0;

  const [provinceGeo, ...cityResults] = await Promise.all([
    fetchJSON(`${GEO_BASE}/100000_full.json`).then((geo) => {
      loaded++;
      onProgress(loaded, total);
      return geo;
    }),
    ...PROVINCES.map((province) => {
      const isWhole = WHOLE_REGION_ADCODES.has(province.adcode);
      const url = `${GEO_BASE}/${province.adcode}${isWhole ? '' : '_full'}.json`;
      return fetchJSON(url)
        .then((geo) => ({ province, geo, isWhole, ok: true as const }))
        .catch(() => ({ province, geo: null, isWhole, ok: false as const }))
        .finally(() => { loaded++; onProgress(loaded, total); });
    }),
  ]);

  const provinceBorders = extractBorderLines(provinceGeo);

  const allFeatures: any[] = [];
  const cityMap = new Map<string, CityMeta>();

  for (const result of cityResults) {
    if (!result.ok || !result.geo) continue;
    const { province, geo, isWhole } = result;

    if (isWhole) {
      const feature = geo.features?.[0];
      if (!feature?.geometry) continue;
      feature.properties = { ...feature.properties, name: province.name };
      cityMap.set(province.name, { province: province.name });
      allFeatures.push(feature);
      continue;
    }

    for (const feature of geo.features ?? []) {
      const name = feature.properties?.name;
      if (!name) continue;
      const uniqueName = cityMap.has(name)
        ? `${name}(${province.name.replace(/省|市|自治区|壮族|回族|维吾尔/, '')})`
        : name;
      if (uniqueName !== name) {
        feature.properties = { ...feature.properties, name: uniqueName };
      }
      cityMap.set(uniqueName, { province: province.name });
      allFeatures.push(feature);
    }
  }

  const geoJSON = { type: 'FeatureCollection', features: allFeatures };
  cachedGeoJSON = geoJSON;
  cachedCityMap = cityMap;
  cachedProvinceBorders = provinceBorders;
  return { geoJSON, cityMap, provinceBorders };
}

export default function ChinaMap({ visited, onToggleCity, onCityMapReady }: ChinaMapProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const cityMapRef = useRef<Map<string, CityMeta>>(new Map());
  const bordersRef = useRef<{ coords: number[][] }[]>([]);
  const initializedRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState({ loaded: 0, total: PROVINCES.length + 1 });
  const [mapReady, setMapReady] = useState(!!cachedGeoJSON);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setLoading(true);
      try {
        const { geoJSON, cityMap, provinceBorders } = await loadAllData((l, t) => {
          if (!cancelled) setProgress({ loaded: l, total: t });
        });
        if (cancelled) return;
        cityMapRef.current = cityMap;
        bordersRef.current = provinceBorders;
        echarts.registerMap(MAP_NAME, geoJSON);
        setMapReady(true);
        onCityMapReady?.(Array.from(cityMap.entries()).map(([name, meta]) => ({ name, province: meta.province })));
      } catch (e) {
        console.error('Failed to load map data:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (!cachedGeoJSON) {
      init();
    } else {
      cityMapRef.current = cachedCityMap!;
      bordersRef.current = cachedProvinceBorders!;
      setLoading(false);
      setMapReady(true);
      onCityMapReady?.(Array.from(cachedCityMap!.entries()).map(([name, meta]) => ({ name, province: meta.province })));
    }
    return () => { cancelled = true; };
  }, []);

  function buildRegions(cityMap: Map<string, CityMeta>, visitedData: VisitedData) {
    return Array.from(cityMap.keys()).map((name) => ({
      name,
      itemStyle: visitedData[name]
        ? { areaColor: '#52c41a', borderColor: '#389e0d' }
        : { areaColor: '#eef2f7', borderColor: '#c5d3e0' },
    }));
  }

  useEffect(() => {
    if (!chartRef.current || !mapReady) return;
    const cityMap = cityMapRef.current;

    if (!initializedRef.current) {
      if (!chartInstance.current) {
        chartInstance.current = echarts.init(chartRef.current);
      }
      const chart = chartInstance.current;

      const option: echarts.EChartsOption = {
        tooltip: {
          trigger: 'item',
          formatter: (params: any) => {
            const cityName = params.name;
            if (!cityName) return '';
            const meta = cityMap.get(cityName);
            const isVisited = visited[cityName];
            const province = meta?.province || '';
            const isSameAsProvince = cityName === province;
            return `<div style="font-size:14px"><strong>${cityName}</strong></div>
              ${isSameAsProvince ? '' : `<div style="color:#888;font-size:12px;margin:2px 0">${province}</div>`}
              <div>${isVisited ? '✅ 已去过' : '⬜ 未去过'}</div>
              <div style="color:#aaa;font-size:11px;margin-top:4px">点击${isVisited ? '取消标记' : '标记为已去过'}</div>`;
          },
        },
        geo: {
          map: MAP_NAME,
          roam: true,
          scaleLimit: { min: 0.5, max: 20 },
          zoom: 1.15,
          center: [104, 36],
          itemStyle: {
            borderColor: '#c5d3e0',
            borderWidth: 0.4,
            areaColor: '#eef2f7',
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 12,
              fontWeight: 'bold',
              color: '#1a1a2e',
            },
            itemStyle: {
              areaColor: '#ffd666',
              borderColor: '#faad14',
              borderWidth: 1.5,
            },
          },
          label: { show: false },
          select: { disabled: true },
          regions: buildRegions(cityMap, visited),
        },
        series: [
          {
            name: '省界',
            type: 'lines',
            coordinateSystem: 'geo',
            polyline: true,
            silent: true,
            lineStyle: {
              color: '#6b8caa',
              width: 1.2,
              opacity: 0.8,
            },
            data: bordersRef.current,
          },
        ],
      };

      chart.setOption(option, true);
      chart.on('click', (params: any) => {
        if (params.componentType === 'geo') {
          const name = params.name;
          if (!name) return;
          const meta = cityMap.get(name);
          if (meta) {
            onToggleCity(name, meta.province);
          }
        }
      });

      initializedRef.current = true;
    } else {
      const chart = chartInstance.current;
      if (!chart) return;
      chart.setOption({
        geo: { regions: buildRegions(cityMap, visited) },
      });
    }
  }, [mapReady, visited, onToggleCity]);

  useEffect(() => {
    const handleResize = () => chartInstance.current?.resize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, []);

  const pct = progress.total > 0
    ? Math.round((progress.loaded / progress.total) * 100)
    : 0;

  return (
    <div className="map-container">
      <div className="map-header">
        <div className="map-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          点击城市标记去过的地方 · 滚轮缩放 · 拖拽移动
        </div>
      </div>
      {loading && (
        <div className="loading-overlay">
          <div className="spinner" />
          <div className="loading-text">加载全国市级地图数据...</div>
          <div className="progress-bar-wrapper">
            <div className="progress-bar" style={{ width: `${pct}%` }} />
          </div>
          <div className="progress-text">{progress.loaded} / {progress.total} ({pct}%)</div>
        </div>
      )}
      <div ref={chartRef} className="chart" />
    </div>
  );
}
