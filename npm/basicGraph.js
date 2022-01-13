const nodeShape = (node) => {
    switch (node.type) {
        case 'API':
            return (node.cluster === 'input') ? 'invhouse' : 'plaintext'
        case 'table':
            return 'cylinder'
        case 'topic':
            return 'rarrow'
        case 'queue':
            return 'rarrow'
        case 'bucket':
            return 'folder'
        case 'function':
            return (node.cluster === 'internal') ? 'box' : 'plaintext'
        case 'auth':
            return 'component'
        case 'email':
            return 'note'
        case 'schedule':
            return 'oval'
        default:
            return 'plaintext'
    }
}

const nodeContent = (node) => {
    const shape = nodeShape(node)
    const color = (node.isQuery) ? ' color=orange' : ''
    const nodeName = (node.serviceName) ? `${node.serviceName}\\n${node.name}` : node.name
    const splitName = node.name.split(' /')

    const descRow = (node.description) ?
        `            <tr><td align="left"><font point-size="10">${node.description || " "}</font></td></tr>
        `
        : ''
    const extraRows = (node.filters) ?
        Object.keys(node.filters).map(key => (
            `<tr>
                <td align="left"><font point-size="10">${key}:</font></td>
                <td align="left"><font point-size="10">${node.filters[key]}</font></td>
            </tr>
            `))
        : ''

    const extFontsize = (node.cluster === 'input' && node.type === 'function') ? 12 : 14
    const isDlq = (node.name.includes('dlq') || node.name.includes('failover'))
    const dlqStyle = (isDlq) ? 'style=dashed color=red ' : ''

    return (node.cluster.includes('ext')) ?
        `[shape=${shape} label="${nodeName}"${color}]`
        : (node.type === 'API') ?
            `[ shape=${shape}${color} fontsize=12 label="${splitName[0]}\\n/${splitName[1]}"]`
            : `[ shape=${shape}${color} ${dlqStyle}label=<
            <table border="0" cellborder="0" cellspacing="0">
            <tr><td align="left"><font point-size="${extFontsize}">${nodeName}</font></td></tr>
            ${descRow}${extraRows}</table>>]`
}

const edgeContent = (edge, nodes) => {
    const fromId = nodes[edge.fromName].nodeId
    const toId = nodes[edge.toName].nodeId
    if (fromId && toId) {
        let edgeLine = `    ${fromId} -> ${toId}`
        let config = []
        let description = edge.description
        if (edge.filters && edge.depType === 'sub') {
            description = Object.keys(edge.filters).map(key => {
                return `${key}=${edge.filters[key]}`
            }).join('\\l')
        }
        if (description) {
            config.push(`label="${description}"`)
        }
        if (edge.isQuery) {
            config.push(`color=orange`)
            config.push(`arrowhead=nonenonenoneoinv`)
        } else if (edge.async) {
            config.push('arrowhead = nonenoneonormal')
        }

        if (config.length) edgeLine += ` [${config.join(' ')}]`
        return edgeLine + '\n'
    }
    return ''
}

module.exports = function (struct) {
    let output = ''
    // add ids to nodes
    const { nodes, edges, serviceName } = struct
    let clusterLines = {}
    // add node lines to cluster subgraphs
    for (const nodeKey in nodes) {
        const node = nodes[nodeKey]
        const line = `        ${node.nodeId} ${nodeContent(node)}\n`
        if (!clusterLines[node.cluster]) clusterLines[node.cluster] = ""
        clusterLines[node.cluster] += line
    }
    // add node lines to output, wrapped in subgraph layout
    for (let i = 0; i < Object.keys(clusterLines).length; i++) {
        const key = Object.keys(clusterLines)[i]
        output += `    subgraph cluster${i} {
            label="${key}"
            fontname="Arial"
            fontsize=10
            color=grey
            style=dashed
    ${clusterLines[key]}    }
`
    }
    // add edges
    for (const edge of edges) {
        output += edgeContent(edge, nodes)
    }

    // wrap output in graph layout and styling stuff
    output = `digraph {
        node [shape=plaintext fontname="Arial" fontsize="10"]
        edge [fontname="Arial" fontsize="10"]
    ${output}
    labelloc="t"
    fontname="Arial"
    fontsize="20"
    label="${serviceName}"
}`
    return output
}