export class NPC {
  constructor(scene, def, x, y) {
    this.scene = scene;
    this.def = def;
    this.x = x;
    this.y = y;
    this.w = 40;
    this.h = 60;
    this.interacted = false;
    this.revealed = false;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
    // 身体
    ctx.fillStyle = this.def.color;
    ctx.fillRect(-12, -20, 24, 30);
    // 头
    ctx.fillStyle = '#f0c090';
    ctx.fillRect(-8, -30, 16, 14);
    // 性别标识
    ctx.fillStyle = '#fff';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.def.gender === '女' ? '♀' : '♂', 0, -22);
    ctx.restore();
    // 名字
    ctx.fillStyle = '#ffd43b';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.def.name, this.x + this.w / 2, this.y - 6);
    ctx.textAlign = 'left';
  }

  getHitBox() {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }
}
