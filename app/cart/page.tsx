import { PublicNav } from "@/components/layout/PublicNav";
import { CartContents } from "@/components/marketplace/CartContents";

export default function CartPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PublicNav />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <CartContents />
      </main>
    </div>
  );
}
