module.exports = {
    serviceName: "calm-user",
    nodes: [
        {
            name: "getUser.js", cluster: "input",
            queries: ["get.js"]
        },
        {
            name: "getUserByEmail.js", cluster: "input",
            queries: ["getByEmail.js"]
        },
        {
            name: "getByEmail.js",
            queries: ["table"]
        },
        {
            name: "updateCover.js",
            subs: [{
                serviceName: "calm-cover", name: "topic",
                filters: { dest: "user", eventName: "INSERT, MODIFY, REMOVE" }
            }],
            pubs: [
                { name: "table", description: "update cover" },
                { name: "cover-dlq-queue", description: "failed cover calls" },
            ]
        },

        {
            name: "createUser.js",
            eventName: "INSERT",
            pubs: [
                { name: "table", description: "create new user" },
            ],
            subs: [
                { name: "auth", description: "Post confirmation" },
            ],
        },
        {
            name: "updateUser.js",
            description: "change name (not cover)",
            eventName: "MODIFY",
            pubs: [
                { name: "table", description: "update user name" },
            ],
            subs: [
                "POST /user",

            ]
        },
        {
            name: "deleteUser.js",
            description: "deletes user",
            eventName: "REMOVE",
            pubs: ["table", { name: "auth", description: "delete from cognito" }],
            subs: ["DELETE /user"]
        },
        {
            name: "cognitoSync.js",
            description: "Custom message",
            pubs: [
                {
                    name: "verification-email",
                    description: "signup + forgot psw mails",
                },
            ],
            subs: [{ name: "auth", description: "Custom message" }],
        },
        {
            name: "preSignup.js",
            description: "Verify if invite exists",
            subs: [{ name: "auth", description: "Pre-signup", isQuery: true }],
            queries: [{ serviceName: "calm-invites", name: "getInvite.js" }]
        },
        {
            name: "postAuth.js",
            description: "update stats on visit",
            pubs: [{ name: "table", description: "update stats" }],
            subs: [{ name: "auth", description: "Post Auth" }],
        },
        {
            name: "dbConsumer.js",
            description: "db stream to publish changes",
            subs: ["table"],
            pubs: [{ name: "topic", filters: { section: "name, cover, visits" } }],
        },
        {
            name: "get.js",
            description: "user details upon login",
            subs: ["GET /user"],
            queries: ["table"],
        },
    ]
}