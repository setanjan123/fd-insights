import { useMemo, useState } from "react";
import { BANKS } from "@/lib/banks";
import { calculateFd, formatINR, formatINRCompact, type PayoutType } from "@/lib/fd";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const ALL_BANK_IDS = BANKS.map((b) => b.id);

export function FdCalculator() {
  const [amount, setAmount] = useState<number>(100000);
  const [years, setYears] = useState<number>(2);
  const [months, setMonths] = useState<number>(0);
  const [payoutType, setPayoutType] = useState<PayoutType>("cumulative");
  const [isSenior, setIsSenior] = useState<boolean>(false);
  const [selectedBanks, setSelectedBanks] = useState<string[]>(ALL_BANK_IDS);

  const totalMonths = Math.max(1, years * 12 + months);

  const results = useMemo(() => {
    return BANKS.filter((b) => selectedBanks.includes(b.id))
      .map((b) =>
        calculateFd(b, {
          principal: amount,
          totalMonths,
          payoutType,
          isSenior,
        }),
      )
      .sort((a, b) => b.maturityAmount - a.maturityAmount);
  }, [amount, totalMonths, payoutType, isSenior, selectedBanks]);

  const bestId = results[0]?.bankId;

  const toggleBank = (id: string) => {
    setSelectedBanks((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const tenureLabel =
    years > 0 && months > 0
      ? `${years}y ${months}m`
      : years > 0
        ? `${years} year${years > 1 ? "s" : ""}`
        : `${months} month${months > 1 ? "s" : ""}`;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/60 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="h-9 w-9 rounded-xl flex items-center justify-center text-primary-foreground font-bold"
              style={{ background: "var(--gradient-primary)" }}
            >
              ₹
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight">FD Calculator</h1>
              <p className="text-xs text-muted-foreground">
                Compare fixed deposit returns across banks
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex text-xs text-muted-foreground">
            Rates updated · Apr 2026
          </span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="grid lg:grid-cols-[380px_1fr] gap-6">
          {/* Inputs */}
          <Card className="p-6 h-fit lg:sticky lg:top-24 shadow-[var(--shadow-soft)]">
            <h2 className="text-sm font-semibold tracking-tight mb-5">Investment details</h2>

            <div className="space-y-5">
              <div>
                <Label htmlFor="amount" className="text-xs font-medium text-muted-foreground">
                  Investment amount
                </Label>
                <div className="relative mt-1.5">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    ₹
                  </span>
                  <Input
                    id="amount"
                    type="number"
                    inputMode="numeric"
                    min={1000}
                    value={amount || ""}
                    onChange={(e) => setAmount(Number(e.target.value) || 0)}
                    className="pl-7 text-base font-medium tabular-nums"
                  />
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {amount > 0 ? formatINRCompact(amount) : "—"}
                </p>
              </div>

              <div>
                <Label className="text-xs font-medium text-muted-foreground">Tenure</Label>
                <div className="grid grid-cols-2 gap-2 mt-1.5">
                  <div className="relative">
                    <Input
                      type="number"
                      min={0}
                      max={10}
                      value={years}
                      onChange={(e) =>
                        setYears(Math.max(0, Math.min(10, Number(e.target.value) || 0)))
                      }
                      className="pr-12 tabular-nums"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      yrs
                    </span>
                  </div>
                  <div className="relative">
                    <Input
                      type="number"
                      min={0}
                      max={11}
                      value={months}
                      onChange={(e) =>
                        setMonths(Math.max(0, Math.min(11, Number(e.target.value) || 0)))
                      }
                      className="pr-12 tabular-nums"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      mos
                    </span>
                  </div>
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Total: {totalMonths} months
                </p>
              </div>

              <div>
                <Label className="text-xs font-medium text-muted-foreground">
                  Interest payout
                </Label>
                <div className="grid grid-cols-2 gap-2 mt-1.5">
                  {(["cumulative", "non-cumulative"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setPayoutType(t)}
                      className={cn(
                        "px-3 py-2 rounded-md text-xs font-medium border transition-all",
                        payoutType === t
                          ? "border-primary bg-primary/5 text-foreground"
                          : "border-border bg-background text-muted-foreground hover:border-foreground/20",
                      )}
                    >
                      {t === "cumulative" ? "Cumulative" : "Non-cumulative"}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {payoutType === "cumulative"
                    ? "Compounded quarterly"
                    : "Simple interest payout"}
                </p>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2.5">
                <div>
                  <Label htmlFor="senior" className="text-sm font-medium cursor-pointer">
                    Senior citizen
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">+0.5% rate benefit</p>
                </div>
                <Switch id="senior" checked={isSenior} onCheckedChange={setIsSenior} />
              </div>

              <div>
                <Label className="text-xs font-medium text-muted-foreground">
                  Banks to compare
                </Label>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {BANKS.map((b) => {
                    const active = selectedBanks.includes(b.id);
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => toggleBank(b.id)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                          active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background text-muted-foreground hover:border-foreground/20",
                        )}
                      >
                        {b.shortName}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>

          {/* Results */}
          <div className="space-y-6">
            {results.length === 0 ? (
              <Card className="p-10 text-center text-sm text-muted-foreground">
                Select at least one bank to compare returns.
              </Card>
            ) : (
              <>
                {/* Summary */}
                <Card
                  className="p-6 border-0 text-primary-foreground shadow-[var(--shadow-elevated)]"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <p className="text-xs uppercase tracking-wider opacity-80">Best return</p>
                      <h2 className="text-xl sm:text-2xl font-semibold mt-1">
                        {results[0].bankName}
                      </h2>
                      <p className="text-xs opacity-80 mt-1">
                        {tenureLabel} · {payoutType === "cumulative" ? "Cumulative" : "Non-cumulative"}
                        {isSenior && " · Senior"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wider opacity-80">Maturity</p>
                      <p className="text-2xl sm:text-3xl font-bold tabular-nums mt-1">
                        {formatINR(results[0].maturityAmount)}
                      </p>
                      <p className="text-xs opacity-90 mt-1 tabular-nums">
                        + {formatINR(results[0].totalInterest)} interest
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Comparison cards */}
                <div className="grid sm:grid-cols-2 gap-4">
                  {results.map((r) => {
                    const isBest = r.bankId === bestId;
                    return (
                      <Card
                        key={r.bankId}
                        className={cn(
                          "p-5 transition-all hover:shadow-[var(--shadow-elevated)]",
                          isBest && "ring-2 ring-primary/40",
                        )}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-sm">{r.bankName}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {r.rate ? `${r.rate.toFixed(2)}% p.a.` : "Tenure not supported"}
                            </p>
                          </div>
                          {isBest && (
                            <Badge className="bg-success text-success-foreground hover:bg-success/90 text-[10px]">
                              Best return
                            </Badge>
                          )}
                        </div>

                        {r.rate ? (
                          <div className="space-y-2.5">
                            <Row
                              label="Maturity amount"
                              value={formatINR(r.maturityAmount)}
                              emphasized
                            />
                            <Row
                              label="Total interest"
                              value={formatINR(r.totalInterest)}
                            />
                            <Row
                              label="Effective annual return"
                              value={`${r.effectiveAnnualReturn.toFixed(2)}%`}
                            />
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground py-4">
                            No rate slab available for {totalMonths} months.
                          </p>
                        )}
                      </Card>
                    );
                  })}
                </div>

                {/* Chart */}
                {results.filter((r) => r.rate).length > 1 && (
                  <Card className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold">Maturity comparison</h3>
                      <span className="text-xs text-muted-foreground">
                        Principal: {formatINR(amount)}
                      </span>
                    </div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={results
                            .filter((r) => r.rate)
                            .map((r) => ({
                              name: r.shortName,
                              Principal: amount,
                              Interest: Math.round(r.totalInterest),
                            }))}
                          margin={{ top: 8, right: 8, bottom: 0, left: 8 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="var(--color-border)"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="name"
                            tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v) => formatINRCompact(v)}
                          />
                          <Tooltip
                            cursor={{ fill: "var(--color-muted)" }}
                            contentStyle={{
                              backgroundColor: "var(--color-popover)",
                              border: "1px solid var(--color-border)",
                              borderRadius: "8px",
                              fontSize: "12px",
                            }}
                            formatter={(value: number) => formatINR(value)}
                          />
                          <Bar
                            dataKey="Principal"
                            stackId="a"
                            fill="var(--color-chart-1)"
                            radius={[0, 0, 0, 0]}
                          />
                          <Bar
                            dataKey="Interest"
                            stackId="a"
                            fill="var(--color-chart-2)"
                            radius={[6, 6, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                )}
              </>
            )}

            <p className="text-[11px] text-muted-foreground text-center">
              Sample rates for illustration. Verify with your bank before investing.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function Row({
  label,
  value,
  emphasized,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span
        className={cn(
          "tabular-nums",
          emphasized ? "font-semibold text-base" : "font-medium",
        )}
      >
        {value}
      </span>
    </div>
  );
}
