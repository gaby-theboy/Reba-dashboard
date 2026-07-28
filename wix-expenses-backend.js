// Filename: wix-expenses-backend.js
// Backend code for Expenses CRUD operations
// Main endpoint that routes to handler functions

import { badRequest, serverError } from 'wix-http-functions';

// Import all handlers from handles.js
import {
    handleGetExpenses,
    handleCreateExpense,
    handleUpdateExpense,
    handleDeleteExpense,
    handleGetCategories,
    handleGetSummary
} from 'backend/handles';

/**
 * POST /expenses
 * Single endpoint for all expense operations
 *
 * Request Body:
 * {
 *   operation: "get" | "create" | "update" | "delete" | "getCategories" | "getSummary",
 *
 *   // For "get" operation:
 *   filters: {
 *     startDate: "YYYY-MM-DD",
 *     endDate: "YYYY-MM-DD",
 *     category: "category name",
 *     searchQuery: "search text",
 *     currency: "RWF"
 *   },
 *
 *   // For "create" operation:
 *   data: {
 *     amount: number,
 *     currency: string,
 *     category: string,
 *     description: string,
 *     date: "ISO date string",
 *     vendor: string,
 *     paymentMethod: string
 *   },
 *
 *   // For "update" operation:
 *   data: {
 *     _id: string,
 *     amount: number,
 *     currency: string,
 *     category: string,
 *     description: string,
 *     date: "ISO date string",
 *     vendor: string,
 *     paymentMethod: string
 *   },
 *
 *   // For "delete" operation:
 *   expenseId: string
 * }
 */
export async function post_expenses(request) {
    try {
        const body = await request.body.text();
        const requestData = JSON.parse(body);
        const operation = requestData.operation;

        if (!operation) {
            return badRequest({
                body: JSON.stringify({
                    success: false,
                    error: "Operation field is required"
                }),
                headers: {
                    "Content-Type": "application/json"
                }
            });
        }

        const options = { suppressAuth: true };

        // Route to appropriate operation
        switch (operation) {
            case 'get':
                return await handleGetExpenses(requestData.filters || {}, options);

            case 'create':
                return await handleCreateExpense(requestData.data, options);

            case 'update':
                return await handleUpdateExpense(requestData.data, options);

            case 'delete':
                return await handleDeleteExpense(requestData.expenseId, options);

            case 'getCategories':
                return await handleGetCategories(options);

            case 'getSummary':
                return await handleGetSummary(requestData.filters || {}, options);

            default:
                return badRequest({
                    body: JSON.stringify({
                        success: false,
                        error: `Unknown operation: ${operation}`
                    }),
                    headers: {
                        "Content-Type": "application/json"
                    }
                });
        }

    } catch (error) {
        console.error("Error in expenses endpoint:", error);
        return serverError({
            body: JSON.stringify({
                success: false,
                error: error.message
            }),
            headers: {
                "Content-Type": "application/json"
            }
        });
    }
}
