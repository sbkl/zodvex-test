import { QueryCtx } from "@/convex/_generated/server";

export async function getUserOrThrow(ctx: QueryCtx) {
  const user = await ctx.auth.getUserIdentity();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}
