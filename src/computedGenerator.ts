import { computedParser, ComputedNode, ComputedItemNode } from 'odatafy-parser';
import { Document } from 'mongodb';

import { processNode } from './filterGenerator';

/**
 * Generate a MongoDB addFields stage based on an oData compute expression
 * @param computedExpr expression of compute parameter
 * @returns MongoDB addFields stage
 */
export function generateComputedStageFromComputedExpr(computedExpr: string): Document {
    const ast = computedParser.parse(computedExpr);

    return generateComputedStage(ast)
}

/**
 * Generate a MongoDB addFields expression based on the ast of a parsed oData compute expression
 * @param ast abstract syntax tree of a parsed oData compute expression
 * @returns MongoDB addFields stage
 */
export function generateComputedStage(ast: ComputedNode): Document {
    let fields: { [ key: string]: any  } = {};

    ast.value.forEach((itemNode: ComputedItemNode) => {
        fields[itemNode.computedIdentifier] = processNode(itemNode.commonExpr, false, { withoutExpr: true })
    });

    return { 
        "$addFields": fields
    };
}