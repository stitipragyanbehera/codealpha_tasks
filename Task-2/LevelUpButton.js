import Hint from "./Hint";

export default class LevelUpButton extends THREE.Object3D {

  constructor () {
    super()

    this.sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: ResourceManager.get("hud-level-up") }))
    this.add(this.sprite)

    this.width = (this.sprite.material.map.frame.w *  config.HUD_SCALE) / 2
    this.height = (this.sprite.material.map.frame.h *  config.HUD_SCALE) / 2

    this.initialScale = {
      x: this.sprite.material.map.frame.w * config.HUD_SCALE,
      y: this.sprite.material.map.frame.h * config.HUD_SCALE,
    };
    this.scale.set(this.initialScale.x, this.initialScale.y, 1);

    // hidden by default.
    this.sprite.material.opacity = 0;

    this.addEventListener("mouseover", () => this.onMouseOver());
    this.addEventListener("mouseout", () => this.onMouseOut());

    this.addEventListener("click", () => {
      this.scale.x = this.initialScale.x - 5;
      this.scale.y = this.initialScale.y - 5;
      this.onMouseOver();
    });
  }

  get isActive () {
    return this.userData.hud === true;
  }

  onMouseOver () {
    if (this.userData.hint) { Hint.show(this.userData.hint, this.sprite); }

    App.tweens.remove(this.scale);
    App.tweens.add(this.scale).to({
      x: this.initialScale.x + 4,
      y: this.initialScale.y + 4,
    }, 300, Tweener.ease.quadOut);
  }

  onMouseOut () {
    if (this.userData.hint) { Hint.hide(); }
    App.tweens.remove(this.scale);
    App.tweens.add(this.scale).to(this.initialScale, 200, Tweener.ease.quadOut);
  }

  show () {
    // skip if already active.
    if (this.isActive) { return; }

    this.userData.hud = true;

    if (this.initialX === undefined) {
      this.initialX = this.position.x;
    }

    this.position.x = this.initialX - 20;
    App.tweens.add(this.position).to({ x: this.initialX }, 300, Tweener.ease.cubicOut);
    App.tweens.add(this.sprite.material).to({ opacity: 1 }, 500, Tweener.ease.quadOut);
  }

  hide () {
    // skip if not active already.
    if (!this.isActive) { return; }

    this.userData.hud = undefined;

    App.tweens.remove(this.position);
    App.tweens.remove(this.sprite.material);
    App.tweens.add(this.sprite.material).to({ opacity: 0 }, 200, Tweener.ease.quadOut);
  }

}
