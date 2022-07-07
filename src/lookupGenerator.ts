import { Document } from "mongodb";
import { ExpandItemNode, expandParser } from "odatafy-parser";

import { generateMatchStage } from "./filterGenerator";
import { generateSortStage } from "./sortGenerator";
import { generateLimitStage } from "./limitGenerator";
import { generateSkipStage } from "./skipGenerator";

export type CollectionMap = {
  [key: string]: string;
};

export function generateLookupFromExpand(
  expr: string,
  collectionMap: CollectionMap,
): Document[] {
  let result: Document[] = [];

  const expNode = expandParser.parse(expr);

  expNode.value.forEach((node: ExpandItemNode) => {
    //generate lookup pipeline
    const pipeline: Document[] = [];

    if (node.options.filter) {
      pipeline.push(generateMatchStage(node.options.filter));
    }

    if (node.options.orderby) {
      pipeline.push(generateSortStage(node.options.orderby));
    }

    if (node.options.skip) {
      pipeline.push(generateSkipStage(node.options.skip));
    }

    if (node.options.top) {
      pipeline.push(generateLimitStage(node.options.top));
    }

    result = [...result, ...getLookupQuery(node.identifier, collectionMap[node.identifier], pipeline)];
  });

  return result;
}

function getLookupQuery(field: string, collection: string, pipeline: Document[] = []): Document[] {
  let query: Document[] = [
    {
      "$addFields": {
        "mongodbODataTempJoinIsArray": {
          "$isArray": `$${field}`,
        },
      },
    },
    {
      "$lookup": {
        from: `${collection}`,
        let: {
          "mongodbODataTempJoinIsArray": "$mongodbODataTempJoinIsArray",
          "mongodbODataTempJoinFieldValue": `$${field}`
        },
        pipeline: [
          {
            "$match": {
              "$expr": {
                "$eq": [
                  {
                    "$cond": {
                      "if": "$$mongodbODataTempJoinIsArray",
                      "then": {
                          "$in": [
                            "$_id", 
                            "$$mongodbODataTempJoinFieldValue"
                          ]
                      },
                      "else": {
                        "$eq": [
                          "$_id",
                          "$$mongodbODataTempJoinFieldValue"
                        ]
                      },
  
                    },
                  },
                  true
                ]
              }
            }
          },
          ...pipeline
        ],
        as: `${field}`
      },
    }
  ];

  let extension: Document[] = [{
    "$set": {},
  }, {
    "$project": {
      "mongodbODataTempJoinIsArray": 0,
    },
  }];

  extension[0]["$set"][`${field}`] = {
    "$cond": {
      "if": "$mongodbODataTempJoinIsArray",
      "then": `$${field}`,
      "else": {
        "$cond": {
          "if": {
            "$eq": [
              `$${field}`,
              [],
            ],
          },
          "then": null,
          "else": {
            "$first": `$${field}`,
          },
        },
      },
    },
  };

  return [...query, ...extension];
}