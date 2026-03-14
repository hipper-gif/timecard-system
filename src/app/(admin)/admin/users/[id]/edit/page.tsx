import { getUserById } from "@/actions/admin";
import { notFound } from "next/navigation";
import EditUserForm from "./EditUserForm";

type Props = { params: Promise<{ id: string }> };

export default async function EditUserPage({ params }: Props) {
  const { id } = await params;
  const user = await getUserById(id);
  if (!user) notFound();
  return <EditUserForm user={user} />;
}
