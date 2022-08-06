import { Document } from 'mongodb';
import { topParser } from 'odatafy-parser';

/**
 * Get a MongoDB limit stage based on oData top parameter expression
 * @param limit limit parameter expression
 * @returns MongoDB limit stage
 */
export function generateLimitStage(limit: number): Document {
    return {
        '$limit': limit
    }
}

/**
 * Get a MongoDB limit stage based on parsed oData top parameter
 * @param expr parsed oData top parameter expression
 * @returns MongoDB limit stage
 */
export function generateLimitFromTopExpr(expr: string): Document {
    const top = topParser.parse(expr);

    return generateLimitStage(top);
}