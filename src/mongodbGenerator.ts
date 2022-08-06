import url from 'url';

import { generateMatchFromFilterExpr } from './filterGenerator';
import { generateLimitFromTopExpr } from './limitGenerator';
import { generateSkipFromSkipExpr } from './skipGenerator';
import { generateSortFromOrderbyExpr } from './sortGenerator';
import { generateLookupFromExpand, CollectionMap } from './lookupGenerator';
import { generateComputedStageFromComputedExpr } from './computedGenerator';

import { oDataParameters } from 'odatafy-parser';
import { Document } from 'mongodb';

export type MongoDBODatafyOpts = {
    expandMapping?: CollectionMap,
    returnEmptyPipeline?: boolean
}

export function getQueryFromUrl(oDataUrl: string, opts?: MongoDBODatafyOpts): Document[] {
    const query = url.parse(oDataUrl, true).query;
    const validParams = ['filter', 'orderby', 'skip', 'top', 'expand', 'computed'];
    const params = Object.keys(query);

    let parseParameters: oDataParameters = {}

    validParams.forEach((param: string) => {
        //check if url 
        if (params.includes(param) && params.includes('$' + param)) {
            throw new Error(`Malformed oData url, cannot contain param: ${param} and param: $${param}`)
        }

        if (params.includes(param) || params.includes('$' + param)) {
            parseParameters[param as keyof oDataParameters] = query[(params.includes(param) ? param : '$' + param)] as string
        }
    });

    return getQuery(parseParameters, opts);
}

export function getQuery(parameters: oDataParameters, opts?: MongoDBODatafyOpts): Document[] {
    const pipeline: Document[] = [];

    if (parameters.expand) {
        pipeline.push(...generateLookupFromExpand(parameters.expand, opts?.expandMapping? opts.expandMapping: {}));
    }

    if (parameters.computed) {
        pipeline.push(generateComputedStageFromComputedExpr(parameters.computed));
    }

    if (parameters.filter) {
        pipeline.push(generateMatchFromFilterExpr(parameters.filter));
    }

    if (parameters.orderby) {
        pipeline.push(generateSortFromOrderbyExpr(parameters.orderby));
    }

    if (parameters.skip) {
        pipeline.push(generateSkipFromSkipExpr(parameters.skip));
    }

    if (parameters.top) {
        pipeline.push(generateLimitFromTopExpr(parameters.top));
    }

    //add default steps if pipline must not be empty
    if(!opts?.returnEmptyPipeline) {
        pipeline.push(
            {
                $addFields: {
                    odatafyMongoDBTempField: ""
                }
            },
            {
                $project: {
                    odatafyMongoDBTempField: 0
                }
            }
        )
    }

    return pipeline;
}