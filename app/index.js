const vscode = require('vscode')
const TreeProvider = require('./tree-provider')
const TestRunner = require('./runner')

module.exports.activate = (context) => {
  const treeProvider = new TreeProvider(context)
  const testRunner = new TestRunner(vscode.workspace.rootPath, (data) => treeProvider.setData(data))
  vscode.workspace.onDidSaveTextDocument(() => testRunner.run())
  vscode.window.registerTreeDataProvider('CargoTestView', treeProvider)
  testRunner.run()
}
