import { QueryCtx } from "@/convex/_generated/server";

export function getUserOrThrow(ctx: QueryCtx) {
  const user = ctx.auth.getUserIdentity();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}
