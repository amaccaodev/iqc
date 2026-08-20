import type { Team } from "@shared/types";
import { BaseApiService } from "../../core/BaseApiService";
import type { ITeamService } from "../../interfaces/services";

export class TeamApiService extends BaseApiService implements ITeamService {
  getAll(): Promise<Team[]> {
    return this.get<Team[]>("/teams");
  }
}

export const teamApi = new TeamApiService();
