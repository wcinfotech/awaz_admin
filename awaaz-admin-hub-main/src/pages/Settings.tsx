import { AdminLayout } from "@/components/layout/AdminLayout";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Camera } from "lucide-react";

const Settings = () => {
  return (
    <AdminLayout title="Settings">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-2xl space-y-8"
      >
        {/* Profile Section */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <h3 className="text-lg font-semibold text-foreground mb-6">
            Profile Settings
          </h3>
          <div className="flex items-center gap-6 mb-6">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                  AD
                </AvatarFallback>
              </Avatar>
              <button className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <div>
              <h4 className="font-medium text-foreground">Admin User</h4>
              <p className="text-sm text-muted-foreground">admin@awaaz.com</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" defaultValue="Admin" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" defaultValue="User" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue="admin@awaaz.com" />
            </div>
          </div>
          <div className="mt-6">
            <Button>Save Changes</Button>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <h3 className="text-lg font-semibold text-foreground mb-6">
            Notification Preferences
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Email Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Receive email updates for important events
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Push Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Get browser notifications for real-time alerts
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Weekly Reports</p>
                <p className="text-sm text-muted-foreground">
                  Receive weekly summary reports via email
                </p>
              </div>
              <Switch />
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <h3 className="text-lg font-semibold text-foreground mb-6">
            Security
          </h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input id="currentPassword" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input id="newPassword" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input id="confirmPassword" type="password" />
            </div>
          </div>
          <div className="mt-6">
            <Button variant="outline">Update Password</Button>
          </div>
        </div>
      </motion.div>
    </AdminLayout>
  );
};

export default Settings;
