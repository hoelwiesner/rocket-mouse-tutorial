import Phaser from 'phaser'
import TextureKeys from './consts/TextureKeys'
import SceneKeys from './consts/SceneKeys'
import AnimationKeys from './consts/AnimationKeys'

import RocketMouse from '../game/RocketMouse'

import LaserObstacle from '../game/LaserObstacle'

export default class Game extends Phaser.Scene {

    // create the background class property
    private background!: Phaser.GameObjects.TileSprite
    private mouseHole!: Phaser.GameObjects.Image
    private window1!: Phaser.GameObjects.Image
    private window2!: Phaser.GameObjects.Image
    private bookcase1!: Phaser.GameObjects.Image
    private bookcase2!: Phaser.GameObjects.Image


    private bookcases: Phaser.GameObjects.Image[] = []
    private windows: Phaser.GameObjects.Image[] = []

    private laserObstacle!: LaserObstacle

    private coins!: Phaser.Physics.Arcade.StaticGroup

    private mouse!: RocketMouse

    constructor() {
        super(SceneKeys.Game)
    }

    private scoreLabel!: Phaser.GameObjects.Text
    private score = 0

    init() {
        this.score = 0
    }

    create() {


        // store the width and height of the game screen
        const width = this.scale.width
        const height = this.scale.height

        //repeat background
        this.background = this.add.tileSprite(0, 0, width, height, TextureKeys.Background)
            .setOrigin(0, 0)
            .setScrollFactor(0, 0)

        // create in layers of appearance
        this.mouseHole = this.add.image(Phaser.Math.Between(900, 1500), //x value
            501,
            TextureKeys.MouseHole)

        this.window1 = this.add.image(
            Phaser.Math.Between(900, 1300), 200, TextureKeys.Window1
        )

        this.window2 = this.add.image(
            Phaser.Math.Between(1600, 2000), 200, TextureKeys.Window2
        )

        // array of windows
        this.windows = [this.window1, this.window2]

        this.bookcase1 = this.add.image(
            Phaser.Math.Between(2200, 2700),
            580,
            TextureKeys.Bookcase1
        ).setOrigin(0.5, 1)

        this.bookcase2 = this.add.image(
            Phaser.Math.Between(2900, 3400),
            580, TextureKeys.Bookcase2)
            .setOrigin(0.5, 1)

        // bookcase array
        this.bookcases = [this.bookcase1, this.bookcase2]

        // create lasers
        this.laserObstacle = new LaserObstacle(this, 900, 100)
        this.add.existing(this.laserObstacle)

        this.coins = this.physics.add.staticGroup()
        this.spawnCoins()

        // create mouse
        const mouse = new RocketMouse(this, width * 0.5, height - 30)
        this.add.existing(mouse)

        const body = mouse.body as Phaser.Physics.Arcade.Body
        body.setCollideWorldBounds(true)

        // set the x velocity to 200
        body.setVelocityX(200)

        this.physics.world.setBounds(
            0, 0, // x,y
            Number.MAX_SAFE_INTEGER, height - 55 //width, height
        )

        this.cameras.main.startFollow(mouse)
        this.cameras.main.setBounds(0, 0, Number.MAX_SAFE_INTEGER, height)

        // laser logic
        this.physics.add.overlap(this.laserObstacle, mouse, this.handleOverlapLaser, undefined, this)

        // coin logic
        this.physics.add.overlap(this.coins, mouse, this.handleCollectCoin, undefined, this)

        this.scoreLabel = this.add.text(10, 10, `Score: ${this.score}`, {
            fontSize: '24px',
            color: '#080808',
            backgroundColor: '#F8E71C',
            shadow: { fill: true, blur: 0, offsetY: 0 },
            padding: { left: 15, right: 15, top: 10, bottom: 10 }
        })
            .setScrollFactor(0)
    }

    update(t: number, dt: number) {
        //scroll the background
        this.background.setTilePosition(this.cameras.main.scrollX)

        // update mouseHole
        this.wrapMouseHole()

        // update windows
        this.wrapWindows()

        // update bookshelves
        this.wrapBookcases()

        // update lasers
        this.wrapLaserObstacle()

        // teleport everything
        // this.teleportBackwards()
    }

    private wrapMouseHole() {
        const scrollX = this.cameras.main.scrollX
        const rightEdge = scrollX + this.scale.width

        if (this.mouseHole.x + this.mouseHole.width < scrollX) {
            this.mouseHole.x = Phaser.Math.Between(
                rightEdge + 100,
                rightEdge + 1000
            )
        }
    }

    private wrapWindows() {
        const scrollX = this.cameras.main.scrollX
        const rightEdge = scrollX + this.scale.width

        // multiply by 2 to add padding
        let width = this.window1.width * 2
        if (this.window1.x + width < scrollX) {
            this.window1.x = Phaser.Math.Between(rightEdge + width, rightEdge + width + 800)
            const overlap = this.bookcases.find(bc => {
                return Math.abs(this.window1.x - bc.x) <= this.window1.width
            })

            this.window1.visible = !overlap
        }

        width = this.window2.width

        if (this.window2.x + width < scrollX) {
            this.window2.x = Phaser.Math.Between(
                this.window1.x + width,
                this.window1.x + width + 800
            )
            const overlap = this.bookcases.find(bc => {
                return Math.abs(this.window2.x - bc.x) <= this.window2.width
            })

            this.window2.visible = !overlap
        }

    }

