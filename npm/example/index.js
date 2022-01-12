// index.js
const { resolve } = require('path')
const { localGraph, localVerify } = require("../local.js")

const currentPath = resolve('./')

async function main() {
    const result = await localGraph({
        outputFilename: 'stackdef',
        path: currentPath
    })
    console.log(result.valid)

    const validationResult = await localVerify({
        path: currentPath
    })
    console.log(validationResult.valid)
}

main()