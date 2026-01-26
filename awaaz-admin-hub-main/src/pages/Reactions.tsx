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
import { Plus, Upload, Trash2 } from "lucide-react";

interface Reaction {
    id: string;
    name: string;
    iconUrl?: string;
}

const fallback: Reaction[] = [
    { id: "r1", name: "Like" },
    { id: "r2", name: "Helpful" },
];

export default function Reactions() {
    const [name, setName] = useState("");
    const [iconFile, setIconFile] = useState<File | null>(null);

    const { data = fallback, isLoading, refetch } = useQuery({
        queryKey: ["reactions"],
        queryFn: async () => {
            const res = await api.get("/admin/v1/event-reaction/list");
            const rows = res.data?.data || [];
            return (rows as any[]).map((item) => ({
                id: item._id,
                name: item.reactionName,
                iconUrl: item.reactionIcon,
            }));
        },
    });

    const handleSave = async () => {
        if (!name) {
            toast.error("Name is required");
            return;
        }
        if (!iconFile) {
            toast.error("Icon is required");
            return;
        }

        const fd = new FormData();
        fd.append("reactionName", name);
        fd.append("reactionIcon", iconFile);

        try {
            await api.post("/admin/v1/event-reaction/add", fd, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            toast.success("Reaction created");
            setName("");
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
            toast.success("Reaction removed");
            refetch();
        } catch (err) {
            toast.error("Failed to delete", { description: String(err) });
        }
    };

    return (
        <AdminLayout title="Reactions">
            <div className="grid gap-6 lg:grid-cols-[1.2fr,2fr]">
                <Card>
                    <CardHeader>
                        <CardTitle>Create / Update Reaction</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Input placeholder="Reaction name" value={name} onChange={(e) => setName(e.target.value)} />
                        <Input type="file" accept="image/*" onChange={(e) => setIconFile(e.target.files?.[0] || null)} />
                        <div className="flex gap-2">
                            <Button className="gap-2" onClick={handleSave}>
                                <Plus className="h-4 w-4" /> Save
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="overflow-hidden">
                    <CardHeader>
                        <CardTitle>Reactions</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Icon</TableHead>
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
                                    : data.map((reaction) => (
                                        <TableRow key={reaction.id}>
                                            <TableCell>{reaction.name}</TableCell>
                                            <TableCell>
                                                {reaction.iconUrl ? (
                                                    <img src={reaction.iconUrl} alt={reaction.name} className="h-8 w-8 rounded" />
                                                ) : (
                                                    <span className="text-muted-foreground text-sm">No icon</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(reaction.id)}>
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
