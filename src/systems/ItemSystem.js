import itemsData from '../config/items.json';

export class ItemSystem {
  constructor(scene) {
    this.scene = scene;
    this.items = itemsData;
    this.inventory = []; // 最多3个
    this.maxSlots = 3;
  }

  addItem(itemId) {
    if (this.inventory.length >= this.maxSlots) return false;
    const item = this.items.find(i => i.id === itemId);
    if (!item) return false;
    this.inventory.push({ id: itemId, uses: item.effect === 'invincible' || item.effect === 'shield1' || item.effect === 'heal1' || item.effect === 'clearDebuff' || item.effect === 'slowZone' ? 1 : 3 });
    return true;
  }

  useItem(slot) {
    const item = this.inventory[slot];
    if (!item) return null;
    const def = this.items.find(i => i.id === item.id);
    item.uses--;
    if (item.uses <= 0) this.inventory.splice(slot, 1);
    return def;
  }

  getInventory() { return this.inventory; }

  applyItemEffect(item, player) {
    switch (item.effect) {
      case 'heal1':
        player.hp = Math.min(player.maxHp, player.hp + 1);
        break;
      case 'invincible':
        player.invincibleUntil = performance.now() + item.value;
        break;
      case 'shield1':
        player.shield = (player.shield || 0) + 1;
        break;
      case 'clearDebuff':
        player.slowUntil = 0;
        player.stunUntil = 0;
        break;
      case 'reviveOnce':
        player.hasRevive = true;
        break;
      case 'attackDouble':
        player.attackMultiplier = item.value;
        break;
      case 'next3BonusDamage':
        player.bonusShots = 3;
        player.bonusDamage = item.value;
        break;
      case 'next5Crit':
        player.critShots = 5;
        break;
    }
  }
}
