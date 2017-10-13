const path = require('path')
const vscode = require('vscode')

class TreeProvider {
  constructor (context) {
    this.context = context
    this.bus = new vscode.EventEmitter()
    this.onDidChangeTreeData = this.bus.event
    this.tree = {}
  }

  setData (testData) {
    this.tree = testData
    this.bus.fire()
  }

  getChildren (node) {
    return node
      ? node.children || []
      : Object.keys(this.tree).sort().map(key => this.tree[key])
  }

  getTreeItem (node) {
    const collapsibleState = node.target
      ? vscode.TreeItemCollapsibleState.Expanded
      : node.children.length === 0
        ? vscode.TreeItemCollapsibleState.None
        : vscode.TreeItemCollapsibleState.Collapsed
    const treeItem = new vscode.TreeItem(node.name, collapsibleState)
    treeItem.iconPath = this.getIcon(node)
    treeItem.contextValue = node.type
    return treeItem
  }

  getIcon (node) {
    const iconName = node.target
      ? 'target'
      : node.children.length === 0
        ? 'test'
        : 'namespace'
    const theme = this.getNodeStatus(node)
    return {
      light: this.context.asAbsolutePath(path.join('resources', theme || 'light', `${iconName}.svg`)),
      dark: this.context.asAbsolutePath(path.join('resources', theme || 'dark', `${iconName}.svg`))
    }
  }

  getNodeStatus (node) {
    if (node.children.length === 0) {
      return node.data && node.data.status
    }
    const statuses = node.children.map((node) => this.getNodeStatus(node))
    if (statuses.includes('error')) {
      return 'error'
    }
    if (statuses.every((status) => status === 'success')) {
      return 'success'
    }
  }
}

module.exports = TreeProvider
