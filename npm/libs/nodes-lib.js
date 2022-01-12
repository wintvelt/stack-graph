// helpers to build nodes structure

const standardCluster = {
    "API": "input",
    "function": "internal",
    "queue": "internal",
    "table": "internal",
    "bucket": "internal",
    "auth": "input",
    "topic": "output",
    "email": "output",
    "schedule": "input"
}

const standardOwnDepCluster = {
    "API": { sub: "input" },
    "function": { pub: "internal", sub: "internal", query: "internal" },
    "queue": { pub: "output", sub: "input" },
    "table": { pub: "internal", sub: "internal", query: "internal" },
    "bucket": { pub: "internal", sub: "internal", query: "internal" },
    "auth": { pub: "input", sub: "input", query: "input" },
    "topic": { pub: "output", sub: "input" },
    "email": { pub: "output", sub: "input" },
    "schedule": { sub: "input" },
}

const standardExtDepCluster = {
    "API": { pub: "extOutput", sub: "extInput", query: "extOutput" },
    "function": { pub: "extOutput", query: "extOutput" },
    "queue": { pub: "extOutput", sub: "extInput" },
    "bucket": { pub: "extOutput", sub: "extInput", query: "extOutput" },
    "auth": { pub: "extOutput", sub: "extInput", query: "extOutput" },
    "topic": { pub: "extOutput", sub: "extInput" },
    "email": { pub: "extOutput", sub: "extInput" },
}

const mapDepToObj = (dep) => ((typeof dep === "string") ? { name: dep } : dep)

const typeFromName = (name) => {
    if (name.includes(' /')) return "API"
    if (name.includes('-table')) return "table"
    if (name.includes('-bucket')) return "bucket"
    if (name.includes('-auth')) return "auth"
    if (name.includes('-topic')) return "topic"
    if (name.includes('-queue')) return "queue"
    if (name.includes('-email')) return "email"
    if (name.includes('-schedule')) return "schedule"
    if (["table", "bucket", "auth", "topic", "queue", "email", "schedule"].includes(name)) return name
    return "function"
}

// create standard node from input node
const standardNode = (node) => {
    const type = node.type || typeFromName(node.name)
    const name = (type === 'API') ?
        (node.name) ?
            node.name
            : `${node.method} ${node.path}`
        : (type === 'function') ?
            node.name
            : (node.name) ?
                (node.name.includes(type)) ?
                    node.name
                    : `${node.name}-${type}`
                : type
    const cluster = node.cluster || standardCluster[type]
    let newNode = { ...node, type, name, cluster }
    if (node.subs) newNode.subs = node.subs.map(mapDepToObj)
    if (node.pubs) newNode.pubs = node.pubs.map(mapDepToObj)
    if (node.queries) newNode.queries = node.queries.map(mapDepToObj)
    return newNode
}

const nodesFromList = (nodeList) => {
    let outputNodes = {}
    nodeList.forEach(node => {
        const newNode = standardNode(node)
        outputNodes[newNode.name] = newNode
    })
    return outputNodes
}

const nodeNameFromDep = (dep) => (dep.serviceName) ? `${dep.serviceName}-${dep.name}` : dep.name

// per pub
const updateNodesFromDep = (nodes, dep, depType) => {
    // check of node al bestaat
    const indexName = nodeNameFromDep(dep)
    const type = typeFromName(dep.name)
    const cluster = (dep.serviceName) ?
        standardExtDepCluster[type][depType]
        : (dep.cluster) ?
            dep.cluster
            : standardOwnDepCluster[type][depType]
    const existingNode = nodes[indexName]
    if (!existingNode) {
        let newNode = {
            name: dep.name,
            serviceName: dep.serviceName,
            filters: dep.filters,
            type,
            cluster
        }
        if (dep.serviceName && type === "function") newNode.isQuery = (depType === "query")
        return {
            ...nodes,
            [indexName]: newNode
        }
    }
    return ({
        ...nodes,
        [indexName]: {
            ...existingNode,
            cluster: (cluster.includes("input")) ?
                cluster
                : (cluster.includes("output") && existingNode.cluster === "internal") ?
                    "output"
                    : existingNode.cluster,
            filters: (existingNode.filters) ?
                (dep.filters) ?
                    `${existingNode.filters}, ${dep.filters}`
                    : existingNode.filters
                : dep.filters
        }
    })
}

const hasOnlyQuerySub = (nodesObj, name) => {
    const querySubscriberWithPubs = Object.keys(nodesObj).filter(key => {
        const node = nodesObj[key]
        const isSubscribed = !!node.subs && !!node.subs.map(s => s.name).find(n => (n === name))
        const hasPubs = !!node.pubs && node.pubs.length > 0
        return (isSubscribed && hasPubs)
    })
    return (querySubscriberWithPubs.length === 0)
}

const nodesFromStack = (stackdef) => {
    const { nodes } = stackdef
    // create initial nodes set from nodes
    let nodesObj = nodesFromList(nodes)
    // create/change nodes from deps if needed
    for (const key in nodesObj) {
        const node = nodesObj[key]
        const subs = node.subs || []
        for (const sub of subs) {
            nodesObj = updateNodesFromDep(nodesObj, sub, "sub")
        }
        const pubs = node.pubs || []
        for (const pub of pubs) {
            nodesObj = updateNodesFromDep(nodesObj, pub, "pub")
        }
        const queries = node.queries || []
        for (const query of queries) {
            nodesObj = updateNodesFromDep(nodesObj, query, "query")
        }
    }
    // set isQuery to function and API nodes
    for (const key in nodesObj) {
        const node = nodesObj[key]
        switch (node.type) {
            case "function":
                nodesObj[key].isQuery = (!node.pubs || node.pubs.length === 0)
                break
            case "API":
                nodesObj[key].isQuery = hasOnlyQuerySub(nodesObj, key)
            default:
                break
        }
    }
    // add nodeId to each node
    for (let i = 0; i < Object.keys(nodesObj).length; i++) {
        const nodeKey = Object.keys(nodesObj)[i]
        nodesObj[nodeKey].nodeId = `node${i}`
    }
    return nodesObj
}

module.exports = {
    standardOwnDepCluster,
    standardExtDepCluster,
    typeFromName,
    standardNode,
    nodesFromList,
    nodeNameFromDep,
    updateNodesFromDep,
    nodesFromStack
}