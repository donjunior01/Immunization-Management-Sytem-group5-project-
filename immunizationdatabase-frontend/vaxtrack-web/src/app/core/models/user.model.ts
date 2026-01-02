export enum UserRole {
  // Main backend roles only
  HEALTH_WORKER = 'HEALTH_WORKER',
  FACILITY_MANAGER = 'FACILITY_MANAGER',
  GOVERNMENT_OFFICIAL = 'GOVERNMENT_OFFICIAL'
}

export interface User {
  id: string;
  username: string;
  email?: string;
  role: UserRole | string; // Allow string for backend role names
  facilityId?: string;
  facilityName?: string;
  districtId?: string; // District ID for government officials
  firstName?: string;
  lastName?: string;
  fullName?: string; // Backend uses fullName
  phoneNumber?: string; // Phone number for staff
  status?: 'ACTIVE' | 'INACTIVE' | 'LOCKED' | string; // User status
  isActive?: boolean;
  active?: boolean; // Backend uses active
  createdAt?: string;
}

/**
 * Maps backend role to frontend role
 * All roles are now the same - no mapping needed, just normalization
 */
export function mapBackendRoleToFrontendRole(backendRole: string): UserRole {
  // Normalize role name (uppercase, handle variations)
  const normalizedRole = backendRole?.toUpperCase().trim();

  // Direct mapping - backend and frontend use same role names
  switch (normalizedRole) {
    case 'HEALTH_WORKER':
      return UserRole.HEALTH_WORKER;
    case 'FACILITY_MANAGER':
      return UserRole.FACILITY_MANAGER;
    case 'GOVERNMENT_OFFICIAL':
      return UserRole.GOVERNMENT_OFFICIAL;
    default:
      // Default to HEALTH_WORKER if role is unknown
      return UserRole.HEALTH_WORKER;
  }
}

export interface LoginRequest {
  username?: string;
  usernameOrEmail?: string; // For login form compatibility
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  expiresIn: number;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  email?: string;
  fullName?: string;
  role: UserRole | string;
  facilityId?: string;
  firstName?: string;
  lastName?: string;
}

export interface UpdateUserRequest {
  email?: string;
  fullName?: string;
  role?: UserRole | string;
  password?: string;
  facilityId?: string;
  districtId?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  active?: boolean;
}

