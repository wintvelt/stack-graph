// tests for edges

import { edgesFromNodes, updateEdgesFromDep, updateEdgesFromNode } from "../npm/libs/edges-lib"
import { nodesFromStack } from "../npm/libs/nodes-lib"

const stack = {
    name: "test-stack",
    nodes: [
        { type: "function", name: "getSingle.js", subs: ["GET /[id]"], queries: ["table"] },
        { type: "function", name: "postSingle.js", subs: ["POST /[id]"], pubs: ["table"] },
        { type: "function", name: "postSingleAsync.js", pubs: [{ name: "postSingle.js", async: true }] },
        { type: "function", name: "dbConsumer.js", subs: ["table"] },
        { name: "preSignup.js", subs: [{ name: "auth", async: false }] },
    ]
}

const nodesObj = nodesFromStack(stack)

describe("updateEdgesFromDep adds edge for 1 dependency", () => {
    const node1 = nodesObj["getSingle.js"]
    const actualSubDeps = updateEdgesFromDep([], node1["subs"][0], "sub", "getSingle.js", node1)
    const actualSubDep = actualSubDeps[0]
    const actualQueryDeps = updateEdgesFromDep([], node1["queries"][0], "query", "getSingle.js", node1)
    const actualQueryDep = actualQueryDeps[0]
    const node2 = nodesObj["postSingle.js"]
    const actualPubDeps = updateEdgesFromDep([], node2["pubs"][0], "pub", "postSingle.js", node2)
    const actualPubDep = actualPubDeps[0]
    const node3 = nodesObj["postSingleAsync.js"]
    const actualAsyncPubDeps = updateEdgesFromDep([], node3["pubs"][0], "pub", "postSingleAsync.js", node3)
    const actualAsyncPubDep = actualAsyncPubDeps[0]
    const node4 = nodesObj["dbConsumer.js"]
    const actualDbDeps = updateEdgesFromDep([], node4["subs"][0], "sub", "dbConsumer.js", node4)
    const actualDbDep = actualDbDeps[0]
    const node5 = nodesObj["preSignup.js"]
    const actualAsyncDeps = updateEdgesFromDep([], node5["subs"][0], "sub", "preSignup.js", node5)
    const actualAsyncDep = actualAsyncDeps[0]
    test("creates from and to names for pub, sub and query", () => {
        expect(actualSubDep.toName).toBe("getSingle.js")
        expect(actualQueryDep.fromName).toBe("getSingle.js")
        expect(actualPubDep.fromName).toBe("postSingle.js")
    })
    test("sets async for async pubs to functions and non-api subs, never for queries", () => {
        expect(actualAsyncPubDep.toName).toBe("postSingle.js")
        expect(actualAsyncPubDep.async).toBe(true)
        expect(actualDbDep.async).toBe(true)
        expect(actualSubDep.async).toBe(false)
        expect(actualQueryDep.async).toBe(false)
        expect(actualPubDep.async).toBe(false)
    })
    test("does not override pre-existing async flag on sub", () => {
        expect(actualAsyncDep.async).toBe(false)
    })
    test("sets isQuery flag when sub to API, or when dependency is query", () => {
        expect(actualAsyncPubDep.isQuery).toBe(false)
        expect(actualDbDep.isQuery).toBe(false)
        expect(actualSubDep.isQuery).toBe(true)
        expect(actualQueryDep.isQuery).toBe(true)
        expect(actualPubDep.isQuery).toBe(false)
    })
})

describe("updateEdgesFromNode adds edge for each dependency of a node", () => {
    test("adds right number of edges for a single node", () => {
        const actual = updateEdgesFromNode([], "postSingle.js", nodesObj["postSingle.js"])
        expect(actual.length).toBe(2)
        const actual2 = updateEdgesFromNode([], "table", nodesObj["table"])
        expect(actual2.length).toBe(0)
    })
})

describe("edgesFromNodes creates array of edges from nodesObj", () => {
    test("add right number of edges for a nodesObj", () => {
        const actual = edgesFromNodes(nodesObj)
        expect(actual.length).toBe(7)
    })
})