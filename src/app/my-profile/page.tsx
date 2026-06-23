"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, ShieldUser, Calendar, Loader2, Save, KeyRound, EyeOff, Eye } from "lucide-react";

import { authService } from "@/services/api";
import { useUserStore } from "@/store/userStore";

export default function SettingsPage() {
  const { updateMyProfile, changeMyPassword, updating, changingPasswordId } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [userName, setUserName] = useState("");
  const [phone, setPhone] = useState("");
  const [originalName, setOriginalName] = useState("");
  const [originalUserName, setOriginalUserName] = useState("");
  const [originalPhone, setOriginalPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);

  interface CurrentUser {
    id: string;
    name: string;
    userName: string;
    email: string;
    phone?: string | null;
    roles: string[];
    createdAt: string;
  }

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await authService.getProfile();

        const user = res.data?.data || res.data;
        setCurrentUser(user);

        setName(user?.name || "");
        setUserName(user?.userName || "");
        setPhone(user?.phone || "");

        setOriginalName(user?.name || "");
        setOriginalUserName(user?.userName || "");
        setOriginalPhone(user?.phone || "");
      } catch (error) {
        console.error(error);
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const hasChanges = name !== originalName || userName !== originalUserName || phone !== originalPhone;

  const handleProfileUpdate = async () => {
    if (!currentUser) return;

    if (!name.trim()) {
      toast.error("Full Name is required");
      return;
    }

    if (!userName.trim()) {
      toast.error("Username is required");
      return;
    }

    try {
      const updatedUser = await updateMyProfile({
        name: name.trim(),
        userName: userName.trim(),
        phone: phone.trim() || null,
      });

      setCurrentUser((prev) =>
        prev
          ? {
              ...prev,
              ...updatedUser,
            }
          : null
      );

      setName(updatedUser.name || "");
      setUserName(updatedUser.userName || "");
      setPhone(updatedUser.phone || "");

      setOriginalName(updatedUser.name || "");
      setOriginalUserName(updatedUser.userName || "");
      setOriginalPhone(updatedUser.phone || "");

      toast.success("Profile updated successfully");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update profile";

      toast.error(message);
    }
  };

  const handlePasswordChange = async () => {
    if (!currentUser) return;

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill all password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      await changeMyPassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      toast.success("Password changed successfully");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to change password";

      toast.error(message);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Profile</h1>

          <p className="text-muted-foreground">Manage your account settings</p>
        </div>

        {/* Profile Details */}
        <div className="bg-card rounded-md border border-border/60 p-5">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Profile Information</h2>

            <p className="text-sm text-muted-foreground">Your account details</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <User className="size-5 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Full Name</p>
                <p className="font-medium">{currentUser?.name || "-"}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User className="size-5 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Username</p>
                <p className="font-medium">{currentUser?.userName || "-"}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="size-5 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-medium">{currentUser?.email || "-"}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="size-5 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="font-medium">{currentUser?.phone || "-"}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <ShieldUser className="size-5 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Role</p>

                <div className="flex gap-2 flex-wrap mt-1">
                  {currentUser?.roles?.map((role: string) => (
                    <Badge key={role}>{role}</Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="size-5 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Created At</p>

                <p className="font-medium">
                  {currentUser?.createdAt
                    ? new Date(currentUser.createdAt).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "-"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Profile */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <div className="bg-card rounded-md border border-border/60 p-5">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Edit Profile</h2>

              <p className="text-sm text-muted-foreground">Update your account information</p>
            </div>

            <div className="space-y-4">
              <FieldGroup>
                <Field>
                  <Label>Full Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </Field>
              </FieldGroup>

              <FieldGroup>
                <Field>
                  <Label>Username</Label>
                  <Input value={userName} onChange={(e) => setUserName(e.target.value)} />
                </Field>
              </FieldGroup>

              <FieldGroup>
                <Field>
                  <Label>Phone</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                </Field>
              </FieldGroup>

              <FieldGroup>
                <Field>
                  <Label>Email</Label>
                  <Input value={currentUser?.email || ""} disabled />
                </Field>
              </FieldGroup>

              <Button onClick={handleProfileUpdate} disabled={!hasChanges || updating} className="gap-2 min-w-[150px]">
                {updating ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="size-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Change Password */}
          <div className="bg-card rounded-md border border-border/60 p-5">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Change Password</h2>

              <p className="text-sm text-muted-foreground">Update your password</p>
            </div>

            <div className="space-y-4">
              <FieldGroup>
                <Field>
                  <Label>Current Password</Label>
                  <div className="relative">
                    <Input type={showCurrentPassword ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="pr-10" />
                    <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                      {showCurrentPassword ? <Eye className="size-5" /> : <EyeOff className="size-5" />}
                    </button>
                  </div>
                </Field>
              </FieldGroup>

              <FieldGroup>
                <Field>
                  <Label>New Password</Label>
                  <div className="relative">
                    <Input type={showCurrentPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="pr-10" />
                    <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                      {showCurrentPassword ? <Eye className="size-5" /> : <EyeOff className="size-5" />}
                    </button>
                  </div>
                </Field>
              </FieldGroup>

              <FieldGroup>
                <Field>
                  <Label>Confirm Password</Label>
                  <div className="relative">
                    <Input type={showCurrentPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="pr-10" />
                    <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                      {showCurrentPassword ? <Eye className="size-5" /> : <EyeOff className="size-5" />}
                    </button>
                  </div>
                </Field>
              </FieldGroup>

              <Button onClick={handlePasswordChange} disabled={!newPassword || !confirmPassword || !!changingPasswordId} className="gap-2">
                {changingPasswordId ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Changing...
                  </>
                ) : (
                  <>
                    <KeyRound className="size-4" />
                    Change Password
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
