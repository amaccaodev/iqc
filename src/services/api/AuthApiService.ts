import type { LoginRequest, LoginResponse, UserPublic, DeviceLoginRequest } from "@shared/types";
import { BaseApiService } from "../../core/BaseApiService";
import type { IAuthService } from "../../interfaces/services";
import { detectDeviceKind, getOrCreateDeviceId } from "../../lib/device";

export class AuthApiService extends BaseApiService implements IAuthService {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const payload: LoginRequest = {
      ...credentials,
      deviceId: credentials.deviceId ?? getOrCreateDeviceId(),
      deviceKind: credentials.deviceKind ?? detectDeviceKind(),
      userAgent: credentials.userAgent ?? navigator.userAgent,
    };
    const result = await this.post<LoginResponse>("/auth/login", payload);
    if (result.status === "pending_device") {
      return result;
    }
    if (result.token) {
      localStorage.setItem("iqc_token", result.token);
      localStorage.setItem("iqc_user", JSON.stringify(result.user));
    }
    return result;
  }

  async refresh(): Promise<LoginResponse> {
    const result = await this.post<LoginResponse>("/auth/refresh");
    if (result.token) {
      localStorage.setItem("iqc_token", result.token);
      localStorage.setItem("iqc_user", JSON.stringify(result.user));
    }
    return result;
  }

  async logout(): Promise<void> {
    try {
      await this.post<void>("/auth/logout");
    } catch {
      /* still clear local */
    }
    localStorage.removeItem("iqc_token");
    localStorage.removeItem("iqc_user");
  }

  getStoredUser(): UserPublic | null {
    const raw = localStorage.getItem("iqc_user");
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UserPublic;
    } catch {
      return null;
    }
  }

  listDeviceRequests(): Promise<DeviceLoginRequest[]> {
    return this.get<DeviceLoginRequest[]>("/auth/device-requests");
  }

  reviewDevice(id: string, approved: boolean): Promise<DeviceLoginRequest> {
    return this.post<DeviceLoginRequest>(`/auth/device-requests/${id}/review`, { approved });
  }
}

export const authApi = new AuthApiService();
