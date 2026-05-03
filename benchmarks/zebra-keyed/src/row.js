import { View, Tr, Td, Anchor, Span, signal, effect } from '@matthewp/zebra';

export class RowView extends View {
  constructor(item) {
    super();
    this.id = item.id;
    this.label = signal(item.label);
    this.selected = signal(item.selected);
  }

  render() {
    const row = new Tr();

    const idTd = new Td().addClass('col-md-1').setText(String(this.id));

    const lblA = new Anchor()
      .addClass('lbl')
      .on('click', () => this.emit('row-select', { id: this.id }));
    const lblTd = new Td().addClass('col-md-4').append(lblA);

    const removeIcon = new Span()
      .addClass('remove glyphicon glyphicon-remove')
      .setAttribute('aria-hidden', 'true');
    const removeA = new Anchor()
      .addClass('remove')
      .on('click', () => this.emit('row-remove', { id: this.id }))
      .append(removeIcon);
    const removeTd = new Td().addClass('col-md-1').append(removeA);

    const filler = new Td().addClass('col-md-6');

    row.append(idTd, lblTd, removeTd, filler);

    effect(() => lblA.setText(this.label()));
    effect(() => row.toggleClass('danger', this.selected()));

    return row;
  }

  update(item) {
    if (this.label() !== item.label) this.label(item.label);
    if (this.selected() !== item.selected) this.selected(item.selected);
  }
}
