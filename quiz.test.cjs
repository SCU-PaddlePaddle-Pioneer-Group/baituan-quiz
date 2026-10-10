const test = require('node:test');
const assert = require('node:assert/strict');
const questions = require('./dist/questions.js');
const Quiz = require('./dist/quiz.js');

// 覆盖现场连续答题的状态边界，而非仅检查界面文案。
test('20 道题的选项、答案与解析完整', () => {
  assert.equal(questions.length, 20);
  for (const question of questions) {
    assert.equal(question.options.length, 4);
    assert.ok(question.prompt && question.explanation);
    assert.ok(Number.isInteger(question.answer) && question.answer >= 0 && question.answer < 4);
  }
});
test('未提交不能跳题，重复选择不改答案或计分', () => {
  const quiz = new Quiz(questions);
  assert.equal(quiz.choose(0), false);
  quiz.start();
  assert.equal(quiz.next(), false);
  assert.equal(quiz.choose(-1), false);
  assert.equal(quiz.choose(4), false);
  assert.equal(quiz.choose(questions[0].answer), true);
  assert.equal(quiz.choose((questions[0].answer + 1) % 4), false);
  assert.equal(quiz.correct, 1);
  assert.equal(quiz.next(), true);
  assert.equal(quiz.complete, false);
});
test('完成 20 题立即保留成绩；下一人未完成不覆盖上一人成绩', () => {
  const quiz = new Quiz(questions);
  quiz.start();
  questions.forEach((question, index) => {
    quiz.choose(index < 13 ? question.answer : (question.answer + 1) % 4);
    quiz.next();
  });
  assert.equal(quiz.complete, true);
  assert.deepEqual(quiz.lastResult, { correct: 13, total: 20, score: 65 });
  quiz.start();
  assert.equal(quiz.index, 0);
  assert.deepEqual(quiz.answers, []);
  quiz.choose(questions[0].answer);
  assert.equal(quiz.lastResult.score, 65);
  assert.equal(quiz.answers[0], questions[0].answer);
  quiz.next();
  questions.slice(1).forEach(question => { quiz.choose(question.answer); quiz.next(); });
  assert.equal(quiz.lastResult.score, 100);
  assert.equal(new Quiz(questions).lastResult, null);
});
