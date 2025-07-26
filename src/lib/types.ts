export type RiskLevel = 'Normal' | 'low' | 'medium' | 'high' | 'critical';

export interface Alert {
  id: string;
  type: string;
  description: string;
  riskLevel: RiskLevel;
  timestamp: string;
  zoneId: string;
  location: string;
  coordinates?: GeolocationCoordinates;
}

export interface Zone {
  id:string;
  name: string;
  type: 'webcam' | 'ip-camera';
  ipAddress?: string; // Only for ip-camera type
  alarmSilenced: boolean;
  configurable: boolean;
}

export interface ZoneStatus {
  zoneId: string;
  zoneName: string;
  status: string;
  riskLevel: RiskLevel;
  anomaly: string;
  description: string;
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

export type AnomalyType = 
    | "panic_run"
    | "loitering"
    | "crowd_gathering"
    | "fall_detected"
    | "fight"
    | "reverse_flow"
    | "entry_breach"
    | "object_abandon"
    | "overcrowd"
    | "rapid_dispersion"
    | "hand_cover_face"
    | "cover_eyes"
    | "fire"
    | "building_destruction"
    | "flood"
    | "other"
    | "none"
    | "head_covered";

export interface AnalyzeCameraFeedInput {
    photoDataUri: string;
    zone: string;
}

export interface AnalyzeCameraFeedOutput {
    anomalyType: AnomalyType;
    description: string;
    riskLevel: RiskLevel;
    isAnomaly: boolean;
    fireDetected: boolean;
    dominantEmotion: string;
    isStrongEmotion: boolean;
}
