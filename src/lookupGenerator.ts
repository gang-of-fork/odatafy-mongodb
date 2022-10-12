import { Document } from "mongodb";
import { ExpandPathNode, ExpandPathNodeWithOptions, NodeTypes, expandParser, ExpandItemNode } from "odatafy-parser";
import { generateMatchStage } from "./filterGenerator";
import { generateSortStage } from "./sortGenerator";
import { generateLimitStage } from "./limitGenerator";
import { generateSkipStage } from "./skipGenerator";
import { generateProjectStage } from "./selectGenerator";

export type CollectionMap = {
  [key: string]: string;
};

/**
 * Get a MongoDB lookup stage based on oData expand parameter
 * @param expr expression of the oData expand parameter
 * @param collectionMap collection map to map properties of a data model to collection names
 * @returns MongoDB lookup stage
 */
export function generateLookupFromExpand(
  expr: string,
  collectionMap: CollectionMap,
): Document[] {
  let result: Document[] = [];

  const expNode = expandParser.parse(expr);

  expNode.value.forEach((node: ExpandPathNode | ExpandPathNodeWithOptions) => {
    //generate lookup pipeline
    const pipeline: Document[] = [];

    //Is path node without options
    if (node.nodeType == NodeTypes.ExpandPathNode) {

      const extractedPaths: string[] = []

      node.value.forEach((itemNode: ExpandItemNode) => {
        if (itemNode.nodeType == NodeTypes.ExpandIdentifierNode) {
          extractedPaths.push(itemNode.value);
        }
      });

      const path = extractedPaths.join('.');

      if (path in collectionMap) {
        result = [...result, ...getLookupQuery(path, collectionMap[path])];
      }

    }

    //Is path node with options
    if (node.nodeType == NodeTypes.ExpandPathNodeWithOptions) {

      const extractedPaths: string[] = []

      node.value.forEach((itemNode: ExpandItemNode) => {
        if (itemNode.nodeType == NodeTypes.ExpandIdentifierNode) {
          extractedPaths.push(itemNode.value);
        }
      });

      const path = extractedPaths.join('.');

      if (path in collectionMap) {
        //only process options after checking if field is in collectionMap to safe some performance
        const optionsPipeline: Document[] = [];
        
        if (node.optionType == 'default') {
          //@ts-expect-error
          if (node.options.filter) {
            //@ts-expect-error
            optionsPipeline.push(generateMatchStage(node.options.filter));
          }

          //@ts-expect-error
          if (node.options.orderby) {
            //@ts-expect-error
            optionsPipeline.push(generateSortStage(node.options.orderby));
          }

          //@ts-expect-error
          if (node.options.skip) {
            //@ts-expect-error
            optionsPipeline.push(generateSkipStage(node.options.skip));
          }

          //@ts-expect-error
          if (node.options.top) {
            //@ts-expect-error
            optionsPipeline.push(generateLimitStage(node.options.top));
          }

          //@ts-expect-error
          if(node.options.select) {
            //@ts-expect-error
            optionsPipeline.push(generateProjectStage(node.options.select));
          }

          result = [...result, ...getLookupQuery(path, collectionMap[path], optionsPipeline)];
        }

      }

    }


    return pipeline
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