// libs to create checklist from structObj

// mark todo as done if already included as done in oldFile
const todoFrom = (oldFile) => (todo) => {
    const todoDone = todo.replace('[ ]', '[x]')
    const todoWasDone = oldFile.includes(`\n${todoDone}\n`)
    return (todoWasDone) ? todoDone : todo
}

// format name with maybe service name in it
const niceName = (item) => {
    return (item.serviceName) ?
        `\`${item.name}\` in \`${item.serviceName}\` service`
        : `\`${item.name}\``
}

// add permission todos to a stack todolist
const addPermissionsForPubs = (todoList, node, indent = '') => {
    const { name, pubs = [], queries = [] } = node
    const list = pubs.concat(queries)
    if (list.length === 0) return todoList
    let output = [...todoList]
    for (const item of list) {
        const newTodo = `${indent}  - [ ] add permissions for \`${name}\` to access ${niceName(item)}`
        output.push(newTodo)
    }
    return output
}

// add createStack todo to stacks
const stackFromNode = (stacks, node) => {
    let output = { ...stacks }
    const noStackNeeded = (node.serviceName || node.type === "function")
    if (noStackNeeded) return output

    const nodeStack = output[node.name] || []
    const unsupported = ['email'].includes(node.type)
    const newTodo = (unsupported) ?
        `  - [ ] Manually setup ${node.type} in AWS console for \`${node.name}\``
        : `  - [ ] add ${node.type} stack for \`${node.name}\``
    nodeStack.push(newTodo)
    output[node.name] = nodeStack
    return output
}

// add function def todo as stack or within other stack
const funcDefFromNode = (stacks, node) => {
    let output = { ...stacks }
    const isInternalFunc = (node.type === 'function' && !node.serviceName)
    if (!isInternalFunc) return output

    const needsStack = (!node.subs || node.subs.length === 0)
    if (needsStack) {
        const nodeStack = [`  - [ ] add function stack for \`${node.name}\``]
        output[node.name] = nodeStack
        output[node.name] = addPermissionsForPubs(output[node.name], node, '  ')
        return output
    }
    const funcOwner = node.subs[0].name
    const ownerNotInStack = !output[funcOwner]
    if (ownerNotInStack) return output

    const newTodo = `    - [ ] add function definition for \`${node.name}\``
    output[funcOwner].push(newTodo)
    output[funcOwner] = addPermissionsForPubs(output[funcOwner], node, '  ')
    return output
}

// add todos for pubs and queries
const addLinesForPubs = (todoList, node) => {
    const { pubs = [], queries = [] } = node
    const list = pubs.concat(queries)
    if (list.length === 0) return todoList
    let output = [...todoList]
    for (const query of queries) {
        const desc = (query.description) ? ` to ${query.description}` : ''
        const newTodo = `    - [ ] add query of ${niceName(query)}${desc}`
        output.push(newTodo)
    }
    for (const pub of pubs) {
        const desc = (pub.description) ? ` to ${pub.description}` : ''
        const newTodo = `    - [ ] add update for ${niceName(pub)}${desc}`
        output.push(newTodo)
    }
    return output
}

// add todo to define function handler
const handlerFromFuncNode = (srcs, node) => {
    let output = { ...srcs }
    const desc = (node.description) ? ` to ${node.description}` : ''
    output[node.name] = [`  - [ ] create \`${node.name}\` handler${desc}`]
    output[node.name] = addLinesForPubs(output[node.name], node)
    return output
}

module.exports = {
    todoFrom,
    addPermissionsForPubs,
    stackFromNode,
    funcDefFromNode,
    addLinesForPubs,
    handlerFromFuncNode
}