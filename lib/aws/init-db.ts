import {
    CreateTableCommand,
    DescribeTableCommand,
    waitUntilTableExists,
} from "@aws-sdk/client-dynamodb";
import { client } from "./dynamodb";

const TABLES = [
    {
        name: "Users",
        key: "id",
    },
    {
        name: "chatbots",
        key: "id",
    },
] as const;

let initializationPromise: Promise<void> | undefined;

export async function initializeDatabase() {
    if (!initializationPromise) {
        initializationPromise = initializeTables().catch((error) => {
            initializationPromise = undefined;
            throw error;
        });
    }

    return initializationPromise;
}

async function initializeTables() {
    for (const table of TABLES) {
        try {
            const result = await client.send(
                new DescribeTableCommand({
                    TableName: table.name,
                })
            );
            if (result.Table?.TableStatus !== "ACTIVE") {
                await waitUntilTableExists(
                    { client, maxWaitTime: 60 },
                    { TableName: table.name }
                );
            }
        } catch (error) {
            if (
                !(error instanceof Error) ||
                error.name !== "ResourceNotFoundException"
            ) {
                throw error;
            }

            try {
                await client.send(
                    new CreateTableCommand({
                        TableName: table.name,
                        BillingMode: "PAY_PER_REQUEST",
                        AttributeDefinitions: [
                            {
                                AttributeName: table.key,
                                AttributeType: "S",
                            },
                        ],
                        KeySchema: [
                            {
                                AttributeName: table.key,
                                KeyType: "HASH",
                            },
                        ],
                    })
                );
            } catch (createError) {
                // Another request may create the table after DescribeTable
                // reports it as missing.
                if (
                    !(createError instanceof Error) ||
                    createError.name !== "ResourceInUseException"
                ) {
                    throw createError;
                }
            }

            await waitUntilTableExists(
                { client, maxWaitTime: 60 },
                { TableName: table.name }
            );
        }
    }
}