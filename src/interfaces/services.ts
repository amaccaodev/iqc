import type {
  LoginRequest,
  LoginResponse,
  ProductionOrder,
  Team,
  User,
  UserPublic,
} from "@shared/types";

export interface IAuthService {
  login(credentials: LoginRequest): Promise<LoginResponse>;
  logout(): void | Promise<void>;
  getStoredUser(): UserPublic | null;
}

export interface IOrderService {
  getAll(): Promise<ProductionOrder[]>;
  getById(id: string): Promise<ProductionOrder>;
  create(order: Partial<ProductionOrder>): Promise<ProductionOrder>;
  approve(id: string): Promise<ProductionOrder>;
  reject(id: string): Promise<ProductionOrder>;
  assignBOM(orderId: string, bomId: string, teamId: string): Promise<ProductionOrder>;
  assignWorkers(orderId: string, bomId: string, workerNames: string[]): Promise<ProductionOrder>;
  submitTeamReport(
    orderId: string,
    bomId: string,
    summary: { passQty: number; failQty: number; note: string; reportedBy: string },
  ): Promise<ProductionOrder>;
  submitQCReport(
    orderId: string,
    bomId: string,
    report: { passQty: number; failQty: number; complaint: string; status: string; inspectedBy: string },
    passed: boolean,
  ): Promise<ProductionOrder>;
  refresh(): Promise<void>;
}

export interface IUserService {
  getAll(): Promise<UserPublic[]>;
  create(user: Omit<User, "id">): Promise<UserPublic>;
  update(id: string, user: Partial<User>): Promise<UserPublic>;
  toggle(id: string): Promise<UserPublic>;
}

export interface ITeamService {
  getAll(): Promise<Team[]>;
}
