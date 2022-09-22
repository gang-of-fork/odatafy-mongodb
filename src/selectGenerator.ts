import { Document } from 'mongodb';
import { selectParser, SelectNode, NodeTypes } from 'odatafy-parser';

/**
 * Get a MongoDB project stage based on oData select parameter
 * @param expr value of select url parameter
 * @returns MongoDB aggregation pipline project stage
 */
export function generateProjectFromSelectExpr(expr: string): Document {
    const select = selectParser.parse(expr);

    return generateProjectStage(select);
}

/**
 * Get MongoDB project stage based on a parsed select expression
 * @param select ast parsed select from a select expression
 * @returns MongoDB aggregation pipline project stage
 */
export function generateProjectStage(selectNode: SelectNode): Document {
    let projection: { [key: string]: 1 } = {}

    //iterate through selectnode
    selectNode.value.forEach(selectPathNode => {
        const extractedPaths: string[] = []

        if(selectPathNode.nodeType == NodeTypes.SelectPathNode) {
            
            selectPathNode.value.forEach(selectItemNode => {
                
                //only include identifier nodes
                if(selectItemNode.nodeType == NodeTypes.SelectIdentifierNode) {
                    extractedPaths.push(selectItemNode.value);
                }

            });
            
            const path = extractedPaths.join('.');

            projection[path] = 1;
        }
    });


    return {
        '$project': projection
    }
}