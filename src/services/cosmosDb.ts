import { CosmosClient, Container, CosmosClientOptions, RequestOptions } from '@azure/cosmos';
import { azureConfig } from '../config/azure-config';

interface CircuitBreakerState {
    failures: number;
    lastFailure: number;
    isOpen: boolean;
}

class CosmosDBService {
    private client: CosmosClient | null = null;
    private container: Container | null = null;
    private isInitializing = false;
    private initializationError: Error | null = null;
    
    // Circuit breaker configuration
    private readonly FAILURE_THRESHOLD = 5;
    private readonly RESET_TIMEOUT = 30000; // 30 seconds
    private circuitBreaker: CircuitBreakerState = {
        failures: 0,
        lastFailure: 0,
        isOpen: false
    };

    private async initialize() {
        if (this.client && this.container) {
            return;
        }

        if (this.isInitializing) {
            // Wait for initialization to complete if already in progress
            while (this.isInitializing) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            if (this.initializationError) {
                throw this.initializationError;
            }
            return;
        }

        try {
            this.isInitializing = true;
            console.log('Initializing CosmosDB connection...');

            let key = process.env.REACT_APP_COSMOS_KEY;
            if (key) {
                console.log('[CosmosDB] Using REACT_APP_COSMOS_KEY from environment.');
            }
            // In production, the key will be available through the Static Web Apps auth
            if (!key && process.env.NODE_ENV === 'production') {
                try {
                    const response = await fetch('/.auth/me');
                    const authData = await response.json();
                    key = authData.clientPrincipal?.cosmosDbKey;
                    if (key) {
                        console.log('[CosmosDB] cosmosDbKey retrieved from /.auth/me endpoint.');
                    } else {
                        console.warn('[CosmosDB] cosmosDbKey not found in /.auth/me response:', authData);
                    }
                } catch (error) {
                    console.error('[CosmosDB] Error fetching auth data from /.auth/me:', error);
                    throw new Error('Failed to get CosmosDB key from Static Web Apps auth');
                }
            }

            if (!key) {
                console.error('[CosmosDB] CosmosDB key not found.');
                throw new Error('CosmosDB key not found');
            }

            // Log key type and masked preview for debugging (do not log full key)
            const keyType = typeof key;
            const keyLength = key ? key.length : 0;
            const keyPreview = key ? key.substring(0, 4) + '...' + key.substring(key.length - 4) : 'none';
            console.log(`[CosmosDB] Key type: ${keyType}, length: ${keyLength}, preview: ${keyPreview}`);

            // Validate base64 format (simple check)
            try {
                atob(key);
            } catch (e) {
                console.error('[CosmosDB] CosmosDB key is not valid base64:', e);
                throw new Error('CosmosDB key is not valid base64.');
            }

            const options: CosmosClientOptions = {
                endpoint: azureConfig.cosmosDb.endpoint,
                key: key,
                connectionPolicy: {
                    retryOptions: {
                        maxRetryAttemptCount: 3
                    }
                }
            };

            this.client = new CosmosClient(options);

            // Get reference to database
            const { database } = await this.client.databases.createIfNotExists({
                id: azureConfig.cosmosDb.databaseId
            });

            // Get reference to container
            const { container } = await database.containers.createIfNotExists({
                id: azureConfig.cosmosDb.containerId,
                partitionKey: { paths: ["/userId"] }
            });

            this.container = container;
            console.log('CosmosDB connection initialized successfully');
        } catch (error) {
            console.error('Failed to initialize CosmosDB:', error);
            this.initializationError = error as Error;
            throw error;
        } finally {
            this.isInitializing = false;
        }
    }

    private async getContainer(): Promise<Container> {
        await this.initialize();
        if (!this.container) {
            throw new Error('Container not initialized');
        }
        return this.container;
    }

    private async withRetry<T>(operation: () => Promise<T>, maxRetries: number = 3): Promise<T> {
        if (this.circuitBreaker.isOpen) {
            const timeSinceLastFailure = Date.now() - this.circuitBreaker.lastFailure;
            if (timeSinceLastFailure < this.RESET_TIMEOUT) {
                throw new Error('Circuit breaker is open. Please try again later.');
            }
            // Reset circuit breaker after timeout
            this.circuitBreaker = {
                failures: 0,
                lastFailure: 0,
                isOpen: false
            };
        }

        let lastError: Error | null = null;
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const result = await operation();
                // Reset failures on success
                this.circuitBreaker.failures = 0;
                return result;
            } catch (error) {
                lastError = error as Error;
                // Increment failure count
                this.circuitBreaker.failures++;
                this.circuitBreaker.lastFailure = Date.now();

                if (this.circuitBreaker.failures >= this.FAILURE_THRESHOLD) {
                    this.circuitBreaker.isOpen = true;
                    throw new Error('Circuit breaker triggered due to multiple failures');
                }

                // Only retry on specific errors
                if (!this.isRetryableError(error)) {
                    throw error;
                }

                // Exponential backoff
                const delay = Math.min(100 * Math.pow(2, attempt), 2000);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        throw lastError || new Error('Operation failed after retries');
    }

