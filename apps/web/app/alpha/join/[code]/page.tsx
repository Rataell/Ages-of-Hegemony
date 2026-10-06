import { redirect } from 'next/navigation';

/** Invite link: /alpha/join/<code> opens the entry screen with the code already filled. */
export default async function JoinInvite({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  redirect(`/alpha?join=${encodeURIComponent(code.slice(0, 22))}`);
}
