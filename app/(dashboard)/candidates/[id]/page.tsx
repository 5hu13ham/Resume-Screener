import { notFound } from "next/navigation";

import { getCurrentUser } from "@/src/application/use-cases/get-current-user";
import { getContainer } from "@/src/infrastructure/di/container";
import { CandidateDetailView } from "@/src/presentation/components/candidate-detail";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function CandidateDetailPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) notFound();

  const { id } = await params;
  const { screeningRepository } = getContainer();
  const candidate = await screeningRepository.getCandidate(user.id, id);
  if (!candidate) notFound();

  const session = await screeningRepository.getSession(
    user.id,
    candidate.sessionId,
  );

  return <CandidateDetailView candidate={candidate} session={session} />;
}
