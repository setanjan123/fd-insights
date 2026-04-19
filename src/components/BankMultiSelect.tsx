import { useState } from "react";
import { BANKS } from "@/lib/banks";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

export function BankMultiSelect({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);

  const toggle = (id: string) => {
    onChange(
      selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id],
    );
  };

  const label =
    selected.length === 0
      ? "Select banks"
      : selected.length === BANKS.length
        ? `All banks (${BANKS.length})`
        : selected.length === 1
          ? BANKS.find((b) => b.id === selected[0])?.name
          : `${selected.length} banks selected`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "mt-2 w-full flex items-center justify-between rounded-xl border border-border bg-card px-3.5 h-11 text-sm transition-colors hover:border-foreground/20",
            open && "border-foreground/30 ring-2 ring-foreground/5",
          )}
        >
          <span className="flex items-center gap-2 min-w-0">
            <span
              className={cn(
                "inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full text-[10px] font-semibold tabular-nums",
                selected.length > 0
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {selected.length}
            </span>
            <span className="truncate font-medium">{label}</span>
          </span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            className={cn(
              "text-muted-foreground transition-transform shrink-0",
              open && "rotate-180",
            )}
          >
            <path
              d="M3.5 5.5L7 9L10.5 5.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl shadow-[var(--shadow-elevated)]"
      >
        <Command>
          <CommandInput placeholder="Search banks..." className="h-10" />
          <CommandList className="max-h-72">
            <CommandEmpty>No banks found.</CommandEmpty>
            <CommandGroup>
              {BANKS.map((b) => {
                const active = selected.includes(b.id);
                return (
                  <CommandItem
                    key={b.id}
                    value={`${b.shortName} ${b.name}`}
                    onSelect={() => toggle(b.id)}
                    className="flex items-center gap-2.5 cursor-pointer"
                  >
                    <span
                      className={cn(
                        "h-4 w-4 rounded-md border flex items-center justify-center transition-all shrink-0",
                        active
                          ? "bg-foreground border-foreground"
                          : "border-border",
                      )}
                    >
                      {active && (
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 12 12"
                          fill="none"
                          className="text-background"
                        >
                          <path
                            d="M2 6.5L4.5 9L10 3"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </span>
                    <span className="font-medium text-sm">{b.shortName}</span>
                    <span className="text-xs text-muted-foreground truncate ml-auto">
                      {b.name}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                onSelect={() =>
                  onChange(
                    selected.length === BANKS.length ? [] : BANKS.map((b) => b.id),
                  )
                }
                className="cursor-pointer text-xs text-muted-foreground justify-center"
              >
                {selected.length === BANKS.length ? "Clear all" : "Select all"}
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
