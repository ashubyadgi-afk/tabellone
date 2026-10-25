import { PublicNav } from "@/components/layout/PublicNav";
import { WishlistContents } from "@/components/marketplace/WishlistContents";

export default function WishlistPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PublicNav />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <WishlistContents />
      </main>
    </div>
  );
}
