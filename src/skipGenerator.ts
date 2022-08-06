import { Document } from 'mongodb';
import { skipParser } from 'odatafy-parser';

/**
 * Get a MongoDB skip stage based on oData skip parameter
 * @param expr value of skip url parameter
 * @returns MongoDB aggregation pipline skip stage
 */
export function generateSkipFromSkipExpr(expr: string): Document {
    const skip = skipParser.parse(expr);

    return generateSkipStage(skip);
}

/**
 * Get MongoDB skip stage based on a parsed skip expression
 * @param skip parsed skip from a skip expression
 * @returns MongoDB aggregation pipline skip stage
 */
export function generateSkipStage(skip: number): Document {
    return {
        '$skip': skip
    }
}