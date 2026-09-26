import * as Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  create(): void {
    document.body.dataset.ready = 'true';
  }
}
