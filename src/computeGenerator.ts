import { computeParser, ComputeNode, ComputeItemNode } from 'odatafy-parser';
import { Document } from 'mongodb';

import { processNode } from './filterGenerator';

/**
 * Generate a MongoDB addFields stage based on an oData compute expression
 * @param computedExpr expression of compute parameter
 * @returns MongoDB addFields stage
 */
export function generateComputeStageFromComputedExpr(computedExpr: string): Document {
    const ast = computeParser.parse(computedExpr);

    return generateComputeStage(ast)
}

/**
 * Generate a MongoDB addFields expression based on the ast of a parsed oData compute expression
 * @param ast abstract syntax tree of a parsed oData compute expression
 * @returns MongoDB addFields stage
 */
export function generateComputeStage(ast: ComputeNode): Document {
    let fields: { [ key: string]: any  } = {};

    ast.value.forEach((itemNode: ComputeItemNode) => {
        fields[itemNode.computeIdentifier] = processNode(itemNode.commonExpr, false, { withoutExpr: true })
    });

    return { 
        "$addFields": fields
    };
}