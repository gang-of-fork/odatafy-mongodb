import { Document } from 'mongodb';
import { searchParser, SearchNode, NodeTypes } from 'odatafy-parser';

/**
 * Get a MongoDB project stage based on oData search parameter
 * @param expr value of search url parameter
 * @returns MongoDB aggregation pipline project stage
 */
export function generateSearchFromSearchExpr(expr: string, regexSearchFields?: string[]): Document {
    const searchAst = searchParser.parse(expr);

    return generateSearchStage(searchAst, regexSearchFields);
}

/**
 * Get MongoDB search stage based on a parsed search expression
 * @param searchNode ast parsed search from a search expression
 * @returns MongoDB aggregation pipline search stage
 */
export function generateSearchStage(searchNode: SearchNode, regexSearchFields?: string[]): Document {
    if(searchNode.nodeType == NodeTypes.SearchOperatorNode && searchNode.op != 'AND') {
        throw new Error('Search with operators is not implemented');
    }    

    const searchValue = buildSearchValue(searchNode);

    if(regexSearchFields) {
        let searchQuery: { $or: { [key: string]: { $regex: string, $options: "i" }}[] } = { $or: [] }

        for (const searchField of regexSearchFields) {
            let regexpr: { [key: string]: { $regex: string, $options: "i" }} = {};
            regexpr[searchField] = { $regex: searchValue, $options: "i" };

            searchQuery.$or.push(regexpr);
        }

        return {
            "$match": searchQuery
        };
    }
    

    return {
        '$search': searchValue
    }
}

function buildSearchValue(searchNode: SearchNode | undefined): string {
    if (!searchNode) {
        return '';
    }

    if (searchNode.nodeType === NodeTypes.SearchItemNode) {
        return String(searchNode.value ?? '').trim();
    }

    if (searchNode.nodeType === NodeTypes.SearchOperatorNode) {
        if (searchNode.op !== 'AND') {
            throw new Error('Search with operators is not implemented');
        }

        const leftValue = buildSearchValue(searchNode.left);
        const rightValue = buildSearchValue(searchNode.right);

        if (!leftValue) {
            return rightValue;
        }

        if (!rightValue) {
            return leftValue;
        }

        return `${leftValue} ${rightValue}`;
    }

    return '';
}