export interface LoginCredentials {
  username: string;
  password:  string;
}

// Add other shared types here in the future 

export interface TableDetectParams {
  file?: File;
  imageUrl?: string;
  visualize?: boolean;
} 