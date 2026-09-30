import type { Issue } from "@codefloor/schema";

export function ValidationErrors({ issues }: { issues: Issue[] }) {
  return (
    <div role="alert" className="cf-card cf-errors">
      <p className="cf-strong">This codefloor document is invalid</p>
      <ul>
        {issues.map((issue) => (
          <li key={`${issue.path}:${issue.message}`}>
            <code className="cf-mono">{issue.path || "(root)"}</code> {issue.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
