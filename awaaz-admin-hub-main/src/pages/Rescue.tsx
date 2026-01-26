import { useMemo, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { LifeBuoy, MapPin, Phone, Radio, ShieldCheck, Plus, Check, X } from "lucide-react";
import { format } from "date-fns";

const initialRescueQueue = [
    {
        id: "r1",
        title: "Water rescue team dispatched",
        status: "Active",
        location: "Yamuna Bank",
        reportedAt: new Date("2026-01-10T08:15:00"),
        timeline: [
            { id: "t1", text: "Reported by user", time: new Date("2026-01-10T08:00:00") },
        ],
    },
    {
        id: "r2",
        title: "Medical triage requested",
        status: "Queued",
        location: "Sector 62",
        reportedAt: new Date("2026-01-10T07:40:00"),
        timeline: [],
    },
    {
        id: "r3",
        title: "Collapsed structure - evacuation",
        status: "Resolved",
        location: "MG Road",
        reportedAt: new Date("2026-01-09T21:15:00"),
        timeline: [
            { id: "t2", text: "Teams on site", time: new Date("2026-01-09T21:45:00") },
        ],
    },
];

export default function RescuePage() {
    const [tasks, setTasks] = useState(initialRescueQueue);
    const [selectedId, setSelectedId] = useState<string | null>(tasks[0]?.id ?? null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newTask, setNewTask] = useState({ title: "", location: "", notes: "", startDate: new Date() });

    const stats = useMemo(() => ({
        total: tasks.length,
        active: tasks.filter((t) => t.status === "Active").length,
        queued: tasks.filter((t) => t.status === "Queued").length,
        resolved: tasks.filter((t) => t.status === "Resolved").length,
    }), [tasks]);

    const selectedTask = tasks.find((t) => t.id === selectedId) || null;

    const handleCreateTask = async () => {
        if (!newTask.title.trim() || !newTask.location.trim()) {
            toast.error("Please enter title and location");
            return;
        }
        const created = {
            id: `r-${Date.now()}`,
            title: newTask.title,
            status: "Queued",
            location: newTask.location,
            reportedAt: newTask.startDate,
            timeline: [{ id: `tl-${Date.now()}`, text: newTask.notes || "Task created", time: new Date() }],
        };
        setTasks((prev) => [created, ...prev]);
        toast.success("Rescue task created");
        setIsCreateOpen(false);
        setNewTask({ title: "", location: "", notes: "", startDate: new Date() });
        setSelectedId(created.id);
    };

    const updateTaskStatus = (id: string, status: string) => {
        setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
        toast.success(`Task marked ${status}`);
    };

    const addTaskNote = (id: string, text: string) => {
        if (!text.trim()) return;
        setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, timeline: [...t.timeline, { id: `n-${Date.now()}`, text, time: new Date() }] } : t)));
        toast.success("Update logged");
    };

    return (
        <AdminLayout title="Rescue">
            <div className="space-y-6 text-foreground">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-2xl font-semibold">Rescue Console</h2>
                        <p className="text-sm text-muted-foreground">Coordinate rescue tasks and monitor updates in real-time.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="grid grid-cols-3 gap-3 mr-3">
                            <Card className="border-white/10 bg-card/80 px-3 py-2">
                                <CardHeader>
                                    <CardTitle className="text-sm">Active</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-semibold">{stats.active}</div>
                                </CardContent>
                            </Card>
                            <Card className="border-white/10 bg-card/80 px-3 py-2">
                                <CardHeader>
                                    <CardTitle className="text-sm">Queued</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-semibold">{stats.queued}</div>
                                </CardContent>
                            </Card>
                            <Card className="border-white/10 bg-card/80 px-3 py-2">
                                <CardHeader>
                                    <CardTitle className="text-sm">Resolved</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-semibold">{stats.resolved}</div>
                                </CardContent>
                            </Card>
                        </div>
                        <Button className="gap-2 bg-blue-600 hover:bg-blue-500" onClick={() => setIsCreateOpen(true)}><Plus className="h-4 w-4" /> Create Rescue Task</Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-[1fr_420px]">
                    {/* Left: Task list */}
                    <div>
                        <Card className="border-white/10 bg-card">
                            <CardHeader>
                                <CardTitle>Rescue Tasks</CardTitle>
                                <p className="text-sm text-muted-foreground">Only rescue-category tasks are shown here.</p>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="max-h-[520px] overflow-y-auto space-y-2 pr-2">
                                    {tasks.map((task) => (
                                        <div
                                            key={task.id}
                                            className={`p-4 rounded-md border ${selectedId === task.id ? 'border-blue-500 bg-card/90' : 'border-white/10 bg-card/80'} cursor-pointer`}
                                            onClick={() => setSelectedId(task.id)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="font-semibold text-white">{task.title}</div>
                                                    <div className="text-xs text-muted-foreground flex items-center gap-2"><MapPin className="h-3 w-3" /> {task.location}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs text-muted-foreground">{format(task.reportedAt, 'MMM dd, yyyy • hh:mm a')}</div>
                                                    <Badge variant="outline" className={`mt-2 ${task.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400' : task.status === 'Queued' ? 'bg-blue-500/20 text-blue-300' : 'bg-gray-500/20 text-white/80'}`}>{task.status}</Badge>
                                                </div>
                                            </div>
                                            {task.status === 'Queued' && (
                                                <div className="mt-3 flex gap-2">
                                                    <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600" onClick={() => updateTaskStatus(task.id, 'Active')}><LifeBuoy className="h-4 w-4 mr-2" /> Dispatch</Button>
                                                    <Button size="sm" variant="outline" onClick={() => updateTaskStatus(task.id, 'Resolved')}>Resolve</Button>
                                                </div>
                                            )}
                                            {task.status === 'Active' && (
                                                <div className="mt-3 flex gap-2">
                                                    <Button size="sm" className="bg-green-600 hover:bg-green-500" onClick={() => updateTaskStatus(task.id, 'Resolved')}><Check className="h-4 w-4 mr-2" /> Complete</Button>
                                                    <Button size="sm" variant="outline" onClick={() => updateTaskStatus(task.id, 'Queued')}><X className="h-4 w-4 mr-2" /> Re-queue</Button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right: Selected task details + log updates */}
                    <div>
                        <Card className="border-white/10 bg-card">
                            <CardHeader>
                                <CardTitle>Task Details</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {selectedTask ? (
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-3">
                                            <div className="flex-1">
                                                <div className="text-lg font-semibold text-white">{selectedTask.title}</div>
                                                <div className="text-sm text-muted-foreground flex items-center gap-2"><MapPin className="h-4 w-4" /> {selectedTask.location}</div>
                                                <div className="mt-2 text-xs text-muted-foreground">Reported: {format(selectedTask.reportedAt, 'PPP p')}</div>
                                            </div>
                                            <div>
                                                <Badge variant="outline" className={` ${selectedTask.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400' : selectedTask.status === 'Queued' ? 'bg-blue-500/20 text-blue-300' : 'bg-gray-500/20 text-white/80'}`}>{selectedTask.status}</Badge>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-white">Log Update</Label>
                                            <Textarea placeholder="Add notes for the rescue team" rows={4} id="rescueNotes" />
                                            <div className="flex gap-2">
                                                <Button className="gap-2 bg-blue-600 hover:bg-blue-500" onClick={() => {
                                                    const el = document.getElementById('rescueNotes') as HTMLTextAreaElement | null;
                                                    if (el && selectedTask) {
                                                        addTaskNote(selectedTask.id, el.value);
                                                        el.value = '';
                                                    }
                                                }}><Radio className="h-4 w-4" /> Send Update</Button>
                                                <Button variant="outline" className="gap-2" onClick={() => { if (selectedTask) updateTaskStatus(selectedTask.id, 'Resolved'); }}><Check className="h-4 w-4" /> Mark Resolved</Button>
                                            </div>
                                        </div>

                                        <div>
                                            <Label className="text-white">Timeline</Label>
                                            <div className="mt-2 space-y-2 max-h-40 overflow-y-auto pr-2">
                                                {selectedTask.timeline.map((n) => (
                                                    <div key={n.id} className="rounded-md bg-white/3 p-2 text-sm text-white/90">
                                                        <div className="flex items-center justify-between">
                                                            <div>{n.text}</div>
                                                            <div className="text-xs text-white/60">{format(n.time, 'hh:mm a')}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                    </div>
                                ) : (
                                    <div className="text-sm text-muted-foreground">Select a task to view details</div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Create Rescue Dialog */}
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogContent className="max-w-md bg-[#1a1a1f] border-white/10">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-semibold text-white">Create Rescue Task</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 p-4">
                            <div className="space-y-2">
                                <Label className="text-white">Title</Label>
                                <Input value={newTask.title} onChange={(e) => setNewTask((p) => ({ ...p, title: e.target.value }))} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-white">Location</Label>
                                <Input value={newTask.location} onChange={(e) => setNewTask((p) => ({ ...p, location: e.target.value }))} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-white">Start Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-full justify-between bg-white/5 border-white/10 text-white hover:bg-white/10">{format(newTask.startDate, 'MM/dd/yyyy hh:mm a')}</Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar mode="single" selected={newTask.startDate} onSelect={(d) => d && setNewTask((p) => ({ ...p, startDate: d }))} initialFocus />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-white">Notes</Label>
                                <Textarea rows={4} value={newTask.notes} onChange={(e) => setNewTask((p) => ({ ...p, notes: e.target.value }))} />
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                                <Button className="bg-emerald-500 hover:bg-emerald-600" onClick={handleCreateTask}>Create</Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    );
}
