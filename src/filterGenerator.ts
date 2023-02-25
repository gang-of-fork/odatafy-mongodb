import {
    filterParser, FilterNode, NodeTypes,
    OperatorNode, ConstantNode, SymbolNode,
    OperatorNodeOperators, FuncNames0Args, FuncNode0Args,
    FuncNames1Args, FuncNode1Args, FuncNode2Args,
    ConstantNodeTypes,
    FuncNames2Args,
    FuncNodeVarArgs,
    FuncNamesVarArgs
} from 'odatafy-parser';
import { Document, ObjectId } from 'mongodb';

type ProcessingOpts = {
    withoutExpr?: boolean
}

/**
 * TODO: Support geo functions
 * TODO: date and time and totalseconds currently not supported - fun1arg
 * TODO: totaloffset minutes not supported - func1arg
 */

/**
 * Get a MongoDB match stage based on oData filter expression
 * @param filterExpr oData filter expression
 * @param opts options for generating the match stage
 * @returns MongoDB match stage
 */
export function generateMatchFromFilterExpr(filterExpr: string, opts?: ProcessingOpts): Document {
    const ast = filterParser.parse(filterExpr);

    return generateMatchStage(ast, opts);
}

/**
 * Get a MongoDB skip stage based on the ast of a parsed oData filter expression
 * @param ast abstract syntax tree of the filter expression
 * @param opts options for generating the match stage
 * @returns MongoDB match stage
 */
export function generateMatchStage(ast: FilterNode, opts?: ProcessingOpts): Document {
    return {
        '$match': processNode(ast, undefined, opts)
    }
}

export function processNode(node: FilterNode, parentExpr?: boolean, opts?: ProcessingOpts): any {
    if (!node) {
        throw new Error('Something went wrong, node is undefined');
    }

    switch (node.nodeType) {
        case NodeTypes.OperatorNode:
        case undefined:
            return processOperatorNode(node, parentExpr, opts);
        case NodeTypes.ConstantNode:
            return processConstantNode(node);
        case NodeTypes.SymbolNode:
            return processSymbolNode(node);
        case NodeTypes.FuncNode0Args:
            return processFuncNode0Args(node);
        case NodeTypes.FuncNode1Args:
            return processFuncNode1Args(node);
        case NodeTypes.FuncNode2Args:
            return processFuncNode2Args(node);
        case NodeTypes.FuncNodeVarArgs:
            return processFuncVarArgs(node);
        default:
            throw new Error(`Unsupported NodeType: ${node.nodeType}`)
    }
}

function processFuncNode0Args(node: FuncNode0Args) {
    switch (node.func) {
        case FuncNames0Args.Maxdatetime:
            return new Date(8640000000000000);
        case FuncNames0Args.Mindatetime:
            return new Date(-8640000000000000);
        case FuncNames0Args.Now:
            return new Date()
    }
}

function processFuncNode1Args(node: FuncNode1Args) {
    switch (node.func) {
        case FuncNames1Args.Year:
            return {
                $year: processNode(node.args[0])
            }
        case FuncNames1Args.Month:
            return {
                $month: processNode(node.args[0])
            }
        case FuncNames1Args.Minute:
            return {
                $minute: processNode(node.args[0])
            }
        case FuncNames1Args.Second:
            return {
                $second: processNode(node.args[0])
            }
        case FuncNames1Args.Day:
            return {
                $dayOfMonth: processNode(node.args[0])
            }
        case FuncNames1Args.Hour:
            return {
                $hour: processNode(node.args[0])
            }
        case FuncNames1Args.Fractionalseconds:
            return {
                $millisecond: processNode(node.args[0])
            }
        case FuncNames1Args.Floor:
            return {
                $floor: processNode(node.args[0])
            }
        case FuncNames1Args.Ceiling:
            return {
                $ceil: processNode(node.args[0])
            }
        case FuncNames1Args.Length:
            if(node.args[0].nodeType == NodeTypes.ConstantNode && node.args[0].type == ConstantNodeTypes.Array) {
                return { $size: [ processNode(node.args[0]) ] }
            }

            return { 
                $cond: { 
                    if: { $isArray: [ processNode(node.args[0]) ] }, 
                    then: { $size: [ processNode(node.args[0]) ] }, 
                    else: { $strLenCP: processNode(node.args[0]) } 
                } 
            }
        case FuncNames1Args.Toupper:
            return {
                $toUpper: processNode(node.args[0])
            }
        case FuncNames1Args.Tolower:
            return {
                $toLower: processNode(node.args[0])
            }
        case FuncNames1Args.Trim:
            return {
                $trim: {
                    input: processNode(node.args[0])
                }
            }
        case FuncNames1Args.Round:
            return { 
                $round: [processNode(node.args[0]), 2] 
            }
        default:
            throw new Error(`Function ${node.func} is not supported`)
    }

}

//TODO: add functions with 2 args
function processFuncNode2Args(node: FuncNode2Args) {
    switch(node.func) {
        case FuncNames2Args.Contains:
            if(node.args[0].nodeType == NodeTypes.ConstantNode && node.args[0].type == ConstantNodeTypes.String) {
                return {
                    $regexMatch: {
                        input: processNode(node.args[0]),
                        regex: processNode(node.args[1]).toString()
                    }
                } 
            }

            return { 
                $cond: { 
                    if: { $isArray: [ processNode(node.args[0]) ] }, 
                    then: {
                        $in: [processNode(node.args[1]), processNode(node.args[0])]
                    }, 
                    else: {
                        $regexMatch: {
                            input: processNode(node.args[0]),
                            regex: processNode(node.args[1]).toString()
                        }
                    } 
                } 
            }
        case FuncNames2Args.MatchesPattern:
            return {
                $regexMatch: {
                    input: processNode(node.args[0]),
                    regex: processNode(node.args[1]).toString()
                }
            } 

        case FuncNames2Args.Startswith:
            return {
                $regexMatch: {
                    input: processNode(node.args[0]),
                    regex: `^${processNode(node.args[1]).toString()}`
                }
            }
        
        case FuncNames2Args.Endswith:
            return {
                $regexMatch: {
                    input: processNode(node.args[0]),
                    regex: `${processNode(node.args[1]).toString()}$`
                }
            }

        default:
            throw new Error(`Function ${node.func} is not supported`)
    }
}

function processFuncVarArgs(node: FuncNodeVarArgs) {
    switch(node.func) {
        case FuncNamesVarArgs.Cast:
            if(node.args.length == 2) {
                if(node.args[0].nodeType == NodeTypes.ConstantNode && 
                    node.args[1].nodeType == NodeTypes.SymbolNode && 
                    node.args[1].value === 'ObjectId') {
                        return new ObjectId(node.args[0].value);
                }
            }

            throw new Error(`Typings not supported yet`);
        default:
            throw new Error(`Function ${node.func} is not supported`);
    }
}

function processOperatorNode(node: OperatorNode, parentExpr?: boolean, opts?: ProcessingOpts): Document {
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
            result = {
                '$toInt': {
                    '$divide': [processNode(node.left, true), processNode(node.right, true)]
                }
            }
            break;
        default:
            throw new Error(`Unsupported operator: ${node.op}`)
    }

    if (!parentExpr && needsExpr && !opts?.withoutExpr) {
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