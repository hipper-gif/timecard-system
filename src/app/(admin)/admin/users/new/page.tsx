import { getDepartmentOptions } from "@/actions/department";
import NewUserForm from "./NewUserForm";

export default async function NewUserPage() {
  const departments = await getDepartmentOptions();
  return <NewUserForm departments={departments} />;
}
