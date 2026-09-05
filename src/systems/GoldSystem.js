export class GoldSystem {
  constructor() {
    this.gold = 0;
  }

  add(amount) {
    this.gold += amount;
  }

  spend(amount) {
    if (this.gold >= amount) {
      this.gold -= amount;
      return true;
    }
    return false;
  }

  getGold() { return this.gold; }
  setGold(g) { this.gold = g; }
}
