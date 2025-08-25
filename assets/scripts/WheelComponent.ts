import {
  _decorator,
  Color,
  Component,
  Graphics,
  Label,
  Node,
  RichText,
  tween,
  UITransform,
  Vec2,
  Vec3,
} from "cc";
const { ccclass, property } = _decorator;

@ccclass("WheelComponent")
export class WheelComponent extends Component {
  @property(Node)
  wheel: Node | null = null;

  @property(RichText)
  resultName: RichText | null = null;

  isRolling: boolean = false;

  private sections = [
    //draft data
    {
      id: "01",
      name: "Goblin",
      weight: 5,
      color: "#CC4C4C",
    },
    {
      id: "02",
      name: "Gnome",
      weight: 5,
      color: "#E6A857",
    },
    {
      id: "03",
      name: "Human",
      weight: 5,
      color: "#E6E68A",
    },
    {
      id: "04",
      name: "Dwarf",
      weight: 5,
      color: "#5FAF5F",
    },
    {
      id: "05",
      name: "Merfolk",
      weight: 4,
      color: "#80D4D4",
    },
  ];
  start() {
    this.drawWheel();
  }

  update(deltaTime: number) {}

  drawWheel() {
    if (!this.wheel) return;
    this.wheel.removeAllChildren();
    const graphics =
      this.wheel.getComponent(Graphics) || this.wheel.addComponent(Graphics);
    graphics.clear();
    const radius = 250;
    const center = new Vec2(0, 0);

    const totalWeight = this.sections.reduce((sum, sec) => sum + sec.weight, 0);
    let startAngle = 0; // Bắt đầu từ góc 90 độ

    for (const section of this.sections) {
      const angleStep = (section.weight / totalWeight) * 360;
      const endAngle = startAngle + angleStep;

      // Vẽ phần của vòng quay
      const color = this.hexToColor(section.color);
      graphics.fillColor = color;
      graphics.moveTo(center.x, center.y);
      this.drawArc(graphics, center, radius, startAngle, endAngle);
      graphics.lineTo(center.x, center.y);
      graphics.close();
      graphics.fill();

      // Tính toán vị trí để đặt tên
      this.drawTextOnSection(
        section.name,
        (startAngle + endAngle) / 2,
        radius * 0.6
      );

      startAngle = endAngle; // Cập nhật góc bắt đầu
    }
  }

  drawArc(
    graphics: Graphics,
    center: Vec2,
    radius: number,
    startAngle: number,
    endAngle: number
  ) {
    const segments = 15;
    const radStart = (Math.PI / 180) * startAngle;
    const radEnd = (Math.PI / 180) * endAngle;

    for (let i = 0; i <= segments; i++) {
      const angle = radStart + (i / segments) * (radEnd - radStart);
      const x = center.x + Math.cos(angle) * radius;
      const y = center.y + Math.sin(angle) * radius;

      if (i === 0) {
        graphics.moveTo(x, y);
      } else {
        graphics.lineTo(x, y);
      }
    }
  }

  hexToColor(hex: string): Color {
    const r = parseInt(hex.substring(1, 3), 16);
    const g = parseInt(hex.substring(3, 5), 16);
    const b = parseInt(hex.substring(5, 7), 16);
    return new Color(r, g, b);
  }

  drawTextOnSection(text: string, angle: number, distance: number) {
    if (!this.wheel) return;

    const radian = (Math.PI / 180) * angle;
    const x = Math.cos(radian) * distance;
    const y = Math.sin(radian) * distance;

    const textNode = new Node();
    const label = textNode.addComponent(Label);
    label.string = text;
    label.fontSize = 25;
    label.lineHeight = 150;
    label.color = new Color(0, 0, 0);

    textNode.setPosition(x, y);
    textNode.angle = angle;

    this.wheel.addChild(textNode);
  }

  spinWheel() {
    if (this.isRolling) {
      return;
    }
    this.wheel.eulerAngles = new Vec3(0, 0, 0);

    if (!this.wheel || !this.resultName) return;

    this.isRolling = true;
    const randomAngle = Math.random() * 360;
    const extraRotations = 5;
    const finalAngle = 360 * extraRotations + randomAngle;

    this.wheel.eulerAngles = new Vec3(0, 0, 0);

    tween(this.wheel)
      .to(
        2,
        { eulerAngles: new Vec3(0, 0, -finalAngle) },
        { easing: "quartOut" }
      )
      .call(() => {
        this.showResult(randomAngle);
      })
      .start();
  }

  showResult(randomAngle: number) {
    let cumulativeAngle = 0;
    const totalWeight = this.sections.reduce((sum, sec) => sum + sec.weight, 0);

    for (const section of this.sections) {
      const angleStep = (section.weight / totalWeight) * 360;
      cumulativeAngle += angleStep;

      if (randomAngle <= cumulativeAngle) {
        this.resultName.string = `<color=#FF4500>${section.name}</color>`;
        break;
      }
    }
    this.isRolling = false;
  }
}
