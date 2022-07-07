import { Document } from 'mongodb';
import { skipParser } from 'odatafy-parser';

export function generateSkipFromSkipExpr(expr: string): Document {
    const skip = skipParser.parse(expr);

    return generateSkipStage(skip);
}

export function generateSkipStage(skip: number): Document {
    return {
        '$skip': skip
    }
}