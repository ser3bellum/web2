export type AnalyticsComparisonValue = {
  current: number;
  previous: number;
};

export type AnalyticsModalPayload = {
  selectedRangeLabel: string;
  previousRangeLabel: string;
  totalVisits: number;
  visitsDelta: number;
  topPage: string;
  bounceRate: number;
  engagementRate: number;
  comparison: {
    visits: AnalyticsComparisonValue;
    bounceRate: AnalyticsComparisonValue;
  };
};