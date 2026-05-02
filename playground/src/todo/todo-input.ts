import { View, Form, Input, Button, type Element } from '@matthewp/zebra';

export class TodoInput extends View {
  render(): Element {
    const root = new Form().addClass('todo-input');
    const input = new Input()
      .addClass('todo-text')
      .setAttribute('type', 'text')
      .setAttribute('placeholder', 'What needs to be done?');
    const submit = new Button().setAttribute('type', 'submit').setText('Add');

    root.append(input, submit);

    root.on('submit', (e) => {
      e.preventDefault();
      const text = input.getValue().trim();
      if (text) {
        root.emit('add', { text });
        input.setValue('');
      }
    });

    return root;
  }
}

export default TodoInput;
