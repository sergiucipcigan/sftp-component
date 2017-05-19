'use strict';
const expect = require('chai').expect;
const upload = require('../lib/actions/upload');
const EventEmitter = require('events');
const co = require('co');
const url = require('url');

class TestEmitter extends EventEmitter {

    constructor(done) {
        super();
        this.data = [];
        this.end = 0;
        this.error = [];

        this.on('data', (value) => this.data.push(value));
        this.on('error', (value) => this.error.push(value));
        this.on('end', () => {
            this.end++;
            done();
        });
    }

}

describe('SFTP integration test', () => {

    before(() => {
        if (!process.env.SFTP_URL) throw new Error("Please set SFTP_URL env variable to proceed");
    });

    describe('upload then download', () => {
        const parsed = url.parse(process.env.SFTP_URL);
        const [username, password] = parsed.auth.split(':');
        const cfg = {
            host: parsed.hostname,
            username: username,
            password: password,
            directory: '/www/integration-test/'
        };

        before(() => upload.init(cfg));


        it('upload attachment', () => co(function* gen() {
            console.log('Starting test');
            const sender = new TestEmitter();
            const msg = {
                body: {
                },
                attachments: {
                    "logo.svg": {
                        url: "https://app.elastic.io/img/logo.svg"
                    }
                }
            };
            yield upload.process.call(sender, msg, cfg);
            console.log('Lets check');
            expect(sender.data.length).equal(1);
            expect(sender.data[0].body.results).to.be.an('array')
            expect(sender.data[0].body.results.length).equal(1);
        })).timeout(5000);
    });

});