import { Document } from 'mongodb';
import { orderbyParser, OrderDirection, OrderbyNode } from 'odatafy-parser';

/**
 * Get MongoDB sort stage based on an oData url orderby expression
 * @param expr expression from url
 * @returns MongoDB sort stage
 */
export function generateSortFromOrderbyExpr(expr: string): Document {
    const ast = orderbyParser.parse(expr);

    return generateSortStage(ast);
}

/**
 * Get MongoDB sort stage based on the syntax tree of an oData orderby expression
 * @param ast abstract syntax tree of the parsed orderby expression
 * @returns MongoDB sort stage
 */
export function generateSortStage(ast: OrderbyNode): Document {
    let result: Document = {
        '$sort': { }
    }

    ast.value.forEach(node => {
        result.$sort[node.value] = node.type == OrderDirection.Asc? 1: -1;
    });

    return result;
}