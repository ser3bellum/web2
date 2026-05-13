export type AnalyticsComparisonValue = {
  current: number;
  previous: number;
};

export type AnalyticsModalPayload = {
  users: number;
  sessions: number;
  newUsers: number;
  topPage: string;
  topLocations: {
    country: string;
    users: number;
  }[];
  selectedRangeLabel: string;
  previousRangeLabel: string;
  comparison: {
    users: {
      current: number;
      previous: number;
    };
    sessions: {
      current: number;
      previous: number;
    };
  };
};