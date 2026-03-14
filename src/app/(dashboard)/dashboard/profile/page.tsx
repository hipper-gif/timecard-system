import { getProfile } from "@/actions/profile";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const profile = await getProfile();
  return <ProfileClient profile={profile} />;
}
