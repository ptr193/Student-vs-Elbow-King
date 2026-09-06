import { MetaManager } from './SettingsManager.js';

// 剧情碎片触发系统：在特定事件后解锁剧情文本
export class NarrativeSystem {
  static FRAGMENTS = {
    // 读卡机击败后
    reader_defeated: {
      title: '解救同伴 · 沉默者',
      text: '沉默者终于脱离了读卡机的控制。\n她低着头，紧握着衣角，轻声说：\n"……谢谢你。肘击王不是一个人，它是一台机器。\n一台吞噬所有人声音的机器。"\n\n你了解到：肘击王的冲撞有规律，\n抓住它眩晕的瞬间全力输出。',
    },
    // 计时器击败后
    timer_defeated: {
      title: '时间碎片',
      text: '计时器倒下了，它的齿轮散落一地。\n空气中残留着滴答声的回响。\n\n"时间……从来就不是你的敌人。"\n一个声音在走廊深处响起。\n"是它把时间变成了武器。"',
    },
    // 抄写板击败后
    chalkboard_defeated: {
      title: '解救同伴 · 交易员',
      text: '抄写板的粉笔轨迹停止了流动。\n一个挎着大包的身影从墙角走出来。\n\n"嘿，谢了兄弟！我叫交易员。"\n"我这儿有点好东西，以后遇到了用得上。"\n"对了，肘击王的二阶段……冲撞前有预警，提前跑。"',
    },
    // 通告板击败后
    bulletin_defeated: {
      title: '章节过渡 · 走廊→深处',
      text: '通告板裂开了，纸条纷纷扬扬飘落。\n走廊尽头，暗红色的光透过来。\n\n"你越走越深了……"\n"前面的路更难，但你不孤单。"\n"每一步都有人走过。"',
    },
    // 排名表击败后
    ranking_defeated: {
      title: '希望与绝望 · 前置对白',
      text: '排名表碎裂成无数数字，随风消散。\n前方一片开阔，黑金色的光芒从尽头射来。\n\n那是肘击王所在之处。\n\n"你准备好了吗？"\n"也许没有，但你必须去了。"\n"所有人的希望都在你身上。"',
    },
    // 审判台击败后 · 身份揭示
    tribunal_defeated: {
      title: '身份揭示',
      text: '审判台轰然崩塌，碎片中飘出一张"判决书"。\n上面的文字逐渐清晰——\n\n"起义军，你曾是肘击王最得意的门生。\n你接受了他的教导，也承受了他的压迫。\n现在，你带着他的影子来推翻他。"\n\n你愣住了。\n原来……我竟然是……\n\n画面渐黑，前方是最后的战场。',
    },
    // 肘击王 P1→P2 切换
    zjw_phase2: {
      title: '肘击王 · 面具碎裂',
      text: '"呵……还不错。"\n肘击王的面具裂开一道缝。\n"但你知道的，这远远不够。"\n\n它的声音变了，带着一种熟悉感。\n"来吧，让我看看你有多大的决心。"',
    },
    // 三败后第二次
    three_defeat_2: {
      title: '肘击王 · 嘲讽',
      text: '"又来一个送死的？"\n肘击王的声音从黑暗中传来。\n"上一个也是这样说的，然后就倒下了。"\n"你觉得你会不一样吗？"',
    },
  };

  static trigger(scene, fragmentId) {
    const frag = NarrativeSystem.FRAGMENTS[fragmentId];
    if (!frag) return;

    // 检查是否已触发过
    const meta = MetaManager.load();
    meta.triggeredFragments = meta.triggeredFragments || [];
    if (meta.triggeredFragments.includes(fragmentId)) {
      // 仍然显示，但不重复记录
    } else {
      meta.triggeredFragments.push(fragmentId);
      MetaManager.save(meta);
    }

    // 触发对话
    scene.dialogue = { name: frag.title, text: frag.text, color: '#cc5de8' };
    scene.dialogueActive = true;
  }

  static hasTriggered(fragmentId) {
    const meta = MetaManager.load();
    return (meta.triggeredFragments || []).includes(fragmentId);
  }
}
