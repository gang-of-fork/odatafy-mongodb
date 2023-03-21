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
            "category": "test functions with 1 args",
            "testcases": [
                {
                    "name": "test year",
                    "tableName": "orders",
                    "url": "?$filter=year(orderDate) eq 2021",
                    "expected": [
                        {
                            "orderDate": new Date("2021-03-03T15:16:29.892Z")
                        },
                        {
                            "orderDate": new Date("2021-06-03T15:16:29.892Z")
                        },
                        {
                            "orderDate": new Date("2021-10-03T15:16:29.892Z")
                        }
                    ]
                },
                {
                    "name": "test month",
                    "tableName": "orders",
                    "url": "?$filter=month(orderDate) eq 3",
                    "expected": [
                        {
                            "orderDate": new Date("2021-03-03T15:16:29.892Z")
                        }
                    ]
                },
                {
                    "name": "test minute",
                    "tableName": "orders",
                    "url": "?$filter=minute(orderDate) eq 16",
                    "expected": [
                        {
                            "orderDate": new Date("2021-03-03T15:16:29.892Z")
                        },
                        {
                            "orderDate": new Date("2021-06-03T15:16:29.892Z")
                        },
                        {
                            "orderDate": new Date("2021-10-03T15:16:29.892Z")
                        }
                    ]
                },
                {
                    "name": "test hour",
                    "tableName": "orders",
                    "url": "?$filter=hour(orderDate) eq 15",
                    "expected": [
                        {
                            "orderDate": new Date("2021-03-03T15:16:29.892Z")
                        },
                        {
                            "orderDate": new Date("2021-06-03T15:16:29.892Z")
                        },
                        {
                            "orderDate": new Date("2021-10-03T15:16:29.892Z")
                        }
                    ]
                },
                {
                    "name": "test second",
                    "tableName": "orders",
                    "url": "?$filter=second(orderDate) eq 29",
                    "expected": [
                        {
                            "orderDate": new Date("2021-03-03T15:16:29.892Z")
                        },
                        {
                            "orderDate": new Date("2021-06-03T15:16:29.892Z")
                        },
                        {
                            "orderDate": new Date("2021-10-03T15:16:29.892Z")
                        }
                    ]
                },
                {
                    "name": "test fractionalseconds",
                    "tableName": "orders",
                    "url": "?$filter=fractionalseconds(orderDate) eq 892",
                    "expected": [
                        {
                            "orderDate": new Date("2021-03-03T15:16:29.892Z")
                        },
                        {
                            "orderDate": new Date("2021-06-03T15:16:29.892Z")
                        },
                        {
                            "orderDate": new Date("2021-10-03T15:16:29.892Z")
                        }
                    ]
                },
                {
                    "name": "test floor",
                    "tableName": "inventoryItems",
                    "url": "?$filter=floor(price) eq 1",
                    "expected": [
                        {
                            "id": 1,
                        },
                        {
                            "id": 3,
                        },
                        {
                            "id": 5,
                        }
                    ]
                },
                {
                    "name": "test ceiling",
                    "tableName": "inventoryItems",
                    "url": "?$filter=ceiling(price) eq 2",
                    "expected": [
                        {
                            "id": 3,
                        },
                        {
                            "id": 5,
                        }
                    ]
                },
                {
                    "name": "test toupper",
                    "tableName": "inventoryItems",
                    "url": "?$filter=toupper(name) eq 'PLATE'",
                    "expected": [
                        {
                            "id": 1
                        }
                    ]
                },
                {
                    "name": "test tolower",
                    "tableName": "customers",
                    "url": "?$filter=tolower(name) eq 'robin'",
                    "expected": [
                        {
                            "id": 2
                        }
                    ]
                },
                {
                    "name": "test trim",
                    "tableName": "inventoryItems",
                    "url": "?$filter=trim(name) eq 'plate'",
                    "expected": [
                        {
                            "id": 1
                        }
                    ]
                }
            ]
        }
    ].forEach((testcaseCategory) => {
        describe(testcaseCategory.category, () => {
            testcaseCategory.testcases.forEach(testcase => {
                test(testcase.name, async () => {
                    const query = getQueryFromUrl(testcase.url);

                    const queryResult = await mdbClient.db(dbname).collection(testcase.tableName).aggregate(query).toArray();

                    expect(testcase.expected.length).to.equal(queryResult.length);

                    for(let qR of queryResult) {
                        expect(testcase.expected.some((exp: any) =>{
                            return Object.keys(exp).every(k => {
                                return exp[k].toString() == qR[k].toString();
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
});