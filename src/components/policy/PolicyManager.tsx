import { PolicyList } from "./PolicyList";

interface PolicyManagerProps {
  userRole: string;
  userEmail: string;
}

export function PolicyManager({ userRole, userEmail }: PolicyManagerProps) {
  return <PolicyList userRole={userRole} />;
}