    private wrapBookcases() {
        const scrollX = this.cameras.main.scrollX
        const rightEdge = scrollX + this.scale.width

        let width = this.bookcase1.width * 2
        if (this.bookcase1.x + width < scrollX) {
            this.bookcase1.x = Phaser.Math.Between(rightEdge + width, rightEdge + width + 800)

            const overlap = this.windows.find(win => {
                return Math.abs(this.bookcase1.x - win.x) <= win.width
            })

            this.bookcase1.visible = !overlap

        }

        width = this.bookcase2.width
        if (this.bookcase2.x + width < scrollX) {
            this.bookcase2.x = Phaser.Math.Between(
                this.bookcase1.x + width,
                this.bookcase1.x + width + 800
            )

            const overlap = this.windows.find(win => {
                return Math.abs(this.bookcase2.x - win.x) <= win.width
            })

            this.bookcase2.visible = !overlap


        }
    }

    private wrapLaserObstacle() {
        const scrollX = this.cameras.main.scrollX
        const rightEdge = scrollX + this.scale.width

        // body variable with specific physics body type
        const body = this.laserObstacle.body as Phaser.Physics.Arcade.StaticBody

        const width = body.width
        if (this.laserObstacle.x + width < scrollX) {
            this.laserObstacle.x = Phaser.Math.Between(
                rightEdge + width,
                rightEdge + width + 1000
            )

            this.laserObstacle.y = Phaser.Math.Between(0, 300)

            //et the physics body position
            // add body.offset.x to account for the x offset
            body.position.x = this.laserObstacle.x + body.offset.x
            body.position.y = this.laserObstacle.y + body.offset.y
        }
    }

    private handleOverlapLaser(
        obj1: Phaser.GameObjects.GameObject,
        obj2: Phaser.GameObjects.GameObject
    ) {
        // const laser = obj1 as LaserObstacle
        const mouse = obj2 as RocketMouse

        mouse.kill()

    }

    private spawnCoins() {
        // can add method to shape to coin pattern

        // make sure all coins are inactive and hidden
        this.coins.children.each(child => {
            const coin = child as Phaser.Physics.Arcade.Sprite
            this.coins.killAndHide(coin)
            coin.body.enable = false
        })

        const scrollX = this.cameras.main.scrollX
        const rightEdge = scrollX + this.scale.width

        // start at 100 pixels past the right side of the screen
        let x = rightEdge + 100

        // random number from 1-20
        const numCoins = Phaser.Math.Between(1, 20)

        // the coins based on random number
        for (let i = 0; i < numCoins; ++i) {
            const coin = this.coins.get(
                x,
                Phaser.Math.Between(100, this.scale.height - 100),
                TextureKeys.Coin
            ) as Phaser.Physics.Arcade.Sprite

            // make sure coin is active and visible
            coin.setVisible(true)
            coin.setActive(true)

            // enable and adjust physics body to be a circle
            const body = coin.body as Phaser.Physics.Arcade.StaticBody
            body.setCircle(body.width * 0.5)
            body.enable = true

            // update the body x and y positions from the game object
            body.updateFromGameObject()

            x += coin.width * 1.5
        }
    }

    private handleCollectCoin(
        obj1: Phaser.GameObjects.GameObject,
        obj2: Phaser.GameObjects.GameObject
    ) {
        //obj 2 will be the coin
        const coin = obj2 as Phaser.Physics.Arcade.Sprite

        // use the group to hide it
        this.coins.killAndHide(coin)

        // and turn off the physics body
        coin.body.enable = false

        // increment by 1
        this.score += 1

        // charge the text with new score 
        this.scoreLabel.text = `Score: ${this.score}`
    }

    private teleportBackwards() {
        const scrollX = this.cameras.main.scrollX
        const maxX = 2380

        // fix what's wrong with the this.mouse.x not being found

        // perform a teleport once scrolled beyond 2500
        if (scrollX > maxX) {
            // teleport the mouse and mousehole
            this.mouse.x -= maxX
            this.mouseHole.x -= maxX

            // teleport windows
            this.windows.forEach(win => {
                win.x -= maxX
            })

            // teleport each bookcase
            this.bookcases.forEach(bc => {
                bc.x -= maxX
            })

            // teleport the laser
            this.laserObstacle.x -= maxX
            const laserBody = this.laserObstacle.body as Phaser.Physics.Arcade.StaticBody

            // as well as the laser physics body
            laserBody.x -= maxX

            this.spawnCoins()

            //teleport any spawned coins
            this.coins.children.each(child => {
                const coin = child as Phaser.Physics.Arcade.Sprite
                if (!coin.active) {
                    return
                }

                coin.x -= maxX
                const body = coin.body as Phaser.Physics.Arcade.StaticBody
                body.updateFromGameObject()
            })


        }
    }

}