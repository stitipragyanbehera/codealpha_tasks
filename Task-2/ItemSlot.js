import hint from "../hud/Hint";
import EquipedItems from "./EquipedItems";
import { trackEvent, humanize } from "../../utils";
import { MeshText2D, textAlign } from "three-text2d";
import { isMobile } from "../../utils/device";

let draggingItem = null
  , draggingFrom = null

export default class ItemSlot extends THREE.Object3D {
  static DEFAULT_OPACITY = 0.6;
  static OCCUPIED_OPACITY = 1;

  constructor (options = { accepts: null }) {
    super()

    this._item = null

    this.accepts = options.accepts

    var freeTex = ResourceManager.get("hud-item-slot-free")
    this.free = new THREE.Sprite(new THREE.SpriteMaterial({ map: freeTex, transparent: true }))
    this.free.scale.set(freeTex.frame.w *  config.HUD_SCALE, freeTex.frame.h *  config.HUD_SCALE, 1)
    this.free.material.opacity = ItemSlot.DEFAULT_OPACITY
    this.add(this.free)

    var useTex = ResourceManager.get("hud-item-slot-use")
    this.use = new THREE.Sprite(new THREE.SpriteMaterial({ map: useTex, transparent: true }))
    this.use.scale.set(useTex.frame.w *  config.HUD_SCALE, useTex.frame.h *  config.HUD_SCALE, 1)
    this.use.material.opacity = ItemSlot.OCCUPIED_OPACITY;

    this.width = useTex.frame.w *  config.HUD_SCALE
    this.height = useTex.frame.h *  config.HUD_SCALE

    var qtyTex = ResourceManager.get("hud-item-slot-qty");
    this.qty = new THREE.Sprite(new THREE.SpriteMaterial({ map: qtyTex, transparent: true }))
    this.qty.scale.set(qtyTex.frame.w *  config.HUD_SCALE, qtyTex.frame.h *  config.HUD_SCALE, 1)
    this.qty.position.x = 3 * config.HUD_SCALE;
    this.qty.position.y = -3 * config.HUD_SCALE;
    this.qty.position.z = 2;

    this.qtyText = null;

    this.onMouseOver = this.onMouseOver.bind(this);
    this.onMouseOut = this.onMouseOut.bind(this);
    this.onDragStart = this.onDragStart.bind(this);
    this.onDragEnd = this.onDragEnd.bind(this);
    this.onDoubleClick = this.onDoubleClick.bind(this);

    this.onTouchStart = this.onTouchStart.bind(this);
    this.onTouchEnd = this.onTouchEnd.bind(this);

    if (!isMobile) {
      // desktop mouse-over / mouse-out
      this.addEventListener('mouseover', this.onMouseOver);
      this.addEventListener('mouseout', this.onMouseOut);

      // drag start
      this.addEventListener('mousedown', this.onDragStart);
      this.addEventListener('mouseup', this.onDragEnd);

    } else {
      // mobile / touch events
      this.addEventListener('touchstart', this.onTouchStart);
      this.addEventListener('touchend', this.onTouchEnd);

    }

    // double click
    this.addEventListener('dblclick', this.onDoubleClick)
  }

  set enabled (bool) {
    this.userData.hud = bool;
  }

  hasItem () {
    return this._item
  }

  onMouseOver ( e ) {
    this._showHint();

    if (this._item || draggingItem) {
      App.tweens.remove(this.scale)
      App.tweens.add(this.scale).to({ x: 1.1, y: 1.1 }, 200, Tweener.ease.quadOut)
    }
  }

  onMouseOut () {
    hint.hide();

    App.tweens.remove(this.scale)
    App.tweens.add(this.scale).to({ x: 1, y: 1 }, 200, Tweener.ease.quadOut)
  }

  set item(item) {
    this.use.material.opacity = ItemSlot.OCCUPIED_OPACITY;
    this.free.material.opacity = ItemSlot.DEFAULT_OPACITY

    if (item) {
      this.add(this.use)
      this.remove(this.free)

      item.position.x = 0
      item.position.y = 0
      item.position.z = 1

      this.add(item)

    } else {
      if (this._item) {
        this.remove(this._item)
        this._item.destroy();
        delete this._item;
      }

      this.remove(this.use)
      this.add(this.free)
    }

    this._item = item;

    this.updateItemQty();
  }

  updateItemQty() {
    const qty = this._item && this._item.userData.item && this._item.userData.item.qty;

    if (qty) {
      this.add(this.qty);

      if (!this.qtyText) {
        this.qtyText = new MeshText2D(qty.toString(), {
          align: textAlign.center,
          font: config.SMALL_FONT,
          fillStyle: "#d8d8d8"
        })
        this.qtyText.scale.set(0.6, 0.6, 0.6);
        this.qtyText.position.x = this.qty.position.x;
        this.qtyText.position.y = this.qty.position.y + (this.qtyText.height * this.qtyText.scale.y) / 2.2;
        this.qtyText.position.z = 3;

      } else {
        this.qtyText.text = qty.toString();
      }

      this.add(this.qtyText);

    } else if (this.qtyText) {
      this.remove(this.qty);
      this.remove(this.qtyText);
    }
  }

  get item () {
    return this._item
  }

  get material () {
    return this._item ? this.use.material : this.free.material
  }

