// make node structure
// input = stackdef object
// output = { nodes: {}, edges: []}

const { edgesFromNodes } = require("./libs/edges-lib.js")
const { nodesFromStack } = require("./libs/nodes-lib.js")

module.exports = function (stackDef) {
    const nodes = nodesFromStack(stackDef)
    const edges = edgesFromNodes(nodes)
    return { nodes, edges }
}
