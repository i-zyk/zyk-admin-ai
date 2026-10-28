import { createAuth } from "@zyk-admin-ai/auth";
import { createPrismaClient } from "@zyk-admin-ai/db";

import { ENV } from "./env.server";

export const db = createPrismaClient(ENV);
export const auth = createAuth(ENV, db);
