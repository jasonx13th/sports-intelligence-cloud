# Club Vivo Backend Service

`services/club-vivo` is the backend service area for the Club Vivo product surface.

## Important Folders

- `api/`
  - API Gateway/Lambda backend implementation for Club Vivo.

## What Belongs Here

- Club Vivo backend service code.
- Service-specific README files.
- Backend package and test configuration under service subfolders.

## What Should Not Go Here

- Frontend UI code.
- CDK stack definitions.
- Product docs.
- Generated local artifacts.

## Change Rules

- Put API handler/domain changes under `api/`.
- Keep frontend behavior in `apps/club-vivo`.
- Keep AWS resource definitions in `infra/cdk`.
- Do not widen tenant input or ownership behavior from this layer.

