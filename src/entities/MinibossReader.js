import poems from '../data/poems.json';

export class MinibossReader {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.w = 90;
    this.h = 90;
    this.homeX = x;
    this.phase = 1;
    this.hpMax = 4;
    this.hp = 4;
    this.cellHits = 0;
    this.nextAttackAt = 0;
    this.nextGrabAt = 0;
    this.noiseUntil = 0;
    this.stunUntil = 0;
    this.flashUntil = 0;
    this.defeated = false;
    this.grabbing = false;
    this.grabArmY = 0;
    this.grabTargetY = 0;
    this.grabExtending = false;
    this.grabHolding = false;
    this.quizActive = false;
    this.currentPoem = null;
    this.quizOptions = [];
    this.quizAnswer = -1;
    this.quizDeadline = 0;
    this.quizResult = null; // 'correct' | 'wrong'
    this.usedPoems = new Set();
  }

  update(player, now) {
    if (this.defeated) return;
    // 抽查进行中：BOSS 不动
    if (this.quizActive) {
      this._updateQuiz(now);
      return;
    }
    if (now < this.stunUntil) return;

    const canShoot = now >= this.nextAttackAt;
    const canGrab = now >= this.nextGrabAt && !this.grabbing;

    // 噪音攻击
    if (canShoot) {
      this._noiseAttack(player, now);
    }
    // 抓取抽查
    if (canGrab) {
      this._startGrab(player, now);
    }
    // 抓取手臂动画
    if (this.grabbing) {
      this._updateGrab(player, now);
    }
  }

  _noiseAttack(player, now) {
    const duration = this.phase === 1 ? 3000 : 5000;
    this.noiseUntil = now + duration;
    player.slowUntil = now + duration;
    const cd = this.phase === 1 ? 8000 : 5000;
    this.nextAttackAt = now + cd;
    this.scene.audio?.readerNoise();
    this.scene.showBanner('读卡签到：噪音干扰', '#868e96');
  }

  _startGrab(player, now) {
    this.grabbing = true;
    this.grabExtending = true;
    this.grabArmY = 0;
    this.grabTargetY = player.y;
    const cd = this.phase === 1 ? 10000 : 6000;
    this.nextGrabAt = now + cd;
  }

  _updateGrab(player, now) {
    if (this.grabExtending) {
      this.grabArmY += 8;
      if (this.grabArmY >= Math.abs(this.grabTargetY - this.y)) {
        this.grabExtending = false;
        // 判定是否抓到玩家
        const px = player.x + player.w / 2;
        const bx = this.x + this.w / 2;
        if (Math.abs(px - bx) < 60) {
          this._grabPlayer(player, now);
        } else {
          // 未命中，硬直
          this.grabbing = false;
          this.stunUntil = now + 2000;
          this.scene.showBanner('抓取落空！输出窗口', '#51cf66');
        }
      }
    }
  }

  _grabPlayer(player, now) {
    this.grabHolding = true;
    this.grabbing = false;
    player.stunUntil = now + 99999;
    this._startQuiz(now);
  }

  _startQuiz(now) {
    this.quizActive = true;
    // 随机抽一首没出过的诗
    const pool = poems.filter(p => !this.usedPoems.has(p.upper) && (this.phase === 1 ? p.common : true));
    const available = pool.length > 0 ? pool : poems;
    const poem = available[Math.floor(Math.random() * available.length)];
    this.usedPoems.add(poem.upper);
    this.currentPoem = poem;
    // 打乱选项
    const options = [...poem.options];
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }
    this.quizOptions = options;
    this.quizAnswer = options.indexOf(poem.answer);
    this.quizDeadline = now + 8000;
    this.quizResult = null;
    this.scene.audio?.grab();
  }

  _updateQuiz(now) {
    if (this.quizResult) {
      // 展示结果后结束
      if (now > this.quizResultEnd) {
        this._endQuiz();
      }
      return;
    }
    if (now >= this.quizDeadline) {
      this._answerQuiz(-1, now);
    }
  }

  answerQuiz(idx, now) {
    if (!this.quizActive || this.quizResult) return;
    this._answerQuiz(idx, now);
  }

  _answerQuiz(idx, now) {
    const correct = idx === this.quizAnswer;
    this.quizResult = correct ? 'correct' : 'wrong';
    this.quizResultEnd = now + 1500;
    if (correct) {
      this.scene.audio?.quizCorrect();
      this.stunUntil = now + 3000;
      this.scene.showBanner('答对了！挣脱抓取', '#51cf66');
      // 记录背诵诗句
      if (this.scene.recordPoem) this.scene.recordPoem();
      // 玩家短暂加速
      this.scene.player.slowUntil = 0;
    } else {
      this.scene.audio?.quizWrong();
      // 扣半管血
      this.scene.player.takeDamage(now, Math.ceil(this.scene.player.maxHp / 2));
      this.scene.showBanner('答错了！扣除半管血', '#fa5252');
    }
  }

  _endQuiz() {
    this.quizActive = false;
    this.grabHolding = false;
    this.scene.player.stunUntil = 0;
  }

  takeHit(now) {
    if (this.quizActive || this.stunUntil > now) return;
    this.cellHits++;
    this.flashUntil = now + 100;
    if (this.cellHits >= (this.phase === 1 ? 4 : 8)) {
      this.cellHits = 0;
      this.hp--;
      if (this.phase === 1 && this.hp <= 0) {
        this.phase = 2;
        this.hpMax = 8;
        this.hp = 8;
        this.scene.showBanner('读卡机 · 二阶段', '#cc5de8');
        this.scene.audio?.phaseChange();
      } else if (this.phase === 2 && this.hp <= 0) {
        this.defeated = true;
        this.scene.onBossDefeated('reader');
      }
    }
  }

  draw(ctx) {
    const now = performance.now();
    const flash = now < this.flashUntil;
    ctx.save();
    ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
    if (flash) ctx.filter = 'brightness(2)';
    // 机械体
    const color = this.phase === 1 ? '#343a40' : '#5c2a4a';
    ctx.fillStyle = color;
    ctx.fillRect(-40, -40, 80, 80);
    // 读取窗口
    const winColor = this.phase === 1 ? 'rgba(77,171,247,0.8)' : 'rgba(186,73,255,0.8)';
    ctx.fillStyle = winColor;
    ctx.fillRect(-28, -12, 56, 32);
    // 扫描线
    ctx.strokeStyle = this.phase === 1 ? '#ff6b6b' : '#cc5de8';
    ctx.lineWidth = 2;
    const scanY = -12 + ((now / 50) % 32);
    ctx.beginPath();
    ctx.moveTo(-28, scanY);
    ctx.lineTo(28, scanY);
    ctx.stroke();
    ctx.strokeStyle = '#adb5bd';
    ctx.lineWidth = 2;
    ctx.strokeRect(-40, -40, 80, 80);
    ctx.restore();

    // 抓取手臂
    if (this.grabbing && this.grabArmY > 0) {
      ctx.save();
      ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
      ctx.fillStyle = '#868e96';
      ctx.fillRect(-6, 0, 12, this.grabArmY);
      ctx.fillStyle = '#495057';
      ctx.beginPath();
      ctx.arc(0, this.grabArmY, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  drawQuiz(ctx, lw, lh) {
    if (!this.quizActive) return;
    const now = performance.now();
    // 半透明遮罩
    ctx.fillStyle = 'rgba(10,10,20,0.85)';
    ctx.fillRect(0, 0, lw, lh);
    // 答题卡面板
    const pw = 600, ph = 360;
    const px = (lw - pw) / 2, py = (lh - ph) / 2;
    ctx.fillStyle = 'rgba(20,22,40,0.95)';
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 2;
    this._roundRect(ctx, px, py, pw, ph, 16, true, true);
    // 标题
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffd43b';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('抽查时间！', lw / 2, py + 50);
    // 诗句上半句
    ctx.fillStyle = '#f8f9fa';
    ctx.font = '24px sans-serif';
    ctx.fillText('上句：' + this.currentPoem.upper, lw / 2, py + 110);
    ctx.fillStyle = '#adb5bd';
    ctx.font = '18px sans-serif';
    ctx.fillText('请选择下句', lw / 2, py + 150);
    // 倒计时
    const remain = Math.max(0, (this.quizDeadline - now) / 1000);
    ctx.fillStyle = remain < 3 ? '#fa5252' : '#51cf66';
    ctx.font = 'bold 32px monospace';
    ctx.fillText(remain.toFixed(1) + 's', lw / 2, py + 190);
    // 选项
    if (!this.quizResult) {
      this.quizOptions.forEach((opt, i) => {
        const ox = px + 60 + (i % 2) * 260;
        const oy = py + 230 + Math.floor(i / 2) * 60;
        ctx.fillStyle = 'rgba(73,80,87,0.6)';
        this._roundRect(ctx, ox, oy, 220, 48, 8, true, false);
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.stroke();
        ctx.fillStyle = '#f8f9fa';
        ctx.font = '18px sans-serif';
        ctx.fillText(opt, ox + 110, oy + 24);
      });
    } else {
      ctx.fillStyle = this.quizResult === 'correct' ? '#51cf66' : '#fa5252';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText(this.quizResult === 'correct' ? '✓ 答对了！' : '✗ 答错了！', lw / 2, py + 280);
    }
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }

  _roundRect(ctx, x, y, w, h, r, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  getQuizOptionAt(clientX, clientY, lw, lh) {
    if (!this.quizActive || this.quizResult) return -1;
    const pw = 600, ph = 360;
    const px = (lw - pw) / 2, py = (lh - ph) / 2;
    for (let i = 0; i < 4; i++) {
      const ox = px + 60 + (i % 2) * 260;
      const oy = py + 230 + Math.floor(i / 2) * 60;
      if (clientX >= ox && clientX <= ox + 220 && clientY >= oy && clientY <= oy + 48) {
        return i;
      }
    }
    return -1;
  }
}
