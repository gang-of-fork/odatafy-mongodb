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

    /*
    [
        {
            "category": "test compute",
            "testcases": [
                {
                    "name": "test compute with simple add",
                    "tableName": "inventoryItems",
                    "url": "?$compute=round(price add 2) as AddedPrice",
                    "expected": [
                        {
                            "AddedPrice": 3
                        },
                        {
                            "AddedPrice": 5
                        },
                        {
                            "AddedPrice": 3.5
                        },
                        {
                            "AddedPrice": 4.5
                        },
                        {
                            "AddedPrice": 3.75
                        },
                        {
                            "AddedPrice": 5.75
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

                    console.log(query);

                    const queryResult = await mdbClient.db(dbname).collection(testcase.tableName).aggregate(query).toArray();

                    for(let qR of queryResult) {
                        expect(testcase.expected.some(exp =>{
                            return Object.keys(exp).every(k => {
                                return exp[k].toString() == qR[k].toString();
                            });
                        })).to.equal(true);
                    }
                });
            })
        });
    });
    */

    after(async () => {
        await Promise.all((await mdbClient.db(dbname).collections()).map(async (collection) => {
            await collection.deleteMany({});
        }));

        mdbClient.close();
    });
});