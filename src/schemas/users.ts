import z from "zod";

export const userShape = {
  name: z.string(),
  email: z.string(),
  age: z.number().optional(),
  avatarUrl: z.url().nullable(),
};
