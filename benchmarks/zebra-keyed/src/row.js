import { View, html } from '@matthewp/zebra';

export class RowView extends View {
  id = undefined;
  label = undefined;
  selected = false;

  idText;
  lblText;

  template() {
    return html`<tr><td class="col-md-1"> </td><td class="col-md-4"><a class="lbl"> </a></td><td class="col-md-1"><a class="remove"><span class="remove glyphicon glyphicon-remove" aria-hidden="true"></span></a></td><td class="col-md-6"></td></tr>`;
  }

  mount(el) {
    super.mount(el);
    this.idText = el.firstChild.firstChild;
    this.lblText = el.firstChild.nextSibling.firstChild.firstChild;
  }

  setId(value) {
    if (this.id !== value) {
      this.id = value;
      this.idText.data = value;
    }
  }

  setLabel(value) {
    if (this.label !== value) {
      this.label = value;
      this.lblText.data = value;
    }
  }

  setSelected(value) {
    if (this.selected !== value) {
      this.selected = value;
      this.el.className = value ? 'danger' : '';
    }
  }

  update(data = {}) {
    if ('id' in data) this.setId(data.id);
    if ('label' in data) this.setLabel(data.label);
    if ('selected' in data) this.setSelected(data.selected);
    return this.el;
  }
}
