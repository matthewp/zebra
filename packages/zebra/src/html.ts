const ESC: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (ch) => ESC[ch]);
}

export class SafeHTML {
  #html: string;
  constructor(value: string) {
    this.#html = value;
  }
  toString(): string {
    return this.#html;
  }
}

export function unsafeHTML(s: string): SafeHTML {
  return new SafeHTML(s);
}

function resolveValue(val: unknown): string {
  if (val == null || val === false) return '';
  if (val instanceof SafeHTML) return val.toString();
  if (typeof val === 'object' && 'template' in val && typeof (val as any).template === 'function') {
    return (val as any).template().toString();
  }
  if (Array.isArray(val)) return val.map(resolveValue).join('');
  return escapeHtml(String(val));
}

export function html(strings: TemplateStringsArray, ...values: unknown[]): SafeHTML {
  let result = strings[0];
  for (let i = 0; i < values.length; i++) {
    result += resolveValue(values[i]);
    result += strings[i + 1];
  }
  return new SafeHTML(result);
}
