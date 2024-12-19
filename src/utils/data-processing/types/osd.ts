export interface OSDInfo {
  name: string;
  region: string;
  code?: string;
  postalCodes?: string[];
}

export interface OSDMapping {
  [postalCode: string]: OSDInfo;
} 