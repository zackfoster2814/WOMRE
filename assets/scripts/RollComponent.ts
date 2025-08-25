import {
  _decorator,
  Component,
  Node,
  RichText,
  tween,
  Graphics,
  Color,
  UITransform,
  Vec2,
} from "cc";
const { ccclass, property } = _decorator;

@ccclass("SpinWheelComponent")
export class SpinWheelComponent extends Component {
  @property(Node)
  wheel: Node | null = null;
  @property(RichText)
  resultText: RichText | null = null; // Hiển thị kết quả

  start() {
    if (this.wheel) {
      this.drawWheel();
    }
  }

  drawWheel() {
    if (!this.wheel) return;

    const graphics =
      this.wheel.getComponent(Graphics) || this.wheel.addComponent(Graphics);
    graphics.clear();

    const radius = this.wheel.getComponent(UITransform)?.width / 2 || 100;
    const center = new Vec2(0, 0);
    const sectors = 10;
    const angleStep = (2 * Math.PI) / sectors;
    const colors = [
      Color.RED,
      Color.BLUE,
      Color.GREEN,
      Color.YELLOW,
      Color.CYAN,
      Color.MAGENTA,
      Color.RED,
      Color.GRAY,
      Color.WHITE,
      Color.BLACK,
    ];

    for (let i = 0; i < sectors; i++) {
      let startAngle = i * angleStep;
      let endAngle = (i + 1) * angleStep;

      graphics.fillColor = colors[i % colors.length]; // Đặt màu cho từng phần
      graphics.moveTo(center.x, center.y);
      graphics.arc(center.x, center.y, radius, startAngle, endAngle, false);
      graphics.lineTo(center.x, center.y);
      graphics.close();
      graphics.fill();
    }
  }

  spinWheel() {
    if (!this.wheel || !this.resultText) return;

    const randomRounds = Math.floor(Math.random() * 5) + 5;
    const randomAngle = Math.floor(Math.random() * 360);
    const targetAngle = 360 * randomRounds + randomAngle;

    const currentAngle = this.wheel.angle;
    const finalAngle = currentAngle + targetAngle;

    tween(this.wheel)
      .to(2, { angle: finalAngle }, { easing: "cubicOut" })
      .call(() => {
        this.showResult(finalAngle % 360);
      })
      .start();
  }

  showResult(angle: number) {
    const sector = Math.floor(angle / 36);
    const reward = sector + 1;
    this.resultText.string = `<color=#ff0000>${reward}</color>`;
  }
}
