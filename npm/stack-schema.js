// JSON schema for stack definition
const nodeTypes = ["API", "function", "queue", "table", "bucket", "topic", "auth", "email", "schedule"]
const methods = ["GET", "PUT", "POST", "DELETE", "PATCH"]
const eventNames = ["INSERT", "MODIFY", "REMOVE"]

const baseNodeProps = {
    name: { type: "string" },
    type: { type: "string" },
    cluster: { type: "string", enum: ["input", "output", "internal"] },
    description: { type: "string" },
}

const baseDepProps = {
    serviceName: { type: "string" },
    name: { type: "string" },
    description: { type: "string" },
    filter: { type: "string", enum: eventNames }
}

const subSchema = {
    type: "object",
    properties: {
        ...baseDepProps,
    },
    required: ["name"]
}

const otherDepSchema = {
    type: "object",
    properties: baseDepProps,
    required: ["name"],
    not: { required: ["filter"] }
}

const depArray = (depSchema) => ({
    type: "array",
    items: {
        oneOf: [
            { type: "string" },
            depSchema
        ]
    }
})

const apiNodeSchema = {
    type: "object",
    properties: {
        ...baseNodeProps,
        type: { type: "string", value: "API" },
        path: { type: "string" },
        method: { type: "string", enum: methods },
    },
    required: ["path", "method"],
    not: { required: ["name", "pubs", "subs", "queries"] }
}

const apiStringNodeSchema = {
    type: "object",
    properties: {
        ...baseNodeProps,
        type: { type: "string", value: "API" },
        name: { type: "string", pattern: " \\/" },
    },
    required: ["name"],
    not: { required: ["path", "method", "pubs", "subs", "queries"] }
}

const functionNodeSchema = {
    type: "object",
    properties: {
        ...baseNodeProps,
        name: { type: "string", pattern: "\\.js" },
        type: { type: "string", value: "function" },
        pubs: depArray(otherDepSchema),
        subs: depArray(subSchema),
        queries: depArray(otherDepSchema),
    },
    required: ["name"],
    not: { required: ["path", "method"] },
}

const queueNodeSchema = {
    type: "object",
    properties: {
        ...baseNodeProps,
        name: { type: "string", pattern: "queue" },
        type: { type: "string", value: "queue" },
        subs: depArray(subSchema),
    },
    required: ["name"],
    not: { required: ["path", "method", "pubs", "queries"] },
}

const otherNamedNodeSchema = {
    type: "object",
    properties: {
        ...baseNodeProps,
        name: { type: "string", pattern: `(${nodeTypes.slice(3).join('|')})` },
        type: { type: "string", enum: nodeTypes.slice(3) },
    },
    not: { required: ["path", "method", "queries", "pubs", "subs"] },
    required: ["name"]
}
const otherTypedNodeSchema = {
    type: "object",
    properties: {
        ...baseNodeProps,
        type: { type: "string", enum: nodeTypes.slice(3) },
    },
    not: { required: ["path", "method", "queries", "pubs", "subs"] },
    required: ["type"]
}

const nodeSchema = {
    type: "object",
    oneOf: [apiNodeSchema, apiStringNodeSchema, functionNodeSchema, queueNodeSchema,
        otherNamedNodeSchema, otherTypedNodeSchema]
}


module.exports = {
    type: "object",
    properties: {
        serviceName: {
            type: "string"
        },
        nodes: {
            type: "array",
            items: nodeSchema,
            minItems: 1
        },
    },
    required: ["serviceName", "nodes"],
}