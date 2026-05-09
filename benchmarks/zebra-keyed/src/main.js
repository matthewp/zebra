import { signal, List } from '@matthewp/zebra';
import { RowView } from './row.js';

const adjectives = ['pretty','large','big','small','tall','short','long','handsome','plain','quaint','clean','elegant','easy','angry','crazy','helpful','mushy','odd','unsightly','adorable','important','inexpensive','cheap','expensive','fancy'];
const colours = ['red','yellow','blue','green','pink','brown','purple','brown','white','black','orange'];
const nouns = ['table','chair','house','bbq','desk','car','pony','cookie','sandwich','burger','pizza','mouse','keyboard'];

let nextId = 1;
const random = arr => arr[Math.floor(Math.random() * arr.length)];

function makeRow() {
  return {
    id: nextId++,
    label: signal(`${random(adjectives)} ${random(colours)} ${random(nouns)}`),
    selected: signal(false),
  };
}

function buildData(count) {
  const data = new Array(count);
  for (let i = 0; i < count; i++) data[i] = makeRow();
  return data;
}

const rows = signal([]);
let selectedRow = null;

const list = new List(rows, row => row.id, row => new RowView(row), 'tbody')
  .on('row-select', (e) => {
    const id = e.detail.id;
    if (selectedRow && selectedRow.id !== id) selectedRow.selected(false);
    const next = rows().find(r => r.id === id);
    if (next) {
      next.selected(true);
      selectedRow = next;
    }
  })
  .on('row-remove', (e) => {
    const id = e.detail.id;
    if (selectedRow && selectedRow.id === id) selectedRow = null;
    rows(rows().filter(row => row.id !== id));
  });

const placeholder = document.getElementById('tbody');
const tbody = list.toDOM();
tbody.id = 'tbody';
placeholder.replaceWith(tbody);

document.getElementById('run').addEventListener('click', () => {
  selectedRow = null;
  rows(buildData(1000));
});
document.getElementById('runlots').addEventListener('click', () => {
  selectedRow = null;
  rows(buildData(10000));
});
document.getElementById('add').addEventListener('click', () => rows(rows().concat(buildData(1000))));

document.getElementById('update').addEventListener('click', () => {
  const data = rows();
  for (let i = 0; i < data.length; i += 10) {
    data[i].label(data[i].label() + ' !!!');
  }
});

document.getElementById('clear').addEventListener('click', () => {
  selectedRow = null;
  rows([]);
});

document.getElementById('swaprows').addEventListener('click', () => {
  const data = rows();
  if (data.length > 998) {
    const next = data.slice();
    next[1] = data[998];
    next[998] = data[1];
    rows(next);
  }
});
