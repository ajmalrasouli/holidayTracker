import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";

const client = new CosmosClient({
    endpoint: process.env.COSMOS_DB_ENDPOINT || "",
    key: process.env.COSMOS_DB_KEY
});

const database = client.database(process.env.COSMOS_DB_DATABASE || "HolidayTracker");
const container = database.container(process.env.COSMOS_DB_CONTAINER || "UserData");

async function httpTrigger(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const userId = request.headers.get("x-ms-client-principal-id");
    if (!userId) {
        return {
            status: 401,
            jsonBody: { error: "Unauthorized" }
        };
    }

    try {
        switch (request.method) {
            case "GET":
                // Get user's holiday requests
                const { resources: holidays } = await container.items
                    .query({
                        query: "SELECT * FROM c WHERE c.type = 'holiday' AND c.userId = @userId",
                        parameters: [{ name: "@userId", value: userId }]
                    })
                    .fetchAll();
                return { jsonBody: holidays };

            case "POST": {
                // Create new holiday request
                const body = await request.json() as Record<string, unknown>;
                const newHoliday = {
                    id: `holiday-${Date.now()}`,
                    type: "holiday",
                    userId: userId,
                    ...body,
                    createdAt: new Date().toISOString()
                };
                const { resource: created } = await container.items.create(newHoliday);
                return { status: 201, jsonBody: created };
            }

            case "PUT": {
                // Update holiday request
                const params = new URL(request.url).searchParams;
                const holidayId = params.get("id");
                if (!holidayId) {
                    return { status: 400, jsonBody: { error: "Holiday ID is required" } };
                }
                const { resource: existing } = await container.item(holidayId, userId).read();
                if (!existing) {
                    return { status: 404, jsonBody: { error: "Holiday request not found" } };
                }
                const body = await request.json() as Record<string, unknown>;
                const updated = { ...existing, ...body, updatedAt: new Date().toISOString() };
                const { resource: result } = await container.item(holidayId, userId).replace(updated);
                return { jsonBody: result };
            }

            case "DELETE":
                // Delete holiday request
                const deleteId = new URL(request.url).searchParams.get("id");
                if (!deleteId) {
                    return { status: 400, jsonBody: { error: "Holiday ID is required" } };
                }
                await container.item(deleteId, userId).delete();
                return { status: 204 };

            default:
                return { status: 405, jsonBody: { error: "Method not allowed" } };
        }
    } catch (error) {
        context.log(`Error processing holiday request: ${error instanceof Error ? error.message : String(error)}`);
        return {
            status: 500,
            jsonBody: { error: "An error occurred while processing your request" }
        };
    }
}

app.http('holidayRequests', {
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    authLevel: 'anonymous',
    handler: httpTrigger
});