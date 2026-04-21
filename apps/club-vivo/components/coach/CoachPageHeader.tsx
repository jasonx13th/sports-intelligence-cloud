import type { ReactNode } from "react";

type CoachPageHeaderProps = {
  badge?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
};

export function CoachPageHeader({
  badge,
  title,
  description,
  actions
}: CoachPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        {badge ? (
          <div className="club-vivo-badge mb-4 inline-flex rounded-full px-3 py-1 text-sm font-medium tracking-wide uppercase">
            {badge}
          </div>
        ) : null}

        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          {title}
        </h1>

        {description ? (
          <div className="mt-4 max-w-2xl text-base leading-7 text-slate-700">{description}</div>
        ) : null}
      </div>

      {actions ? <div>{actions}</div> : null}
    </div>
  );
}
