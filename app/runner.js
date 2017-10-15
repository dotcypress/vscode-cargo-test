const readline = require('readline')
const execa = require('execa')

class TestRunner {
  constructor (rootPath, renderFn) {
    this.rootPath = rootPath
    this.renderFn = renderFn
    this.tests = {}
    this.run()
  }

  run () {
    this.loadTests('all')
    this.runTests('all')
  }

  handleUpdate (update) {
    const target = update.target
    this.tests[target] = this.tests[target] || {
      target: target,
      name: 'All Tests',
      children: []
    }
    const node = this.ensureChild(this.tests[target], update.name.split('::'))
    Object.assign(node.data, update)
    this.renderFn(this.tests)
  }

  ensureChild (rootNode, [head, ...tail]) {
    let node = rootNode.children.find(({ name }) => name === head)
    if (!node) {
      node = { name: head, children: [], data: {} }
      rootNode.children.push(node)
      rootNode.children = rootNode.children.sort((a, b) => a.name.localeCompare(b.name))
    }
    if (tail.length === 0) {
      return node
    }
    return this.ensureChild(node, tail)
  }

  exec (args, lineCb) {
    readline.createInterface({
      input: execa('cargo', ['test', ...args], { cwd: this.rootPath }).stdout,
      terminal: false
    }).on('line', lineCb)
  }

  clearStatus (rootNode) {
    if (!rootNode) {
      return
    }
    rootNode.data && delete rootNode.data.status
    rootNode.children.forEach(node => this.clearStatus(node))
  }

  loadTests (testKind) {
    this.clearStatus(this.tests[testKind])
    this.exec([`--${testKind}`, '--', '--list', '--test-threads', '1'], (line) => {
      if (!line || line.match(/^\d+ /)) {
        return
      }
      const docTest = line.match(/(.+) - (.+) \(line (\d+)/u)
      const name = docTest ? docTest[2] : line.split(': ')[0]
      this.handleUpdate({
        name,
        target: testKind,
        file: docTest && docTest[1],
        line: docTest && docTest[3]
      })
    })
  }

  runTests (testKind) {
    this.exec([`--${testKind}`, '--', '--test-threads', '1'], (line) => {
      const docTest = line.match(/test (.+) - (.+) \(line (\d+)\) \.\.\. (.+)/u)
      if (docTest) {
        this.handleUpdate({
          target: testKind,
          name: docTest[2],
          file: docTest && docTest[1],
          line: docTest && docTest[3],
          status: docTest[4] === 'ok' ? 'success' : 'error'
        })
        return
      }
      const testMatch = line.match(/test (.+) \.\.\. (.+)/u)
      if (testMatch) {
        this.handleUpdate({
          target: testKind,
          name: testMatch[1],
          status: testMatch[2] === 'ok' ? 'success' : 'error'
        })
      }
    })
  }
}

module.exports = TestRunner