  onDragStart(e) {
    hint.hide();

    if (App.cursor.isPerformingCast()) {
      App.cursor.cancelItemCast();
    }

    let targetSlot = e.target
    if (targetSlot.item) {

      draggingItem = targetSlot.item
      draggingFrom = targetSlot

      draggingItem.slot = targetSlot;

      // setup initialScale variable for the first time
      if (draggingItem.initialScale === undefined) {
        draggingItem.initialScale = draggingItem.scale.clone()
      }

      targetSlot.item = null

      App.cursor.dispatchEvent({
        type: "drag",
        item: draggingItem
      });

      App.tweens.add(draggingItem.scale).to({
        x: draggingItem.initialScale.x + (2 * config.HUD_SCALE),
        y: draggingItem.initialScale.y + (2 * config.HUD_SCALE)
      }, 300, Tweener.ease.quintOut)
    }
  }

  dispatchSell(itemData) {
    trackEvent('trade-sell', { event_category: 'Trade', event_label: 'Sell' });

    this.dispatchEvent({
      type: "inventory-sell",
      bubbles: true,
      ...itemData
    });
  }

  onDragEnd(e) {
    let targetSlot = e.target

    const isPurchasing = (draggingFrom && draggingFrom.parent && draggingFrom.parent.inventoryType === "purchase");

    //
    // Sell item!
    //
    if (
      draggingItem &&
      draggingFrom.parent &&
      this.accepts === "sell" &&
      !isPurchasing
    ) {
      this.dispatchSell({
        fromInventoryType: draggingFrom.parent.inventoryType,
        itemId: draggingItem.userData.itemId
      })
      return;
    }

    //
    // EquipedItems: check if target slot accepts this type of item.
    //
    if (this.parent instanceof EquipedItems && draggingItem && global.player) {
      if (
        ( // is incorrect slot?
          draggingItem.userData.item.slotName &&
          this.accepts &&
          draggingItem.userData.item.slotName !== this.accepts
        ) ||
        ( // doesn't have a
          !draggingItem.userData.item.slotName
        ) ||
        ( // doesn't meet requiredProgress
          draggingItem.userData.item.progressRequired &&
          draggingItem.userData.item.progressRequired > player.userData.latestProgress
        )
      ) {
        // cancel drop if slotName doesn't match dropped slot.
        this._revertDraggingItem(true);
        return;
      }
    }

    if (draggingItem) {

      let switchWith = {};
      if (this.item) {
        switchWith['switchItemId'] = this.item.userData.item.id

        if (!isPurchasing) {
          draggingFrom.item = this.item;
        }
      }

      /**
       * dispatch "inventory-drag" event only for different types of inventories
       */
      if (
        draggingFrom.parent && this.parent &&
        draggingFrom.parent.inventoryType !== this.parent.inventoryType
      ) {
        this.dispatchEvent({
          type: "inventory-drag",
          bubbles: true,
          fromInventoryType: draggingFrom.parent.inventoryType,
          toInventoryType: this.parent.inventoryType,
          itemId: draggingItem.userData.itemId,
          ...switchWith
        });
      }

      if (!isPurchasing) {
        targetSlot.item = draggingItem
      };

      this._revertDraggingItem(isPurchasing);
    }

    this._showHint();
  }

  onDoubleClick(e) {
    const targetSlot = e.target;
    const item = targetSlot.item;

    if (item) {
      const itemData = item.userData.item;

      if (
        hud.inventory.isTrading &&
        this.parent.inventoryType !== "purchase"
      ) {
        if (this.parent.inventoryType === "equipedItems") {
          if (!confirm(`Are you sure you'd like to sell this '${humanize(this._item.userData.item.type)}'?`)) {
            return;
          }
        }

        // Sell item!
        this.dispatchSell({
          fromInventoryType: this.parent.inventoryType,
          itemId: targetSlot.item.userData.itemId
        });

      } else if (itemData.isCastable && !hud.inventory.isTrading) {
        draggingFrom = targetSlot;
        App.cursor.prepareItemCast(item, draggingFrom);

        // force to close inventory if it's open.
        // FIXME: this code is duplicated all over the place!
        if (hud.isInventoryOpen()) {
          hud.onToggleInventory();
        }

      } else {
        // attach inventory type for sending to room handler.
        this.dispatchEvent({
          type: "use-item",
          bubbles: true,
          itemId: targetSlot.item.userData.itemId,
          inventoryType: this.parent.inventoryType
        });

      }

    } else {
      e.stopPropagation = true;
    }
  }

  onTouchStart (e) {
    this._showHint();

    clearTimeout(global.startDragTimeout);
    global.startDragTimeout = setTimeout(() => this.onDragStart(e), 300);
  }

  onTouchEnd (e) {
    clearTimeout(global.startDragTimeout);

    if (draggingItem) {
      this.onDragEnd(e);
      this.onMouseOut();
    }
  }

  _showHint() {
    if (this._item && this._item.userData.item) {
      hint.show(this._item.userData.item, this);
    }
  }

  _drop() {
    draggingFrom = null;
    draggingItem = null;
  }

  _revertDraggingItem(cancelDrop) {
    if (cancelDrop) {
      draggingFrom.item = draggingItem;
    }

    App.cursor.dispatchEvent({
      type: "drag",
      item: false
    });

    App.tweens.remove(draggingItem.scale)
    App.tweens.add(draggingItem.scale).to(draggingItem.initialScale, 300, Tweener.ease.quintOut)

    draggingItem = null
  }

  removeAllListeners() {
    this.removeEventListener('mouseover', this.onMouseOver);
    this.removeEventListener('mouseout', this.onMouseOut);
    this.removeEventListener('mousedown', this.onDragStart);
    this.removeEventListener('touchstart', this.onDragStart);
    this.removeEventListener('mouseup', this.onDragEnd);
    this.removeEventListener('touchend', this.onDragEnd);
    this.removeEventListener('dblclick', this.onDoubleClick);
  }

}
