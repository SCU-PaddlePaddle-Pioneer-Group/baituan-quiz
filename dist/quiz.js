/* 飞桨领航百团大战答题网页：管理当前题改选与内存计分，最后一题改选时同步更新总成绩。 */
class Quiz {
  constructor(questions) {
    this.questions = questions;
    this.answers = [];
    this.index = 0;
    this.started = false;
    this.lastResult = null;
  }
  start() {
    this.answers = [];
    this.index = 0;
    this.started = true;
  }
  get complete() { return this.answers.length === this.questions.length; }
  get correct() {
    return this.answers.filter((answer, index) => answer === this.questions[index].answer).length;
  }
  choose(choice) {
    // 当前题可覆盖选择；总分从每题最新选择计算，避免改选累计计分。
    if (!this.started || this.answers[this.index] === choice || !Number.isInteger(choice) || choice < 0 || choice > 3) return false;
    this.answers[this.index] = choice;
    if (this.complete) this.lastResult = { correct: this.correct, total: this.questions.length, score: this.correct * 5 };
    return true;
  }
  next() {
    if (this.answers[this.index] === undefined || this.index >= this.questions.length - 1) return false;
    this.index += 1;
    return true;
  }
}
if (typeof module !== 'undefined') module.exports = Quiz;
