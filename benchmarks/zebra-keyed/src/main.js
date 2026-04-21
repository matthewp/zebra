import { List } from '@matthewp/zebra/list';
import { RowView } from './row.js';

const adjectives = ['pretty','large','big','small','tall','short','long','handsome','plain','quaint','clean','elegant','easy','angry','crazy','helpful','mushy','odd','unsightly','adorable','important','inexpensive','cheap','expensive','fancy'];
const colours = ['red','yellow','blue','green','pink','brown','purple','brown','white','black','orange'];
const nouns = ['table','chair','house','bbq','desk','car','pony','cookie','sandwich','burger','pizza','mouse','keyboard'];

let nextId = 1;

function random(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildData(count) {
  let data = new Array(count);
  for (let i = 0; i < count; i++) {
    data[i] = { id: nextId++, label: `${random(adjectives)} ${random(colours)} ${random(nouns)}`, selected: false };
  }
  return data;
}

let rows = [];

const tbody = document.getElementById('tbody');
const list = new List(RowView, row => row.id);
list.mount(tbody);

function render() {
  list.update(rows);
}

document.getElementById('run').addEventListener('click', () => {
  rows = buildData(1000);
  render();
});

document.getElementById('runlots').addEventListener('click', () => {
  rows = buildData(10000);
  render();
});

document.getElementById('add').addEventListener('click', () => {
  rows = rows.concat(buildData(1000));
  render();
});

document.getElementById('update').addEventListener('click', () => {
  for (let i = 0; i < rows.length; i += 10) {
    rows[i] = { ...rows[i], label: rows[i].label + ' !!!' };
  }
  render();
});

document.getElementById('clear').addEventListener('click', () => {
  rows = [];
  render();
});

document.getElementById('swaprows').addEventListener('click', () => {
  if (rows.length > 998) {
    let tmp = rows[1];
    rows[1] = rows[998];
    rows[998] = tmp;
    render();
  }
});

tbody.addEventListener('click', e => {
  let target = e.target;
  if (target.matches('.lbl')) {
    let id = parseInt(target.closest('tr').firstElementChild.textContent);
    rows = rows.map(row => row.selected === (row.id === id) ? row : { ...row, selected: row.id === id });
    render();
  } else if (target.matches('.remove, .remove span')) {
    let id = parseInt(target.closest('tr').firstElementChild.textContent);
    rows = rows.filter(row => row.id !== id);
    render();
  }
});
