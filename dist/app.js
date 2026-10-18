/* 飞桨领航百团大战答题网页：支持当前题切换选项，渲染选择状态与总成绩，全程不展示正确答案或解析。 */
const quiz = new Quiz(QUESTIONS);
const app = document.getElementById('app');
const letters = 'ABCD';

// 所有题库文本都以文本节点写入，避免把内容解释为 HTML。
function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function button(text, className, action) {
  const node = element('button', className, text);
  node.type = 'button';
  node.addEventListener('click', action);
  return node;
}
function clear() { app.replaceChildren(); window.scrollTo(0, 0); }
function enterQuiz() {
  if (location.hash !== '#quiz') history.pushState(null, '', '#quiz');
  showQuestion();
}
function start() { quiz.start(); enterQuiz(); }
function home() {
  if (location.hash === '#quiz') history.back();
  else showHome();
}
function showHome() {
  clear();
  const section = element('section', 'cover');
  section.append(element('p', 'eyebrow', 'SCU · 百度飞桨领航团'));
  const title = element('h1');
  title.append(document.createTextNode('飞桨领航百团大战'), element('br'), document.createTextNode('趣味答题'));
  section.append(title, element('p', 'muted', '20 道趣味题 · 每题 5 分'), button('开始答题', 'primary', start));
  const actions = element('div', 'home-actions');
  if (quiz.started && !quiz.complete) actions.append(button('继续答题', 'link', enterQuiz));
  if (quiz.lastResult) actions.append(button('查看上一人成绩', 'link', () => showResult(true)));
  section.append(actions);
  app.append(section);
}
function showQuestion() {
  clear();
  const question = QUESTIONS[quiz.index];
  const selected = quiz.answers[quiz.index];
  const answered = selected !== undefined;
  const top = element('div', 'top');
  top.append(element('span', '', `第 ${quiz.index + 1} / ${QUESTIONS.length} 题`), button('返回首页', 'link', home));
  const progress = element('div', 'progress');
  const bar = element('span');
  bar.style.width = `${(quiz.index + 1) / QUESTIONS.length * 100}%`;
  progress.append(bar);
  app.append(top, progress, element('h2', '', question.prompt));
  const options = element('div', 'options');
  question.options.forEach((text, index) => {
    const option = button('', 'option', () => {
      if (quiz.choose(index)) {
        showQuestion();
        document.getElementById('next').focus({ preventScroll: true });
      }
    });
    option.append(element('span', 'letter', letters[index]), element('span', 'option-text', text));
    // 只标记参与者的选择，不通过颜色、符号或无障碍标签透露对错。
    if (answered && index === selected) {
      option.classList.add('selected');
      option.setAttribute('aria-label', `${letters[index]}. ${text}，你的选择`);
    }
    options.append(option);
  });
  app.append(options);
  const bottom = element('div', 'bottom');
  const last = quiz.index === QUESTIONS.length - 1;
  const next = button(last ? '查看总成绩' : '下一题 →', 'primary', () => {
    if (last && quiz.complete) showResult(false);
    else if (quiz.next()) showQuestion();
  });
  next.id = 'next';
  next.disabled = !answered;
  bottom.append(next);
  app.append(bottom);
}
function showResult(previous) {
  if (!quiz.lastResult) return showHome();
  clear();
  const result = quiz.lastResult;
  const section = element('section', 'result');
  section.append(element('p', 'eyebrow', previous ? '上一位答题者' : '答题完成'), element('h1', '', previous ? '上一人成绩' : '你的总成绩'));
  const score = element('div', 'score', String(result.score));
  score.append(element('span', '', '分'));
  section.append(score, element('p', 'muted', `答对 ${result.correct} / ${result.total} 题 · 满分 100 分`));
  const actions = element('div', 'result-actions');
  actions.append(button('返回首页', 'secondary', home));
  if (!previous) actions.append(button('下一位开始答题', 'primary', start));
  section.append(actions);
  app.append(section);
}

// 浏览器返回只切换视图，不清除进行中的答题或最近完成的成绩。
window.addEventListener('popstate', () => {
  if (location.hash === '#quiz' && quiz.started) showQuestion();
  else showHome();
});
history.replaceState(null, '', location.pathname + location.search);
showHome();
