import { Document } from 'mongodb';
import { orderbyParser, OrderDirection, OrderbyNode } from 'odatafy-parser';

export function generateSortFromOrderbyExpr(expr: string): Document {
    const ast = orderbyParser.parse(expr);

    return generateSortStage(ast);
}

export function generateSortStage(ast: OrderbyNode): Document {
    let result: Document = {
        '$sort': { }
    }

    ast.value.forEach(node => {
        result.$sort[node.value] = node.type == OrderDirection.Asc? 1: -1;
    });

    return result;
}