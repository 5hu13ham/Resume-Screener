import { redirect } from "next/navigation";

import { getCurrentUser } from "@/src/application/use-cases/get-current-user";

export default async function HomePage() {
  const user = await getCurrentUser();
  redirect(user ? "/dashboard" : "/login");
}
