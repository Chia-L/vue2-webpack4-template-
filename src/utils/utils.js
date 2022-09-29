export function typeString(data) {
  return Object.prototype.toString.call(data).split(' ')[1].slice(0, -1)
}

export function findPathsByKey(treeArray, key, keyVal, callback) {
  function findNodePaths(nodes, key, target, res = []) {
    if (!Array.isArray(nodes)) {
      throw new Error(`Error: params of function getMenuPaths is incorrect. ' +
        'the treeArray expect Array, however get ${typeString(nodes)}`)
    }
    if (!nodes.length) return res
    for (let i = 0; i < nodes.length; i++) {
      res.push(nodes[i])
      if (Array.isArray(nodes[i].children) && nodes[i].children.length) {
        return findNodePaths(nodes[i].children, key, target, res)
      }
      if (nodes[i][key] === target) {
        return res
      }
      res.pop()
    }
  }
  if (typeString(callback) === 'Function') {
    callback(findNodePaths(treeArray, key, keyVal))
    return undefined
  }
  return findNodePaths(treeArray, key, keyVal)
}
export default {
  typeString,
  findPathsByKey
}
