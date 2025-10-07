process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_key';
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod;

module.exports = async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    process.env.MONGODB_TEST_URI = uri;
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-secret-key';
};

module.exports.teardown = async () => {
    if (mongod) {
        await mongod.stop();
    }
};
