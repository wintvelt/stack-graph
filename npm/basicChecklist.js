// create checklist 
// input = struct object
// output = .md file with todolist 

const { funcDefFromNode, handlerFromFuncNode, stackFromNode, todoFrom, clientTodosFromNode } =
    require("./libs/checklist-lib.js")

module.exports = function (structObj, oldFile) {
    const { nodes } = structObj
    let stacks = {}
    let srcs = {}

    // first create todo for each stack to be defined
    for (const nodeKey in nodes) {
        const node = nodes[nodeKey]
        // add todo to create stack from node
        stacks = stackFromNode(stacks, node)
    }
    // then add details per stack
    for (const nodeKey in nodes) {
        const node = nodes[nodeKey]
        // add todo to create stack from node
        stacks = funcDefFromNode(stacks, node)
    }

    let stackLines = []
    for (const key in stacks) {
        const stack = stacks[key]
        stackLines = stackLines.concat(stack)
    }
    stackLines = stackLines.map(todoFrom(oldFile))
    const stackBlock = stackLines.join('\n')

    // add handler todos
    for (const nodeKey in nodes) {
        const node = nodes[nodeKey]
        const needsHandler = (node.type === 'function' && node.cluster === 'internal')
        if (!needsHandler) continue
        // add todo to create handler from node
        srcs = handlerFromFuncNode(srcs, node)
    }

    let srcLines = []
    for (const key in srcs) {
        const src = srcs[key]
        srcLines = srcLines.concat(src)
    }
    srcLines = srcLines.map(todoFrom(oldFile))
    const srcBlock = srcLines.join('\n')

    // add todos for npm client
    let clientLines = []
    for (const nodeKey in nodes) {
        const node = nodes[nodeKey]
        const needsClient = (["input","output"].includes(node.cluster))
        if (!needsClient) continue
        // add todo to create handler from node
        clientLines = clientTodosFromNode(clientLines, node)
    }
    clientLines = clientLines.map(todoFrom(oldFile)).sort()
    const clientBlock = clientLines.join('\n')

    const output = `## Todo list to create your stack

### In \`/stacks\` folder create the stack
${stackBlock}

### In \`/src\` folder create the handler functions
${srcBlock}

### In \`/npm\` folder expose functions and arn info for client
${clientBlock}`

    return output
}