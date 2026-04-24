import * as z from "zod";

export const sheetUrlFormSchema = z.object({
  sheetUrl: z.string().url("Please enter a valid URL"),
});

export type SheetUrlFormValues = z.infer<typeof sheetUrlFormSchema>;
