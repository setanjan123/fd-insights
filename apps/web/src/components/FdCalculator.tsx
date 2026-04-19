import { useMemo, useState } from "react";
import { BANKS, LAST_UPDATED } from "@/lib/banks";
import { calculateFd, formatINR, formatINRCompact, formatTenure, type PayoutType } from "@/lib/fd";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { BankMultiSelect } from "@/components/BankMultiSelect";
import { cn } from "@/lib/utils";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const ALL_BANK_IDS = BANKS.map((b) => b.id);

export function FdCalculator() {
  const [amount, setAmount] = useState<number>(100000);
  const [years, setYears] = useState<number>(2);
  const [months, setMonths] = useState<number>(0);
  const [days, setDays] = useState<number>(0);
  const [payoutType, setPayoutType] = useState<PayoutType>("cumulative");
  const [isSenior, setIsSenior] = useState<boolean>(false);
  const [selectedBanks, setSelectedBanks] = useState<string[]>(ALL_BANK_IDS);

  const totalDays = Math.max(1, years * 365 + months * 30 + days);

  const results = useMemo(() => {
    return BANKS.filter((b) => selectedBanks.includes(b.id))
      .map((b) =>
        calculateFd(b, {
          principal: amount,
          totalDays,
          payoutType,
          isSenior,
        }),
      )
      .sort((a, b) =>
        payoutType === "non-cumulative"
          ? b.quarterlyPayout - a.quarterlyPayout
          : b.maturityAmount - a.maturityAmount,
      );
  }, [amount, totalDays, payoutType, isSenior, selectedBanks]);

  const best = results[0];
  const worst = results[results.length - 1];

  const toggleBank = (id: string) => {
    setSelectedBanks((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const tenureLabel = formatTenure(totalDays);

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      {/* Ambient background */}
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{ background: "var(--gradient-hero)" }}
      />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-grid opacity-60" />

      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-md bg-background/70 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-display text-lg">
              ₹
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-semibold tracking-tight">Fixed</span>
              <span className="font-display text-base italic text-muted-foreground">
                deposit
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="hidden sm:inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              Rates · {new Date(LAST_UPDATED).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-10 sm:py-16">
        {/* Hero */}
        <section className="max-w-3xl mb-12 sm:mb-16">
          <h1 className="font-display text-5xl sm:text-7xl leading-[0.95] tracking-tight">
            Find the <em className="text-success">best</em> fixed
            <br />
            deposit, in seconds.
          </h1>
          <p className="mt-5 text-base text-muted-foreground max-w-xl leading-relaxed">
            A no-nonsense calculator that compares maturity value, interest, and
            effective annual return across India's top banks — side by side.
          </p>
        </section>

        <div className="grid lg:grid-cols-12 gap-6">
          {/* Inputs panel */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24 h-fit">
            <div className="rounded-3xl bg-card border border-border shadow-[var(--shadow-soft)] overflow-hidden">
              <div className="px-6 pt-6 pb-4 border-b border-border/60">
                <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Configure
                </h2>
              </div>

              <div className="p-6 space-y-6">
                {/* Amount */}
                <div>
                  <Label
                    htmlFor="amount"
                    className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
                  >
                    Amount(₹3Cr Max)
                  </Label>
                  <div className="relative mt-2">
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 font-display text-3xl text-muted-foreground">
                      ₹
                    </span>
                    <Input
                      id="amount"
                      type="number"
                      inputMode="numeric"
                      min={1000}
                      max={29999999}
                      value={amount || ""}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        setAmount(Math.min(29999999, val));
                      }}
                      className="pl-8 pr-2 h-12 text-3xl font-semibold tabular-nums border-0 border-b border-border rounded-none bg-transparent shadow-none focus-visible:ring-0 focus-visible:border-foreground transition-colors"
                    />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {[50000, 100000, 500000, 1000000].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setAmount(v)}
                        className={cn(
                          "px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all",
                          amount === v
                            ? "bg-foreground text-background border-foreground"
                            : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30",
                        )}
                      >
                        {formatINRCompact(v)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tenure */}
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      Tenure
                    </Label>
                    <span className="text-[11px] tabular-nums text-muted-foreground">
                      {totalDays} {totalDays === 1 ? "day" : "days"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <NumberStepper
                      value={years}
                      min={0}
                      max={10}
                      onChange={setYears}
                      suffix="yr"
                    />
                    <NumberStepper
                      value={months}
                      min={0}
                      max={11}
                      onChange={setMonths}
                      suffix="mo"
                    />
                    <NumberStepper
                      value={days}
                      min={0}
                      max={29}
                      onChange={setDays}
                      suffix="d"
                    />
                  </div>
                </div>

                {/* Payout type segmented */}
                <div>
                  <Label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Interest payout
                  </Label>
                  <div className="mt-2 grid grid-cols-2 gap-1 p-1 rounded-xl bg-muted">
                    {(["cumulative", "non-cumulative"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setPayoutType(t)}
                        className={cn(
                          "px-3 py-2 rounded-lg text-xs font-medium transition-all",
                          payoutType === t
                            ? "bg-card text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {t === "cumulative" ? "Cumulative" : "Payout"}
                      </button>
                    ))}
                  </div>
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    {payoutType === "cumulative"
                      ? "Compounded quarterly"
                      : "Simple interest"}
                  </p>
                </div>

                {/* Senior */}
                <label
                  htmlFor="senior"
                  className="flex items-center justify-between rounded-xl border border-border bg-muted/40 px-3.5 py-3 cursor-pointer hover:border-foreground/20 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium">Senior citizen</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Adds ~0.5% to base rate
                    </p>
                  </div>
                  <Switch id="senior" checked={isSenior} onCheckedChange={setIsSenior} />
                </label>

                {/* Banks */}
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      Banks
                    </Label>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedBanks(
                          selectedBanks.length === BANKS.length ? [] : ALL_BANK_IDS,
                        )
                      }
                      className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {selectedBanks.length === BANKS.length ? "Clear" : "Select all"}
                    </button>
                  </div>
                  <BankMultiSelect
                    selected={selectedBanks}
                    onChange={setSelectedBanks}
                  />
                </div>
              </div>
            </div>
          </aside>

          {/* Results */}
          <section className="lg:col-span-8 space-y-6">
            {results.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border p-16 text-center text-sm text-muted-foreground bg-card/40">
                Select at least one bank to start comparing.
              </div>
            ) : (
              <>
                {/* Hero result */}
                {best && best.rate && (
                  <div
                    className="relative rounded-3xl p-8 sm:p-10 text-primary-foreground overflow-hidden shadow-[var(--shadow-elevated)]"
                    style={{ background: "var(--gradient-best)" }}
                  >
                    <div
                      className="absolute inset-0 bg-noise opacity-[0.04] mix-blend-overlay pointer-events-none"
                      aria-hidden
                    />
                    <div
                      className="absolute -top-24 -right-24 h-64 w-64 rounded-full opacity-30 blur-3xl"
                      style={{ background: "oklch(0.7 0.18 150)" }}
                      aria-hidden
                    />

                    <div className="relative flex flex-wrap items-start justify-between gap-6">
                      <div>
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-success/20 text-success px-2.5 py-1 text-[11px] font-medium ring-1 ring-success/30 mb-4">
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path
                              d="M5 1L6.2 3.6L9 4L7 6L7.4 9L5 7.6L2.6 9L3 6L1 4L3.8 3.6L5 1Z"
                              fill="currentColor"
                            />
                          </svg>
                          Best return
                        </div>
                        <p className="text-sm opacity-70">{best.bankName}</p>
                        {payoutType === "non-cumulative" ? (
                          <>
                            <h2 className="font-display text-5xl sm:text-6xl mt-1 leading-none tabular-nums text-success">
                              {formatINR(best.quarterlyPayout)}
                            </h2>
                            <p className="text-xs opacity-70 mt-2">
                              every quarter · {best.numPayouts} payout
                              {best.numPayouts !== 1 ? "s" : ""} over {tenureLabel}
                            </p>
                          </>
                        ) : (
                          <>
                            <h2 className="font-display text-5xl sm:text-6xl mt-1 leading-none tabular-nums">
                              {formatINR(best.maturityAmount)}
                            </h2>
                            <p className="text-xs opacity-60 mt-3 tabular-nums">
                              {tenureLabel} · {best.rate.toFixed(2)}% p.a. · Cumulative
                              {isSenior && " · Senior"}
                            </p>
                          </>
                        )}
                      </div>
                      <div className="flex gap-8 text-right">
                        {payoutType === "non-cumulative" ? (
                          <>
                            <div>
                              <p className="text-[11px] uppercase tracking-wider opacity-60">
                                Rate
                              </p>
                              <p className="font-display text-2xl mt-1 tabular-nums">
                                {best.rate.toFixed(2)}%
                              </p>
                            </div>
                            <div>
                              <p className="text-[11px] uppercase tracking-wider opacity-60">
                                Principal back
                              </p>
                              <p className="font-display text-2xl mt-1 tabular-nums">
                                {formatINRCompact(amount)}
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <p className="text-[11px] uppercase tracking-wider opacity-60">
                                Interest
                              </p>
                              <p className="font-display text-2xl mt-1 tabular-nums text-success">
                                +{formatINRCompact(best.totalInterest)}
                              </p>
                            </div>
                            <div>
                              <p className="text-[11px] uppercase tracking-wider opacity-60">
                                EAR
                              </p>
                              <p className="font-display text-2xl mt-1 tabular-nums">
                                {best.effectiveAnnualReturn.toFixed(2)}%
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Comparison list */}
                <div className="rounded-3xl bg-card border border-border shadow-[var(--shadow-soft)] overflow-hidden">
                  <div className="px-6 py-4 border-b border-border/60 flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Comparison
                    </h3>
                    <span className="text-[11px] text-muted-foreground">
                      {payoutType === "non-cumulative"
                        ? "Sorted by quarterly payout"
                        : "Sorted by maturity"}
                    </span>
                  </div>

                  <div className="divide-y divide-border/60">
                    {results.map((r, i) => {
                      const isBest = r.bankId === best?.bankId;
                      const metric =
                        payoutType === "non-cumulative"
                          ? r.quarterlyPayout
                          : r.totalInterest;
                      const bestMetric =
                        payoutType === "non-cumulative"
                          ? best?.quarterlyPayout ?? 0
                          : best?.totalInterest ?? 0;
                      const widthPct =
                        bestMetric > 0
                          ? Math.max(4, (metric / bestMetric) * 100)
                          : 0;
                      const primary =
                        payoutType === "non-cumulative"
                          ? r.quarterlyPayout
                          : r.maturityAmount;
                      const bestPrimary =
                        payoutType === "non-cumulative"
                          ? best?.quarterlyPayout ?? 0
                          : best?.maturityAmount ?? 0;
                      const diff = primary - bestPrimary;

                      return (
                        <div
                          key={r.bankId}
                          className="px-6 py-5 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center gap-6">
                            {/* Rank */}
                            <div className="font-mono text-xs text-muted-foreground tabular-nums w-6">
                              {String(i + 1).padStart(2, "0")}
                            </div>

                            {/* Name + rate */}
                            <div className="w-32 sm:w-40 shrink-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm">{r.shortName}</p>
                                {isBest && (
                                  <span className="text-[10px] font-medium text-success">
                                    ★ Best
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">
                                {r.rate ? `${r.rate.toFixed(2)}% p.a.` : "Not available"}
                              </p>
                            </div>

                            {/* Bar */}
                            <div className="flex-1 hidden sm:block">
                              {r.rate ? (
                                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                  <div
                                    className={cn(
                                      "h-full rounded-full transition-all duration-500",
                                      isBest ? "bg-success" : "bg-foreground/40",
                                    )}
                                    style={{ width: `${widthPct}%` }}
                                  />
                                </div>
                              ) : (
                                <div className="h-1.5 rounded-full bg-muted opacity-40" />
                              )}
                            </div>

                            {/* Amount */}
                            <div className="text-right w-36 sm:w-44 shrink-0">
                              <p className="font-display text-xl tabular-nums">
                                {r.rate ? formatINR(primary) : "—"}
                              </p>
                              {r.rate && (
                                <p
                                  className={cn(
                                    "text-[11px] tabular-nums mt-0.5",
                                    isBest ? "text-success" : "text-muted-foreground",
                                  )}
                                >
                                  {payoutType === "non-cumulative"
                                    ? `per quarter · ${r.numPayouts} payouts`
                                    : isBest
                                      ? `+${formatINRCompact(r.totalInterest)} interest`
                                      : `${formatINRCompact(diff)} vs best`}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Chart */}
                {results.filter((r) => r.rate).length > 1 && (
                  <div className="rounded-3xl bg-card border border-border shadow-[var(--shadow-soft)] p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                          {payoutType === "non-cumulative"
                            ? "Quarterly payout"
                            : "Interest earned"}
                        </h3>
                        <p className="text-sm mt-1">
                          On{" "}
                          <span className="font-medium tabular-nums">
                            {formatINR(amount)}
                          </span>{" "}
                          {payoutType === "non-cumulative"
                            ? "· paid every quarter"
                            : `over ${tenureLabel}`}
                        </p>
                      </div>
                      {worst && best && worst.rate && best.rate && (
                        <div className="text-right">
                          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                            Spread
                          </p>
                          <p className="font-display text-xl tabular-nums text-success">
                            +
                            {formatINRCompact(
                              payoutType === "non-cumulative"
                                ? best.quarterlyPayout - worst.quarterlyPayout
                                : best.totalInterest - worst.totalInterest,
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={results
                            .filter((r) => r.rate)
                            .map((r) => ({
                              name: r.shortName,
                              value: Math.round(
                                payoutType === "non-cumulative"
                                  ? r.quarterlyPayout
                                  : r.totalInterest,
                              ),
                              isBest: r.bankId === best?.bankId,
                            }))}
                          margin={{ top: 16, right: 8, bottom: 0, left: 8 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="var(--color-border)"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="name"
                            tick={{
                              fontSize: 12,
                              fill: "var(--color-muted-foreground)",
                            }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{
                              fontSize: 11,
                              fill: "var(--color-muted-foreground)",
                            }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v) => formatINRCompact(v)}
                          />
                          <Tooltip
                            cursor={{ fill: "var(--color-muted)", opacity: 0.5 }}
                            contentStyle={{
                              backgroundColor: "var(--color-popover)",
                              border: "1px solid var(--color-border)",
                              borderRadius: "12px",
                              fontSize: "12px",
                              boxShadow: "var(--shadow-elevated)",
                            }}
                            formatter={(value: number) => [
                              formatINR(value),
                              payoutType === "non-cumulative" ? "Per quarter" : "Interest",
                            ]}
                          />
                          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                            {results
                              .filter((r) => r.rate)
                              .map((r) => (
                                <Cell
                                  key={r.bankId}
                                  fill={
                                    r.bankId === best?.bankId
                                      ? "var(--color-success)"
                                      : "var(--color-foreground)"
                                  }
                                  fillOpacity={r.bankId === best?.bankId ? 1 : 0.15}
                                />
                              ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </>
            )}

            <p className="text-[11px] text-muted-foreground text-center pt-4">
              Data may be inaccurate. Verify with your bank before
              investing.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

function NumberStepper({
  value,
  min,
  max,
  onChange,
  suffix,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  suffix: string;
}) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-card px-2 h-11 hover:border-foreground/20 transition-colors">
      <button
        type="button"
        onClick={dec}
        className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center justify-center"
        aria-label="Decrease"
      >
        −
      </button>
      <div className="flex items-baseline gap-1 tabular-nums">
        <span className="text-base font-semibold">{value}</span>
        <span className="text-[11px] text-muted-foreground">{suffix}</span>
      </div>
      <button
        type="button"
        onClick={inc}
        className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center justify-center"
        aria-label="Increase"
      >
        +
      </button>
    </div>
  );
}

