import { View, Tr, Td, Anchor, Span, effect } from '@matthewp/zebra';

export class RowView extends View {
  constructor(item) {
    super();
    this.item = item;
  }

  render() {
    const row = new Tr();

    const idTd = new Td().addClass('col-md-1').setText(String(this.item.id));

    const lblA = new Anchor()
      .addClass('lbl')
      .setText(this.item.label)
      .on('click', () => this.emit('row-select', { id: this.item.id }));
    const lblTd = new Td().addClass('col-md-4').append(lblA);

    const removeIcon = new Span()
      .addClass('remove glyphicon glyphicon-remove')
      .setAttribute('aria-hidden', 'true');
    const removeA = new Anchor()
      .addClass('remove')
      .on('click', () => this.emit('row-remove', { id: this.item.id }))
      .append(removeIcon);
    const removeTd = new Td().addClass('col-md-1').append(removeA);

    const filler = new Td().addClass('col-md-6');

    row.append(idTd, lblTd, removeTd, filler);

    effect(() => row.toggleClass('danger', this.item.selected()));

    return row;
  }
}
