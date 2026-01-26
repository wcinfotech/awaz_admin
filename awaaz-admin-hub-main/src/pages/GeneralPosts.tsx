import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { toast } from "sonner";
import { Upload, ImageIcon, Pencil } from "lucide-react";

interface GeneralPost {
    id: string;
    title: string;
    status: "DRAFT" | "PUBLISHED";
    thumbnail?: string;
    updatedAt: string;
}

const fallback: GeneralPost[] = [
    { id: "g1", title: "Community meetup", status: "PUBLISHED", updatedAt: "2026-01-02" },
];

export default function GeneralPosts() {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");

    const { data = fallback, isLoading } = useQuery({
        queryKey: ["general-posts"],
        queryFn: async () => {
            const res = await api.get("/general/posts");
            return res.data as GeneralPost[];
        },
    });

    const handleCreate = async () => {
        if (!title || !content) {
            toast.error("Title and content are required");
            return;
        }
        toast.info("Hook create general post API");
    };

    return (
        <AdminLayout title="General Posts">
            <div className="grid gap-6 lg:grid-cols-[2fr,1.2fr]">
                <Card>
                    <CardHeader>
                        <CardTitle>Create / Update</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Input
                            placeholder="Post title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                        <Textarea
                            rows={8}
                            placeholder="Post content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />
                        <div className="flex flex-wrap gap-3">
                            <Button className="gap-2" onClick={handleCreate}>
                                <Pencil className="h-4 w-4" />
                                Save Post
                            </Button>
                            <Button variant="outline" className="gap-2" onClick={() => toast.info("Upload gallery")}>
                                <ImageIcon className="h-4 w-4" />
                                Media Gallery
                            </Button>
                            <Button variant="secondary" className="gap-2" onClick={() => toast.info("Upload thumbnail")}>
                                <Upload className="h-4 w-4" />
                                Upload Thumbnail
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="overflow-hidden">
                    <CardHeader>
                        <CardTitle>All Posts</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Updated</TableHead>
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
                                    : data.map((post) => (
                                        <TableRow key={post.id}>
                                            <TableCell>{post.title}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={post.status === "PUBLISHED" ? "text-success border-success/30" : "text-muted-foreground"}>
                                                    {post.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{post.updatedAt}</TableCell>
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
