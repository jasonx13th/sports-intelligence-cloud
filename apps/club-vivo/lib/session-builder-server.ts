import "server-only";

import { resolve } from "node:path";

import { getCurrentUser } from "./get-current-user";
import {
  getMethodology,
  METHODOLOGY_SCOPES,
  MethodologyApiError,
  type MethodologyRecord,
  type MethodologyScope
} from "./methodology-api";
import { clearSelectedTeamId, readSelectedTeamId } from "./selected-team";
import { getTeam, TeamApiError, type TeamRecord } from "./team-api";
import type {
  ConfirmedImageAnalysisProfile,
  GenerateSessionPackInput,
  SessionPack
} from "./session-builder-api";

type PipelineResult = {
  validatedPack: SessionPack;
};

type PipelineTenantContext = {
  tenantId: string;
  userId: string;
  role: string;
  tier: string;
};

type PipelineTeamRepository = {
  getTeamById: (
    tenantCtx: PipelineTenantContext,
    teamId: string
  ) => Promise<{ team: unknown } | null>;
};

type PipelineMethodologyRepository = {
  getMethodologyByScope: (
    tenantCtx: PipelineTenantContext,
    scope: MethodologyScope
  ) => Promise<{ methodology: unknown } | null>;
};

type ResolvedGenerationContext = {
  appliedMethodologyScopes?: MethodologyScope[];
  resolvedProgramType?: "travel" | "ost" | null;
};

type MethodologyDisplayModel = {
  methodologyApplied: boolean;
  appliedScopes: MethodologyScope[];
  activeSelectedTeam: TeamRecord | null;
  resolvedProgramDirection: "travel" | "ost" | null;
  styleBias: "default" | "travel" | "ost";
};

const pipelineModulePath = resolve(
  process.cwd(),
  "../../services/club-vivo/api/src/domains/session-builder/session-builder-pipeline.js"
);
const resolverModulePath = resolve(
  process.cwd(),
  "../../services/club-vivo/api/src/domains/session-builder/generation-context-resolver.js"
);

function loadBackendModule<T>(absolutePath: string): T {
  const runtimeRequire = eval("require") as NodeRequire;
  return runtimeRequire(absolutePath) as T;
}

const { processSessionPackRequest, deriveMethodologyInfluence } = loadBackendModule<{
  processSessionPackRequest: (
    rawInput: GenerateSessionPackInput,
    options?: {
      tenantCtx?: PipelineTenantContext;
      teamId?: string;
      teamRepository?: PipelineTeamRepository;
      methodologyRepository?: PipelineMethodologyRepository;
    }
  ) => Promise<PipelineResult>;
  deriveMethodologyInfluence: (resolvedGenerationContext: ResolvedGenerationContext) => {
    styleBias: "default" | "travel" | "ost";
    methodologyApplied: boolean;
  };
}>(pipelineModulePath);

const { resolveGenerationContext } = loadBackendModule<{
  resolveGenerationContext: (input: {
    generationContext: Record<string, never>;
    teamContext?: {
      programType?: "travel" | "ost" | null;
      ageBand?: string;
      playerCount?: number | null;
    } | null;
    methodologyRecords?: Partial<Record<MethodologyScope, MethodologyRecord | null>>;
  }) => ResolvedGenerationContext;
}>(resolverModulePath);

function createPipelineTeamRepository(): PipelineTeamRepository {
  return {
    async getTeamById(_tenantCtx, teamId) {
      const team = await getTeam(teamId);
      return { team };
    }
  };
}

function createPipelineMethodologyRepository(): PipelineMethodologyRepository {
  return {
    async getMethodologyByScope(_tenantCtx, scope) {
      try {
        const methodology = await getMethodology(scope);
        return { methodology };
      } catch (error) {
        if (error instanceof MethodologyApiError && error.status === 404) {
          return null;
        }

        throw error;
      }
    }
  };
}

async function getValidatedSelectedTeam(currentUser: PipelineTenantContext): Promise<TeamRecord | null> {
  const selectedTeamId = await readSelectedTeamId(currentUser.tenantId);

  if (!selectedTeamId) {
    return null;
  }

  try {
    return await getTeam(selectedTeamId);
  } catch (error) {
    if (error instanceof TeamApiError && error.status === 404) {
      await clearSelectedTeamId();
      return null;
    }

    throw error;
  }
}

function getTeamProgramType(team: TeamRecord | null) {
  const programType = (team as (TeamRecord & { programType?: unknown }) | null)?.programType;
  return programType === "travel" || programType === "ost" ? programType : null;
}

async function getPublishedMethodologyRecords() {
  const records: Partial<Record<MethodologyScope, MethodologyRecord | null>> = {};

  for (const scope of METHODOLOGY_SCOPES) {
    try {
      const methodology = await getMethodology(scope);
      records[scope] = methodology.status === "published" ? methodology : null;
    } catch (error) {
      if (error instanceof MethodologyApiError && error.status === 404) {
        records[scope] = null;
        continue;
      }

      throw error;
    }
  }

  return records;
}

export async function getActiveSelectedTeamForWorkspace() {
  const currentUser = await getCurrentUser();
  return getValidatedSelectedTeam(currentUser);
}

export async function getSessionBuilderMethodologyDisplay(): Promise<MethodologyDisplayModel> {
  const currentUser = await getCurrentUser();
  const activeSelectedTeam = await getValidatedSelectedTeam(currentUser);
  const methodologyRecords = await getPublishedMethodologyRecords();
  const resolvedGenerationContext = resolveGenerationContext({
    generationContext: {},
    teamContext: activeSelectedTeam
      ? {
          programType: getTeamProgramType(activeSelectedTeam),
          ageBand: activeSelectedTeam.ageBand
        }
      : null,
    methodologyRecords
  });
  const methodologyInfluence = deriveMethodologyInfluence(resolvedGenerationContext);

  return {
    methodologyApplied: methodologyInfluence.methodologyApplied,
    appliedScopes: Array.isArray(resolvedGenerationContext.appliedMethodologyScopes)
      ? resolvedGenerationContext.appliedMethodologyScopes
      : [],
    activeSelectedTeam,
    resolvedProgramDirection: resolvedGenerationContext.resolvedProgramType || null,
    styleBias: methodologyInfluence.styleBias
  };
}

export async function generateSessionPackForWorkspace(input: GenerateSessionPackInput, selectedTeamId?: string) {
  const currentUser = await getCurrentUser();
  let selectedTeam: TeamRecord | null = null;

  if (selectedTeamId?.trim()) {
    try {
      selectedTeam = await getTeam(selectedTeamId.trim());
    } catch (error) {
      if (!(error instanceof TeamApiError && error.status === 404)) {
        throw error;
      }
    }
  } else {
    selectedTeam = await getValidatedSelectedTeam(currentUser);
  }

  const pipelineResult = await processSessionPackRequest(input, {
    ...(selectedTeam
      ? {
          tenantCtx: currentUser,
          teamId: selectedTeam.teamId,
          teamRepository: createPipelineTeamRepository(),
          methodologyRepository: createPipelineMethodologyRepository()
        }
      : {})
  });

  return pipelineResult.validatedPack;
}

export type { ConfirmedImageAnalysisProfile };