    private isRetryableError(error: any): boolean {
        // Add specific error codes that should trigger a retry
        const retryableCodes = [
            408, // Request Timeout
            429, // Too Many Requests
            503, // Service Unavailable
            -1, // Connection errors
        ];
        return retryableCodes.includes(error.code) || 
               error.message?.includes('timeout') ||
               error.message?.includes('network');
    }

    async getUserData(userId: string, type: string): Promise<any> {
        return this.withRetry(async () => {
            const container = await this.getContainer();
            const querySpec = {
                query: "SELECT * FROM c WHERE c.userId = @userId AND c.type = @type",
                parameters: [
                    { name: "@userId", value: userId },
                    { name: "@type", value: type }
                ]
            };

            const { resources } = await container.items.query(querySpec).fetchAll();
            return resources[0];
        });
    }

    async saveData(userId: string, type: string, data: any): Promise<void> {
        return this.withRetry(async () => {
            const container = await this.getContainer();
            const item = {
                id: `${userId}-${type}`,
                userId,
                type,
                ...data,
                _partitionKey: userId
            };

            await container.items.upsert(item);
        });
    }

    async deleteData(userId: string, type: string): Promise<void> {
        return this.withRetry(async () => {
            const container = await this.getContainer();
            const itemId = `${userId}-${type}`;
            await container.item(itemId, userId).delete();
        });
    }

    async batchSaveData(items: { userId: string; type: string; data: any }[]): Promise<void> {
        return this.withRetry(async () => {
            const container = await this.getContainer();
            const operations = items.map(({ userId, type, data }) => {
                const item = {
                    id: `${userId}-${type}`,
                    userId,
                    type,
                    ...data,
                    _partitionKey: userId
                };
                return container.items.upsert(item);
            });

            await Promise.all(operations);
        });
    }

    async saveDataWithConcurrency(userId: string, type: string, data: any, etag?: string): Promise<void> {
        return this.withRetry(async () => {
            const container = await this.getContainer();
            const item = {
                id: `${userId}-${type}`,
                userId,
                type,
                ...data,
                _partitionKey: userId
            };

            const options: RequestOptions = {};
            if (etag) {
                options.accessCondition = { type: 'IfMatch', condition: etag };
            }

            await container.items.upsert(item, options);
        });
    }

    async getDataWithEtag(userId: string, type: string): Promise<{ data: any; etag: string | undefined }> {
        try {
            const container = await this.getContainer();
            const querySpec = {
                query: "SELECT * FROM c WHERE c.userId = @userId AND c.type = @type",
                parameters: [
                    { name: "@userId", value: userId },
                    { name: "@type", value: type }
                ]
            };

            const { resources } = await container.items.query(querySpec).fetchAll();
            const item = resources[0];
            return {
                data: item,
                etag: item?._etag
            };
        } catch (error) {
            console.error('Error getting data with etag:', error);
            throw new Error('Failed to fetch data from CosmosDB');
        }
    }

    async queryData(userId: string, type: string, filter?: any): Promise<any[]> {
        try {
            const container = await this.getContainer();
            let query = "SELECT * FROM c WHERE c.userId = @userId AND c.type = @type";
            const parameters: { name: string; value: any }[] = [
                { name: "@userId", value: userId },
                { name: "@type", value: type }
            ];

            if (filter) {
                Object.entries(filter).forEach(([key, value], index) => {
                    query += ` AND c.${key} = @param${index}`;
                    parameters.push({ name: `@param${index}`, value });
                });
            }

            const querySpec = { query, parameters };
            const { resources } = await container.items.query(querySpec).fetchAll();
            return resources;
        } catch (error) {
            console.error('Error querying data:', error);
            throw new Error('Failed to query data from CosmosDB');
        }
    }
}

export const cosmosDbService = new CosmosDBService();