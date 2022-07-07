import { Document } from 'mongodb';
import { topParser } from 'odatafy-parser';

export function generateLimitStage(limit: number): Document {
    return {
        '$limit': limit
    }
}

export function generateLimitFromTopExpr(expr: string): Document {
    const top = topParser.parse(expr);

    return generateLimitStage(top);
}