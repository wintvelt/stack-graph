// tests for nodes-lib
import { nodesFromList, nodesFromStack, standardNode, updateNodesFromDep } from "../npm/libs/nodes-lib.js"

const apiNode = { type: "API", method: "GET", path: "/" }
const functionNode = { type: "function", name: "create.js" }
const nodeWithName = { type: "table", name: "visits" }
const nodeWithCluster = { type: "bucket", cluster: "input" }
const nodeList = [apiNode, nodeWithName, nodeWithCluster]

describe("standardNode construct node names", () => {
    test("API name is method and path", () => {
        const actual = standardNode(apiNode)
        expect(actual.name).toBe("GET /")
    })
    test("use name with type if present", () => {
        const actual = standardNode(nodeWithName)
        expect(actual.name).toBe("visits-table")
    })
    test("use only name if function type", () => {
        const actual = standardNode(functionNode)
        expect(actual.name).toBe("create.js")
    })
    test("use type as name if no name given", () => {
        const actual = standardNode({ type: "topic" })
        expect(actual.name).toBe("topic")
    })
})

describe("standardNode infers type from name if not specified", () => {
    test("infers function from .js name", () => {
        const actual = standardNode({ name: "create.js" })
        expect(actual.type).toBe("function")
    })
    test("infers API from included path", () => {
        const actual = standardNode({ name: "POST /user" })
        expect(actual.type).toBe("API")
    })
    test("infers type from name for other types", () => {
        const actual = standardNode({ name: "user-table" })
        expect(actual.type).toBe("table")
    })
})

describe("standardNode construct cluster names", () => {
    test("uses cluster name if given", () => {
        const actual = standardNode(nodeWithCluster)
        expect(actual.cluster).toBe("input")
    })
    test("use standard cluster if none given", () => {
        const actual = standardNode(nodeWithName)
        expect(actual.cluster).toBe("internal")
    })
})

describe("nodesFromList converts node array to object", () => {
    const actual = nodesFromList(nodeList)
    test("creates object per node", () => {
        expect(actual["bucket"].name).toBe("bucket")
        expect(actual["visits-table"].name).toBe("visits-table")
    })
})

describe("updateNodesFromDep adds or updates node from 1 dep", () => {
    const nodesObj = nodesFromList([...nodeList, { type: "bucket", name: "log" }])
    test("adds a node if dep is new", () => {
        const dep = { name: "POST /" }
        const actual = updateNodesFromDep(nodesObj, dep, "sub")
        expect(actual["POST /"].type).toBe("API")
        expect(actual["POST /"].cluster).toBe("input")
    })
    test("sets isQuery flag on external function dependencies", () => {
        const dep = { serviceName: "outside", name: "listall.js" }
        const actual = updateNodesFromDep(nodesObj, dep, "query")
        const dep2 = { serviceName: "outside", name: "create.js" }
        const actual2 = updateNodesFromDep(actual, dep2, "pub")
        expect(actual2["outside-listall.js"].isQuery).toBe(true)
        expect(actual2["outside-create.js"].isQuery).toBe(false)
    })
    test("updates existing when output trumps internal cluster", () => {
        const dep = { name: "log-bucket", cluster: "output" }
        const actual = updateNodesFromDep(nodesObj, dep, "pub")
        expect(actual["log-bucket"].cluster).toBe("output")
    })
    test("updates existing when input trumps output cluster", () => {
        const dep = { name: "log-bucket", cluster: "output" }
        const actual1 = updateNodesFromDep(nodesObj, dep, "pub")
        const actual2 = updateNodesFromDep(actual1, { ...dep, cluster: "input" }, "sub")
        expect(actual2["log-bucket"].cluster).toBe("input")
    })
    test("updates existing when input trumps internal cluster", () => {
        const dep = { name: "log-bucket", cluster: "input" }
        const actual = updateNodesFromDep(nodesObj, dep, "sub")
        expect(actual["log-bucket"].cluster).toBe("input")
    })
    test("no updates on node with input cluster", () => {
        const dep = { name: "bucket" }
        const actual = updateNodesFromDep(nodesObj, dep, "pub")
        expect(actual["bucket"].cluster).toBe("input")
    })
})

const stack = {
    nodes: [
        {
            type: "function", name: "create.js",
            subs: ["PUT /"],
            pubs: ["table", "bucket", "topic"],
            queries: [{ serviceName: "outside", name: "listall.js" }],
        },
        { type: "table" },
        { type: "function", name: "invokeCreateAsync.js", async: true, pubs: ["create.js"] },
        { type: "function", name: "listall.js", subs: ["GET /"] }
    ]
}

describe("nodesFromStack creates nodes from stack object", () => {
    const nodesObj = nodesFromStack(stack)
    test("nodes created from deps too", () => {
        expect(Object.keys(nodesObj).length).toBe(9)
    })
    test("external query is extOutput cluster", () => {
        expect(nodesObj["outside-listall.js"].cluster).toBe("extOutput")
    })
    test("sets isQuery flags on internal APIs and functions", () => {
        expect(nodesObj["create.js"].isQuery).toBe(false)
        expect(nodesObj["invokeCreateAsync.js"].isQuery).toBe(false)
        expect(nodesObj["listall.js"].isQuery).toBe(true)
    })
})