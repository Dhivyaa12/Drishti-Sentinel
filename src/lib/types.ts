export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface Alert {
  id: string;
  type: string;
  description: string;
  riskLevel: RiskLevel;
  timestamp: string;
  zoneId: string;
  location: string; // Should be a string for a geographic location, can be updated later
}

export interface Zone {
  id:string;
  name: string;
  type: 'webcam' | 'ip-camera';
  ipAddress?: string; // Only for ip-camera type
  alarmSilenced: boolean;
}


export type CrowdDensityAnalysisResult = {
  headCount: number;
  densityLevel: 'low' | 'medium' | 'high';
  report: string;
  timestamp: string;
  frameDataUri?: string;
};

export type FaceMatchResult = {
  matchFound: boolean;
  confidenceScore: number | null;
  timestamp?: string;
  frameDataUri?: string;
  personPhotoDataUri?: string;
  zoneId?: string;
  zoneName?: string;
};
