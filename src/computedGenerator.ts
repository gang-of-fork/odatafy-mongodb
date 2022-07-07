import { computedParser, ComputedNode, ComputedItemNode } from 'odatafy-parser';
import { Document } from 'mongodb';

import { processNode } from './filterGenerator';

export function generateComputedStageFromComputedExpr(computedExpr: string): Document {
    const ast = computedParser.parse(computedExpr);

    return generateComputedStage(ast)
}

export function generateComputedStage(ast: ComputedNode): Document {
    let fields: { [ key: string]: any  } = {};

    ast.value.forEach((itemNode: ComputedItemNode) => {
        fields[itemNode.computedIdentifier] = processNode(itemNode.commonExpr, false, { withoutExpr: true })
    });

    return { 
        "$addFields": fields
    };
}