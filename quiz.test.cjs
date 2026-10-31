/* 飞桨领航百团大战答题网页：验证当前题改选、计分状态与页面全流程不展示答案的约束。 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const questions = require('./dist/questions.js');
const Quiz = require('./dist/quiz.js');

// 覆盖现场连续答题的状态边界，而非仅检查界面文案。
test('10 道精选题完整，仅包含 AI 趣味与应用、飞桨及社团认知', () => {
  assert.equal(questions.length, 10);
  assert.equal(questions.filter(question => question.category.startsWith('AI')).length, 8);
  assert.deepEqual(questions.slice(8).map(question => question.category), ['认识飞桨', '认识我们']);
  assert.doesNotMatch(questions.map(question => question.prompt).join(' '), /HTTPS|DNS|photo\.|浮点数|验证码|硬币|水果盒/);
  for (const question of questions) {
    assert.equal(question.options.length, 4);
    assert.ok(question.prompt && question.explanation);
    assert.ok(Number.isInteger(question.answer) && question.answer >= 0 && question.answer < 4);
  }
});
test('未选择不能跳题，当前题可改选且不重复计分', () => {
  const quiz = new Quiz(questions);
  assert.equal(quiz.choose(0), false);
  quiz.start();
  assert.equal(quiz.next(), false);
  assert.equal(quiz.choose(-1), false);
  assert.equal(quiz.choose(4), false);
  assert.equal(quiz.choose(questions[0].answer), true);
  assert.equal(quiz.choose(questions[0].answer), false);
  assert.equal(quiz.correct, 1);
  assert.equal(quiz.choose((questions[0].answer + 1) % 4), true);
  assert.equal(quiz.correct, 0);
  assert.equal(quiz.choose(questions[0].answer), true);
  assert.equal(quiz.correct, 1);
  assert.equal(quiz.answers.length, 1);
  assert.equal(quiz.next(), true);
  quiz.choose((questions[1].answer + 1) % 4);
  assert.equal(quiz.answers[0], questions[0].answer);
  assert.equal(quiz.complete, false);
});
test('完成 10 题按每题 10 分保留成绩；下一人未完成不覆盖上一人成绩', () => {
  const quiz = new Quiz(questions);
  quiz.start();
  questions.forEach((question, index) => {
    quiz.choose(index < 6 ? question.answer : (question.answer + 1) % 4);
    quiz.next();
  });
  assert.equal(quiz.complete, true);
  assert.deepEqual(quiz.lastResult, { correct: 6, total: 10, score: 60 });
  // 最后一题改选后，已保留的总成绩必须按最新选择更新。
  quiz.choose(questions[9].answer);
  assert.equal(quiz.lastResult.score, 70);
  quiz.choose((questions[9].answer + 1) % 4);
  assert.equal(quiz.lastResult.score, 60);
  quiz.start();
  assert.equal(quiz.index, 0);
  assert.deepEqual(quiz.answers, []);
  quiz.choose(questions[0].answer);
  assert.equal(quiz.lastResult.score, 60);
  assert.equal(quiz.answers[0], questions[0].answer);
  quiz.next();
  questions.slice(1).forEach(question => { quiz.choose(question.answer); quiz.next(); });
  assert.equal(quiz.lastResult.score, 100);
  assert.equal(new Quiz(questions).lastResult, null);
});

// 用最小 DOM 执行实际页面脚本，检查可见内容与无障碍标签。
function createPage() {
  const nodes = [];
  const listeners = {};
  function node(tag) {
    const item = {
      tag, tagName: tag.toUpperCase(), children: [], attributes: {}, style: {}, className: '', textContent: '',
      append(...children) { this.children.push(...children); },
      replaceChildren(...children) { this.children = children; },
      setAttribute(key, value) { this.attributes[key] = value; },
      addEventListener(event, action) { this[event] = action; },
      focus() {},
      classList: { add(name) { item.className += ` ${name}`; } }
    };
    nodes.push(item);
    return item;
  }
  const app = node('main');
  const location = { hash: '', pathname: '/', search: '' };
  const context = vm.createContext({
    Quiz, QUESTIONS: questions, location,
    document: {
      createElement: node,
      createTextNode: text => ({ textContent: text, children: [], attributes: {} }),
      getElementById: id => id === 'app' ? app : nodes.findLast(item => item.id === id)
    },
    window: { scrollTo() {}, addEventListener(name, action) { listeners[name] = action; } },
    history: {
      pushState(state, title, hash) { location.hash = hash; },
      replaceState() {},
      back() { location.hash = ''; vm.runInContext('showHome()', context); }
    }
  });
  vm.runInContext(fs.readFileSync(`${__dirname}/dist/app.js`, 'utf8'), context);
  return { app, run: code => vm.runInContext(code, context), dispatch: (name, event) => listeners[name](event) };
}
function descendants(root) {
  return [root, ...root.children.flatMap(descendants)];
}
function assertNoAnswer(page) {
  const nodes = descendants(page.app);
  const content = nodes.map(node => [node.textContent, ...Object.values(node.attributes)].join(' ')).join(' ');
  assert.doesNotMatch(content, /正确答案|回答正确|回答错误|[✓✕]/);
  for (const question of questions) assert.ok(!content.includes(question.explanation));
  assert.ok(nodes.every(node => !/\b(correct|wrong|good|bad|feedback)\b/.test(node.className)));
}
test('正确和错误选择、恢复答题、全部题目及成绩页面均不展示答案', () => {
  const page = createPage();
  assertNoAnswer(page);
  page.run('start()');
  for (let index = 0; index < questions.length; index += 1) {
    assertNoAnswer(page);
    const options = descendants(page.app).filter(node => node.className === 'option');
    const choice = (questions[index].answer + index % 2) % 4;
    options[(choice + 1) % 4].click();
    assertNoAnswer(page);
    const currentOptions = descendants(page.app).filter(node => node.tag === 'button' && /\boption\b/.test(node.className));
    assert.ok(currentOptions.every(node => !node.disabled));
    currentOptions[choice].click();
    assertNoAnswer(page);
    const selected = descendants(page.app).filter(node => node.className.includes('selected'));
    assert.equal(selected.length, 1);
    assert.match(selected[0].attributes['aria-label'], /你的选择/);
    assert.ok(selected[0].attributes['aria-label'].startsWith('ABCD'[choice]));
    page.run('home()');
    assertNoAnswer(page);
    page.run('enterQuiz()');
    assertNoAnswer(page);
    descendants(page.app).find(node => node.id === 'next').click();
  }
  assertNoAnswer(page);
  assert.match(descendants(page.app).map(node => node.textContent).join(' '), /50/);
  page.run('showHome(); showResult(true)');
  assertNoAnswer(page);
  page.run('start()');
  assertNoAnswer(page);
  assert.equal(descendants(page.app).filter(node => node.className.includes('selected')).length, 0);
});

test('全错得 0 分，全对得 100 分，结束后不能跳到第 11 题', () => {
  for (const correct of [false, true]) {
    const quiz = new Quiz(questions);
    quiz.start();
    assert.equal(quiz.pointsPerQuestion, 10);
    questions.forEach(question => {
      quiz.choose(correct ? question.answer : (question.answer + 1) % 4);
      quiz.next();
    });
    assert.equal(quiz.lastResult.score, correct ? 100 : 0);
    assert.equal(quiz.index, 9);
    assert.equal(quiz.next(), false);
  }
});

test('键盘快捷键支持选择、改选和前进，且不会跳过未答题或影响首页', () => {
  const page = createPage();
  const key = (value, extra = {}) => page.dispatch('keydown', { key: value, preventDefault() {}, ...extra });
  key('1');
  assert.equal(page.run('quiz.started'), false);
  page.run('start()');
  key('Enter');
  assert.equal(page.run('quiz.index'), 0);
  key('1', { repeat: true });
  key('2', { ctrlKey: true });
  assert.equal(page.run('quiz.answers.length'), 0);
  key('1');
  assert.equal(page.run('quiz.answers[0]'), 0);
  key('2');
  const selected = descendants(page.app).find(node => node.id === 'option-1');
  key('Enter', { target: selected });
  assert.equal(page.run('quiz.index'), 1);
  assert.equal(page.run('quiz.answers[0]'), 1);
  const progress = descendants(page.app).find(node => node.attributes.role === 'progressbar');
  assert.equal(progress.attributes['aria-valuenow'], '1');
  assertNoAnswer(page);
});
