import {
  AiAppDiscoveredSource,
  AiAppStatus,
} from "../../../enums/aiApp.enum";

export class AiAppModel {
  id?: number;
  organization_id!: number;
  name!: string;
  description?: string | null;
  vendor_id?: number | null;
  owner_id?: number | null;
  status!: AiAppStatus;
  risk_score?: number | null;
  discovered_source!: AiAppDiscoveredSource;
  shadow_ai_tool_id?: number | null;
  required_training?: string | null;
  is_demo?: boolean;
  created_at?: string;
  updated_at?: string;

  constructor(data: Partial<AiAppModel>) {
    Object.assign(this, data);
  }

  static createNewAiApp(data: Partial<AiAppModel>): AiAppModel {
    return new AiAppModel({
      status: AiAppStatus.DRAFT,
      discovered_source: AiAppDiscoveredSource.MANUAL,
      ...data,
    });
  }

  get displayName(): string {
    return this.name || "Untitled AI App";
  }

  get isApproved(): boolean {
    return this.status === AiAppStatus.APPROVED;
  }

  get isRestricted(): boolean {
    return this.status === AiAppStatus.RESTRICTED;
  }

  get isBanned(): boolean {
    return this.status === AiAppStatus.BANNED;
  }
}
