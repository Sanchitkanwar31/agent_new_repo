import type { UseFormReturn } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/shared/ui/form";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { Loader2, Search } from "lucide-react";
import type { SheetUrlFormValues } from "../schemas/sheetUrlFormSchema";

export type SheetUrlFormProps = {
  form: UseFormReturn<SheetUrlFormValues>;
  onSubmit: (values: SheetUrlFormValues) => void | Promise<void>;
  isPending: boolean;
  className?: string;
};

export function SheetUrlForm({ form, onSubmit, isPending, className }: SheetUrlFormProps) {
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={className ?? "flex items-center gap-2"}
        data-testid="form-url"
      >
        <FormField
          control={form.control}
          name="sheetUrl"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#fdcd08]/70" />
                  <Input
                    placeholder="Paste Google Sheets URL..."
                    className="w-80 pl-9 h-9 bg-white/10 border-[#ef6c00]/70 rounded-lg text-sm text-[#fdcd08] placeholder:text-[#fdcd08]/70 focus-visible:ring-2 focus-visible:ring-[#fdcd08]"
                    {...field}
                    disabled={isPending}
                    data-testid="input-sheet-url"
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          disabled={isPending}
          className="h-9 bg-[#fdcd08] hover:bg-[#ef6c00] hover:text-white text-[#0b0f1a] rounded-lg px-4 font-semibold"
          data-testid="button-analyze"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Analyze"}
        </Button>
      </form>
    </Form>
  );
}

