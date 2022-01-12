// to create edges from nodesObj
const { nodeNameFromDep, typeFromName } = require("./nodes-lib.js")

// add edge from a dependency
const updateEdgesFromDep = (edges = [], dep, depType, nodeName, node) => {
    const depName = nodeNameFromDep(dep)
    const depNodeType = typeFromName(dep.name)
    const [fromName, toName] = (depType === "sub") ? [depName, nodeName] : [nodeName, depName]
    const async = Object.hasOwnProperty.call(dep, 'async') ?
        dep.async
        : (depType === "pub" && dep.async) || (depType === "sub" && !dep.name.includes("/"))
    const isQuery = Object.hasOwnProperty.call(dep, 'isQuery') ?
        dep.isQuery
        : (depType === "sub") ? (depNodeType === "API" && node.isQuery) : (depType === "query")
    const newEdge = { ...dep, depType, fromName, toName, async, isQuery }
    return [
        ...edges,
        newEdge
    ]
}

// add edges for all dependencies from 1 node
const updateEdgesFromNode = (edges = [], nodeName, node) => {
    let updatedEdges = [...edges]
    const subs = node.subs || []
    for (const sub of subs) {
        updatedEdges = updateEdgesFromDep(updatedEdges, sub, "sub", nodeName, node)
    }
    const pubs = node.pubs || []
    for (const pub of pubs) {
        updatedEdges = updateEdgesFromDep(updatedEdges, pub, "pub", nodeName, node)
    }
    const queries = node.queries || []
    for (const query of queries) {
        updatedEdges = updateEdgesFromDep(updatedEdges, query, "query", nodeName, node)
    }
    return updatedEdges
}

// add edges for all nodes
const edgesFromNodes = (nodes) => {
    let edges = []
    for (const nodeName in nodes) {
        const node = nodes[nodeName]
        edges = updateEdgesFromNode(edges, nodeName, node)
    }
    return edges
}

module.exports = {
    updateEdgesFromDep,
    updateEdgesFromNode,
    edgesFromNodes
}