import { zodTable } from "zodvex";
import { userShape } from "@/schemas/users";

export const Users = zodTable("users", userShape);
