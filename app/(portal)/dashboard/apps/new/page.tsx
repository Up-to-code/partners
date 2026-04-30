import { PartnerAppForm } from "@/components/forms/PartnerAppForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewAppPage() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
        <ArrowLeft className="h-4 w-4" />
        Back to Apps
      </Link>
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Create New Application
        </h1>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-2xl">
          Use public clients with PKCE for browser-based integrations and confidential clients for trusted server apps.
        </p>
      </div>
      
      <div className="max-w-3xl rounded-xl border border-border bg-card p-8">
        <PartnerAppForm />
      </div>
    </div>
  );
}
