import GameController

/// Controller state as the game's action bits (the `ACTIONS` order in src/core/input/actions.ts) and the
/// left stick, with the same layout as the web build's default pad bindings (src/content/bindings.ts).
enum Input {
    static let up = 1 << 0, down = 1 << 1, left = 1 << 2, right = 1 << 3
    static let sword = 1 << 4, item1 = 1 << 5, item2 = 1 << 6, galdr = 1 << 7
    static let roll = 1 << 8, shield = 1 << 9, interact = 1 << 10, menu = 1 << 11
    static let map = 1 << 12, confirm = 1 << 13, cancel = 1 << 14

    static func read() -> (held: Int, mx: Double, my: Double) {
        guard let controller = GCController.current else { return (0, 0, 0) }
        var held = 0
        if let pad = controller.extendedGamepad {
            if pad.dpad.up.isPressed { held |= up }
            if pad.dpad.down.isPressed { held |= down }
            if pad.dpad.left.isPressed { held |= left }
            if pad.dpad.right.isPressed { held |= right }
            if pad.buttonA.isPressed { held |= interact | confirm }
            if pad.buttonB.isPressed { held |= item1 | cancel }
            if pad.buttonX.isPressed { held |= sword }
            if pad.buttonY.isPressed { held |= item2 }
            if pad.leftShoulder.isPressed { held |= shield }
            if pad.rightShoulder.isPressed { held |= roll }
            if pad.rightTrigger.isPressed { held |= galdr }
            if pad.buttonMenu.isPressed { held |= menu }
            if pad.buttonOptions?.isPressed == true { held |= map }
            let stick = pad.leftThumbstick
            return (held, Double(stick.xAxis.value), Double(-stick.yAxis.value))
        }
        if let remote = controller.microGamepad {
            // The Siri Remote: swipe to move, click to interact, play/pause for the menu.
            remote.reportsAbsoluteDpadValues = false
            if remote.buttonA.isPressed { held |= interact | confirm }
            if remote.buttonX.isPressed { held |= sword }
            if remote.buttonMenu.isPressed { held |= cancel }
            return (held, Double(remote.dpad.xAxis.value), Double(-remote.dpad.yAxis.value))
        }
        return (0, 0, 0)
    }
}
