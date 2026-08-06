import { redirect } from "next/navigation";

import { getCurrentUser } from "@/src/application/use-cases/get-current-user";
import { AppShell } from "@/src/presentation/components/app-shell";

export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return <AppShell user={user}>{children}</AppShell>;
}
