// server/test-internal-note.js
// Using built-in fetch (Node 18+)

const BASE_URL = "http://localhost:5001/api";
const ADMIN_EMAIL = "admin@servicedesk.com";
const ADMIN_PASS = "admin123";

async function runTest() {
    console.log("🧪 Starting Internal Notes Feature Test...");

    try {
        // 1. Login as Admin
        console.log("🔑 Logging in as Admin...");
        const loginRes = await fetch(`${BASE_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASS })
        });

        if (!loginRes.ok) {
            const errorData = await loginRes.json();
            console.error("❌ Server Error:", loginRes.status, loginRes.statusText);
            console.error("❌ Error Details:", errorData);
            throw new Error("Login failed!");
        }
        const { token, user } = await loginRes.json();
        console.log("✅ Login successful. Token acquired.");

        // 2. Create a Dummy Ticket
        console.log("🎫 Creating a test ticket...");
        const ticketRes = await fetch(`${BASE_URL}/tickets/create`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                title: "Test Ticket for Internal Notes",
                description: "This is a test ticket to verify the internal notes feature.",
                priority: "Low"
            })
        });

        if (!ticketRes.ok) {
            const errorData = await ticketRes.json();
            console.error("❌ Ticket Creation Failed:", ticketRes.status, ticketRes.statusText);
            console.error("❌ Error Details:", errorData);
            throw new Error("Failed to create ticket");
        }

        const { ticket } = await ticketRes.json();
        console.log(`✅ Ticket created with ID: ${ticket._id}`);

        // 3. Add an Internal Note
        console.log("📝 Adding an Internal Note...");
        const noteText = "Secret note: The customer seems confused about the 2FA settings.";

        const noteRes = await fetch(`${BASE_URL}/tickets/${ticket._id}/internal-note`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ text: noteText })
        });

        if (!noteRes.ok) {
            const err = await noteRes.json();
            throw new Error(`Failed to add note: ${err.error}`);
        }

        const updatedTicket = await noteRes.json();
        console.log("✅ Internal Note added successfully!");

        // 4. Verify Content
        const lastNote = updatedTicket.internalNotes[updatedTicket.internalNotes.length - 1];
        if (lastNote.text === noteText) {
            console.log("🎉 VERIFICATION PASSED: Note text matches!");
            console.log("   Stored Note:", lastNote.text);
            console.log("   Added By:", lastNote.userName);
        } else {
            console.error("❌ VERIFICATION FAILED: Note text mismatch.");
        }

    } catch (error) {
        console.error("\n❌ Test Failed:", error.message);
    }
}

runTest();
