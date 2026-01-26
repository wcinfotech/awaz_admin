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
    updatedAt: string;
}

const fallback: Draft[] = [
    { id: "g1", title: "General awareness post", updatedAt: "2026-01-02" },
];

export default function GeneralDrafts() {
    const [search, setSearch] = useState("");

    const { data = fallback, isLoading, refetch } = useQuery({
        queryKey: ["general-drafts", search],
        queryFn: async () => {
            const res = await api.get("/general/drafts", { params: { search } });
            return res.data as Draft[];
        },
    });

    const handleDelete = async (id: string) => {
        try {
            await api.delete(`/general/drafts/${id}`);
            toast.success("Draft deleted");
            refetch();
        } catch (err) {
            toast.error("Failed to delete draft", { description: String(err) });
        }
    };

    return (
        <AdminLayout title="General Drafts">
            <div className="space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Input
                        placeholder="Search drafts"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="sm:max-w-xs"
                    />
                    <Button className="gap-2" onClick={() => toast.info("Create general draft")}>
                        <Plus className="h-4 w-4" />
                        New Draft
                    </Button>
                </div>

                <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Last Updated</TableHead>
                                <TableHead className="w-32">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading
                                ? Array.from({ length: 4 }).map((_, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell colSpan={3}>
                                            <Skeleton className="h-10 w-full" />
                                        </TableCell>
                                    </TableRow>
                                ))
                                : data.map((draft) => (
                                    <TableRow key={draft.id}>
                                        <TableCell>{draft.title}</TableCell>
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
