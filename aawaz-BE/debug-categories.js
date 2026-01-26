// Debug script to verify category data in MongoDB
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGODB_URL;

console.log("=== DEBUG CATEGORIES ===");
console.log("1. Mongo URI:", MONGO_URI ? "Found" : "MISSING!");

async function debug() {
    try {
        console.log("\n2. Connecting to MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("   ✅ Connected!");

        // List all collections
        console.log("\n3. All collections in database:");
        const collections = await mongoose.connection.db.listCollections().toArray();
        collections.forEach(c => console.log("   -", c.name));

        // Check AdminEventReaction collection
        console.log("\n4. Checking 'admineventreactions' collection:");
        const reactionCount = await mongoose.connection.db.collection("admineventreactions").countDocuments();
        console.log("   Count:", reactionCount);

        if (reactionCount > 0) {
            const reactions = await mongoose.connection.db.collection("admineventreactions").find({}).limit(5).toArray();
            console.log("\n5. Sample reactions (first 5):");
            reactions.forEach((r, i) => {
                console.log(`   ${i + 1}. ${r.reactionName} - ${r._id}`);
            });
        }

        // Also check AdminEventType (event-category)
        console.log("\n6. Checking 'admineventtypes' collection:");
        const typeCount = await mongoose.connection.db.collection("admineventtypes").countDocuments();
        console.log("   Count:", typeCount);

        if (typeCount > 0) {
            const types = await mongoose.connection.db.collection("admineventtypes").find({}).limit(5).toArray();
            console.log("\n7. Sample event types (first 5):");
            types.forEach((t, i) => {
                console.log(`   ${i + 1}. ${t.eventName || t.reactionName} - ${t._id}`);
            });
        }

        console.log("\n=== DEBUG COMPLETE ===");
    } catch (error) {
        console.error("Error:", error.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

debug();
