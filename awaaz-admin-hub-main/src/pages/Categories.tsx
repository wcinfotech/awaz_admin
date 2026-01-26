import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

interface Category {
    id: string;
    name: string;
    parent?: string;
    iconUrl?: string;
}

const fallback: Category[] = [
    { id: "c1", name: "Rescue" },
    { id: "c2", name: "Medical", parent: "Rescue" },
];

export default function Categories() {
    const [name, setName] = useState("");
    const [parent, setParent] = useState("");
    const [postType, setPostType] = useState("incident");
    const [notificationName, setNotificationName] = useState("");
    const [iconFile, setIconFile] = useState<File | null>(null);

    const { data = fallback, isLoading, refetch } = useQuery({
        queryKey: ["categories", postType],
        queryFn: async () => {
            const res = await api.get("/admin/v1/event-reaction/list", {
                params: { postType },
            });
            const rows = res.data?.data || [];
            return (rows as any[]).map((item) => ({
                id: item._id,
                name: item.eventName,
                parent: undefined,
                iconUrl: item.eventIcon,
            }));
        },
    });

    const handleSave = async () => {
        if (!name) {
            toast.error("Name is required");
            return;
        }
        if (!notificationName) {
            toast.error("Notification name is required");
            return;
        }
        if (!iconFile) {
            toast.error("Icon is required");
            return;
        }

        const fd = new FormData();
        fd.append("eventName", name);
        fd.append("notificationCategotyName", notificationName);
        fd.append("postType", postType);
        fd.append("eventIcon", iconFile);

        try {
            await api.post("/admin/v1/event-category/add", fd, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            toast.success("Category created");
            setName("");
            setParent("");
            setNotificationName("");
            setIconFile(null);
            refetch();
        } catch (err: any) {
            const msg = err?.response?.data?.message || err?.message || "Failed to create";
            toast.error("Create failed", { description: msg });
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await api.delete(`/admin/v1/event-reaction/delete/${id}`);
            toast.success("Category removed");
            refetch();
        } catch (err) {
            toast.error("Failed to delete", { description: String(err) });
        }
    };

    return (
        <AdminLayout title="Categories & Sub-categories">
            <div className="grid gap-6 lg:grid-cols-[1.2fr,2fr]">
                <Card>
                    <CardHeader>
                        <CardTitle>Create / Update Category</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
                        <Input placeholder="Notification name" value={notificationName} onChange={(e) => setNotificationName(e.target.value)} />
                        <Input placeholder="Post type (incident/rescue/general_category)" value={postType} onChange={(e) => setPostType(e.target.value)} />
                        <Input type="file" accept="image/*" onChange={(e) => setIconFile(e.target.files?.[0] || null)} />
                        <Button className="gap-2" onClick={handleSave}>
                            <Plus className="h-4 w-4" /> Save
                        </Button>
                    </CardContent>
                </Card>

                <Card className="overflow-hidden">
                    <CardHeader>
                        <CardTitle>Categories</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Parent</TableHead>
                                    <TableHead className="w-24">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading
                                    ? Array.from({ length: 5 }).map((_, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell colSpan={3}>
                                                <Skeleton className="h-10 w-full" />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                    : data.map((cat) => (
                                        <TableRow key={cat.id}>
                                            <TableCell>{cat.name}</TableCell>
                                            <TableCell>{cat.parent || "-"}</TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(cat.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
