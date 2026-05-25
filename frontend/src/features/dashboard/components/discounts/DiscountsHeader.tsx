import { Percent } from 'lucide-react';

export default function DiscountsHeader() {
  return (
    <div>
      <div className="mb-1 flex items-center gap-2">
        <Percent className="size-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Discounts Catalog</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Register promotional checkout codes, set campaign percentages, and configure billing rules.
      </p>
    </div>
  );
}
