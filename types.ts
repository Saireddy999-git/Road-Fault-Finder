
export enum UserRole {
  ADMIN = 'ADMIN',
  TEAM_MEMBER = 'TEAM_MEMBER'
}

export interface User {
  id: string; // acts as User ID or Phone Number
  name: string;
  email: string;
  role: UserRole;
  password?: string; // Optional because we don't want it in the active session object
}

export enum ViolationType {
  RED_LIGHT = 'Jumping Red Light',
  NO_HELMET = 'No Helmet',
  TRIPLE_RIDING = 'Triple Riding',
  WRONG_LANE = 'Wrong Lane Driving',
  ILLEGAL_PARKING = 'Illegal Parking',
  SPEEDING = 'Speeding'
}

export interface Violation {
  id: string;
  vehicleNumber: string;
  violationType: ViolationType;
  timestamp: string;
  location: string;
  mediaUrl: string;
  status: 'pending' | 'verified' | 'rejected';
  confidence: number;
  detectedBy: string;
  officerId?: string; // Tracks the Login ID of the officer
}

export interface DetectionResult {
  detections: {
    vehicleNumber: string;
    violationType: ViolationType;
    confidence: number;
    reasoning: string;
  }[];
}
