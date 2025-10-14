import * as ConvexBase from "@/convex/_generated/server";
import {
  customCtx,
  zActionBuilder,
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
} from "convex-helpers/server/rowLevelSecurity";

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
    const { rules, user } = await rlsRules(ctx);
    return {
      db: wrapDatabaseReader(ctx, ctx.db, rules),
      user,
    };
  })
);

// Helper to extract the convex ctx type from the custom functions
type CustomCtx<T> = T extends (config: infer Config) => any
  ? Config extends { handler: (ctx: infer Ctx, ...args: any[]) => any }
    ? Ctx
    : never
  : never;

export type ProtectedQueryCtx = CustomCtx<typeof protectedQuery>;

export const queryTest = protectedQuery({
  args: {
    userId: zid("users"),
  },
  async handler(ctx, { userId }) {
    const user = await ctx.db.get(userId);
    return user;
  },
});
