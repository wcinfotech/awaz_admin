import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import { toast } from "sonner";
import { Plus, Trash2, Pencil } from "lucide-react";

interface Draft {
    id: string;
    title: string;
    type: string;
    updatedAt: string;
}

const fallback: Draft[] = [
    { id: "d1", title: "Relief drop - East zone", type: "Event", updatedAt: "2026-01-03" },
];

export default function EventDrafts() {
    const [search, setSearch] = useState("");

    const { data = fallback, isLoading, refetch } = useQuery({
        queryKey: ["event-drafts", search],
        queryFn: async () => {
            const res = await api.get("/events/drafts", { params: { search } });
            return res.data as Draft[];
        },
    });

    const handleDelete = async (id: string) => {
        try {
            await api.delete(`/events/drafts/${id}`);
            toast.success("Draft deleted");
            refetch();
        } catch (err) {
            toast.error("Failed to delete draft", { description: String(err) });
        }
    };

    return (
        <AdminLayout title="Event Drafts">
            <div className="space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Input
                        placeholder="Search drafts"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="sm:max-w-xs"
                    />
                    <Button className="gap-2" onClick={() => toast.info("Create event draft")}>
                        <Plus className="h-4 w-4" />
                        New Draft
                    </Button>
                </div>

                <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Last Updated</TableHead>
                                <TableHead className="w-32">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading
                                ? Array.from({ length: 4 }).map((_, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell colSpan={4}>
                                            <Skeleton className="h-10 w-full" />
                                        </TableCell>
                                    </TableRow>
                                ))
                                : data.map((draft) => (
                                    <TableRow key={draft.id}>
                                        <TableCell>{draft.title}</TableCell>
                                        <TableCell>{draft.type}</TableCell>
                                        <TableCell>{draft.updatedAt}</TableCell>
                                        <TableCell className="flex gap-2">
                                            <Button size="sm" variant="outline" className="gap-1" onClick={() => toast.info("Open draft editor")}>
                                                <Pencil className="h-4 w-4" />
                                                Edit
                                            </Button>
                                            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(draft.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </AdminLayout>
    );
}
