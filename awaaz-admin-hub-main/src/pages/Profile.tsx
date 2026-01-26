import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Profile() {
    const [firstName, setFirstName] = useState("Admin");
    const [lastName, setLastName] = useState("User");
    const [email, setEmail] = useState("admin@awaaz.com");
    const [radius, setRadius] = useState("10");

    const handleSave = () => {
        toast.info("Wire profile update to /admins/profile");
    };

    return (
        <AdminLayout title="Admin Profile">
            <div className="max-w-2xl space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Profile</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>First Name</Label>
                                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Last Name</Label>
                                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Admin Radius (km)</Label>
                            <Input value={radius} onChange={(e) => setRadius(e.target.value)} />
                        </div>
                        <Button onClick={handleSave}>Save Changes</Button>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
