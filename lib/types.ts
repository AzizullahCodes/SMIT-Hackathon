export type UserRole = "admin" | "technician";

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
}

export type AssetStatus =
  | "Operational"
  | "Issue Reported"
  | "Under Inspection"
  | "Under Maintenance"
  | "Out of Service"
  | "Retired";

export type AssetCondition = "Excellent" | "Good" | "Fair" | "Poor" | "Critical";

export interface Asset {
  id: string;
  name: string;
  code: string;
  category: string;
  location: string;
  condition: AssetCondition;
  status: AssetStatus;
  description: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: string;
  lastServiceDate?: string;
  nextServiceDate?: string;
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  imageUrl?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type IssueStatus =
  | "Reported"
  | "Assigned"
  | "Inspection Started"
  | "Maintenance In Progress"
  | "Waiting for Parts"
  | "Resolved"
  | "Closed"
  | "Reopened";

export type IssuePriority = "Low" | "Medium" | "High" | "Critical";

export type IssueCategory =
  | "Electrical"
  | "Mechanical"
  | "Plumbing"
  | "HVAC"
  | "IT/Network"
  | "Furniture"
  | "Structural"
  | "General"
  | "Other";

export interface Issue {
  id: string;
  issueNumber: string;
  assetId: string;
  assetName: string;
  assetCode: string;
  title: string;
  description: string;
  priority: IssuePriority;
  category: IssueCategory;
  status: IssueStatus;
  reporterName: string;
  reporterEmail: string;
  reporterPhone?: string;
  assignedToId?: string;
  assignedToName?: string;
  evidenceUrls?: string[];
  maintenanceNotes?: string;
  partsReplaced?: string;
  maintenanceCost?: number;
  timeSpent?: string;
  completedDate?: string;
  resolvedBy?: string;
  aiSuggested?: boolean;
  aiOriginalData?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export type HistoryAction =
  | "Asset Created"
  | "Asset Updated"
  | "Issue Reported"
  | "Issue Assigned"
  | "Inspection Started"
  | "Maintenance Started"
  | "Parts Recorded"
  | "Issue Resolved"
  | "Issue Reopened"
  | "Issue Closed"
  | "Status Changed"
  | "Asset Retired";

export interface HistoryEntry {
  id: string;
  assetId: string;
  issueId?: string;
  action: HistoryAction;
  actorName: string;
  actorRole: UserRole;
  details: string;
  createdAt: string;
}

export interface AI_triageResult {
  title: string;
  category: IssueCategory;
  priority: IssuePriority;
  possibleCauses: string[];
  initialChecks: string[];
  safetyNote: string;
}
