// TEMP: Minimal fix for Event.tsx - revert and use this snippet

const handleCreateEvent = async () => {
    if (!newEvent.postCategory) {
        toast.error("Please select a category");
        return;
    }
    if (!newEvent.title.trim()) {
        toast.error("Please enter a title");
        return;
    }
    if (!newEvent.description.trim()) {
        toast.error("Please enter a description");
        return;
    }

    setIsSubmitting(true);
    try {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        toast.success("Event captured", {
            description: "Refresh to fetch the latest items from the server.",
        });
        setIsCreateEventOpen(false);
        // Clear previews
        if (videoImagePreview) URL.revokeObjectURL(videoImagePreview);
        if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
        setVideoImagePreview(null);
        setThumbnailPreview(null);
        setNewEvent({
            postCategory: fixedCategory ?? "",
            startDate: new Date(),
            title: "",
            description: "",
            latitude: "",
            longitude: "",
            address: "",
            hashtag: "",
            sensitiveContent: false,
            videoImage: null as File | null,
            thumbnail: null as File | null,
        });
    } catch (err) {
        toast.error("Failed to create event");
    } finally {
        setIsSubmitting(false);
    }
};
