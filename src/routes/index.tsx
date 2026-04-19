import { createFileRoute } from "@tanstack/react-router";
import { FdCalculator } from "@/components/FdCalculator";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "FD Calculator — Compare Fixed Deposit Returns Across Banks" },
      {
        name: "description",
        content:
          "Calculate FD maturity, interest and effective returns. Compare SBI, HDFC, ICICI, and Axis side-by-side. Fast, free, no signup.",
      },
    ],
  }),
});

function Index() {
  return <FdCalculator />;
}
