export interface ProvinceInfo {
  name: string;
  adcode: number;
}

export interface VisitedData {
  [cityName: string]: {
    province: string;
    visitedAt: string;
  };
}
