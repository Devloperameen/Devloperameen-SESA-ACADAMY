// Database Optimization Utilities
import mongoose from 'mongoose';

// Connection management
export const connectWithRetry = async (uri: string, maxRetries = 3): Promise<void> => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            await mongoose.connect(uri);
            console.log(`✅ Database connected on attempt ${attempt}`);
            return;
        } catch (error) {
            console.error(`❌ Database connection attempt ${attempt} failed:`, error);
            if (attempt === maxRetries) {
                throw error;
            }
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
        }
    }
};

// Connection health check
export const checkDatabaseHealth = async (): Promise<{ status: string; responseTime: number; error?: string }> => {
    const startTime = Date.now();
    
    try {
        await mongoose.connection.db.admin().ping();
        const responseTime = Date.now() - startTime;
        
        return {
            status: 'healthy',
            responseTime
        };
    } catch (error) {
        return {
            status: 'unhealthy',
            responseTime: Date.now() - startTime,
            error: error.message
        };
    }
};

// Query optimization helpers
export const createOptimizedQuery = (model: any, filters: any = {}, options: any = {}) => {
    const query = model.find(filters);
    
    // Add lean() for better performance
    if (options.lean !== false) {
        query.lean();
    }
    
    // Add select for only needed fields
    if (options.select) {
        query.select(options.select);
    }
    
    // Add sorting
    if (options.sort) {
        query.sort(options.sort);
    }
    
    // Add pagination
    if (options.limit) {
        query.limit(options.limit);
    }
    
    if (options.skip) {
        query.skip(options.skip);
    }
    
    return query;
};

// Bulk operations for performance
export const bulkOperation = async (operations: Array<{
    type: 'updateOne' | 'updateMany' | 'deleteMany' | 'insertMany';
    collection: string;
    filter: any;
    data?: any;
    options?: any;
}>) => {
    const results = [];
    
    for (const operation of operations) {
        try {
            let result;
            
            switch (operation.type) {
                case 'updateOne':
                    result = await mongoose.connection.db.collection(operation.collection).updateOne(
                        operation.filter,
                        operation.data,
                        operation.options
                    );
                    break;
                    
                case 'updateMany':
                    result = await mongoose.connection.db.collection(operation.collection).updateMany(
                        operation.filter,
                        operation.data,
                        operation.options
                    );
                    break;
                    
                case 'deleteMany':
                    result = await mongoose.connection.db.collection(operation.collection).deleteMany(
                        operation.filter,
                        operation.options
                    );
                    break;
                    
                case 'insertMany':
                    result = await mongoose.connection.db.collection(operation.collection).insertMany(
                        operation.data,
                        operation.options
                    );
                    break;
            }
            
            results.push({
                type: operation.type,
                success: true,
                result
            });
        } catch (error) {
            results.push({
                type: operation.type,
                success: false,
                error: error.message
            });
        }
    }
    
    return results;
};

// Index management
export const ensureIndexes = async (model: any, indexes: Array<{ fields: any; options?: any }>) => {
    try {
        for (const index of indexes) {
            await model.createIndex(index.fields, index.options);
            console.log(`✅ Created index:`, index.fields);
        }
    } catch (error) {
        console.error('❌ Index creation error:', error);
    }
};

// Cache simulation (in production, use Redis)
export const cacheMiddleware = (ttl: number = 300) => {
    const cache = new Map();
    
    return {
        get: (key: string) => cache.get(key),
        set: (key: string, value: any) => {
            cache.set(key, value);
            // Auto-expire after TTL (simplified)
            setTimeout(() => cache.delete(key), ttl * 1000);
        },
        has: (key: string) => cache.has(key),
        delete: (key: string) => cache.delete(key),
        clear: () => cache.clear(),
        size: () => cache.size
    };
};

// Performance monitoring
export const performanceMonitor = () => {
    const start = Date.now();
    
    return {
        end: (operation: string) => {
            const duration = Date.now() - start;
            console.log(`⏱️ ${operation}: ${duration}ms`);
            return duration;
        },
        memory: () => {
            const used = process.memoryUsage();
            console.log('💾 Memory Usage:', {
                rss: Math.round(used.rss / 1024 / 1024) + 'MB',
                heapTotal: Math.round(used.heapTotal / 1024 / 1024) + 'MB',
                heapUsed: Math.round(used.heapUsed / 1024 / 1024) + 'MB',
                external: Math.round(used.external / 1024 / 1024) + 'MB'
            });
            return used;
        }
    };
};
