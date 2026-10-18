import SpriteKit
import UIKit

/// The baked sprite pages (`pnpm port:art` → Resources/art): PNG pages and frames.json, whose frames
/// are [name, page, x, y, w, h, ox, oy] in top-left pixel coordinates.
final class Atlas {
    struct Frame {
        let texture: SKTexture
        /// SpriteKit's anchor for the frame's origin (its feet), bottom-left based.
        let anchor: CGPoint
    }

    private struct File: Decodable {
        let pages: Int
        let frames: [[Entry]]
    }

    private enum Entry: Decodable {
        case name(String)
        case number(Double)

        init(from decoder: Decoder) throws {
            let c = try decoder.singleValueContainer()
            if let s = try? c.decode(String.self) { self = .name(s) } else { self = .number(try c.decode(Double.self)) }
        }

        var number: Double { if case .number(let n) = self { n } else { 0 } }
        var name: String { if case .name(let s) = self { s } else { "" } }
    }

    private var pages: [SKTexture] = []
    private var table: [String: [Double]] = [:]

    init() {
        guard let url = Bundle.main.url(forResource: "frames", withExtension: "json", subdirectory: "Resources/art"),
              let data = try? Data(contentsOf: url),
              let file = try? JSONDecoder().decode(File.self, from: data)
        else { return }
        pages = (0 ..< file.pages).compactMap { i in
            guard let png = Bundle.main.url(forResource: "sprites_\(i)", withExtension: "png", subdirectory: "Resources/art"),
                  let image = UIImage(contentsOfFile: png.path)
            else { return nil }
            let texture = SKTexture(image: image)
            texture.filteringMode = .nearest
            return texture
        }
        for entry in file.frames where entry.count == 8 {
            table[entry[0].name] = entry.dropFirst().map(\.number)
        }
    }

    func frame(_ name: String) -> Frame? {
        guard let f = table[name], f.count == 7 else { return nil }
        let page = Int(f[0])
        guard page < pages.count else { return nil }
        let texture = pages[page]
        let size = texture.size()
        let (x, y, w, h, ox, oy) = (CGFloat(f[1]), CGFloat(f[2]), CGFloat(f[3]), CGFloat(f[4]), CGFloat(f[5]), CGFloat(f[6]))
        // SpriteKit texture rects are unit-based and start at the bottom left.
        let rect = CGRect(x: x / size.width, y: 1 - (y + h) / size.height, width: w / size.width, height: h / size.height)
        let sub = SKTexture(rect: rect, in: texture)
        sub.filteringMode = .nearest
        return Frame(texture: sub, anchor: CGPoint(x: ox / w, y: 1 - oy / h))
    }
}
