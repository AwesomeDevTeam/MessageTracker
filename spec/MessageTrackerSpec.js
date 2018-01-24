const MessageTracker = require("../dist/MessageTracker.cjs");

// Suite
describe("MessageTracker", function() {

    var defaultTracker0,
        defaultTracker1,
        defaultParameters = {
            timeout : 10
        };

    function filterFnc(o) {

        if (o.message.id === o.current.id) {
            o.resolve(o.current);
        } else {
            o.reject("Id not match");
        }

    }

    function prepare() {

        defaultTracker0 = MessageTracker(defaultParameters);
        defaultTracker1 = new MessageTracker(defaultParameters)

    }

    beforeAll(prepare);

    it("Constructor should throw \"Missing configuration object\" Error", () => {

        expect(function() {
            MessageTracker();
        }).toThrowError(Error, "Missing configuration object");

    });


    it("Constructor should throw Required param 'timeout' is not defined Error", () => {

        expect(function(){
            MessageTracker({});
        }).toThrowError("Required param 'timeout' is not defined");

    });


    it ("defaultTracker should be instance of DefaultTracker", () => {

        expect(defaultTracker0 instanceof MessageTracker).toBe(true);
        expect(defaultTracker1 instanceof MessageTracker).toBe(true);

    });

    it("defaultTracker.register should return Promise", function(){

        function filterFnc(o) {

        }

        expect( defaultTracker0.register({
            message : {
                id : "1",
            },
            filter : filterFnc,
            timeoutRejectWith : "TIMEOUT",
        }
        ) instanceof Promise).toBe(true);

    });


    it("defaultTracker.register should return failed Promise after 2 seconds", function(done){

        defaultTracker0.register({
                    message : {
                        id : 1,
                    },
                    timeout : 2,
                    filter : filterFnc,
                    timeoutRejectWith : "TIMEOUT",
                }
        ).then(
            () => fail("Promise should not be resolved")
        ).catch( () => {

            done();

        })

    });

    it("default.tracker.matchMessage should return true and registered Promise should be resolved", function(done) {

        defaultTracker0.register({
                message : {
                    id : 2,
                },
                timeout : 2,
                filter : filterFnc,
                timeoutRejectWith : "TIMEOUT",
            }
        ).then(
            (m) => {

                expect(m.id).toBe(2);
                done();
            }
        ).catch( () => {

            () => fail("Promise should not be rejected");

        });

        expect(defaultTracker0.matchMessage({ id : 2})).toBe(true);


    });

    it("default.tracker.matchMessage should return true and registered Promise should be rejected", function(done) {

        defaultTracker0.register({
                message : {
                    id : 3,
                },
                timeout : 2,
                filter : filterFnc,
                timeoutRejectWith : "TIMEOUT",
            }
        ).then(
            (m) => {

                () => fail("Promise should not be resolved");
            }
        ).catch( (res) => {

            expect(res).toBe("Id not match");

            done()

        });

        expect(defaultTracker0.matchMessage({ id : 4})).toBe(true);


    });

    // TODO: Sprawdzenie, czy wytimeoutuje
    it("default.tracker.matchMessage registered Promise should be rejected with TIMEOUT", function(done) {

        defaultTracker0.register({
                message : {
                    id : 5,
                },
                timeout : 2,
                filter : filterFnc,
                timeoutRejectWith : "TIMEOUT",
            }
        ).then(
            (m) => {

                () => fail("Promise should not be resolved");
            }
        ).catch( (res) => {

            expect(res).toBe("TIMEOUT");

            done()

        });

    });


});