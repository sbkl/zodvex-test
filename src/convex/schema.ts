import { defineSchema } from "convex/server";
import { Users } from "@/convex/users/table";

const schema = defineSchema({
  users: Users.table.index("email", ["email"]),
});

export default schema;
