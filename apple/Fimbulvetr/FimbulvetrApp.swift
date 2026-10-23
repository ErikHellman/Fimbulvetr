import SpriteKit
import SwiftUI

@main
struct FimbulvetrApp: App {
    @State private var scene = GameScene()

    var body: some Scene {
        WindowGroup {
            SpriteView(scene: scene, preferredFramesPerSecond: 60)
                .ignoresSafeArea()
        }
    }
}
