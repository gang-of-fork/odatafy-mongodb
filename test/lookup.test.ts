import { describe, test, before, after } from 'mocha';
import { expect } from 'chai';

import * as mongoDB from 'mongodb';
import * as dotenv from 'dotenv';

import { getQueryFromUrl } from '../src/mongodbGenerator';

import * as testdata from './testdata.json';

describe('Function integration tests', () => {
    dotenv.config();
    const dbUri = process.env.DB_URL as string;
    const dbname = 'test';
    let mdbClient: mongoDB.MongoClient;

    before(async () => {
        //create test db

        mdbClient = new mongoDB.MongoClient(dbUri);
        await mdbClient.connect();

        //@ts-expect-error load json to db
        await Promise.all(testdata.default.map(async (testcollection: { tableName: string, data: any[] }) => {
            return await mdbClient.db(dbname).collection(testcollection.tableName).insertMany(testcollection.data.map(doc => {
                if (testcollection.tableName == "orders") {
                    return {
                        ...doc,
                        ...{ _id: doc.id },
                        ...{ orderDate: new Date(doc.orderDate) }
                    }
                }

                return {
                    ...doc,
                    ...{ _id: doc.id }
                }
            }))
        }));
    });

    [
        {
            "category": "test expand",
            "testcases": [
                {
                    "name": "test expand on single value field",
                    "tableName": "inventoryItems",
                    "url": "?$expand=category",
                    "expected": [
                        {
                            "category": {
                                "id": 3,
                                "name": "plates",
                                "sku": null
                            }
                        },
                        {
                            "category": {
                                "id": 2,
                                "name": "cutlery",
                                "sku": "cut"
                            }
                        },
                        {
                            "category": {
                                "id": 2,
                                "name": "cutlery",
                                "sku": "cut"
                            }
                        },
                        {
                            "category": {
                                "id": 2,
                                "name": "cutlery",
                                "sku": "cut"
                            }
                        },
                        {
                            "category": {
                                "id": 1,
                                "name": "furniture",
                                "sku": null
                            }
                        },
                        {
                            "category": {
                                "id": 1,
                                "name": "furniture",
                                "sku": null
                            }
                        }
                    ]
                }
            ]
        }
    ].forEach((testcaseCategory) => {
        describe(testcaseCategory.category, () => {
            testcaseCategory.testcases.forEach(testcase => {
                test(testcase.name, async () => {
                    const query = getQueryFromUrl(testcase.url, { 
                        expandMapping: {
                            category: 'categories'
                        }
                    });

                    const queryResult = await mdbClient.db(dbname).collection(testcase.tableName).aggregate(query).toArray();

                    for(let qR of queryResult) {
                        expect(testcase.expected.some(exp =>{
                            const category = exp['category'];
                            return Object.keys(category).every(k => {
                                //@ts-expect-error
                                return exp['category'][k] == qR['category'][k];
                            });
                        })).to.equal(true);
                    }
                });
            })
        });
    });


    after(async () => {
        await Promise.all((await mdbClient.db(dbname).collections()).map(async (collection) => {
            await collection.deleteMany({});
        }));

        mdbClient.close();
    });
})