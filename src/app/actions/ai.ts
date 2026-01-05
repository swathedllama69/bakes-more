"use server";

import { OpenAI } from "openai";

export async function processAIRequest(
    messages: any[],
    imageBase64?: string
) {
    if (!process.env.OPENAI_API_KEY) {
        return {
            role: 'assistant',
            content: "Configuration Error: Missing OPENAI_API_KEY in .env file. Please add your API key to use AI features."
        };
    }

    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });

    try {
        const tools: any[] = [
            {
                type: "function",
                function: {
                    name: "create_order",
                    description: "Create a new bakery order. If details are missing, ask the user for them.",
                    parameters: {
                        type: "object",
                        properties: {
                            customer_name: { type: "string", description: "Name of the customer" },
                            due_date: { type: "string", description: "Due date in YYYY-MM-DD format" },
                            items: {
                                type: "array",
                                items: { type: "string" },
                                description: "List of items ordered (e.g. 'Chocolate Cake', '12 Cupcakes')"
                            },
                            notes: { type: "string", description: "Any special instructions or notes" }
                        },
                        required: ["customer_name", "due_date", "items"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "set_timer",
                    description: "Set a timer for a specific duration.",
                    parameters: {
                        type: "object",
                        properties: {
                            duration_seconds: { type: "number", description: "Duration in seconds" },
                            label: { type: "string", description: "Label for the timer" }
                        },
                        required: ["duration_seconds"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "set_reminder",
                    description: "Set a reminder for a specific task.",
                    parameters: {
                        type: "object",
                        properties: {
                            task: { type: "string", description: "The task to remind about" },
                            delay_seconds: { type: "number", description: "Delay in seconds before reminding" }
                        },
                        required: ["task", "delay_seconds"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "add_pantry_item",
                    description: "Add or update an item in the pantry/inventory.",
                    parameters: {
                        type: "object",
                        properties: {
                            item_name: { type: "string", description: "Name of the ingredient" },
                            quantity: { type: "number", description: "Quantity to add" },
                            unit: { type: "string", description: "Unit of measurement (optional)" }
                        },
                        required: ["item_name", "quantity"]
                    }
                }
            }
        ];

        // Prepare messages
        const apiMessages = [...messages];

        // If image is provided, add it to the last user message
        if (imageBase64) {
            const lastMsg = apiMessages[apiMessages.length - 1];
            if (lastMsg.role === 'user') {
                lastMsg.content = [
                    { type: "text", text: lastMsg.content },
                    { type: "image_url", image_url: { url: imageBase64 } }
                ];
            }
        }

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: apiMessages,
            tools: tools,
            tool_choice: "auto",
        });

        const message = response.choices[0].message;

        // If tool call
        if (message.tool_calls) {
            return {
                role: 'assistant',
                content: message.content,
                tool_calls: message.tool_calls
            };
        }

        return {
            role: 'assistant',
            content: message.content
        };

    } catch (error: any) {
        console.error("AI Error Details:", error);

        let errorMessage = "I'm sorry, I encountered an error processing your request.";

        if (error.code === 'invalid_api_key') {
            errorMessage = "Configuration Error: Invalid OpenAI API Key. Please check your .env file.";
        } else if (error.code === 'model_not_found') {
            errorMessage = "Configuration Error: The selected model (gpt-4o) is not available for your API key. Please try 'gpt-3.5-turbo'.";
        } else if (error.message) {
            errorMessage += ` (${error.message})`;
        }

        return {
            role: 'assistant',
            content: errorMessage
        };
    }
}
