/* 成绩仅存在当前页面的内存中，完成最后一题时立即保留。 */
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
    if (!this.started || this.answers[this.index] !== undefined || !Number.isInteger(choice) || choice < 0 || choice > 3) return false;
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
