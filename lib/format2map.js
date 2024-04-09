const path = require('path')
const fs = require('fs')

let pca = require(path.resolve(__dirname, '../dist/pca-code.json'))
function jsonOut (name, data) {
  fs.writeFileSync(
    path.resolve(__dirname, `../dist/${name}.json`),
    JSON.stringify(data)
  )
}

let map = {}

function toMap (list, code = '86') {
  let tempMap = {}
  for (let index = 0; index < list.length; index++) {
    let currentCode = list[index].code.toString().padEnd(6, 0)
    tempMap[currentCode] = list[index].name
    if (list[index].children && list[index].children.length > 0) {
      toMap(list[index].children, currentCode)
    }
    map[code] = tempMap
  }
}
toMap(pca)
jsonOut('data', map)
