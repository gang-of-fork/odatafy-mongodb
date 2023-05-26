import url from 'url';

import { generateMatchFromFilterExpr } from './filterGenerator';
import { generateLimitFromTopExpr } from './limitGenerator';
import { generateSkipFromSkipExpr } from './skipGenerator';
import { generateSortFromOrderbyExpr } from './sortGenerator';
import { generateProjectFromSelectExpr } from './selectGenerator';
import { generateLookupFromExpand, CollectionMap } from './lookupGenerator';
import { generateComputeStageFromComputedExpr } from './computeGenerator';
import { generateSearchFromSearchExpr } from './searchGenerator';

import { oDataParameters } from 'odatafy-parser';
import { Document } from 'mongodb';

export type MongoDBODatafyOpts = {
    expandMapping?: CollectionMap,
    returnEmptyPipeline?: boolean,
    regexSearchFields?: string[],
    returnDataCountQuery?: boolean,
    returnCountOnly?: boolean
}

/**
 * Get MongoDB aggregation query from a given url can be obtained by nodes req.url
 * @param oDataUrl - the url format ?param=value
 * @param opts options for getting the url
 * @returns MongoDB aggregation query
 */
export function getQueryFromUrl(oDataUrl: string, opts?: MongoDBODatafyOpts): Document[] {
    const query = url.parse(oDataUrl, true).query;
    const validParams = ['filter', 'orderby', 'skip', 'top', 'expand', 'compute', 'select', 'search'];
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

/**
 * Get a MongoDB based on oData url paramaters
 * @param parameters parameters
 * @param opts options for getting the url
 * @returns MongoDB aggregaion pipeline
 */
export function getQuery(parameters: oDataParameters, opts?: MongoDBODatafyOpts): Document[] {
    const pipeline: Document[] = [];
    let countPipeline: Document[] = [];

    if (parameters.expand) {
        pipeline.push(...generateLookupFromExpand(parameters.expand, opts?.expandMapping? opts.expandMapping: {}));
    }

    if (parameters.compute) {
        pipeline.push(generateComputeStageFromComputedExpr(parameters.compute));
    }

    if (parameters.filter) {
        pipeline.push(generateMatchFromFilterExpr(parameters.filter));
    }

    /* copy to count query */
    if(opts?.returnDataCountQuery) {
        countPipeline = [...pipeline];
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

    if(parameters.select) {
        pipeline.push(generateProjectFromSelectExpr(parameters.select));
    }

    if(parameters.search) {
        const searchExpr = generateSearchFromSearchExpr(parameters.search, opts?.regexSearchFields);

        pipeline.push(searchExpr);
        countPipeline.push(searchExpr);
    }

    //add default steps if pipline must not be empty - i.e. in mongoose an empty pipeline returns an error
    if(!opts?.returnEmptyPipeline && pipeline.length == 0) {
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

        countPipeline = [...pipeline];
    }

    if(opts?.returnDataCountQuery) {
        countPipeline.push({
            $count: "count"
        });

        if(opts?.returnCountOnly) {
            return countPipeline
        }

        return [
            {
                "$facet": {
                    "data": pipeline,
                    "countTmp": countPipeline
                }
            },
            {
                "$addFields": {
                    "countTmp2": {
                        "$first": "$countTmp"
                    }
                }
            },
            {
                "$project": {
                    "data": "$data",
                    "count": "$countTmp2.count"
                }
            }
        ]
    }

    return pipeline;
}