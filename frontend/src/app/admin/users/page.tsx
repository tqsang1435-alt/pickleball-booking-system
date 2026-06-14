// src/app/admin/users/page.tsx
import UserManagement from "@/modules/admin/user-management/UserManagement";

export const metadata = { title: "Quản lý tài khoản | Admin" };

export default function AdminUsersPage() {
    return <UserManagement />;
}