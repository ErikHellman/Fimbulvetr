import SpriteKit

/// The first Apple TV scene: the rules run at a fixed 60 Hz in JavaScriptCore, the controller drives the
/// hero and the hero is drawn from the baked sprite pages. Ground, actors and the HUD come with the shared
/// draw list (docs/tv-port.md, step A3).
final class GameScene: SKScene {
    private static let width: CGFloat = 640
    private static let height: CGFloat = 360
    private static let tick = 1.0 / 60

    private var core: GameCore?
    private let atlas = Atlas()
    private let hero = SKSpriteNode()
    private let label = SKLabelNode(fontNamed: "Menlo")
    private var last: TimeInterval?
    private var backlog: TimeInterval = 0
    private var stepMs = 0.0

    override init() {
        super.init(size: CGSize(width: Self.width, height: Self.height))
        scaleMode = .aspectFit
        backgroundColor = .black
    }

    required init?(coder: NSCoder) { fatalError("not used") }

    override func didMove(to view: SKView) {
        label.fontSize = 8
        label.horizontalAlignmentMode = .left
        label.verticalAlignmentMode = .top
        label.position = CGPoint(x: 4, y: Self.height - 4)
        addChild(label)
        addChild(hero)
        do {
            core = try GameCore(seed: Int.random(in: 1 ..< 1 << 30))
        } catch {
            label.text = "core failed: \(error)"
        }
    }

    override func update(_ now: TimeInterval) {
        guard let core else { return }
        backlog += min(now - (last ?? now), 0.25)
        last = now
        let input = Input.read()
        var steps = 0
        let start = CACurrentMediaTime()
        while backlog >= Self.tick && steps < 4 {
            core.step(held: input.held, mx: input.mx, my: input.my)
            backlog -= Self.tick
            steps += 1
        }
        if steps > 0 { stepMs = (CACurrentMediaTime() - start) * 1000 / Double(steps) }
        guard let status = core.status() else { return }
        if hero.texture == nil, let frame = atlas.frame("hero_idle_s_0") {
            hero.texture = frame.texture
            hero.size = frame.texture.size()
            hero.anchorPoint = frame.anchor
        }
        hero.position = CGPoint(x: status.hero.x, y: Self.height - status.hero.y)
        label.text = String(format: "%@  %@  hp %d  %.2f ms/tick", status.screen, status.mode, status.hero.hp, stepMs)
    }
}
