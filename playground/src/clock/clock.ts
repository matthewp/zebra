import { View, Div, signal, effect, type Element } from '@matthewp/zebra';
import { Svg, G, Circle, SvgLine } from './svg.ts';

const getSecondsSinceMidnight = (): number =>
  (Date.now() - new Date().setHours(0, 0, 0, 0)) / 1000;

const rotate = (turn: number, fixed = 1) => `rotate(${(turn * 360).toFixed(fixed)})`;

interface HandOpts {
  className: string;
  length: number;
  width: number;
  fixed?: boolean;
}

function hand(opts: HandOpts): SvgLine {
  const line = new SvgLine()
    .addClass(opts.className)
    .setAttribute('y2', String(-(opts.fixed ? 95 : opts.length)))
    .setAttribute('stroke', 'currentColor')
    .setAttribute('stroke-width', String(opts.width))
    .setAttribute('stroke-linecap', 'round');
  if (opts.fixed) line.setAttribute('y1', String(opts.length - 95));
  return line;
}

function ticks(count: number, className: string, length: number, width: number): SvgLine[] {
  const lines: SvgLine[] = [];
  for (let i = 0; i < count; i++) {
    const line = hand({ className, length, width, fixed: true });
    line.setAttribute('transform', `rotate(${(360 * i) / count})`);
    lines.push(line);
  }
  return lines;
}

export class Clock extends View {
  time = signal(getSecondsSinceMidnight());
  private started = false;

  render(): Element {
    const root = new Div().addClass('clock');

    const svg = new Svg()
      .setAttribute('viewBox', '0 0 200 200')
      .setAttribute('width', '320')
      .setAttribute('height', '320');

    const face = new Circle()
      .addClass('face')
      .setAttribute('r', '99')
      .setAttribute('fill', 'white')
      .setAttribute('stroke', 'currentColor');

    const subsecondHand = hand({ className: 'subsecond', length: 85, width: 5 });
    const hourHand = hand({ className: 'hour', length: 50, width: 4 });
    const minuteHand = hand({ className: 'minute', length: 70, width: 3 });
    const secondHand = hand({ className: 'second', length: 80, width: 2 });

    const dial = new G().setAttribute('transform', 'translate(100, 100)');
    dial.append(
      face,
      ...ticks(60, 'subsecond', 2, 1),
      ...ticks(12, 'hour', 5, 2),
      subsecondHand,
      hourHand,
      minuteHand,
      secondHand,
    );
    svg.append(dial);
    root.append(svg);

    effect(() => {
      const t = this.time();
      subsecondHand.setAttribute('transform', rotate(t % 1));
      secondHand.setAttribute('transform', rotate((t % 60) / 60));
      minuteHand.setAttribute('transform', rotate(((t / 60) % 60) / 60));
      hourHand.setAttribute('transform', rotate(((t / 3600) % 12) / 12));
    });

    this.start();
    return root;
  }

  private start() {
    if (this.started) return;
    this.started = true;
    const tick = () => {
      this.time(getSecondsSinceMidnight());
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}

export default Clock;
