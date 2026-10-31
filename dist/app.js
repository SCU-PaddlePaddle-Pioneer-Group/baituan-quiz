/* 纯本地答题：当前题可改选，所有选择统一呈现蓝色，不展示答案或解析。 */
const quiz = new Quiz(QUESTIONS);
const app = document.getElementById('app');
const letters = 'ABCD';
let currentView = 'home';

// 文本统一使用 textContent，避免把题库内容解释为 HTML。
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
function logo(className) {
  const image = element('img', className);
  image.src = 'dist/assets/scu-pioneer.png';
  image.alt = '四川大学百度飞桨领航团团标';
  image.width = 490;
  image.height = 490;
  return image;
}
function arrowButton(text, className, action) {
  const node = button('', className, action);
  const arrow = element('span', 'button-arrow', '→');
  arrow.setAttribute('aria-hidden', 'true');
  node.append(element('span', '', text), arrow);
  return node;
}
function clear(view, preserveScroll = false) {
  currentView = view;
  app.replaceChildren();
  app.className = `view-${view}`;
  if (!preserveScroll) window.scrollTo(0, 0);
}
function header() {
  const node = element('header', 'site-header');
  const brand = button('', 'brand', home);
  brand.setAttribute('aria-label', '四川大学百度飞桨领航团，返回首页');
  const text = element('span', 'brand-text');
  text.append(element('strong', '', '百度飞桨领航团'), element('span', '', '四川大学 · SICHUAN UNIVERSITY'));
  brand.append(logo('brand-logo'), text);
  const label = element('span', 'event-label', '百团大战 · 趣味挑战');
  node.append(brand, currentView === 'quiz' ? button('返回首页', 'nav-home', home) : label);
  app.append(node);
}
function footer() {
  const node = element('footer', 'site-footer');
  node.append(element('span', '', '保持好奇，一起探索 AI。'), element('span', '', 'SCU PADDLEPADDLE PIONEER GROUP'));
  app.append(node);
}
function focusHeading() {
  document.getElementById('view-title').focus({ preventScroll: true });
}
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
  clear('home');
  header();
  const cover = element('section', 'cover');
  const intro = element('div', 'hero-copy');
  intro.append(element('p', 'eyebrow', 'HELLO, FUTURE EXPLORER'));
  const title = element('h1', 'hero-title');
  title.id = 'view-title';
  title.tabIndex = -1;
  title.append(document.createTextNode('你的 AI 好奇心，'), element('br'), element('span', 'accent', '现在就出发。'));
  intro.append(title, element('p', 'hero-description', '探索 AI 的有趣日常，认识飞桨领航团。\n用 10 道趣味题，开启你的 AI 之旅。'));
  const metrics = element('div', 'metrics');
  [[String(QUESTIONS.length), '道精选题'], ['100', '分满分'], ['约 2', '分钟挑战']].forEach(([value, label]) => {
    const item = element('div', 'metric');
    item.append(element('strong', '', value), element('span', '', label));
    metrics.append(item);
  });
  intro.append(metrics);
  const ongoing = quiz.started && !quiz.complete;
  intro.append(arrowButton(ongoing ? '继续答题' : '开始挑战', 'primary start-button', ongoing ? enterQuiz : start));
  intro.append(element('p', 'start-hint', `单选 · 每题 ${quiz.pointsPerQuestion} 分 · 无需登录`));
  const actions = element('div', 'home-actions');
  if (ongoing) actions.append(button('重新开始', 'text-button', start));
  if (quiz.lastResult) actions.append(button('查看上一人成绩', 'text-button', () => showResult(true)));
  intro.append(actions);

  const visual = element('div', 'hero-visual');
  visual.setAttribute('aria-hidden', 'true');
  const orbit = element('div', 'orbit');
  orbit.append(element('div', 'orbit-ring ring-one'), element('div', 'orbit-ring ring-two'), element('div', 'orbit-ring ring-three'));
  const badge = element('div', 'emblem');
  badge.append(logo('hero-logo'));
  orbit.append(badge, element('span', 'orbit-dot dot-one'), element('span', 'orbit-dot dot-two'), element('span', 'orbit-dot dot-three'));
  const chipAI = element('div', 'floating-chip chip-ai');
  chipAI.append(element('span', 'chip-icon', 'AI'), element('span', '', '让灵感，开始发生'));
  const chipIdea = element('div', 'floating-chip chip-idea');
  chipIdea.append(element('span', 'spark', '✦'), element('span', '', '好奇心已就位'));
  visual.append(element('span', 'visual-index', 'PIONEER / 2026'), orbit, chipAI, chipIdea, element('span', 'visual-caption', '从第一个问题，到无限种可能'));
  cover.append(intro, visual);
  app.append(cover);

  const steps = element('section', 'steps');
  steps.setAttribute('aria-label', '参与方式');
  [['01', '轻松开场', '无需基础，带上好奇心'], ['02', '趣味作答', '选好答案，点击下一题'], ['03', '解锁成绩', '完成挑战，看看你的表现']].forEach(([number, titleText, detail]) => {
    const step = element('div', 'step');
    const copy = element('div', 'step-copy');
    copy.append(element('h2', '', titleText), element('p', '', detail));
    step.append(element('span', 'step-number', number), copy);
    steps.append(step);
  });
  app.append(steps);
  footer();
}
function showQuestion(preserveScroll = false) {
  clear('quiz', preserveScroll);
  header();
  const question = QUESTIONS[quiz.index];
  const selected = quiz.answers[quiz.index];
  const answered = selected !== undefined;
  const section = element('section', 'quiz-layout');
  const top = element('div', 'quiz-top');
  const label = element('p', 'quiz-label', 'AI 趣味挑战');
  top.append(label, element('span', 'question-counter', `${String(quiz.index + 1).padStart(2, '0')} / ${QUESTIONS.length}`));
  section.append(top);
  const progress = element('div', 'progress');
  progress.setAttribute('role', 'progressbar');
  progress.setAttribute('aria-label', '已完成题目');
  progress.setAttribute('aria-valuemin', '0');
  progress.setAttribute('aria-valuemax', String(QUESTIONS.length));
  progress.setAttribute('aria-valuenow', String(quiz.answers.length));
  const bar = element('span');
  bar.style.width = `${quiz.answers.length / QUESTIONS.length * 100}%`;
  progress.append(bar);
  section.append(progress);
  const card = element('div', 'question-card');
  const meta = element('div', 'question-meta');
  meta.append(element('span', 'category', question.category), element('span', 'question-type', `单选题 · ${quiz.pointsPerQuestion} 分`));
  const title = element('h1', 'question-title', question.prompt);
  title.id = 'view-title';
  title.tabIndex = -1;
  card.append(meta, title);
  const options = element('div', 'options');
  options.setAttribute('role', 'group');
  options.setAttribute('aria-labelledby', 'view-title');
  question.options.forEach((text, index) => {
    const option = button('', 'option', () => {
      if (quiz.choose(index)) {
        showQuestion(true);
        document.getElementById(`option-${index}`).focus({ preventScroll: true });
      }
    });
    option.id = `option-${index}`;
    option.setAttribute('aria-pressed', String(index === selected));
    option.append(element('span', 'letter', letters[index]), element('span', 'option-text', text));
    const marker = element('span', 'selection-marker');
    marker.setAttribute('aria-hidden', 'true');
    option.append(marker);
    if (answered && index === selected) {
      option.classList.add('selected');
      option.setAttribute('aria-label', `${letters[index]}. ${text}，你的选择`);
    }
    options.append(option);
  });
  card.append(options);
  const bottom = element('div', 'question-bottom');
  bottom.append(element('p', 'selection-hint', answered ? '已选择，可点击其他选项修改' : '请选择一个你认为合适的答案'));
  const last = quiz.index === QUESTIONS.length - 1;
  const next = arrowButton(last ? '查看总成绩' : '下一题', 'primary next-button', () => {
    if (last && quiz.complete) showResult(false);
    else if (quiz.next()) showQuestion();
  });
  next.id = 'next';
  next.disabled = !answered;
  bottom.append(next);
  card.append(bottom);
  section.append(card, element('p', 'keyboard-hint', '键盘也能答：按 1–4 选择，Enter 进入下一题'));
  app.append(section);
  footer();
  if (!preserveScroll) focusHeading();
}
function showResult(previous) {
  if (!quiz.lastResult) return showHome();
  clear('result');
  header();
  const result = quiz.lastResult;
  const section = element('section', 'result');
  const icon = element('div', 'result-emblem');
  icon.append(logo('result-logo'));
  const title = element('h1', 'result-title', previous ? '上一位的挑战成绩' : '挑战完成，好奇心满格！');
  title.id = 'view-title';
  title.tabIndex = -1;
  section.append(icon, element('p', 'eyebrow', previous ? 'PREVIOUS EXPLORER' : 'CHALLENGE COMPLETE'), title);
  const score = element('div', 'score');
  score.append(element('strong', '', String(result.score)), element('span', '', '/ 100 分'));
  section.append(score, element('p', 'result-detail', `答对 ${result.correct} / ${result.total} 题`), element('p', 'result-message', '探索没有终点，下一次灵感从这里开始。'));
  const actions = element('div', 'result-actions');
  actions.append(arrowButton(previous ? '开始新的挑战' : '下一位开始答题', 'primary', start), button('返回首页', 'secondary', home));
  section.append(actions, element('p', 'result-note', '可向现场工作人员展示此页 · 刷新后成绩将清除'));
  app.append(section);
  footer();
  focusHeading();
}

// 浏览器返回保留进行中的答题与上一人成绩；只在当前题接收快捷键。
window.addEventListener('popstate', () => {
  if (location.hash === '#quiz' && quiz.started) showQuestion();
  else showHome();
});
window.addEventListener('keydown', event => {
  if (currentView !== 'quiz' || event.repeat || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
  if (/^[1-4]$/.test(event.key)) {
    event.preventDefault();
    document.getElementById(`option-${Number(event.key) - 1}`).click();
  } else if (event.key === 'Enter') {
    const targetTag = event.target && event.target.tagName;
    if (targetTag !== 'BUTTON') {
      event.preventDefault();
      const next = document.getElementById('next');
      if (!next.disabled) next.click();
    } else if (event.target.id && event.target.id.startsWith('option-')) {
      event.preventDefault();
      document.getElementById('next').click();
    }
  }
});
history.replaceState(null, '', location.pathname + location.search);
showHome();
