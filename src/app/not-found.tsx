import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <SearchX className="size-10 text-muted-foreground" strokeWidth={1.5} />
      <h1 className="text-lg font-semibold">Page not found</h1>
      <p className="text-sm text-muted-foreground">
        That job or page doesn&apos;t exist, or has been removed.
      </p>
      <Button className="mt-2" render={<Link href="/" />}>
        Back to dashboard
      </Button>
    </div>
  );
}
