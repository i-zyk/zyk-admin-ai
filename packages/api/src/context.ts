import type { Session } from "@zyk-admin-ai/auth";
import type { Database } from "@zyk-admin-ai/db";

export type Context = {
  session: Session | null;
  db: Database;
};
