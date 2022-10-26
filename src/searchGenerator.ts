import { Document } from 'mongodb';
import { searchParser, SearchNode, NodeTypes } from 'odatafy-parser';

/**
 * Get a MongoDB project stage based on oData search parameter
 * @param expr value of search url parameter
 * @returns MongoDB aggregation pipline project stage
 */
export function generateSearchFromSearchExpr(expr: string): Document {
    const searchAst = searchParser.parse(expr);

    return generateSearchStage(searchAst);
}

/**
 * Get MongoDB search stage based on a parsed search expression
 * @param searchNode ast parsed search from a search expression
 * @returns MongoDB aggregation pipline search stage
 */
export function generateSearchStage(searchNode: SearchNode): Document {
    if(searchNode.nodeType == NodeTypes.SearchOperatorNode) {
        throw new Error('Search with operators is not implemented');
    }    

    return {
        '$search': searchNode.value
    }
}