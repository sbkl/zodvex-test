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
import { ConvexError } from "convex/values";

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

export const protectedQueryWithRls = zCustomQueryBuilder(
  ConvexBase.query,
  customCtx(async (ctx) => {
    const { rules, user } = await rlsRules(ctx);
    if (!user) {
      throw new ConvexError("Unauthorized");
    }
    return {
      db: wrapDatabaseReader(ctx, ctx.db, rules),
      user,
    };
  })
);

export const simpleProtectedQuery = zCustomQueryBuilder(
  ConvexBase.query,
  customCtx(async (ctx) => {
    const user = await getUserOrThrow(ctx);
    if (!user) {
      throw new ConvexError("Unauthorized");
    }
    return {
      user,
    };
  })
);

export const protectedMutationWithRlsAndTriggers = zCustomMutationBuilder(
  ConvexBase.mutation,
  customCtx(async (ctx) => {
    const withTriggersCtx = triggers.wrapDB(ctx);
    const { rules, user } = await rlsRules(withTriggersCtx);
    if (!user) {
      throw new ConvexError("Unauthorized");
    }
    return {
      db: wrapDatabaseWriter(withTriggersCtx, withTriggersCtx.db, rules),
      user,
    };
  })
);

export const simpleProtectedMutation = zCustomMutationBuilder(
  ConvexBase.mutation,
  customCtx(async (ctx) => {
    const user = await getUserOrThrow(ctx);
    if (!user) {
      throw new ConvexError("Unauthorized");
    }
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

export const simpleCustomQueryTest = simpleProtectedQuery({
  args: {
    userId: zid("users"),
  },
  // userId type is Id<"users">
  async handler(ctx, { userId }) {
    // Returns any
    const user = await ctx.db.get(userId);
    return user;
  },
});

export const customQueryTest = protectedQueryWithRls({
  args: {
    userId: zid("users"),
  },
  // userId type is Id<"users">
  async handler(ctx, { userId }) {
    // returns GenericDocument | null
    const user = await ctx.db.get(userId);
    return user;
  },
});

export const zodvexQueryTest = zq({
  args: {
    userId: zid("users"),
  },
  // userId type is Id<"users">
  async handler(ctx, { userId }) {
    // returns any
    const user = await ctx.db.get(userId);
    return user;
  },
});

export const simpleCustomMutationTest = simpleProtectedMutation({
  args: {
    userId: zid("users"),
  },
  // userId type is Id<"users">
  async handler(ctx, { userId }) {
    // Returns any
    const user = await ctx.db.get(userId);
    return user;
  },
});

export const customMutationTest = protectedMutationWithRlsAndTriggers({
  args: {
    userId: zid("users"),
  },
  // userId type is Id<"users">
  async handler(ctx, { userId }) {
    // returns GenericDocument | null
    const user = await ctx.db.get(userId);
    return user;
  },
});

export const zodvexMutationTest = zm({
  args: {
    userId: zid("users"),
  },
  // userId type is Id<"users">
  async handler(ctx, { userId }) {
    // returns any
    const user = await ctx.db.get(userId);
    return user;
  },
});
