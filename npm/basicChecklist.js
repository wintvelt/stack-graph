// create checklist 
// input = struct object
// output = .md file with todolist 

const { funcDefFromNode, handlerFromFuncNode, stackFromNode, todoFrom } = require("./libs/checklist-lib.js")

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

    // add handler todos
    for (const nodeKey in nodes) {
        const node = nodes[nodeKey]
        const needsHandler = (node.type === 'function' && !node.serviceName)
        if (!needsHandler) continue
        // add todo to create handler from node
        srcs = handlerFromFuncNode(srcs, node)
    }
    let stackLines = []
    for (const key in stacks) {
        const stack = stacks[key]
        stackLines = stackLines.concat(stack)
    }
    stackLines = stackLines.map(todoFrom(oldFile))
    let srcLines = []
    for (const key in srcs) {
        const src = srcs[key]
        srcLines = srcLines.concat(src)
    }
    srcLines = srcLines.map(todoFrom(oldFile))
    const stackBlock = stackLines.join('\n')
    const srcBlock = srcLines.join('\n')

    const output = `## Todo list to create your stack

### In \`/stacks\` folder create the stack
${stackBlock}

### In \`/src\` folder create the handler functions
${srcBlock}`

    return output
}