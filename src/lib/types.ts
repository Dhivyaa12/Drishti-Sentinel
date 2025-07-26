export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface Alert {
  id: string;
  type: string;
  description: string;
  riskLevel: RiskLevel;
  timestamp: string;
  zoneId: string;
  location: string;
}

export interface Zone {
  id: string;
  name: string;
  alarmSilenced: boolean;
}

export type CrowdDensityAnalysisResult = {
  headCount: number;
  densityLevel: string;
  report: string;
  timestamp: string;
};

export type FaceMatchResult = {
  matchFound: boolean;
  confidenceScore: number | null;
  timestamp?: string;
  frameDataUri?: string;
  personPhotoDataUri?: string;
};
