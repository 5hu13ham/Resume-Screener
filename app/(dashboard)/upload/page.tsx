import Link from "next/link";
import { getCurrentUser } from "@/src/application/use-cases/get-current-user";
import { ScreeningWizard } from "@/src/presentation/components/screening-wizard";

export default async function UploadPage() {
  const user = await getCurrentUser();
  if (user?.isDemo) {
    return (
      <div className="space-y-4 rounded-2xl border border-brand/30 bg-brand-soft/30 p-8">
        <h1 className="text-2xl font-semibold text-slate-900">Synthetic demo only</h1>
        <p className="max-w-xl text-sm leading-6 text-slate-700">
          Personal resume uploads are disabled in the public portfolio sandbox.
          Explore nine generated sample candidates instead. This protects visitors'
          information and avoids accidental real hiring decisions.
        </p>
        <Link href="/dashboard" className="inline-block rounded-xl bg-brand px-4 py-2 text-white">
          Explore the sample screening
        </Link>
      </div>
    );
  }
  return <ScreeningWizard />;
}
