import * as ConvexBase from "@/convex/_generated/server";
import {
  customCtx,
  zActionBuilder,
  zCustomMutationBuilder,
  zCustomQueryBuilder,
  zid,
  zMutationBuilder,
  zQueryBuilder,
} from "zodvex";
import { getUserOrThrow } from "@/convex/users/utils";
import { Triggers } from "convex-helpers/server/triggers";
import { DataModel } from "@/convex/_generated/dataModel";
import {
  Rules,
  wrapDatabaseReader,
  wrapDatabaseWriter,
} from "convex-helpers/server/rowLevelSecurity";

import z from "zod";

export const triggers = new Triggers<DataModel>();

// convex helpers rls config
async function rlsRules(ctx: ConvexBase.QueryCtx) {
  const user = await getUserOrThrow(ctx);
  return {
    rules: {} satisfies Rules<ConvexBase.QueryCtx, DataModel>,
    user,
  };
}

export const zq = zQueryBuilder(ConvexBase.query);
export const zm = zMutationBuilder(ConvexBase.mutation);
export const za = zActionBuilder(ConvexBase.action);

export const protectedQuery = zCustomQueryBuilder(
  ConvexBase.query,
  customCtx(async (ctx) => {
    const user = await getUserOrThrow(ctx);
    return {
      user,
    };
  })
);

export const protectedQueryWithRls = zCustomQueryBuilder(
  ConvexBase.query,
  customCtx(async (ctx: ConvexBase.QueryCtx) => {
    const { rules, user } = await rlsRules(ctx);
    return {
      db: wrapDatabaseReader(ctx, ctx.db, rules),
      user,
    };
  })
);

export const simpleProtectedQuery = zCustomQueryBuilder(
  ConvexBase.query,
  customCtx(async (ctx: ConvexBase.QueryCtx) => {
    const user = await getUserOrThrow(ctx);
    return {
      user,
    };
  })
);

export const protectedMutationWithRlsAndTriggers = zCustomMutationBuilder(
  ConvexBase.mutation,
  customCtx(async (ctx: ConvexBase.MutationCtx) => {
    const withTriggersCtx = triggers.wrapDB(ctx);
    const { rules, user } = await rlsRules(withTriggersCtx);
    return {
      db: wrapDatabaseWriter(withTriggersCtx, withTriggersCtx.db, rules),
      user,
    };
  })
);

export const simpleProtectedMutation = zCustomMutationBuilder(
  ConvexBase.mutation,
  customCtx(async (ctx: ConvexBase.MutationCtx) => {
    const user = await getUserOrThrow(ctx);
    return { user };
  })
);

// Helper to extract the convex ctx type from the custom functions
type CustomCtx<T> = T extends (config: infer Config) => any
  ? Config extends { handler: (ctx: infer Ctx, ...args: any[]) => any }
    ? Ctx
    : never
  : never;

export type ProtectedQueryWithRlsCtx = CustomCtx<typeof protectedQueryWithRls>;
export type SimpleProtectedQueryCtx = CustomCtx<typeof simpleProtectedQuery>;
export type ProtectedMutationWithRlsAndTriggersCtx = CustomCtx<
  typeof protectedMutationWithRlsAndTriggers
>;

export const simpleProtectedQueryTest = simpleProtectedQuery({
  args: {
    userId: zid("users"),
  },
  async handler(ctx, { userId }) {
    const user = await getUserById(ctx, { userId });
    return user;
  },
});

export const protectedMutationWithRlsAndTriggersTest =
  protectedMutationWithRlsAndTriggers({
    args: {
      userId: zid("users"),
    },
    async handler(ctx, { userId }) {
      const user = await getUserById(ctx, { userId });
      return user;
    },
  });

const userIdSchema = zid("users");

export async function getUserById(
  ctx: ProtectedMutationWithRlsAndTriggersCtx | SimpleProtectedQueryCtx,
  { userId }: { userId: z.infer<typeof userIdSchema> }
) {
  const user = await ctx.db.get(userId);
  return user;
}
