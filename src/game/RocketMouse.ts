import Phaser from 'phaser'

import TextureKeys from '../scenes/consts/TextureKeys'
import AnimationKeys from '../scenes/consts/AnimationKeys'
import SceneKeys from '../scenes/consts/SceneKeys'

enum MouseState {
    Running,
    Killed,
    Dead,
}

export default class RocketMouse extends Phaser.GameObjects.Container {
    private mouse: Phaser.GameObjects.Sprite
    private flames: Phaser.GameObjects.Sprite
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys

    private mouseState = MouseState.Running


    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y)

        //create the Rocket Mouse sprite
        this.mouse = scene.add.sprite(0, 0, TextureKeys.RocketMouse)
            .setOrigin(0.5, 1)
            .play(AnimationKeys.RocketMouseRun)

        this.flames = scene.add.sprite(-63, -15, TextureKeys.RocketMouse)
            .play(AnimationKeys.RocketFlamesOn)

        this.enableJetpack(false)

        this.add(this.flames)
        this.add(this.mouse)

        scene.physics.add.existing(this)

        //adjust physics body size and offset
        const body = this.body as Phaser.Physics.Arcade.Body
        body.setSize(this.mouse.width * 0.5, this.mouse.height * 0.7)
        body.setOffset(this.mouse.width * -0.3, -this.mouse.height + 15)

        this.cursors = scene.input.keyboard.createCursorKeys()
    }

    enableJetpack(enabled: boolean) {
        this.flames.setVisible(enabled)
    }

    kill() {
        // don't do anything if not in RUNNING state
        if (this.mouseState !== MouseState.Running) {
            return
        }

        // set state to KILLED
        this.mouseState = MouseState.Killed

        this.mouse.play(AnimationKeys.RocketMouseDead)

        const body = this.body as Phaser.Physics.Arcade.Body
        body.setAccelerationY(0)
        body.setVelocity(500, 0)
        this.enableJetpack(false)
    }


    preUpdate() {
        const body = this.body as Phaser.Physics.Arcade.Body


        // switch on this.mouseState
        switch (this.mouseState) {


            case MouseState.Running:
                {

                    // check if Space bar is down
                    if (this.cursors.space?.isDown) {
                        // set y acceleration to -600 if so
                        body.setAccelerationY(-600)
                        this.enableJetpack(true)
                        this.mouse.play(AnimationKeys.RocketMouseFly, true)
                    }
                    else {
                        // turn off acceleration otherwise
                        body.setAccelerationY(0)
                        this.enableJetpack(false)
                    }

                    // check if touching the ground
                    if (body.blocked.down) {
                        // play run when touching the ground
                        this.mouse.play(AnimationKeys.RocketMouseRun, true)
                    }
                    else if (body.velocity.y > 0) {
                        // play fall when no longer ascending
                        this.mouse.play(AnimationKeys.RocketMouseFall, true)
                    }

                    break
                }

            case MouseState.Killed:
                {
                    // reduce velocity to 99% of current value
                    body.velocity.x *= 0.99

                    // once less than 5 we can say stop
                    if (body.velocity.x <= 5) {
                        this.mouseState = MouseState.Dead
                    }
                    break
                }

            case MouseState.Dead:
                {
                    // make complete stop
                    body.setVelocity(0, 0)


                    // better way would be to emit dead state and run GameOver from Game.ts
                    this.scene.scene.run(SceneKeys.GameOver)
                    break
                }
        }

    }


}