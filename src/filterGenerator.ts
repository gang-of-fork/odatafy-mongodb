import { filterParser, FilterNode, NodeTypes, OperatorNode, ConstantNode, SymbolNode, OperatorNodeOperators } from 'odatafy-parser';
import { Document } from 'mongodb';

export function generateMatchFromFilterExpr(filterExpr: string): Document {
    const ast = filterParser.parse(filterExpr);

    return generateMatchStage(ast);
}

export function generateMatchStage(ast: FilterNode): Document {
    return {
        '$match': processNode(ast)
    }
}

function processNode(node: FilterNode, parentExpr?: boolean): any {
    if (!node) {
        throw new Error('Something went wrong, node is undefined');
    }

    switch (node.nodeType) {
        case NodeTypes.OperatorNode:
        case undefined:
            return processOperatorNode(node, parentExpr);
        case NodeTypes.ConstantNode:
            return processConstantNode(node);
        case NodeTypes.SymbolNode:
            return processSymbolNode(node);
        default:
            throw new Error(`Unsupported NodeType: ${node.nodeType}`)
    }
}

function processOperatorNode(node: OperatorNode, parentExpr?: boolean): Document {
    let needsExpr = false;
    let result: Document = {};

    switch (node.op) {
        case OperatorNodeOperators.And:
            result = {
                '$and': [
                    processNode(node.left, parentExpr),
                    processNode(node.right, parentExpr)
                ]
            }
            break;
        case OperatorNodeOperators.Or:
            result = {
                '$or': [
                    processNode(node.left, parentExpr),
                    processNode(node.right, parentExpr)
                ]
            }
            break;
        case OperatorNodeOperators.Eq:
        case OperatorNodeOperators.Ne:
        case OperatorNodeOperators.Lt:
        case OperatorNodeOperators.Gt:
        case OperatorNodeOperators.Le:
        case OperatorNodeOperators.Ge:
            needsExpr = true;
            let op: OperatorNodeOperators | 'gte' | 'lte' = node.op;

            if (op == OperatorNodeOperators.Le) {
                op = 'lte';
            }

            if (op == OperatorNodeOperators.Ge) {
                op = 'gte';
            }

            result[`$${op}`] = [processNode(node.left, true), processNode(node.right, true)];
            break;
        case OperatorNodeOperators.Not:
            needsExpr = true;

            result = {
                '$not': [
                    processNode(node.right, true)
                ]
            }
            break;
        case OperatorNodeOperators.Add: //add
            result = {
                '$add': [processNode(node.left, true), processNode(node.right, true)]
            }
            break;
        case OperatorNodeOperators.Mod: //mod
            result = {
                '$mod': [processNode(node.left, true), processNode(node.right, true)]
            }
            break;
        case OperatorNodeOperators.Divby: //divide
            result = {
                '$divide': [processNode(node.left, true), processNode(node.right, true)]
            }
            break;
        case OperatorNodeOperators.Sub: //subtract
            result = {
                '$subtract': [processNode(node.left, true), processNode(node.right, true)]
            }
            break;
        case OperatorNodeOperators.Mul: //multiply
            result = {
                '$multiply': [processNode(node.left, true), processNode(node.right, true)]
            }
            break;
        case OperatorNodeOperators.Div: //integer division
            needsExpr = true;
            result = {
                '$toInt': {
                    '$divide': [processNode(node.left, true), processNode(node.right, true)]
                }
            }
            break;
        default:
            throw new Error(`Unsupported operator: ${node.op}`)
    }

    if (!parentExpr && needsExpr) {
        return {
            "$expr": result
        }
    }

    return result
}


function processConstantNode(node: ConstantNode) {
    return node.value;
}

function processSymbolNode(node: SymbolNode) {
    return `$${node.value}`
}