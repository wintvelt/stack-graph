const { promisify } = require('util')
const { exec } = require('child_process')
const { readFileSync, writeFileSync } = require('fs')
const makeStruct = require('./basicStruct.js')
const makeChecklist = require('./basicChecklist.js')
const makeBasicGraph = require('./basicGraph.js')
const validate = require('./validate.js')

const asyncExec = promisify(exec)

const getFromArgv = (flag, argv) => {
    const index = argv.indexOf(flag)
    if (index === -1 || argv.length < (index + 2)) return undefined
    return argv[index + 1]
}

async function localGraph(passedArgs) {
    const fromCLI = process.argv
    const inputFilename = passedArgs?.inputFilename || getFromArgv('-i', fromCLI) || "stackdef.js"
    const outputFilename = passedArgs?.outputFilename || getFromArgv('-o', fromCLI) || 'stackdef'
    const graphFormat = passedArgs?.graphFormat || getFromArgv('-e', fromCLI) || 'png'
    const path = passedArgs?.path || getFromArgv('-p', fromCLI)
    if (!path) throw new Error("missing required parameter path")

    // get input file
    const { default: stackdefObj } = await import(path + '/' + inputFilename);

    // validate file
    const validationResult = validate(stackdefObj)
    if (!validationResult.valid) {
        console.log(validationResult.errors)
        throw new Error('Not a valid stack')
    }

    // create object with all nodes and edges
    const structObj = makeStruct(stackdefObj)
    const jsonFilename = `${path}/${outputFilename}.json`
    try {
        writeFileSync(jsonFilename, JSON.stringify(structObj, null, 2))
    } catch (error) {
        throw new Error("could not save .json file")
    }

    // create todo list
    const mdFilename = `${path}/${outputFilename}.md`
    let oldFile = ''
    try {
        oldFile = readFileSync(mdFilename, { encoding: "utf-8" })
    } catch (_) {
        oldFile = ''
    }

    const todoContents = makeChecklist(structObj, oldFile)
    try {
        writeFileSync(mdFilename, todoContents)
    } catch (error) {
        throw new Error("could not save .md file")
    }

    // create and write dot file
    const serviceName = stackdefObj.serviceName || "My service"
    const basicGraph = makeBasicGraph({ ...structObj, serviceName })
    const dotFilename = `${path}/${outputFilename}.dot`
    try {
        writeFileSync(dotFilename, basicGraph)
    } catch (error) {
        throw new Error("could not save .dot file")
    }

    // create graph
    const graphFilename = `${path}/${outputFilename}.${graphFormat}`
    const cliCommand = `dot -T${graphFormat} "${dotFilename}" -o ${graphFilename}`
    try {
        await asyncExec(cliCommand)
    } catch (error) {
        throw new Error("could not create graph file")
    }

    return {
        valid: true,
        message: `OK - files saved as ${outputFilename}`
    }
}

async function localVerify({ inputFilename = 'stackdef.js', path }) {
    // get input file
    const { default: stackdefObj } = await import(path + '/' + inputFilename)

    const validationResult = validate(stackdefObj)
    return validationResult
}

module.exports = {
    localGraph,
    localVerify
}